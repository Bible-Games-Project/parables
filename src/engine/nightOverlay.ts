import { Application, Container, Sprite, Texture } from "pixi.js";
import { VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from "@/engine/constants";
import type { Vector2 } from "@/engine/input";

const TEXTURE_RES = 512;
/** World units the texture spans — must comfortably exceed the viewport so the darkness never runs out of coverage at the edges. */
const COVERAGE = Math.max(VIRTUAL_WIDTH, VIRTUAL_HEIGHT) * 2.4;

/** Draws darkness everywhere with a soft transparent hole at the center, big enough to always cover the viewport when centered on the target. */
function createDarknessTexture(lightRadius: number): Texture {
  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_RES;
  canvas.height = TEXTURE_RES;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  const scale = TEXTURE_RES / COVERAGE;
  const center = TEXTURE_RES / 2;
  const innerR = lightRadius * scale;
  const outerR = lightRadius * 1.7 * scale;

  const gradient = ctx.createRadialGradient(center, center, 0, center, center, outerR);
  gradient.addColorStop(0, "rgba(5,6,10,0)");
  gradient.addColorStop(Math.min(0.98, innerR / outerR), "rgba(5,6,10,0.25)");
  gradient.addColorStop(1, "rgba(5,6,10,1)");
  ctx.fillStyle = gradient;
  // Fill the whole canvas: canvas gradients clamp to the last stop beyond
  // their defined radius, so everything past outerR comes out fully opaque.
  ctx.fillRect(0, 0, TEXTURE_RES, TEXTURE_RES);

  return Texture.from(canvas);
}

export interface NightOverlay {
  container: Container;
  /** 0 = full daylight, 1 = full night darkness outside the light radius. */
  setIntensity(intensity: number): void;
  setLightRadius(radius: number): void;
  /** Position (in stage/screen space, not world space) the light circle should follow. */
  setFollowPosition(position: Vector2): void;
  destroy(): void;
}

/** A darkness layer with a soft circular hole that follows a target — purely visual, never gates gameplay. */
export function createNightOverlay(app: Application): NightOverlay {
  const container = new Container();

  let texture = createDarknessTexture(70);
  const darkness = new Sprite(texture);
  darkness.anchor.set(0.5);
  darkness.width = COVERAGE;
  darkness.height = COVERAGE;
  darkness.alpha = 0;
  darkness.position.set(VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2);

  container.addChild(darkness);
  app.stage.addChild(container);

  return {
    container,
    setIntensity(intensity: number) {
      // Capped below 1 so the world stays dimly visible outside the light, per the parable's spec — this is atmosphere, not a vision-blocker.
      darkness.alpha = Math.max(0, Math.min(1, intensity)) * 0.85;
    },
    setLightRadius(radius: number) {
      const next = createDarknessTexture(radius);
      darkness.texture = next;
      texture.destroy(true);
      texture = next;
    },
    setFollowPosition(position: Vector2) {
      darkness.position.set(position.x, position.y);
    },
    destroy() {
      app.stage.removeChild(container);
      container.destroy({ children: true });
      texture.destroy(true);
    },
  };
}
