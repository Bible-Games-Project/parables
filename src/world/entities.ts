import type { Vector2 } from "@/engine/input";
import {
  clampToBounds,
  distance,
  resolveCircleVsCircle,
  resolveCircleVsRect,
  type CircleObstacle,
  type Rect,
} from "@/engine/collision";
import { steerToward } from "@/engine/chaseAI";
import { createRng } from "@/pixel-art/prng";
import { createJesusSprite, createVillagerSprite, type HumanoidVisual, type VillagerVariant } from "@/world/sprites";

/**
 * Sets left/right facing from a horizontal velocity/direction sample. Uses a
 * one-sided hysteresis (a bigger push is required to flip away from the
 * current facing than to reinforce it) so a noisy or momentarily-near-zero
 * signal — e.g. an NPC braking right as it reaches its wander target — can
 * never flip the facing back and forth from one frame to the next. Facing is
 * always exactly one of left/right; there is no "both at once" state.
 */
function applyFacing(body: { scale: { x: number } }, velocityX: number): void {
  const facingRight = body.scale.x >= 0;
  const flipThreshold = 0.28;
  if (facingRight && velocityX < -flipThreshold) body.scale.x = -1;
  else if (!facingRight && velocityX > flipThreshold) body.scale.x = 1;
}

/** The player's character in Israel — walks and idles, same construction technique as the Lost Sheep shepherd, but no combat or health: this is an exploration hub, not a rescue level. */
export class Jesus {
  position: Vector2;
  radius = 7;
  speed = 92;
  sprite: HumanoidVisual;

  private walkPhase = 0;
  private idlePhase = 0;
  private walkBlend = 0;

  constructor(start: Vector2) {
    this.position = { ...start };
    this.sprite = createJesusSprite();
    this.sprite.container.position.set(start.x, start.y);
  }

  update(dt: number, direction: Vector2, obstacles: CircleObstacle[], walls: Rect[], bounds: { width: number; height: number }): void {
    const moving = direction.x !== 0 || direction.y !== 0;
    if (moving) {
      this.position.x += direction.x * this.speed * dt;
      this.position.y += direction.y * this.speed * dt;
      for (const wall of walls) {
        this.position = resolveCircleVsRect(this.position, this.radius, wall);
      }
      for (const obstacle of obstacles) {
        this.position = resolveCircleVsCircle(this.position, this.radius, obstacle, obstacle.radius);
      }
      this.position = clampToBounds(this.position, bounds, this.radius);
    }
    this.sprite.container.position.set(this.position.x, this.position.y);
    this.sprite.container.zIndex = this.position.y;
    applyFacing(this.sprite.body, direction.x);

    const target = moving ? 1 : 0;
    this.walkBlend += (target - this.walkBlend) * Math.min(1, dt * 5);
    this.walkPhase += dt * 8.5;
    this.idlePhase += dt;
    const walkEase = this.walkBlend * this.walkBlend * (3 - 2 * this.walkBlend);

    const legAmp = 0.5 * walkEase;
    this.sprite.leftLeg.rotation = Math.sin(this.walkPhase) * legAmp;
    this.sprite.rightLeg.rotation = -Math.sin(this.walkPhase) * legAmp;
    this.sprite.frontArm.rotation = -Math.sin(this.walkPhase) * 0.32 * walkEase;
    this.sprite.backArm.rotation = Math.sin(this.walkPhase) * 0.32 * walkEase;
    const bodyBobWalk = Math.sin(this.walkPhase * 2) * 1 * walkEase;
    const bodyBobIdle = Math.sin(this.idlePhase * 1.7) * 0.4 * (1 - walkEase);
    this.sprite.body.y = bodyBobWalk + bodyBobIdle;
    const headSway = Math.sin(this.idlePhase * 1.4) * 0.05 * (1 - walkEase);
    this.sprite.head.rotation = headSway;

    const breathe = Math.sin(this.idlePhase * 1.6) * 0.02 * (1 - walkEase);
    this.sprite.torso.scale.set(1 + breathe * 0.6, 1 + breathe);
  }
}

type NpcState = "idle" | "wander";

/**
 * A villager who just lives in the world — idles and wanders a small home
 * radius, never reacts to Jesus. Also the base for handcrafted encounter
 * NPCs (see encounters.ts), which just use a tighter wander radius so they
 * read as "waiting/pacing here" rather than roaming off.
 */
export class AmbientNpc {
  position: Vector2;
  radius = 6;
  sprite: HumanoidVisual;

  private home: Vector2;
  private wanderRadius: number;
  private speed: number;
  private state: NpcState = "idle";
  private stateTimer: number;
  private wanderTarget: Vector2;
  private rng: () => number;
  private walkPhase = 0;
  private idlePhase = 0;
  private walkBlend = 0;

  constructor(start: Vector2, variant: VillagerVariant, seed: number, wanderRadius = 45, speed = 18) {
    this.position = { ...start };
    this.home = { ...start };
    this.wanderRadius = wanderRadius;
    this.speed = speed;
    this.sprite = createVillagerSprite(variant);
    this.sprite.container.position.set(start.x, start.y);
    this.rng = createRng(seed);
    this.idlePhase = this.rng() * 10;
    this.stateTimer = 1.5 + this.rng() * 3;
    this.wanderTarget = { ...start };
  }

  private pickNext(): void {
    if (this.rng() < 0.45) {
      this.state = "idle";
      this.stateTimer = 2.5 + this.rng() * 3.5;
    } else {
      this.state = "wander";
      this.stateTimer = 2 + this.rng() * 2.5;
      const angle = this.rng() * Math.PI * 2;
      const dist = this.rng() * this.wanderRadius;
      this.wanderTarget = { x: this.home.x + Math.cos(angle) * dist, y: this.home.y + Math.sin(angle) * dist };
    }
  }

  update(dt: number, obstacles: CircleObstacle[] = [], walls: Rect[] = []): void {
    this.stateTimer -= dt;
    if (this.stateTimer <= 0) this.pickNext();
    this.idlePhase += dt;

    // Velocity is measured from actual net displacement — computed *after* collision
    // resolution — so an NPC pinned against an obstacle or wall truly reads as stopped
    // (idle animation) instead of playing a walk cycle while visually stuck in place.
    const before = { ...this.position };
    // `steerToward` moves at constant speed and never slows down, so without an arrival
    // radius the NPC would fly past its target every frame and immediately steer back,
    // flipping its direction (and therefore its left/right facing) every single tick —
    // the exact cause of the flicker/duplicated-accessory bug. Once within one frame's
    // step of the target we simply stop, giving movement direction a single stable value.
    if (this.state === "wander" && distance(this.position, this.wanderTarget) > this.speed * dt) {
      this.position = steerToward(this.position, this.wanderTarget, this.speed, dt);
    }

    // Trees, rocks, houses and fences block ambient villagers too — they slide along an obstacle rather than pathfinding around it.
    for (const obstacle of obstacles) {
      this.position = resolveCircleVsCircle(this.position, this.radius, obstacle, obstacle.radius);
    }
    for (const wall of walls) {
      this.position = resolveCircleVsRect(this.position, this.radius, wall);
    }
    const velocity: Vector2 = { x: this.position.x - before.x, y: this.position.y - before.y };

    this.sprite.container.position.set(this.position.x, this.position.y);
    this.sprite.container.zIndex = this.position.y;
    // `velocity` is a raw per-frame world-space delta (speed * dt), not a normalized
    // direction — normalizing before handing it to `applyFacing` keeps its hysteresis
    // threshold meaningful regardless of this NPC's speed or the frame's dt.
    const speedMag = Math.hypot(velocity.x, velocity.y);
    applyFacing(this.sprite.body, speedMag > 0.001 ? velocity.x / speedMag : 0);

    const moving = speedMag > 0.01;
    this.walkBlend += ((moving ? 1 : 0) - this.walkBlend) * Math.min(1, dt * 5);
    this.walkPhase += dt * 7;
    const walkEase = this.walkBlend * this.walkBlend * (3 - 2 * this.walkBlend);

    const legAmp = 0.42 * walkEase;
    this.sprite.leftLeg.rotation = Math.sin(this.walkPhase) * legAmp;
    this.sprite.rightLeg.rotation = -Math.sin(this.walkPhase) * legAmp;
    const headIdle = Math.sin(this.idlePhase * 1.3) * 0.08 * (1 - walkEase);
    this.sprite.head.rotation = headIdle;
    const breathe = Math.sin(this.idlePhase * 1.8) * 0.02;
    this.sprite.torso.scale.set(1 + breathe * 0.6, 1 + breathe);
  }
}
