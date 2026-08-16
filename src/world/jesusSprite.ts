import { Assets, Container, Graphics, Sprite, Texture } from "pixi.js";
import { hexToNumber } from "@/pixel-art/color";
import { palette } from "@/pixel-art/palette";

import jesusStandUrl from "@/assets/player/jesus-stand.png";
import jesusBreatheUrl from "@/assets/player/jesus-breathe.png";
import jesusWalk0Url from "@/assets/player/jesus-walk-0.png";
import jesusWalk1Url from "@/assets/player/jesus-walk-1.png";
import jesusWalk2Url from "@/assets/player/jesus-walk-2.png";
import jesusWalk3Url from "@/assets/player/jesus-walk-3.png";

/**
 * The player's visual identity is now the supplied hand-drawn "Jesus Pixel"
 * sprite (raster PNG), not procedural `Graphics` like the ambient NPCs in
 * `sprites.ts` — this is Jesus-only; NPCs are untouched and keep the vector
 * rig. Every animation frame below is a carefully controlled pixel-edit of
 * that same source image (small rigid shifts of the shoulders/hands and the
 * feet, reusing the sprite's own pixels), never a redraw or a uniform scale.
 *
 * `JesusPose` is the extension point for future activity states — adding
 * IDLE_SITTING, INTERACT, etc. later means adding a pose id, a frame (or
 * frame set), and a URL entry here, nothing else. None of those exist yet.
 */
export type JesusPose = "idle-0" | "idle-1" | "walk-0" | "walk-1" | "walk-2" | "walk-3";

const POSE_TEXTURE_URLS: Record<JesusPose, string> = {
  "idle-0": jesusStandUrl,
  "idle-1": jesusBreatheUrl,
  "walk-0": jesusWalk0Url,
  "walk-1": jesusWalk1Url,
  "walk-2": jesusWalk2Url,
  "walk-3": jesusWalk3Url,
};

// `Texture.from(url)` never fetches anything by itself — it only reads what `Assets` already has
// cached, warning and handing back an empty texture otherwise. These PNGs have to be fetched and
// decoded via `Assets.load` first; every sprite created before that resolves starts on
// `Texture.EMPTY` and is upgraded to the real frame the moment loading finishes (see `setPose`).
let poseTextures: Partial<Record<JesusPose, Texture>> | null = null;
let loadStarted: Promise<void> | null = null;

function ensurePoseTexturesLoading(): Promise<void> {
  if (!loadStarted) {
    loadStarted = Assets.load(Object.values(POSE_TEXTURE_URLS)).then((loaded: Record<string, Texture>) => {
      const map: Partial<Record<JesusPose, Texture>> = {};
      for (const pose of Object.keys(POSE_TEXTURE_URLS) as JesusPose[]) {
        map[pose] = loaded[POSE_TEXTURE_URLS[pose]];
      }
      poseTextures = map;
    });
  }
  return loadStarted;
}

// Source sprite is a 64x64 canvas; the character is pixel-measured to sit centered
// horizontally with his sandals' ground line at row 59 — that's the sprite's anchor
// point, so `container.position` always represents exactly where his feet touch ground
// (matching the y-sort/shadow convention every other character in this world uses).
const SPRITE_SIZE = 64;
const GROUND_ROW = 59;
const SPRITE_SCALE = 0.5;

/** Same warm pixel-art halo used before, recentered above the new sprite's head. */
function buildHalo(): Graphics {
  const g = new Graphics();
  const cy = -30;
  g.ellipse(0, cy + 0.7, 6.4, 2.1).fill({ color: hexToNumber(palette.gold), alpha: 0.13 });
  g.ellipse(0, cy, 5.4, 1.6).stroke({ width: 1.3, color: hexToNumber(palette.gold), alpha: 0.85 });
  g.ellipse(0, cy - 0.35, 5.4, 1.6).stroke({ width: 0.55, color: hexToNumber(palette.wool.highlight), alpha: 0.55 });
  return g;
}

export interface JesusVisual {
  container: Container;
  /** Flip target for left/right facing — `applyFacing` sets `.scale.x` on this, same as every other character. */
  body: Container;
  setPose(pose: JesusPose): void;
}

export function createJesusVisual(): JesusVisual {
  const container = new Container();
  const body = new Container();

  const shadow = new Graphics();
  shadow.ellipse(0.5, 1.5, 6.6, 2.1).fill({ color: 0x0a0603, alpha: 0.26 });

  const sprite = new Sprite(Texture.EMPTY);
  sprite.anchor.set(0.5, GROUND_ROW / SPRITE_SIZE);
  sprite.scale.set(SPRITE_SCALE);

  const halo = buildHalo();

  body.addChild(shadow, halo, sprite);
  container.addChild(body);

  let pendingPose: JesusPose = "idle-0";
  ensurePoseTexturesLoading().then(() => {
    const texture = poseTextures?.[pendingPose];
    if (texture) sprite.texture = texture;
  });

  return {
    container,
    body,
    setPose(pose) {
      pendingPose = pose;
      const texture = poseTextures?.[pose];
      if (texture) sprite.texture = texture;
    },
  };
}
