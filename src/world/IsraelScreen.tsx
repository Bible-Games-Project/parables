import { useCallback, useEffect, useRef, useState } from "react";
import { Application, Container } from "pixi.js";
import type { Vector2 } from "@/engine/input";
import { PixiStage } from "@/engine/PixiStage";
import { KeyboardController } from "@/engine/input";
import { Camera } from "@/engine/camera";
import { distance, type CircleObstacle, type Rect } from "@/engine/collision";
import { Jesus, AmbientNpc } from "@/world/entities";
import { buildIsraelTerrain } from "@/world/terrain";
import { activeGateWalls } from "@/world/gates";
import { PARABLE_ENCOUNTERS, type ParableEncounter } from "@/world/encounters";
import { FARMHOUSE, FOREST_PATCH, HILL_VIEWPOINT, JESUS_START, OLIVE_GROVE, VINEYARD, WHEAT_FIELD, WORLD_HEIGHT, WORLD_WIDTH } from "@/world/map";
import type { VillagerVariant } from "@/world/sprites";
import { useAppStore } from "@/store/appStore";
import { useProgressStore } from "@/store/progressStore";
import { useWorldStore } from "@/store/worldStore";
import { getParable } from "@/parables/registry";
import { DialogueOverlay } from "@/ui/DialogueOverlay";
import { PixelButton } from "@/ui/PixelButton";
import { PixelIconButton } from "@/ui/PixelIconButton";
import { backIcon, bookIcon } from "@/pixel-art/icons";
import { useT } from "@/locales/useT";
import styles from "@/world/IsraelScreen.module.css";

type Phase = "explore" | "dialogue" | "fading";

const AMBIENT_NPCS: { position: Vector2; variant: VillagerVariant; seed: number; wanderRadius: number }[] = [
  { position: { x: OLIVE_GROVE.x + 20, y: OLIVE_GROVE.y + 30 }, variant: "farmer", seed: 11, wanderRadius: 60 },
  { position: { x: WHEAT_FIELD.x, y: WHEAT_FIELD.y - 25 }, variant: "farmer", seed: 22, wanderRadius: 50 },
  { position: { x: FOREST_PATCH.x - 30, y: FOREST_PATCH.y + 40 }, variant: "traveller", seed: 33, wanderRadius: 40 },
  { position: { x: FARMHOUSE.x - 55, y: FARMHOUSE.y + 20 }, variant: "traveller", seed: 44, wanderRadius: 45 },
  { position: { x: VINEYARD.x + 15, y: VINEYARD.y + 35 }, variant: "farmer", seed: 55, wanderRadius: 40 },
  { position: { x: HILL_VIEWPOINT.x + 30, y: HILL_VIEWPOINT.y + 20 }, variant: "traveller", seed: 66, wanderRadius: 50 },
];

interface RuntimeRefs {
  jesus: Jesus;
  npcs: AmbientNpc[];
  obstacles: CircleObstacle[];
  walls: Rect[];
  input: KeyboardController;
  camera: Camera;
  world: Container;
}

/** A short fade-to-black with the parable's title, held on a stable timer so it always fires exactly once regardless of parent re-renders. */
function FadeTransition({ title, onDone }: { title: string; onDone: () => void }) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  useEffect(() => {
    const timer = window.setTimeout(() => onDoneRef.current(), 1400);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className={styles.fade}>
      <span className={styles.fadeTitle}>{title}</span>
    </div>
  );
}

/**
 * Israel: the open-world hub. The player walks Jesus through a small,
 * handcrafted stretch of the Holy Land, meets ambient villagers who are
 * just scenery, and — at specific, unique situations — can start a
 * conversation that leads into a parable. Always the place the player
 * returns to, whether from a live encounter or a replay from the Book.
 */
export function IsraelScreen() {
  const t = useT();
  const navigate = useAppStore((state) => state.navigate);
  const openParable = useAppStore((state) => state.openParable);
  const totalStars = useProgressStore((state) => state.totalStars());
  const jesusPosition = useWorldStore((state) => state.jesusPosition);
  const setJesusPosition = useWorldStore((state) => state.setJesusPosition);

  const runtimeRef = useRef<RuntimeRefs | null>(null);
  const phaseRef = useRef<Phase>("explore");
  const [phase, setPhase] = useState<Phase>("explore");
  const [activeEncounter, setActiveEncounter] = useState<ParableEncounter | null>(null);
  /** The encounter Jesus is actually talking to — captured from `activeEncounter` the moment Talk is pressed, so it survives the proximity check clearing `activeEncounter` once movement stops during dialogue/fading. */
  const [talkingEncounter, setTalkingEncounter] = useState<ParableEncounter | null>(null);
  const [fadeParableId, setFadeParableId] = useState<string | null>(null);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const onReady = useCallback((app: Application) => {
    const world = new Container();
    app.stage.addChild(world);

    const { obstacles, walls: terrainWalls, dynamicLayer } = buildIsraelTerrain(world, totalStars);
    const walls = [...terrainWalls, ...activeGateWalls(totalStars)];
    world.addChild(dynamicLayer);

    const jesus = new Jesus(jesusPosition ?? JESUS_START);
    dynamicLayer.addChild(jesus.sprite.container);

    const npcs = AMBIENT_NPCS.map((spec) => {
      const npc = new AmbientNpc(spec.position, spec.variant, spec.seed, spec.wanderRadius);
      dynamicLayer.addChild(npc.sprite.container);
      return npc;
    });

    const input = new KeyboardController();
    const camera = new Camera({ width: WORLD_WIDTH, height: WORLD_HEIGHT });
    camera.update(jesus.position, 1);
    world.position.set(camera.x, camera.y);

    const runtime: RuntimeRefs = { jesus, npcs, obstacles, walls, input, camera, world };
    runtimeRef.current = runtime;

    let lastEncounterId: string | null = null;

    const tick = (ticker: { deltaTime: number }) => {
      const current = runtimeRef.current;
      if (!current) return;
      const dt = Math.min(ticker.deltaTime / 60, 1 / 30);
      const exploring = phaseRef.current === "explore";
      const direction = exploring ? current.input.getDirection() : { x: 0, y: 0 };

      const circleObstacles = current.obstacles.concat(
        current.npcs.map((npc) => ({ x: npc.position.x, y: npc.position.y, radius: npc.radius })),
      );
      current.jesus.update(dt, direction, circleObstacles, current.walls, { width: WORLD_WIDTH, height: WORLD_HEIGHT });
      for (const npc of current.npcs) npc.update(dt, current.obstacles);

      current.camera.update(current.jesus.position, dt);
      current.world.position.set(current.camera.x, current.camera.y);

      if (exploring) {
        let nearest: ParableEncounter | null = null;
        let nearestDist = Infinity;
        for (const encounter of PARABLE_ENCOUNTERS) {
          const d = distance(current.jesus.position, encounter.position);
          if (d < encounter.radius && d < nearestDist) {
            nearest = encounter;
            nearestDist = d;
          }
        }
        const nextId = nearest?.id ?? null;
        if (nextId !== lastEncounterId) {
          lastEncounterId = nextId;
          setActiveEncounter(nearest);
        }
      } else if (lastEncounterId !== null) {
        lastEncounterId = null;
        setActiveEncounter(null);
      }
    };

    app.ticker.add(tick);

    return () => {
      app.ticker.remove(tick);
      input.destroy();
      setJesusPosition(jesus.position);
      app.stage.removeChild(world);
      world.destroy({ children: true });
      runtimeRef.current = null;
    };
    // Deliberately mount-only: totalStars/jesusPosition are read once to set
    // up this session of the world, exactly like every other scene here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTalk = () => {
    if (!activeEncounter) return;
    setTalkingEncounter(activeEncounter);
    setPhase("dialogue");
  };

  const handleDialogueComplete = () => {
    if (!talkingEncounter) return;
    setFadeParableId(talkingEncounter.parableId);
    setPhase("fading");
  };

  const handleFadeDone = () => {
    const current = runtimeRef.current;
    if (current) setJesusPosition(current.jesus.position);
    if (fadeParableId) openParable(fadeParableId);
  };

  const handleBackToHome = () => {
    const current = runtimeRef.current;
    if (current) setJesusPosition(current.jesus.position);
    navigate("home");
  };

  const handleOpenBook = () => {
    const current = runtimeRef.current;
    if (current) setJesusPosition(current.jesus.position);
    navigate("parablesMenu");
  };

  const fadeParable = fadeParableId ? getParable(fadeParableId) : undefined;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <PixiStage onReady={onReady} className="" />

      {phase === "explore" && (
        <>
          <PixelIconButton
            sprite={backIcon}
            seed="israel-back"
            style={{ position: "absolute", top: "1rem", left: "1rem", zIndex: 10 }}
            onClick={handleBackToHome}
            aria-label={t("common.back")}
          />
          <PixelIconButton
            sprite={bookIcon}
            seed="israel-book"
            style={{ position: "absolute", top: "1rem", right: "1rem", zIndex: 10 }}
            onClick={handleOpenBook}
            aria-label={t("parablesMenu.title")}
          />
        </>
      )}

      {phase === "explore" && activeEncounter && (
        <div className={styles.talkWrap}>
          <PixelButton onClick={handleTalk}>{t("common.talk")}</PixelButton>
        </div>
      )}

      {phase === "dialogue" && talkingEncounter && (
        <DialogueOverlay seed={talkingEncounter.id} lines={talkingEncounter.dialogueLines} onComplete={handleDialogueComplete} />
      )}

      {phase === "fading" && fadeParable && <FadeTransition title={t(fadeParable.titleKey)} onDone={handleFadeDone} />}
    </div>
  );
}
