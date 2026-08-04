import type { Vector2 } from "@/engine/input";
import { lerp } from "@/engine/collision";
import { VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from "@/engine/constants";

export interface CameraBounds {
  width: number;
  height: number;
}

/** Smoothed camera that keeps a target centered while clamping to the world's edges. */
export class Camera {
  x = 0;
  y = 0;

  constructor(private bounds: CameraBounds) {}

  update(target: Vector2, dt: number, smoothing = 6): void {
    const desiredX = VIRTUAL_WIDTH / 2 - target.x;
    const desiredY = VIRTUAL_HEIGHT / 2 - target.y;

    const minX = Math.min(0, VIRTUAL_WIDTH - this.bounds.width);
    const minY = Math.min(0, VIRTUAL_HEIGHT - this.bounds.height);
    const clampedX = Math.max(minX, Math.min(0, desiredX));
    const clampedY = Math.max(minY, Math.min(0, desiredY));

    const t = 1 - Math.exp(-smoothing * dt);
    this.x = lerp(this.x, clampedX, t);
    this.y = lerp(this.y, clampedY, t);
  }

  /** Converts a world-space point to the current screen/stage-space point. */
  toScreen(point: Vector2): Vector2 {
    return { x: point.x + this.x, y: point.y + this.y };
  }
}
