import { useCallback, useEffect, useRef, useState } from "react";
import { Application, Container, Graphics } from "pixi.js";
import { hexToNumber } from "@/pixel-art/color";
import { palette } from "@/pixel-art/palette";
import { PixiStage } from "@/engine/PixiStage";
import { KeyboardController } from "@/engine/input";
import { Camera } from "@/engine/camera";
import { createNightOverlay, type NightOverlay } from "@/engine/nightOverlay";
import { circleOverlapsRect, circlesOverlap, distance, resolveCircleVsRect, type CircleObstacle } from "@/engine/collision";
import { pickNearestTarget } from "@/engine/chaseAI";
import { createMissionMachine } from "@/engine/missionMachine";
import { Shepherd, LostSheep, Wolf, LOST_SHEEP_START_HP } from "@/parables/lost-sheep/entities";
import { createFenceOutline } from "@/parables/lost-sheep/sprites";
import { Flock } from "@/parables/lost-sheep/flock";
import { buildTerrain, type TerrainObstacle } from "@/parables/lost-sheep/terrain";
import { buildJourneyTrail } from "@/parables/lost-sheep/trail";
import { buildRock } from "@/pixel-art/foliage";
import { createRng } from "@/pixel-art/prng";
import {
  FLOCK_COUNT,
  GATE,
  JOURNEY_PATH,
  LOST_SHEEP_START,
  PEN,
  PEN_CENTER,
  SHEPHERD_START,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "@/parables/lost-sheep/map";
import type { LostSheepMissionState } from "@/parables/lost-sheep/missionState";
import { LostSheepHud } from "@/parables/lost-sheep/LostSheepHud";
import { GameOverOverlay, VictoryOverlay } from "@/parables/lost-sheep/EndScreens";
import { DialogueOverlay } from "@/ui/DialogueOverlay";
import { PixelIconButton } from "@/ui/PixelIconButton";
import { backIcon } from "@/pixel-art/icons";
import { useT } from "@/locales/useT";
import { useProgressStore } from "@/store/progressStore";
import { getNextParableId } from "@/parables/registry";

const RETURN_RADIUS = 46;
const FOUND_RADIUS = 34;
const STAFF_KNOCKBACK = 220;
const STAFF_STUN = 1.1;
const WOLF_CONTACT_DAMAGE = 8;
const SEARCH_WOLF_CAP = 3;
const ESCORT_WOLF_CAP = 5;
const GUARD_WOLF_COUNT = 3;
const GUARD_WOLF_DISTANCE = 26;

/**
 * The small rocky hill the lost sheep waits on — a raised grass mound with
 * rock outcrops embedded at its base, purely decorative (no gameplay
 * elevation). Deterministic seed so the hill looks identical every run.
 */
function drawHill(x: number, y: number): Graphics {
  const g = new Graphics();
  g.ellipse(x, y + 7, 42, 19).fill({ color: hexToNumber(palette.foliage.shadow), alpha: 0.35 });
  g.ellipse(x, y + 3, 38, 21).fill(hexToNumber(palette.grass.dark));
  g.ellipse(x, y, 33, 17).fill(hexToNumber(palette.grass.base));
  g.ellipse(x - 6, y - 5, 19, 9).fill({ color: hexToNumber(palette.grass.light), alpha: 0.55 });

  const rng = createRng(1212);
  const rockAnglesOnHill = [-2.4, -0.6, 1.1, 2.6];
  for (const angle of rockAnglesOnHill) {
    const rx = x + Math.cos(angle) * (26 + rng() * 6);
    const ry = y + Math.sin(angle) * (13 + rng() * 3);
    buildRock(rx, ry, rng, 0.55 + rng() * 0.35, g);
  }
  return g;
}

interface RuntimeRefs {
  app: Application;
  world: Container;
  dynamicLayer: Container;
  shepherd: Shepherd;
  sheep: LostSheep;
  wolves: Wolf[];
  guardWolves: Wolf[];
  flock: Flock;
  terrainObstacles: TerrainObstacle[];
  input: KeyboardController;
  camera: Camera;
  night: NightOverlay;
  mission: ReturnType<typeof createMissionMachine<LostSheepMissionState>>;
  nightIntensity: number;
  spawnTimer: number;
  hitThisSwing: Set<Wolf>;
}

interface LostSheepSceneProps {
  onExit: () => void;
  onRetry: () => void;
}

export function LostSheepScene({ onExit, onRetry }: LostSheepSceneProps) {
  const t = useT();
  const completeParable = useProgressStore((state) => state.completeParable);
  const unlockParable = useProgressStore((state) => state.unlockParable);

  const runtimeRef = useRef<RuntimeRefs | null>(null);
  const [missionState, setMissionState] = useState<LostSheepMissionState>("intro");
  const [hud, setHud] = useState({ shepherdHp: 100, sheepHp: LOST_SHEEP_START_HP });

  const onReady = useCallback((app: Application) => {
    const world = new Container();
    app.stage.addChild(world);
    const { obstacles: terrainObstacles, dynamicLayer } = buildTerrain(world);

    buildJourneyTrail(world, JOURNEY_PATH);

    const fence = createFenceOutline(PEN.width, PEN.height, { x: GATE.x - PEN.x, width: GATE.width });
    fence.position.set(PEN.x, PEN.y);

    const flock = new Flock(FLOCK_COUNT);
    world.addChild(flock.container);
    world.addChild(fence);

    // `dynamicLayer` (tree canopies + large rocks) is added last so the
    // player, sheep and wolves inside it can sort correctly against tall
    // scenery by y — while still rendering above the fence/flock/mound.
    world.addChild(dynamicLayer);

    const shepherd = new Shepherd(SHEPHERD_START);
    const sheepSpawn = LOST_SHEEP_START;
    const sheep = new LostSheep(sheepSpawn);
    world.addChild(drawHill(sheepSpawn.x, sheepSpawn.y));
    dynamicLayer.addChild(sheep.sprite.container);
    dynamicLayer.addChild(shepherd.sprite.container);

    // Three wolves keep watch at the foot of the hill, slowly circling the
    // sheep they're guarding, until the shepherd gets close enough to find it.
    const guardWolves: Wolf[] = [];
    for (let i = 0; i < GUARD_WOLF_COUNT; i++) {
      const angle = (i / GUARD_WOLF_COUNT) * Math.PI * 2 + Math.PI / 2;
      const wolf = new Wolf({
        x: sheepSpawn.x + Math.cos(angle) * GUARD_WOLF_DISTANCE,
        y: sheepSpawn.y + Math.sin(angle) * GUARD_WOLF_DISTANCE + 6,
      });
      wolf.guarding = true;
      wolf.patrolCenter = sheepSpawn;
      wolf.patrolRadius = GUARD_WOLF_DISTANCE + i * 3;
      wolf.patrolAngle = angle;
      wolf.patrolAngularSpeed = 0.12 + i * 0.025;
      guardWolves.push(wolf);
      dynamicLayer.addChild(wolf.sprite.container);
    }

    const input = new KeyboardController();
    const camera = new Camera({ width: WORLD_WIDTH, height: WORLD_HEIGHT });
    const night = createNightOverlay(app);
    const mission = createMissionMachine<LostSheepMissionState>("intro");

    const runtime: RuntimeRefs = {
      app,
      world,
      dynamicLayer,
      shepherd,
      sheep,
      wolves: [...guardWolves],
      guardWolves,
      flock,
      terrainObstacles,
      input,
      camera,
      night,
      mission,
      nightIntensity: 0,
      spawnTimer: 4,
      hitThisSwing: new Set(),
    };
    runtimeRef.current = runtime;

    mission.subscribe((state) => setMissionState(state));

    const unsubscribeAction = input.onAction(() => {
      const current = runtimeRef.current;
      if (!current) return;
      if (current.mission.state !== "search" && current.mission.state !== "escort") return;
      if (current.shepherd.swingStaff()) current.hitThisSwing.clear();
    });

    let lastHudSent = { shepherdHp: 100, sheepHp: LOST_SHEEP_START_HP };

    const tick = (ticker: { deltaTime: number }) => {
      const current = runtimeRef.current;
      if (!current) return;
      const dt = Math.min(ticker.deltaTime / 60, 1 / 30);
      const state = current.mission.state;
      const playing = state === "search" || state === "escort";

      const direction = state === "intro" || state === "victory" || state === "gameOver" ? { x: 0, y: 0 } : current.input.getDirection();
      // The player must never be able to walk through any living creature —
      // the flock, the lost sheep, or a wolf all count as solid obstacles.
      const obstacles: CircleObstacle[] = current.terrainObstacles
        .concat(current.flock.asObstacles())
        .concat([{ x: current.sheep.position.x, y: current.sheep.position.y, radius: current.sheep.radius }])
        .concat(current.wolves.map((wolf) => ({ x: wolf.position.x, y: wolf.position.y, radius: wolf.radius })));
      current.shepherd.update(dt, direction, obstacles);
      current.flock.update(dt);

      if (state !== "intro") {
        current.sheep.update(dt, current.shepherd.position, playing);
      }

      current.camera.update(current.shepherd.position, dt);
      current.world.position.set(current.camera.x, current.camera.y);

      const targetIntensity = state === "intro" ? 0 : 1;
      const fadeRate = 1 - Math.exp(-dt * 0.35);
      current.nightIntensity += (targetIntensity - current.nightIntensity) * fadeRate;
      current.night.setIntensity(current.nightIntensity);
      current.night.setFollowPosition(current.camera.toScreen(current.shepherd.position));

      if (playing) {
        // Search -> found transition: the sheep flees and the wolves guarding it wake up.
        if (state === "search" && distance(current.shepherd.position, current.sheep.position) < FOUND_RADIUS) {
          current.sheep.startFollowing();
          for (const guard of current.guardWolves) guard.guarding = false;
          current.mission.set("escort");
        }

        // Wolf spawning.
        current.spawnTimer -= dt;
        const cap = state === "escort" ? ESCORT_WOLF_CAP : SEARCH_WOLF_CAP;
        const interval = state === "escort" ? 3.2 : 5.5;
        if (current.spawnTimer <= 0 && current.wolves.length < cap) {
          current.spawnTimer = interval;
          spawnWolf(current);
        }

        // Wolf AI + contact damage.
        const candidates = [
          { id: "shepherd", position: current.shepherd.position },
          { id: "sheep", position: current.sheep.position },
        ];
        for (const wolf of current.wolves) {
          const nearest = pickNearestTarget(wolf.position, candidates);
          wolf.update(dt, nearest?.position, current.terrainObstacles);
        }

        // Keep wolves from ever occupying the same space — a simple pairwise push-apart.
        for (let i = 0; i < current.wolves.length; i++) {
          for (let j = i + 1; j < current.wolves.length; j++) {
            const a = current.wolves[i];
            const b = current.wolves[j];
            const d = distance(a.position, b.position);
            const minDist = a.radius + b.radius + 3;
            if (d > 0 && d < minDist) {
              const overlap = minDist - d;
              const nx = (a.position.x - b.position.x) / d;
              const ny = (a.position.y - b.position.y) / d;
              a.position.x += nx * overlap * 0.5;
              a.position.y += ny * overlap * 0.5;
              b.position.x -= nx * overlap * 0.5;
              b.position.y -= ny * overlap * 0.5;
              a.sprite.container.position.set(a.position.x, a.position.y);
              b.sprite.container.position.set(b.position.x, b.position.y);
            }
          }
        }

        for (const wolf of current.wolves) {
          if (!wolf.guarding && !wolf.stunned && wolf.canDamage()) {
            if (circlesOverlap(wolf.position, wolf.radius, current.shepherd.position, current.shepherd.radius + 3)) {
              current.shepherd.takeDamage(WOLF_CONTACT_DAMAGE);
              wolf.markDamaged();
            } else if (
              current.sheep.behavior === "following" &&
              circlesOverlap(wolf.position, wolf.radius, current.sheep.position, current.sheep.radius + 3)
            ) {
              current.sheep.takeDamage(WOLF_CONTACT_DAMAGE);
              wolf.markDamaged();
            }
          }

          if (
            current.shepherd.staffActive &&
            !current.hitThisSwing.has(wolf) &&
            distance(wolf.position, current.shepherd.position) < current.shepherd.staffRange
          ) {
            wolf.applyKnockback(current.shepherd.position, STAFF_KNOCKBACK, STAFF_STUN);
            current.hitThisSwing.add(wolf);
          }
        }

        if (current.shepherd.hp <= 0 || current.sheep.hp <= 0) {
          current.mission.set("gameOver");
        } else if (state === "escort" && distance(current.shepherd.position, PEN_CENTER) < RETURN_RADIUS) {
          current.mission.set("victory");
        }
      }

      const nextHud = { shepherdHp: current.shepherd.hp, sheepHp: current.sheep.hp };
      if (nextHud.shepherdHp !== lastHudSent.shepherdHp || nextHud.sheepHp !== lastHudSent.sheepHp) {
        lastHudSent = nextHud;
        setHud(nextHud);
      }
    };

    app.ticker.add(tick);

    return () => {
      app.ticker.remove(tick);
      unsubscribeAction();
      input.destroy();
      night.destroy();
      app.stage.removeChild(world);
      world.destroy({ children: true });
      runtimeRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (missionState !== "victory") return;
    completeParable("lost-sheep");
    const next = getNextParableId("lost-sheep");
    if (next) unlockParable(next);
  }, [missionState, completeParable, unlockParable]);

  const handleDialogueComplete = () => {
    runtimeRef.current?.mission.set("search");
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <PixiStage onReady={onReady} className="" />

      <PixelIconButton
        sprite={backIcon}
        seed="back-gameplay"
        style={{ position: "absolute", top: "1rem", left: "1rem", zIndex: 10 }}
        onClick={onExit}
        aria-label={t("common.back")}
      />

      {(missionState === "search" || missionState === "escort") && (
        <LostSheepHud shepherdHp={hud.shepherdHp} sheepHp={hud.sheepHp} state={missionState} />
      )}

      {missionState === "intro" && (
        <DialogueOverlay
          seed="lost-sheep-intro"
          lines={["lostSheep.intro.line1", "lostSheep.intro.line2", "lostSheep.intro.line3"]}
          onComplete={handleDialogueComplete}
        />
      )}

      {missionState === "gameOver" && <GameOverOverlay onRetry={onRetry} />}
      {missionState === "victory" && <VictoryOverlay onContinue={onExit} />}
    </div>
  );
}

function spawnWolf(runtime: RuntimeRefs): void {
  const angle = Math.random() * Math.PI * 2;
  const spawnDistance = 180 + Math.random() * 60;
  let x = Math.max(20, Math.min(WORLD_WIDTH - 20, runtime.shepherd.position.x + Math.cos(angle) * spawnDistance));
  let y = Math.max(20, Math.min(WORLD_HEIGHT - 20, runtime.shepherd.position.y + Math.sin(angle) * spawnDistance));

  // Wolves may never spawn inside the pen — push out to the nearest edge if the roll landed there.
  const spawnRadius = 8;
  if (circleOverlapsRect({ x, y }, spawnRadius, PEN)) {
    const pushed = resolveCircleVsRect({ x, y }, spawnRadius, PEN);
    x = pushed.x;
    y = pushed.y;
  }

  const wolf = new Wolf({ x, y });
  runtime.wolves.push(wolf);
  runtime.dynamicLayer.addChild(wolf.sprite.container);
}
