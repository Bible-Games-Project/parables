import type { Vector2 } from "@/engine/input";
import {
  circleOverlapsRect,
  clampToBounds,
  distance,
  lerp,
  normalize,
  resolveCircleVsCircle,
  resolveCircleVsRect,
  type CircleObstacle,
  type Rect,
} from "@/engine/collision";
import { steerToward } from "@/engine/chaseAI";
import {
  createSheepSprite,
  createShepherdSprite,
  createWolfSprite,
  type SheepVisual,
  type ShepherdVisual,
  type WolfVisual,
} from "@/parables/lost-sheep/sprites";
import { PEN, PEN_WALLS, WORLD_HEIGHT, WORLD_WIDTH } from "@/parables/lost-sheep/map";

const WORLD_BOUNDS = { width: WORLD_WIDTH, height: WORLD_HEIGHT };

function applyFacing(body: { scale: { x: number } }, velocityX: number): void {
  if (velocityX > 0.05) body.scale.x = 1;
  else if (velocityX < -0.05) body.scale.x = -1;
}

export class Shepherd {
  position: Vector2;
  radius = 7;
  speed = 100;
  maxHp = 100;
  hp = 100;
  sprite: ShepherdVisual;

  private walkPhase = 0;
  private idlePhase = 0;
  private walkBlend = 0;
  private staffCooldown = 0;
  staffActiveTime = 0;
  readonly staffRange = 26;
  readonly staffArcDuration = 0.22;
  readonly staffCooldownDuration = 0.55;

  constructor(start: Vector2) {
    this.position = { ...start };
    this.sprite = createShepherdSprite();
    this.sprite.container.position.set(start.x, start.y);
  }

  update(dt: number, direction: Vector2, circleObstacles: CircleObstacle[]): void {
    const moving = direction.x !== 0 || direction.y !== 0;
    if (moving) {
      this.position.x += direction.x * this.speed * dt;
      this.position.y += direction.y * this.speed * dt;

      for (const wall of PEN_WALLS) {
        this.position = resolveCircleVsRect(this.position, this.radius, wall);
      }
      for (const obstacle of circleObstacles) {
        this.position = resolveCircleVsCircle(this.position, this.radius, obstacle, obstacle.radius);
      }
      this.position = clampToBounds(this.position, WORLD_BOUNDS, this.radius);
    }
    this.sprite.container.position.set(this.position.x, this.position.y);
    this.sprite.container.zIndex = this.position.y;
    applyFacing(this.sprite.body, direction.x);

    const target = moving ? 1 : 0;
    this.walkBlend += (target - this.walkBlend) * Math.min(1, dt * 5);
    this.walkPhase += dt * 9;
    this.idlePhase += dt;

    // Smootherstep the blend so the walk cycle eases in/out at the start and
    // stop of a step instead of ramping linearly.
    const walkEase = this.walkBlend * this.walkBlend * (3 - 2 * this.walkBlend);

    const legAmp = 0.55 * walkEase;
    this.sprite.leftLeg.rotation = Math.sin(this.walkPhase) * legAmp;
    this.sprite.rightLeg.rotation = -Math.sin(this.walkPhase) * legAmp;
    this.sprite.frontArm.rotation = -Math.sin(this.walkPhase) * 0.4 * walkEase;
    const staffWalk = Math.sin(this.walkPhase) * 0.16 * walkEase;
    const staffIdle = Math.sin(this.idlePhase * 1.3) * 0.06 * (1 - walkEase);
    this.sprite.staffArm.rotation = staffWalk + staffIdle;
    const bodyBobWalk = Math.sin(this.walkPhase * 2) * 1.1 * walkEase;
    const bodyBobIdle = Math.sin(this.idlePhase * 2) * 0.4 * (1 - walkEase);
    this.sprite.body.y = bodyBobWalk + bodyBobIdle;
    const headIdleSway = Math.sin(this.idlePhase * 1.7) * 0.05 * (1 - walkEase);
    const headWalkNod = Math.sin(this.walkPhase * 2) * 0.02 * walkEase;
    this.sprite.head.rotation = headIdleSway + headWalkNod;

    // Idle breathing: a gentle chest scale pulse, strongest at rest.
    const breathe = Math.sin(this.idlePhase * 1.8) * 0.02 * (1 - walkEase);
    this.sprite.torso.scale.set(1 + breathe * 0.6, 1 + breathe);

    if (this.staffCooldown > 0) this.staffCooldown -= dt;
    if (this.staffActiveTime > 0) this.staffActiveTime -= dt;
  }

  swingStaff(): boolean {
    if (this.staffCooldown > 0) return false;
    this.staffCooldown = this.staffCooldownDuration;
    this.staffActiveTime = this.staffArcDuration;
    return true;
  }

  get staffActive(): boolean {
    return this.staffActiveTime > 0;
  }

  takeDamage(amount: number): void {
    this.hp = Math.max(0, this.hp - amount);
  }
}

export type SheepBehavior = "waiting" | "following";

export class LostSheep {
  position: Vector2;
  radius = 6;
  maxHp = 100;
  hp = 100;
  /** Starts "waiting" — motionless on its hill, guarded — until the shepherd finds it and it flees to follow. */
  behavior: SheepBehavior = "waiting";
  sprite: SheepVisual;

  private followSpeed = 92;
  private followDistance = 22;
  private walkPhase = 0;
  private idlePhase = 0;
  private walkBlend = 0;

  constructor(start: Vector2) {
    this.position = { ...start };
    this.sprite = createSheepSprite();
    this.sprite.container.position.set(start.x, start.y);
  }

  startFollowing(): void {
    this.behavior = "following";
  }

  update(dt: number, followTarget: Vector2): void {
    let velocity: Vector2 = { x: 0, y: 0 };

    if (this.behavior === "following") {
      const d = distance(this.position, followTarget);
      if (d > this.followDistance) {
        const before = { ...this.position };
        this.position = steerToward(this.position, followTarget, this.followSpeed, dt);
        velocity = { x: this.position.x - before.x, y: this.position.y - before.y };
      }
    }

    this.position = clampToBounds(this.position, WORLD_BOUNDS, this.radius);
    this.sprite.container.position.set(this.position.x, this.position.y);
    this.sprite.container.zIndex = this.position.y;
    const moving = Math.hypot(velocity.x, velocity.y) > 0.01;
    applyFacing(this.sprite.body, velocity.x);

    const target = moving ? 1 : 0;
    this.walkBlend += (target - this.walkBlend) * Math.min(1, dt * 6);
    this.walkPhase += dt * 10;
    this.idlePhase += dt;

    const legAmp = 0.6 * this.walkBlend;
    this.sprite.frontLeg.rotation = Math.sin(this.walkPhase) * legAmp;
    this.sprite.backLeg.rotation = -Math.sin(this.walkPhase) * legAmp;
    this.sprite.head.rotation = Math.sin(this.idlePhase * 1.5) * 0.08 * (1 - this.walkBlend);
  }

  takeDamage(amount: number): void {
    this.hp = Math.max(0, this.hp - amount);
  }
}

const WOLF_FRONT_LEG_BASE_Y = -3.4;
const WOLF_BACK_LEG_BASE_Y = -3.2;

export class Wolf {
  position: Vector2;
  radius = 8;
  speed = 62;
  hp = 30;
  sprite: WolfVisual;
  /** Guard wolves stand watch, motionless, until the scene activates them (e.g. the player finds the sheep they're guarding). */
  guarding = false;

  private stunTimer = 0;
  private knockback: Vector2 = { x: 0, y: 0 };
  private damageCooldown = 0;
  private walkPhase = 0;
  private idlePhase = 0;
  private walkBlend = 0;
  private attackFlash = 0;
  private facing = 1;

  constructor(start: Vector2) {
    this.position = { ...start };
    this.sprite = createWolfSprite();
    this.sprite.container.position.set(start.x, start.y);
  }

  get stunned(): boolean {
    return this.stunTimer > 0;
  }

  applyKnockback(from: Vector2, force: number, stunDuration: number): void {
    const direction = normalize({ x: this.position.x - from.x, y: this.position.y - from.y });
    this.knockback = { x: direction.x * force, y: direction.y * force };
    this.stunTimer = stunDuration;
  }

  canDamage(): boolean {
    return this.damageCooldown <= 0;
  }

  markDamaged(cooldown = 0.8): void {
    this.damageCooldown = cooldown;
    this.attackFlash = 0.25;
  }

  update(dt: number, chaseTarget: Vector2 | undefined, circleObstacles: CircleObstacle[] = []): void {
    if (this.damageCooldown > 0) this.damageCooldown -= dt;
    if (this.attackFlash > 0) this.attackFlash -= dt;
    let velocity: Vector2 = { x: 0, y: 0 };
    const effectiveTarget = this.guarding ? undefined : chaseTarget;

    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      this.position.x += this.knockback.x * dt;
      this.position.y += this.knockback.y * dt;
      this.knockback = { x: lerp(this.knockback.x, 0, 0.15), y: lerp(this.knockback.y, 0, 0.15) };
    } else if (effectiveTarget) {
      const before = { ...this.position };
      this.position = steerToward(this.position, effectiveTarget, this.speed, dt);
      velocity = { x: this.position.x - before.x, y: this.position.y - before.y };
    }

    // Trees, bushes and large rocks block wolves too — they slide along an
    // obstacle rather than pathfinding around it, which reads fine at this scale.
    for (const obstacle of circleObstacles) {
      this.position = resolveCircleVsCircle(this.position, this.radius, obstacle, obstacle.radius);
    }

    // Wolves may surround the pen but can never cross the fence into it.
    if (circleOverlapsRect(this.position, this.radius, PEN as Rect)) {
      this.position = resolveCircleVsRect(this.position, this.radius, PEN as Rect);
    }

    this.position = clampToBounds(this.position, WORLD_BOUNDS, this.radius);
    this.sprite.container.position.set(this.position.x, this.position.y);
    this.sprite.container.zIndex = this.position.y;
    const moving = Math.hypot(velocity.x, velocity.y) > 0.01 && this.stunTimer <= 0;
    if (velocity.x > 0.05) this.facing = 1;
    else if (velocity.x < -0.05) this.facing = -1;

    const target = moving ? 1 : 0;
    this.walkBlend += (target - this.walkBlend) * Math.min(1, dt * 8);
    this.walkPhase += dt * 15;
    this.idlePhase += dt;

    const legAmp = 0.7 * this.walkBlend;
    this.sprite.frontLeg.rotation = Math.sin(this.walkPhase) * legAmp;
    this.sprite.backLeg.rotation = -Math.sin(this.walkPhase) * legAmp;
    this.sprite.frontLeg.y = WOLF_FRONT_LEG_BASE_Y;
    this.sprite.backLeg.y = WOLF_BACK_LEG_BASE_Y;

    const tailWalk = Math.sin(this.walkPhase * 0.9) * 0.35 * this.walkBlend;
    const tailIdle = Math.sin(this.idlePhase * 1.6) * 0.15 * (1 - this.walkBlend);
    this.sprite.tail.rotation = tailWalk + tailIdle;

    const breathe = Math.sin(this.idlePhase * 2.2) * 0.02 * (1 - this.walkBlend);
    const lunge = this.attackFlash > 0 ? 0.12 : 0;
    this.sprite.body.scale.set(this.facing * (1 + breathe + lunge), 1 - breathe * 0.5);

    this.sprite.container.alpha = this.stunTimer > 0 ? 0.55 : 1;
  }
}
