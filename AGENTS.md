<!-- BGP-ADMIN:BEGIN -->
<!-- Managed by bgp-admin (templates/agent-docs). Edits inside this block are overwritten on the next sync. Add project-specific notes below the END marker. -->

# AGENTS.md

Instructions for AI coding agents working on this repository.

This repo is a **web game**. It is published as an iOS/Android app by a separate
control plane called **bgp-admin** — see "Native boundary" below, it is the rule
that matters most here.

Read also:

- [docs/agents/working-style.md](./docs/agents/working-style.md) — how the maintainer likes to work

## Native boundary

bgp-admin owns everything native. It generates the Capacitor setup, the signing
config and the release workflows from outside this repo, without modifying it.

**Never add or edit any of the following here:**

- `capacitor.config.*`, `ios/`, `android/`
- Capacitor or native plugin dependencies in `package.json`
- `.github/workflows/deploy*.yml`, `.github/workflows/preview-deploy.yml`
- Build config (`vite.config.*`, router config, base paths) changed *for the sake
  of the mobile build*

If something only breaks inside the app shell — blank screen in the WebView,
asset paths, deep links, splash screen, versioning, signing — the fix belongs in
bgp-admin, not here. Say so instead of patching around it. A local fix will be
silently overwritten on the next sync and will hide the real bug.

Normal web work (game logic, UI, assets, web build config for web reasons) is
entirely yours.

## Language

Everything you write into the repository MUST be in English:

- Source code (variables, functions, classes, file names)
- Comments of any kind
- Documentation, README files, guides
- Commit messages, branch names, PR and issue titles and descriptions
- Log messages and error messages
- Tests (descriptions, assertions, fixtures)
- Comments inside config files (YAML, JSON, TOML)
- Database schemas and API route names

Only end-user-facing content may be localized: UI strings in i18n files, store
listings, and marketing copy.

The maintainer communicates in Spanish. You may reply in Spanish in
conversation, but anything committed to the repository stays in English.

## Keeping this file current

At the end of a working session, update `AGENTS.md` with everything important
you learned that day. Worth recording:

- Conventions and patterns of this codebase that were not obvious up front
- Commands that actually work (build, test, lint, run) and their gotchas
- Decisions the maintainer made, and the reasoning behind them
- Traps you fell into, so the next agent does not repeat them

Do not record what the code already says, one-off details of a single task, or a
changelog of what you did. This file is for what the next agent needs to know
before starting, nothing else. Keep it edited down — replace stale entries
instead of appending to them.

Write project-specific notes **below the `BGP-ADMIN:END` marker**. Anything
inside the managed block is shared across all game repos and gets overwritten on
the next sync; if a rule you are adding applies to every game, it belongs in
bgp-admin at `templates/agent-docs/`, so ask before adding it.

<!-- BGP-ADMIN:END -->

## Project-specific notes

### Stack and commands

- React + TypeScript + Vite, package manager **bun**. `bun install`, `bun run dev`,
  `bun run build` (runs `tsc -b --noCheck && vite build`, outputs to `dist/`),
  `bun run preview`, `bun run typecheck` (`tsc -b --noEmit`, strict).
- Game world rendering: **PixiJS v8**, mounted once via `src/engine/PixiStage.tsx`.
  Every scene renders at a fixed virtual resolution (`src/engine/constants.ts`,
  480x270) and the canvas is scaled up with `image-rendering: pixelated` — this is
  what makes it read as pixel art. Author all scene coordinates in that virtual
  space, not raw pixels.
- State: Zustand (+ `persist` middleware to localStorage) — `src/store/`. No
  react-router; navigation is a screen enum in `appStore`.
- Localization: `src/locales/`, flat dot-key dictionary typed from `en.ts` (the
  source of truth). Every other locale file does `{ ...en }` as a placeholder —
  all 12 locales are wired end-to-end but only English has real copy so far.
  Use the `useT()` hook, never hardcode strings.
- No image-generation tool is available in this environment. All pixel art is
  hand-coded: either small color-grid sprites (`src/pixel-art/pixelGrid.ts`,
  used for icons) or procedural canvas drawing (`src/pixel-art/woodTexture.ts`
  for the wooden UI kit, `src/parables/lost-sheep/sprites.ts` for characters via
  layered `Graphics` primitives). It reads as "clean programmer art," not
  hand-painted — swapping in real assets later means changing these renderers,
  not the callers, since entities only hold a `Container` reference.
- Playwright is preinstalled but not as a project dependency — it's only
  reachable via the global install at `/opt/node22/lib/node_modules/playwright`
  (import that path directly, or set `NODE_PATH`), with Chromium at
  `/opt/pw-browsers/chromium`. Don't add `playwright` to package.json for this.

### Traps already hit

- A PixiJS alpha/sprite mask sampled **outside its own texture bounds reads as
  fully transparent**, not as the texture's edge color. The night-lighting
  vignette (`src/engine/nightOverlay.ts`) originally sized the mask sprite
  tightly around the light radius, which made the "darkness" invisible
  everywhere outside that small circle instead of covering the screen. Fixed by
  drawing one big canvas texture (well larger than the viewport) with the light
  hole punched in the middle and using it directly as the visible darkness
  sprite — no separate `.mask` needed. If you need a "hole in an overlay that
  follows a point" effect anywhere else, reuse this pattern, not `.mask`.
- When drawing a fence/grid-like prop with `Graphics`, looping posts across the
  *entire* width/height at every spacing step (instead of only at the two edge
  lines) draws a full interior lattice, not a perimeter fence. Keep post loops
  scoped to just the boundary.
- `ParableRow`/menu locking, `progressStore` (unlocked/completed ids) and
  `parables/registry.ts` are the whole "add a new parable" surface — a second
  parable should only need a new `src/parables/<id>/` folder plus a registry
  entry, no engine changes.
