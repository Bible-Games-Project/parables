import { useCallback, useEffect, useRef, useState } from "react";
import { Application, Container } from "pixi.js";
import { PixiStage } from "@/engine/PixiStage";
import { KeyboardController } from "@/engine/input";
import { Camera } from "@/engine/camera";
import { createNightOverlay, type NightOverlay } from "@/engine/nightOverlay";
import { circleOverlapsRect, circlesOverlap, distance, resolveCircleVsRect, type CircleObstacle } from "@/engine/collision";
import { pickNearestTarget } from "@/engine/chaseAI";
import { createMissionMachine } from "@/engine/missionMachine";
import { Shepherd, LostSheep, Wolf } from "@/parables/lost-sheep/entities";
import { createFenceOutline } from "@/parables/lost-sheep/sprites";
import { Flock } from "@/parables/lost-sheep/flock";
import { buildTerrain, type TerrainObstacle } from "@/parables/lost-sheep/terrain";
import {
  FLOCK_COUNT,
  GATE,
  PEN,
  PEN_CENTER,
  SHEPHERD_START,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  pickLostSheepSpawn,
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
const FOUND_RADIUS = 20;
const STAFF_KNOCKBACK = 220;
const STAFF_STUN = 1.1;
const WOLF_CONTACT_DAMAGE = 8;
const SEARCH_WOLF_CAP = 3;
const ESCORT_WOLF_CAP = 5;

interface RuntimeRefs {
  app: Application;
  world: Container;
  shepherd: Shepherd;
  sheep: LostSheep;
  wolves: Wolf[];
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
  const [hud, setHud] = useState({ shepherdHp: 100, sheepHp: 100 });

  const onReady = useCallback((app: Application) => {
    const world = new Container();
    app.stage.addChild(world);
    const terrainObstacles = buildTerrain(world);

    const fence = createFenceOutline(PEN.width, PEN.height, { x: GATE.x - PEN.x, width: GATE.width });
    fence.position.set(PEN.x, PEN.y);

    const flock = new Flock(FLOCK_COUNT);
    world.addChild(flock.container);
    world.addChild(fence);

    const shepherd = new Shepherd(SHEPHERD_START);
    const sheep = new LostSheep(pickLostSheepSpawn());
    world.addChild(sheep.sprite.container);
    world.addChild(shepherd.sprite.container);

    const input = new KeyboardController();
    const camera = new Camera({ width: WORLD_WIDTH, height: WORLD_HEIGHT });
    const night = createNightOverlay(app);
    const mission = createMissionMachine<LostSheepMissionState>("intro");

    const runtime: RuntimeRefs = {
      app,
      world,
      shepherd,
      sheep,
      wolves: [],
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

    let lastHudSent = { shepherdHp: 100, sheepHp: 100 };

    const tick = (ticker: { deltaTime: number }) => {
      const current = runtimeRef.current;
      if (!current) return;
      const dt = Math.min(ticker.deltaTime / 60, 1 / 30);
      const state = current.mission.state;
      const playing = state === "search" || state === "escort";

      const direction = state === "intro" || state === "victory" || state === "gameOver" ? { x: 0, y: 0 } : current.input.getDirection();
      const obstacles: CircleObstacle[] = current.terrainObstacles.concat(current.flock.asObstacles());
      current.shepherd.update(dt, direction, obstacles);
      current.flock.update(dt);

      if (state !== "intro") {
        current.sheep.update(dt, current.shepherd.position);
      }

      current.camera.update(current.shepherd.position, dt);
      current.world.position.set(current.camera.x, current.camera.y);

      const targetIntensity = state === "intro" ? 0 : 1;
      const fadeRate = 1 - Math.exp(-dt * 0.35);
      current.nightIntensity += (targetIntensity - current.nightIntensity) * fadeRate;
      current.night.setIntensity(current.nightIntensity);
      current.night.setFollowPosition(current.camera.toScreen(current.shepherd.position));

      if (playing) {
        // Search -> found transition.
        if (state === "search" && distance(current.shepherd.position, current.sheep.position) < FOUND_RADIUS) {
          current.sheep.startFollowing();
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
          wolf.update(dt, nearest?.position);

          if (!wolf.stunned && wolf.canDamage()) {
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
  runtime.world.addChild(wolf.sprite.container);
}
