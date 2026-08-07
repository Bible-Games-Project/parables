import { useEffect, useState } from "react";
import { useAppStore } from "@/store/appStore";
import { useProgressStore } from "@/store/progressStore";
import { getParable } from "@/parables/registry";

/** Routes to the active parable's playable scene by id, keyed so "Try Again" cleanly restarts it. Every scene shares the same `ParableSceneProps` contract, so this never needs to change when a new parable is added. */
export function ParableScreen() {
  const activeParableId = useAppStore((state) => state.activeParableId);
  const exitParable = useAppStore((state) => state.exitParable);
  const completeParable = useProgressStore((state) => state.completeParable);
  const [runId, setRunId] = useState(0);

  const parable = activeParableId ? getParable(activeParableId) : undefined;
  const Scene = parable?.component;

  useEffect(() => {
    if (!Scene) exitParable();
  }, [Scene, exitParable]);

  if (!Scene || !parable) return null;

  return (
    <Scene
      key={runId}
      onExit={exitParable}
      onRetry={() => setRunId((id) => id + 1)}
      onVictory={(result) => {
        completeParable(parable.id, result);
        exitParable();
      }}
    />
  );
}
