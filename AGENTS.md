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

### Localization — permanent architecture, do not bypass

This is a load-bearing project rule, not a suggestion: **every user-facing
string, with no exceptions, goes through the localization system.** No
`aria-label="Back"`, no `<p>Loading...</p>`, no literal text in a toast,
tutorial, achievement, error, or future parable — ever. The `LocaleKey` type
(`keyof typeof en`) makes `t()` reject anything that isn't a real key at
compile time, so `bun run typecheck` is the actual enforcement mechanism —
if you're tempted to add a raw string to a `.tsx` file, that temptation means
a key is missing from `en.ts`, not that this rule has an exception.

How it fits together (`src/locales/`):

- `en.ts` is the single source of truth: a flat dot-key dictionary
  (`"lostSheep.objective.search"`, not nested objects), organized by feature
  prefix (`home.`, `settings.`, `lostSheep.`, `parable.`, `common.`, ...).
  Adding UI anywhere — a new screen, a new parable, a tutorial hint, an
  achievement, an error message — means adding keys here first.
- Every other locale file (`ca`, `de`, `es`, `fr`, `it`, `ja`, `nl`, `pl`,
  `pt`, `ro`, `ru`) is `export const xx: LocaleDictionary = { ...en };` — a
  placeholder that inherits every English string automatically. All 12
  required languages already exist and are wired end-to-end; translating one
  means replacing that file's placeholder values, never touching any other
  file, and never touching the loader/hook/store. That's the whole
  scalability contract — do not add a runtime translation service, a JSON
  loader, or a build step here; the point of this architecture is that a
  translator's entire job is editing one flat object.
- `i18n.ts` holds `LOCALE_CODES`, `LOCALE_NAMES` (each language's name in
  itself — "日本語", "Français" — never translated) and `DICTIONARIES`, the
  code -> dictionary map `useT()` reads from.
- `useT()` (`src/locales/useT.ts`) is the only way to render text: it reads
  `locale` from `useSettingsStore` (Zustand, `persist` middleware ->
  localStorage) and returns a `t(key: LocaleKey) => string` closure. Because
  it's a normal reactive store read, calling `setLocale()` anywhere
  re-renders every mounted component using `useT()` immediately — no reload,
  no context provider plumbing needed. The chosen locale persists across
  reloads automatically via the same `persist` middleware; nothing extra to
  wire up when adding new state that should also persist.
- Components that need translated text but shouldn't own its lookup (e.g.
  `Modal`, `ScreenShell`) take `title: string` as a prop and let the caller
  pass `t("...")` in — they don't call `useT()` themselves. Keep following
  that pattern for shared/reusable chrome.

If you ever `git grep -n '"[A-Z][a-z]' src --include=*.tsx` (or similarly
hunt for literal capitalized JSX text) and find a hit outside a comment,
that's a bug against this rule, not a stylistic nit — fix it before moving
on.

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
- Lost Sheep's world layout is driven by a single deterministic S-curve in
  `map.ts` (`JOURNEY_PATH`, built once from a sine offset around the
  straight pen→hill line, no randomness). `terrain.ts` reads it to keep a
  walkable corridor clear and to thicken flanking trees/bushes as `t → 1`;
  `trail.ts` reads it to lay the fixed footprint/blood trail. If the pen or
  the lost sheep's fixed spawn (`LOST_SHEEP_START`) ever move, this path and
  everything anchored to it (landmarks, trail, corridor) recomputes
  automatically — no other file hardcodes world positions along the route.
- Playwright smoke-testing this scene: click through Home → "Play" →
  "The Lost Sheep" → the intro dialogue's "Skip" button (clicking the canvas
  itself does not advance dialogue). There's no route/URL to jump straight
  into a scene and no dev-only teleport hook — verify the far side of a
  large world (e.g. the lost sheep's hill) either by holding movement keys
  for real (shepherd speed is 100px/s, so cross-map distances take tens of
  seconds) or by adding a throwaway `keydown` teleport in `onReady` and
  reverting it before committing, never leaving debug hooks in place.
