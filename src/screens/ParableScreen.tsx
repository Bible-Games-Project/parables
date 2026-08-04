import { useEffect, useState } from "react";
import { useAppStore } from "@/store/appStore";
import { LostSheepScene } from "@/parables/lost-sheep/LostSheepScene";

/** Routes to the active parable's playable scene, keyed so "Try Again" cleanly restarts it. */
export function ParableScreen() {
  const activeParableId = useAppStore((state) => state.activeParableId);
  const exitParable = useAppStore((state) => state.exitParable);
  const [runId, setRunId] = useState(0);

  const isSupported = activeParableId === "lost-sheep";

  useEffect(() => {
    if (!isSupported) exitParable();
  }, [isSupported, exitParable]);

  if (!isSupported) return null;

  return (
    <LostSheepScene
      key={runId}
      onExit={exitParable}
      onRetry={() => setRunId((id) => id + 1)}
    />
  );
}
