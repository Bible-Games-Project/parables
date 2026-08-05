import { Container } from "pixi.js";
import type { Vector2 } from "@/engine/input";
import { steerToward } from "@/engine/chaseAI";
import { createRng } from "@/pixel-art/prng";
import { createSheepSprite, type SheepVisual } from "@/parables/lost-sheep/sprites";
import { PEN } from "@/parables/lost-sheep/map";

const FENCE_MARGIN = 16;
const INTERIOR = {
  x: PEN.x + FENCE_MARGIN,
  y: PEN.y + FENCE_MARGIN,
  width: PEN.width - FENCE_MARGIN * 2,
  height: PEN.height - FENCE_MARGIN * 2,
};

type FlockState = "idle" | "wander" | "graze";

/** One sheep safe in the pen: alternates between standing still, slowly wandering, and grazing, but never leaves the interior. */
class FlockSheep {
  position: Vector2;
  radius = 5;
  sprite: SheepVisual;

  private state: FlockState = "idle";
  private stateTimer: number;
  private wanderTarget: Vector2;
  private rng: () => number;
  private walkPhase = 0;
  private idlePhase = 0;
  private walkBlend = 0;
  private grazeBlend = 0;

  constructor(start: Vector2, scale: number, seed: number) {
    this.position = { ...start };
    this.sprite = createSheepSprite(scale);
    this.sprite.container.position.set(start.x, start.y);
    this.rng = createRng(seed);
    this.idlePhase = this.rng() * 10;
    this.stateTimer = 1 + this.rng() * 3;
    this.wanderTarget = { ...start };
  }

  private pickNextState(): void {
    const roll = this.rng();
    if (roll < 0.4) {
      this.state = "idle";
      this.stateTimer = 2 + this.rng() * 3;
    } else if (roll < 0.7) {
      this.state = "graze";
      this.stateTimer = 2.5 + this.rng() * 3;
    } else {
      this.state = "wander";
      this.stateTimer = 2 + this.rng() * 2.5;
      this.wanderTarget = {
        x: INTERIOR.x + this.rng() * INTERIOR.width,
        y: INTERIOR.y + this.rng() * INTERIOR.height,
      };
    }
  }

  update(dt: number): void {
    this.stateTimer -= dt;
    if (this.stateTimer <= 0) this.pickNextState();
    this.idlePhase += dt;

    let velocity: Vector2 = { x: 0, y: 0 };
    if (this.state === "wander") {
      const before = { ...this.position };
      this.position = steerToward(this.position, this.wanderTarget, 12, dt);
      velocity = { x: this.position.x - before.x, y: this.position.y - before.y };
    }

    this.position = {
      x: Math.max(INTERIOR.x + this.radius, Math.min(INTERIOR.x + INTERIOR.width - this.radius, this.position.x)),
      y: Math.max(INTERIOR.y + this.radius, Math.min(INTERIOR.y + INTERIOR.height - this.radius, this.position.y)),
    };
    this.sprite.container.position.set(this.position.x, this.position.y);

    if (velocity.x > 0.03) this.sprite.body.scale.x = Math.abs(this.sprite.body.scale.x);
    else if (velocity.x < -0.03) this.sprite.body.scale.x = -Math.abs(this.sprite.body.scale.x);

    const moving = this.state === "wander" && Math.hypot(velocity.x, velocity.y) > 0.01;
    this.walkBlend += ((moving ? 1 : 0) - this.walkBlend) * Math.min(1, dt * 5);
    this.walkPhase += dt * 7;
    this.grazeBlend += ((this.state === "graze" ? 1 : 0) - this.grazeBlend) * Math.min(1, dt * 3);

    const legAmp = 0.55 * this.walkBlend;
    this.sprite.frontLeg.rotation = Math.sin(this.walkPhase) * legAmp;
    this.sprite.backLeg.rotation = -Math.sin(this.walkPhase) * legAmp;

    const idleSway = Math.sin(this.idlePhase * 1.4) * 0.06 * (1 - this.grazeBlend) * (1 - this.walkBlend);
    this.sprite.head.rotation = idleSway + 0.55 * this.grazeBlend;
    this.sprite.head.y = -1.4 + 1.6 * this.grazeBlend;
  }
}

export class Flock {
  container = new Container();
  members: FlockSheep[] = [];

  constructor(count: number) {
    const rng = createRng(2024);
    for (let i = 0; i < count; i++) {
      const start = {
        x: INTERIOR.x + rng() * INTERIOR.width,
        y: INTERIOR.y + rng() * INTERIOR.height,
      };
      const sheep = new FlockSheep(start, 0.62 + rng() * 0.16, 4000 + i * 37);
      this.members.push(sheep);
      this.container.addChild(sheep.sprite.container);
    }
  }

  update(dt: number): void {
    for (const member of this.members) member.update(dt);
  }

  /** Current positions as collision circles, for the shepherd's obstacle check. */
  asObstacles(): { x: number; y: number; radius: number }[] {
    return this.members.map((m) => ({ x: m.position.x, y: m.position.y, radius: m.radius }));
  }
}
