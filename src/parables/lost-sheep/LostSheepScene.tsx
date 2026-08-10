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
  PEN_DETAIL_OBSTACLES,
  PEN_EXTENSION,
  SENTINEL_WOLVES,
  SHELTER,
  SHEPHERD_START,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "@/parables/lost-sheep/map";
import type { LostSheepMissionState } from "@/parables/lost-sheep/missionState";
import { LostSheepHud } from "@/parables/lost-sheep/LostSheepHud";
import { GameOverOverlay, VictoryOverlay } from "@/parables/lost-sheep/EndScreens";
import { DialogueOverlay } from "@/ui/DialogueOverlay";
import { NarrativeToast } from "@/ui/NarrativeToast";
import { PixelIconButton } from "@/ui/PixelIconButton";
import { backIcon } from "@/pixel-art/icons";
import { useT } from "@/locales/useT";
import type { LocaleKey } from "@/locales/en";
import type { ParableSceneProps } from "@/parables/registry";
import { computeStars } from "@/world/scoring";

const RETURN_RADIUS = 46;
const FOUND_RADIUS = 34;
const STAFF_KNOCKBACK = 220;
const STAFF_STUN = 1.1;
const WOLF_CONTACT_DAMAGE = 8;
const SEARCH_WOLF_CAP = 3;
const ESCORT_WOLF_CAP = 5;
const GUARD_WOLF_COUNT = 3;
const GUARD_WOLF_DISTANCE = 26;
const DANGER_DELAY = 15;
const BLOOD_DISCOVERY_RADIUS = 26;
const TRACK_DISCOVERY_RADIUS = 30;
const LIGHT_RADIUS_START = 70;
const LIGHT_RADIUS_MIN = 46;
const LIGHT_SHRINK_DURATION = 240;
/** Star pacing: a rescue finished within this many seconds of active play earns full marks on speed; at or beyond the slow threshold, speed contributes nothing. */
const STAR_FAST_SECONDS = 70;
const STAR_SLOW_SECONDS = 220;

/**
 * The lost sheep's special elevated area — a rocky, mostly-exposed ledge
 * (irregular, not a clean ellipse) that reads deliberately different from
 * the lush, unclimbable hills scattered through the terrain: those are
 * green mounds you cannot approach, this is the one place you're meant to
 * be able to reach. Purely decorative, no gameplay elevation — walkable
 * ground like everywhere else, just built to look worth climbing.
 */
function drawSheepLedge(x: number, y: number): Graphics {
  const g = new Graphics();
  const rng = createRng(1212);
  const pointCount = 9;
  const radii: number[] = [];
  for (let i = 0; i < pointCount; i++) radii.push(32 * (0.8 + rng() * 0.4));

  const shadowPts: number[] = [];
  const rockPts: number[] = [];
  const rockMidPts: number[] = [];
  const grassPts: number[] = [];
  for (let i = 0; i < pointCount; i++) {
    const angle = (i / pointCount) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle) * 0.56;
    shadowPts.push(x + cos * radii[i] * 1.1 + 3, y + sin * radii[i] * 1.1 + 7);
    rockPts.push(x + cos * radii[i], y + sin * radii[i]);
    rockMidPts.push(x + cos * radii[i] * 0.82, y + sin * radii[i] * 0.82 - 1);
    grassPts.push(x + cos * radii[i] * 0.55, y + sin * radii[i] * 0.55 - 3);
  }
  g.poly(shadowPts).fill({ color: hexToNumber(palette.foliage.shadow), alpha: 0.3 });
  g.poly(rockPts).fill(0x6b675a);
  g.poly(rockMidPts).fill(0x8b8879);
  g.poly(grassPts).fill(hexToNumber(palette.grass.base));
  g.ellipse(x - 6, y - 8, 12, 6).fill({ color: hexToNumber(palette.grass.light), alpha: 0.5 });

  for (let i = 0; i < 4; i++) {
    const angle = rng() * Math.PI * 2;
    const r = 30 + rng() * 8;
    buildRock(x + Math.cos(angle) * r, y + Math.sin(angle) * r * 0.56, rng, 0.5 + rng() * 0.3, g);
  }
  return g;
}

/** The pen's interior: a lean-to shelter, a hay pile and a stacked-log woodpile — purely visual, their collision comes from `SHELTER`/`PEN_DETAIL_OBSTACLES` (map.ts). */
function buildPenDetails(world: Container): void {
  const s = SHELTER;
  const shelter = new Graphics();
  shelter.rect(s.x, s.y + 8, s.width, s.height - 8).fill(hexToNumber(palette.fence.dark));
  shelter.rect(s.x, s.y + 8, s.width, 3).fill({ color: hexToNumber(palette.fence.darkest), alpha: 0.5 });
  shelter.rect(s.x, s.y + 8, 4, s.height - 8).fill(hexToNumber(palette.fence.darkest));
  shelter.rect(s.x + s.width - 4, s.y + 8, 4, s.height - 8).fill({ color: hexToNumber(palette.fence.mid), alpha: 0.7 });

  const roofPeakX = s.x + s.width / 2;
  shelter
    .poly([s.x - 6, s.y + 14, roofPeakX, s.y - 10, s.x + s.width + 6, s.y + 14, s.x + s.width + 6, s.y + 19, roofPeakX, s.y - 5, s.x - 6, s.y + 19])
    .fill(hexToNumber(palette.hay.base));
  shelter
    .poly([s.x - 6, s.y + 14, roofPeakX, s.y - 10, roofPeakX, s.y - 5, s.x - 6, s.y + 19])
    .fill({ color: hexToNumber(palette.hay.shadow), alpha: 0.55 });

  const roofRng = createRng(4141);
  for (let i = 0; i < 12; i++) {
    const rx = s.x - 4 + roofRng() * (s.width + 8);
    const ry = s.y + 4 + roofRng() * 10;
    shelter
      .moveTo(rx, ry)
      .lineTo(rx + 3, ry - 4)
      .stroke({ width: 0.6, color: hexToNumber(palette.hay.light), alpha: 0.4 });
  }
  world.addChild(shelter);

  const hay = PEN_DETAIL_OBSTACLES[0];
  const haypile = new Graphics();
  haypile.ellipse(hay.x, hay.y + 6, hay.radius + 4, hay.radius * 0.5).fill({ color: hexToNumber(palette.foliage.shadow), alpha: 0.25 });
  haypile.ellipse(hay.x, hay.y + 2, hay.radius + 2, hay.radius * 0.62).fill(hexToNumber(palette.hay.shadow));
  haypile.ellipse(hay.x, hay.y, hay.radius, hay.radius * 0.58).fill(hexToNumber(palette.hay.base));
  haypile.ellipse(hay.x - hay.radius * 0.3, hay.y - hay.radius * 0.3, hay.radius * 0.5, hay.radius * 0.28).fill({
    color: hexToNumber(palette.hay.light),
    alpha: 0.6,
  });
  const strawRng = createRng(2929);
  for (let i = 0; i < 10; i++) {
    const angle = strawRng() * Math.PI * 2;
    const r = hay.radius * (0.5 + strawRng() * 0.5);
    const sx = hay.x + Math.cos(angle) * r;
    const sy = hay.y + Math.sin(angle) * r * 0.55;
    haypile
      .moveTo(sx, sy)
      .lineTo(sx + (strawRng() - 0.5) * 4, sy - 3 - strawRng() * 3)
      .stroke({ width: 0.6, color: hexToNumber(palette.hay.shadow), alpha: 0.5 });
  }
  world.addChild(haypile);

  const wood = PEN_DETAIL_OBSTACLES[1];
  const logs = new Graphics();
  for (let row = 0; row < 2; row++) {
    for (let i = -1; i <= 1; i++) {
      const lx = wood.x + i * 5;
      const ly = wood.y - row * 4.5;
      logs.ellipse(lx, ly, 5, 3).fill(hexToNumber(palette.fence.base));
      logs.ellipse(lx, ly, 2.6, 1.6).fill(hexToNumber(palette.fence.darkest));
    }
  }
  world.addChild(logs);
}

interface RuntimeRefs {
  app: Application;
  world: Container;
  dynamicLayer: Container;
  shepherd: Shepherd;
  sheep: LostSheep;
  wolves: Wolf[];
  guardWolves: Wolf[];
  sentinelWolves: Wolf[];
  flock: Flock;
  terrainObstacles: TerrainObstacle[];
  penObstacles: CircleObstacle[];
  bloodPositions: { x: number; y: number }[];
  firstFootprintPosition: { x: number; y: number };
  input: KeyboardController;
  camera: Camera;
  night: NightOverlay;
  /** Smoothed toward the lantern's true (screen-space) position every frame — softens the instant horizontal jump that would otherwise happen the moment the shepherd's facing flips, without adding any perceptible lag to normal walking. Null until the first frame, so the light starts exactly on the lantern instead of sliding in from the origin. */
  smoothedLanternPosition: { x: number; y: number } | null;
  mission: ReturnType<typeof createMissionMachine<LostSheepMissionState>>;
  nightIntensity: number;
  lightRadius: number;
  lastAppliedLightRadius: number;
  spawnTimer: number;
  hitThisSwing: Set<Wolf>;
  dangerTimer: number;
  dangerActive: boolean;
  dangerDialogueQueued: boolean;
  firstBloodShown: boolean;
  firstTrackShown: boolean;
  toastActive: boolean;
  pendingToasts: LocaleKey[];
  /** Seconds spent actively playing (search + escort) — used only to grade the run's stars, never gates or slows anything. */
  elapsedPlaying: number;
  finalStars: 1 | 2 | 3 | null;
}

export function LostSheepScene({ onExit, onRetry, onVictory }: ParableSceneProps) {
  const t = useT();

  const runtimeRef = useRef<RuntimeRefs | null>(null);
  const [missionState, setMissionState] = useState<LostSheepMissionState>("intro");
  const [hud, setHud] = useState({ shepherdHp: 100, sheepHp: LOST_SHEEP_START_HP });
  const [sheepDanger, setSheepDanger] = useState(false);
  const [finalStars, setFinalStars] = useState<1 | 2 | 3>(1);
  const reportedVictoryRef = useRef(false);
  const [toastLine, setToastLine] = useState<LocaleKey | null>(null);

  const onReady = useCallback((app: Application) => {
    const world = new Container();
    app.stage.addChild(world);
    const { obstacles: terrainObstacles, dynamicLayer } = buildTerrain(world);

    const trail = buildJourneyTrail(world, JOURNEY_PATH);

    const fence = createFenceOutline(
      PEN.width,
      PEN.height,
      { x: GATE.x - PEN.x, width: GATE.width },
      { x: PEN.width, y: PEN_EXTENSION.y - PEN.y, width: PEN_EXTENSION.width, height: PEN_EXTENSION.height },
    );
    fence.position.set(PEN.x, PEN.y);

    buildPenDetails(world);

    const flock = new Flock(FLOCK_COUNT);
    world.addChild(flock.container);
    world.addChild(fence);

    // `dynamicLayer` (tree canopies, rocks, hills) is added last so the
    // player, sheep and wolves inside it can sort correctly against tall
    // scenery by y — while still rendering above the fence/flock/pen.
    world.addChild(dynamicLayer);

    const shepherd = new Shepherd(SHEPHERD_START);
    const sheepSpawn = LOST_SHEEP_START;
    const sheep = new LostSheep(sheepSpawn);
    world.addChild(drawSheepLedge(sheepSpawn.x, sheepSpawn.y));
    dynamicLayer.addChild(sheep.sprite.container);
    dynamicLayer.addChild(shepherd.sprite.container);

    // Three wolves surround the sleeping sheep, fast asleep and utterly
    // unaware of the shepherd, until the mission actually rescues it.
    const guardWolves: Wolf[] = [];
    for (let i = 0; i < GUARD_WOLF_COUNT; i++) {
      const angle = (i / GUARD_WOLF_COUNT) * Math.PI * 2 + Math.PI / 2;
      const wolf = new Wolf({
        x: sheepSpawn.x + Math.cos(angle) * GUARD_WOLF_DISTANCE,
        y: sheepSpawn.y + Math.sin(angle) * GUARD_WOLF_DISTANCE + 6,
      });
      wolf.guarding = true;
      guardWolves.push(wolf);
      dynamicLayer.addChild(wolf.sprite.container);
    }

    // Fixed sentinel wolves scattered through the level — inert until the
    // shepherd wanders into their detection radius, at which point they
    // wake for good. Mostly placed to make the decoy routes feel actively
    // risky rather than just visually different.
    const sentinelWolves: Wolf[] = [];
    SENTINEL_WOLVES.forEach((spec, i) => {
      const wolf = new Wolf({ x: spec.x, y: spec.y });
      wolf.sentinel = true;
      wolf.detectionRadius = spec.detectionRadius;
      if (spec.style === "patrol") {
        wolf.patrolCenter = { x: spec.x, y: spec.y };
        wolf.patrolRadius = 24;
        wolf.patrolAngle = i * 1.3;
        wolf.patrolAngularSpeed = 0.13 + (i % 3) * 0.02;
      }
      sentinelWolves.push(wolf);
      dynamicLayer.addChild(wolf.sprite.container);
    });

    const input = new KeyboardController();
    const camera = new Camera({ width: WORLD_WIDTH, height: WORLD_HEIGHT });
    const night = createNightOverlay(app);
    night.setLightRadius(LIGHT_RADIUS_START);
    const mission = createMissionMachine<LostSheepMissionState>("intro");

    const runtime: RuntimeRefs = {
      app,
      world,
      dynamicLayer,
      shepherd,
      sheep,
      wolves: [...guardWolves, ...sentinelWolves],
      guardWolves,
      sentinelWolves,
      flock,
      terrainObstacles,
      penObstacles: PEN_DETAIL_OBSTACLES,
      bloodPositions: trail.bloodPositions,
      firstFootprintPosition: trail.firstFootprintPosition,
      input,
      camera,
      night,
      smoothedLanternPosition: null,
      mission,
      nightIntensity: 0,
      lightRadius: LIGHT_RADIUS_START,
      lastAppliedLightRadius: LIGHT_RADIUS_START,
      spawnTimer: 4,
      hitThisSwing: new Set(),
      dangerTimer: 0,
      dangerActive: false,
      dangerDialogueQueued: false,
      firstBloodShown: false,
      firstTrackShown: false,
      toastActive: false,
      pendingToasts: [],
      elapsedPlaying: 0,
      finalStars: null,
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
    let lastDangerSent = false;

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
        .concat(current.penObstacles)
        .concat(current.flock.asObstacles())
        .concat([{ x: current.sheep.position.x, y: current.sheep.position.y, radius: current.sheep.radius }])
        .concat(current.wolves.map((wolf) => ({ x: wolf.position.x, y: wolf.position.y, radius: wolf.radius })));
      current.shepherd.update(dt, direction, obstacles);
      current.flock.update(dt);

      if (state !== "intro") {
        current.sheep.update(dt, current.shepherd.position, current.dangerActive);
      }

      current.camera.update(current.shepherd.position, dt);
      current.world.position.set(current.camera.x, current.camera.y);

      const targetIntensity = state === "intro" ? 0 : 1;
      const fadeRate = 1 - Math.exp(-dt * 0.35);
      current.nightIntensity += (targetIntensity - current.nightIntensity) * fadeRate;
      current.night.setIntensity(current.nightIntensity);

      // The lantern's raw screen position jumps instantly whenever the shepherd's
      // facing flips (it's mirrored to the other side of his body along with the
      // rest of his sprite). Smoothing the position the light actually follows —
      // rather than the lantern's true position directly — turns that snap into a
      // brief, natural-feeling slide without ever touching the separate, gradual
      // light-radius shrink above.
      const rawLanternPosition = current.shepherd.getLanternScreenPosition();
      if (!current.smoothedLanternPosition) {
        current.smoothedLanternPosition = { x: rawLanternPosition.x, y: rawLanternPosition.y };
      } else {
        const followRate = 1 - Math.exp(-dt * 24);
        current.smoothedLanternPosition.x += (rawLanternPosition.x - current.smoothedLanternPosition.x) * followRate;
        current.smoothedLanternPosition.y += (rawLanternPosition.y - current.smoothedLanternPosition.y) * followRate;
      }
      current.night.setFollowPosition(current.smoothedLanternPosition);

      if (playing) {
        current.elapsedPlaying += dt;

        // The lantern's light very slowly closes in over the whole level — subtle, but it never stops tightening.
        current.lightRadius = Math.max(
          LIGHT_RADIUS_MIN,
          current.lightRadius - dt * ((LIGHT_RADIUS_START - LIGHT_RADIUS_MIN) / LIGHT_SHRINK_DURATION),
        );
        const roundedRadius = Math.round(current.lightRadius);
        if (roundedRadius !== current.lastAppliedLightRadius) {
          current.lastAppliedLightRadius = roundedRadius;
          current.night.setLightRadius(roundedRadius);
        }

        // The sheep's wound stays quiet for a while — a beat of calm before the pressure starts.
        if (!current.dangerActive && !current.dangerDialogueQueued) {
          current.dangerTimer += dt;
          if (current.dangerTimer >= DANGER_DELAY) {
            current.dangerDialogueQueued = true;
            current.pendingToasts.push("lostSheep.danger.hurry");
          }
        }

        // The very first footprint, just outside the pen, gets a one-time "I see tracks!"
        // reaction — the player's cue that the search is on and the trail is worth following.
        if (!current.firstTrackShown && state === "search") {
          if (distance(current.shepherd.position, current.firstFootprintPosition) < TRACK_DISCOVERY_RADIUS) {
            current.firstTrackShown = true;
            current.pendingToasts.push("lostSheep.search.firstTrack");
          }
        }

        // The first drop of blood the player comes across gets a one-time reaction.
        if (!current.firstBloodShown) {
          for (const drop of current.bloodPositions) {
            if (distance(current.shepherd.position, drop) < BLOOD_DISCOVERY_RADIUS) {
              current.firstBloodShown = true;
              current.pendingToasts.push("lostSheep.danger.bloodFound");
              break;
            }
          }
        }

        if (!current.toastActive && current.pendingToasts.length > 0) {
          current.toastActive = true;
          setToastLine(current.pendingToasts.shift() ?? null);
        }

        // Search -> found transition: the sheep flees and every guard wolf around it wakes at once.
        if (state === "search" && distance(current.shepherd.position, current.sheep.position) < FOUND_RADIUS) {
          current.sheep.startFollowing();
          for (const guard of current.guardWolves) guard.guarding = false;
          current.mission.set("escort");
        }

        // Sentinel wolves wake permanently the instant the shepherd crosses their detection radius.
        for (const wolf of current.sentinelWolves) {
          if (!wolf.aggroed && distance(wolf.position, current.shepherd.position) < wolf.detectionRadius) {
            wolf.aggroed = true;
          }
        }

        // Wolf spawning.
        current.spawnTimer -= dt;
        const cap = state === "escort" ? ESCORT_WOLF_CAP : SEARCH_WOLF_CAP;
        const interval = state === "escort" ? 3.2 : 5.5;
        if (current.spawnTimer <= 0 && current.wolves.length - current.sentinelWolves.length < cap) {
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
          if (!wolf.inert && !wolf.stunned && wolf.canDamage()) {
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
          const healthRatio = (current.shepherd.hp / 100 + current.sheep.hp / 100) / 2;
          current.finalStars = computeStars(healthRatio, current.elapsedPlaying, STAR_FAST_SECONDS, STAR_SLOW_SECONDS);
          current.mission.set("conclusion");
        }
      }

      const nextHud = { shepherdHp: current.shepherd.hp, sheepHp: current.sheep.hp };
      if (nextHud.shepherdHp !== lastHudSent.shepherdHp || nextHud.sheepHp !== lastHudSent.sheepHp) {
        lastHudSent = nextHud;
        setHud(nextHud);
      }
      if (current.dangerActive !== lastDangerSent) {
        lastDangerSent = current.dangerActive;
        setSheepDanger(current.dangerActive);
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
    if (missionState !== "victory" || reportedVictoryRef.current) return;
    reportedVictoryRef.current = true;
    const stars = runtimeRef.current?.finalStars ?? 1;
    const timeSeconds = runtimeRef.current?.elapsedPlaying;
    setFinalStars(stars);
    onVictory({ stars, timeSeconds });
    // onVictory/onRetry are recreated every ParableScreen render; the ref guard above is what actually prevents a double report, so they're deliberately left out of the dependency list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionState]);

  const handleDialogueComplete = () => {
    runtimeRef.current?.mission.set("search");
  };

  const handleConclusionComplete = () => {
    runtimeRef.current?.mission.set("victory");
  };

  const handleToastDone = useCallback(() => {
    const current = runtimeRef.current;
    setToastLine((activeLine) => {
      if (current && activeLine === "lostSheep.danger.hurry") {
        current.dangerActive = true;
      }
      return null;
    });
    if (current) current.toastActive = false;
  }, []);

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
        <LostSheepHud shepherdHp={hud.shepherdHp} sheepHp={hud.sheepHp} sheepDanger={sheepDanger} state={missionState} />
      )}

      {toastLine && <NarrativeToast line={toastLine} onDone={handleToastDone} seed="lost-sheep-toast" />}

      {missionState === "intro" && (
        <DialogueOverlay
          seed="lost-sheep-intro"
          lines={["lostSheep.intro.line1", "lostSheep.intro.line2", "lostSheep.intro.line3"]}
          onComplete={handleDialogueComplete}
        />
      )}

      {missionState === "conclusion" && (
        <DialogueOverlay
          seed="lost-sheep-conclusion"
          lines={["lostSheep.conclusion.line1", "lostSheep.conclusion.line2"]}
          onComplete={handleConclusionComplete}
        />
      )}

      {missionState === "gameOver" && <GameOverOverlay onRetry={onRetry} />}
      {missionState === "victory" && <VictoryOverlay onContinue={onExit} stars={finalStars} />}
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
  } else if (circleOverlapsRect({ x, y }, spawnRadius, PEN_EXTENSION)) {
    const pushed = resolveCircleVsRect({ x, y }, spawnRadius, PEN_EXTENSION);
    x = pushed.x;
    y = pushed.y;
  }

  const wolf = new Wolf({ x, y });
  runtime.wolves.push(wolf);
  runtime.dynamicLayer.addChild(wolf.sprite.container);
}
