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
import {
  FARMHOUSE,
  FOREST_PATCH,
  HILL_VIEWPOINT,
  JESUS_START,
  OLIVE_GROVE,
  SHEPHERD_CAMP,
  VINEYARD,
  WHEAT_FIELD,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "@/world/map";
import type { VillagerVariant } from "@/world/sprites";
import { useAppStore } from "@/store/appStore";
import { useProgressStore } from "@/store/progressStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useWorldStore } from "@/store/worldStore";
import { getParable, PARABLES } from "@/parables/registry";
import { DialogueOverlay } from "@/ui/DialogueOverlay";
import { PixelButton } from "@/ui/PixelButton";
import { PixelIconButton } from "@/ui/PixelIconButton";
import { WorldHud } from "@/world/WorldHud";
import { backIcon, bookIcon } from "@/pixel-art/icons";
import { useT } from "@/locales/useT";
import styles from "@/world/IsraelScreen.module.css";

type Phase = "explore" | "dialogue" | "fading" | "returning";
/** "intro" is an encounter's first-ever conversation (the NPC's human problem); "replay" is the short offer to play an already-completed parable again. Both end the same way: Continue leads into the parable, Back leaves without entering it. */
type TalkingMode = "intro" | "replay";

const AMBIENT_NPCS: { position: Vector2; variant: VillagerVariant; seed: number; wanderRadius: number }[] = [
  { position: { x: OLIVE_GROVE.x + 20, y: OLIVE_GROVE.y + 30 }, variant: "adultWoman", seed: 11, wanderRadius: 60 },
  { position: { x: WHEAT_FIELD.x, y: WHEAT_FIELD.y - 25 }, variant: "adultMan", seed: 22, wanderRadius: 50 },
  { position: { x: FOREST_PATCH.x - 30, y: FOREST_PATCH.y + 40 }, variant: "youngMan", seed: 33, wanderRadius: 40 },
  { position: { x: FARMHOUSE.x - 20, y: FARMHOUSE.y + 24 }, variant: "elderWoman", seed: 44, wanderRadius: 30 },
  { position: { x: VINEYARD.x + 15, y: VINEYARD.y + 35 }, variant: "teen", seed: 55, wanderRadius: 40 },
  { position: { x: HILL_VIEWPOINT.x + 30, y: HILL_VIEWPOINT.y + 20 }, variant: "youngWoman", seed: 66, wanderRadius: 50 },
  { position: { x: SHEPHERD_CAMP.x - 14, y: SHEPHERD_CAMP.y - 6 }, variant: "shepherd", seed: 77, wanderRadius: 20 },
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
  const completedCount = useProgressStore((state) => state.completedParableIds.length);
  const isParableCompleted = useProgressStore((state) => state.isCompleted);
  const debugMode = useSettingsStore((state) => state.debugMode);
  const jesusPosition = useWorldStore((state) => state.jesusPosition);
  const setJesusPosition = useWorldStore((state) => state.setJesusPosition);
  const setPendingReturnEncounterId = useWorldStore((state) => state.setPendingReturnEncounterId);

  const runtimeRef = useRef<RuntimeRefs | null>(null);
  const phaseRef = useRef<Phase>("explore");
  /**
   * If a live Talk conversation sent the player into a completed parable, resume right
   * here with the NPC's reaction instead of leaving that conversation hanging — read
   * once at mount (a plain store getter, not a subscription: this only ever matters for
   * the very first render of a fresh Israel session) and immediately consumed below.
   */
  const [returningEncounter] = useState<ParableEncounter | null>(() => {
    const pendingId = useWorldStore.getState().pendingReturnEncounterId;
    const encounter = pendingId ? PARABLE_ENCOUNTERS.find((entry) => entry.id === pendingId) : undefined;
    return encounter && useProgressStore.getState().isCompleted(encounter.parableId) ? encounter : null;
  });
  const [phase, setPhase] = useState<Phase>(returningEncounter ? "returning" : "explore");
  const [activeEncounter, setActiveEncounter] = useState<ParableEncounter | null>(null);
  /** The encounter Jesus is actually talking to — captured from `activeEncounter` the moment Talk is pressed, so it survives the proximity check clearing `activeEncounter` once movement stops during dialogue/fading. */
  const [talkingEncounter, setTalkingEncounter] = useState<ParableEncounter | null>(null);
  const [talkingMode, setTalkingMode] = useState<TalkingMode>("intro");
  const [fadeParableId, setFadeParableId] = useState<string | null>(null);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (returningEncounter) setPendingReturnEncounterId(null);
    // Mount-only: this consumes whatever was pending when the screen first appeared.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onReady = useCallback((app: Application) => {
    const world = new Container();
    app.stage.addChild(world);

    // Debug Mode is purely an access override for testing — it never changes what's
    // actually earned (the HUD above still reads the real `totalStars`), it just makes
    // every star-gated area behave as if the player already had enough stars for it.
    const gateStars = debugMode ? Infinity : totalStars;
    const { obstacles, walls: terrainWalls, dynamicLayer } = buildIsraelTerrain(world, gateStars);
    const walls = [...terrainWalls, ...activeGateWalls(gateStars)];
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
      for (const npc of current.npcs) npc.update(dt, current.obstacles, current.walls);

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
    // Once the parable has been completed, the NPC's original human problem was
    // already resolved (see the return conversation) — talking again offers a
    // replay instead of repeating that same opening conversation.
    setTalkingMode(isParableCompleted(activeEncounter.parableId) ? "replay" : "intro");
    setTalkingEncounter(activeEncounter);
    setPhase("dialogue");
  };

  const handleDialogueComplete = () => {
    if (!talkingEncounter) return;
    setFadeParableId(talkingEncounter.parableId);
    setPhase("fading");
  };

  const handleBackFromDialogue = () => {
    setTalkingEncounter(null);
    setPhase("explore");
  };

  const handleFadeDone = () => {
    const current = runtimeRef.current;
    if (current) setJesusPosition(current.jesus.position);
    // Only the very first completion (talkingMode "intro") owes the player the
    // automatic return conversation + replay offer — repeating "so I matter?" after
    // every subsequent replay would undercut the moment instead of honoring it.
    if (talkingEncounter && talkingMode === "intro") setPendingReturnEncounterId(talkingEncounter.id);
    if (fadeParableId) openParable(fadeParableId);
  };

  const handleReturnDialogueComplete = () => {
    // The narrative conclusion just played; end the conversation here and let
    // Jesus and the NPC return to normal exploration. The replay offer is only
    // ever reached by the player pressing Talk again on a later visit.
    setPhase("explore");
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

      <WorldHud stars={totalStars} completed={completedCount} total={PARABLES.length} />

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
        <DialogueOverlay
          seed={`${talkingEncounter.id}-${talkingMode}`}
          lines={talkingMode === "replay" ? talkingEncounter.replayDialogueLines : talkingEncounter.dialogueLines}
          speakers={talkingMode === "replay" ? talkingEncounter.replayDialogueSpeakers : talkingEncounter.dialogueSpeakers}
          onBack={handleBackFromDialogue}
          onComplete={handleDialogueComplete}
        />
      )}

      {phase === "fading" && fadeParable && <FadeTransition title={t(fadeParable.titleKey)} onDone={handleFadeDone} />}

      {phase === "returning" && returningEncounter && (
        <DialogueOverlay
          seed={`${returningEncounter.id}-return`}
          lines={returningEncounter.returnDialogueLines}
          speakers={returningEncounter.returnDialogueSpeakers}
          onComplete={handleReturnDialogueComplete}
        />
      )}
    </div>
  );
}
