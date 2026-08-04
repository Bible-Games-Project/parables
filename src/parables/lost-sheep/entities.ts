import type { Vector2 } from "@/engine/input";
import { clampToBounds, distance, lerp, normalize } from "@/engine/collision";
import { steerToward } from "@/engine/chaseAI";
import { createRng } from "@/pixel-art/prng";
import { createSheepSprite, createShepherdSprite, createWolfSprite, type CharacterSprite } from "@/parables/lost-sheep/sprites";
import { WORLD_HEIGHT, WORLD_WIDTH } from "@/parables/lost-sheep/map";

const WORLD_BOUNDS = { width: WORLD_WIDTH, height: WORLD_HEIGHT };

function applyFacing(sprite: CharacterSprite, velocity: Vector2, bobPhase: number, moving: boolean): void {
  if (velocity.x > 0.05) sprite.body.scale.x = 1;
  else if (velocity.x < -0.05) sprite.body.scale.x = -1;
  sprite.body.y = moving ? Math.sin(bobPhase) * 1.6 : 0;
}

export class Shepherd {
  position: Vector2;
  radius = 7;
  speed = 100;
  maxHp = 100;
  hp = 100;
  sprite: CharacterSprite;

  private bobPhase = 0;
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

  update(dt: number, direction: Vector2): void {
    const moving = direction.x !== 0 || direction.y !== 0;
    if (moving) {
      this.position.x += direction.x * this.speed * dt;
      this.position.y += direction.y * this.speed * dt;
      this.position = clampToBounds(this.position, WORLD_BOUNDS, this.radius);
      this.bobPhase += dt * 10;
    }
    this.sprite.container.position.set(this.position.x, this.position.y);
    applyFacing(this.sprite, direction, this.bobPhase, moving);

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

export type SheepBehavior = "wandering" | "following";

export class LostSheep {
  position: Vector2;
  radius = 6;
  maxHp = 100;
  hp = 100;
  behavior: SheepBehavior = "wandering";
  sprite: CharacterSprite;

  private wanderTarget: Vector2;
  private wanderSpeed = 34;
  private followSpeed = 92;
  private followDistance = 22;
  private rng = createRng(9001);
  private retargetIn = 0;
  private bobPhase = 0;

  constructor(start: Vector2) {
    this.position = { ...start };
    this.wanderTarget = { ...start };
    this.sprite = createSheepSprite();
    this.sprite.container.position.set(start.x, start.y);
  }

  startFollowing(): void {
    this.behavior = "following";
  }

  update(dt: number, followTarget: Vector2): void {
    let velocity: Vector2 = { x: 0, y: 0 };

    if (this.behavior === "wandering") {
      this.retargetIn -= dt;
      if (this.retargetIn <= 0 || distance(this.position, this.wanderTarget) < 6) {
        this.wanderTarget = {
          x: this.rng() * WORLD_WIDTH,
          y: this.rng() * WORLD_HEIGHT,
        };
        this.retargetIn = 3 + this.rng() * 3;
      }
      const before = { ...this.position };
      this.position = steerToward(this.position, this.wanderTarget, this.wanderSpeed, dt);
      velocity = { x: this.position.x - before.x, y: this.position.y - before.y };
    } else {
      const d = distance(this.position, followTarget);
      if (d > this.followDistance) {
        const before = { ...this.position };
        this.position = steerToward(this.position, followTarget, this.followSpeed, dt);
        velocity = { x: this.position.x - before.x, y: this.position.y - before.y };
      }
    }

    this.position = clampToBounds(this.position, WORLD_BOUNDS, this.radius);
    this.sprite.container.position.set(this.position.x, this.position.y);
    const moving = Math.hypot(velocity.x, velocity.y) > 0.01;
    if (moving) this.bobPhase += dt * 9;
    applyFacing(this.sprite, velocity, this.bobPhase, moving);
  }

  takeDamage(amount: number): void {
    this.hp = Math.max(0, this.hp - amount);
  }
}

export class Wolf {
  position: Vector2;
  radius = 8;
  speed = 62;
  hp = 30;
  sprite: CharacterSprite;

  private stunTimer = 0;
  private knockback: Vector2 = { x: 0, y: 0 };
  private damageCooldown = 0;
  private bobPhase = 0;

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
  }

  update(dt: number, chaseTarget: Vector2 | undefined): void {
    if (this.damageCooldown > 0) this.damageCooldown -= dt;
    let velocity: Vector2 = { x: 0, y: 0 };

    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      this.position.x += this.knockback.x * dt;
      this.position.y += this.knockback.y * dt;
      this.knockback = { x: lerp(this.knockback.x, 0, 0.15), y: lerp(this.knockback.y, 0, 0.15) };
    } else if (chaseTarget) {
      const before = { ...this.position };
      this.position = steerToward(this.position, chaseTarget, this.speed, dt);
      velocity = { x: this.position.x - before.x, y: this.position.y - before.y };
    }

    this.position = clampToBounds(this.position, WORLD_BOUNDS, this.radius);
    this.sprite.container.position.set(this.position.x, this.position.y);
    const moving = Math.hypot(velocity.x, velocity.y) > 0.01;
    if (moving) this.bobPhase += dt * 11;
    applyFacing(this.sprite, velocity, this.bobPhase, moving && this.stunTimer <= 0);
    this.sprite.container.alpha = this.stunTimer > 0 ? 0.55 : 1;
  }
}
