import { useEffect, useRef } from "react";
import { PixelPanel } from "@/ui/PixelPanel";
import { useT } from "@/locales/useT";
import type { LocaleKey } from "@/locales/en";
import styles from "@/ui/NarrativeToast.module.css";

interface NarrativeToastProps {
  line: LocaleKey;
  onDone: () => void;
  seed?: string;
  durationMs?: number;
}

/** A short, self-dismissing narrative line — for atmospheric beats (the sheep's wound, first blood found) that shouldn't interrupt play with a Skip/Continue prompt the way `DialogueOverlay` does. */
export function NarrativeToast({ line, onDone, seed = "toast", durationMs = 3400 }: NarrativeToastProps) {
  const t = useT();
  // The parent re-renders on every HUD hp tick, which would otherwise hand
  // us a fresh `onDone` identity each time and keep resetting the timer —
  // so the effect only depends on `durationMs` and always calls the latest
  // callback through a ref.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const timer = window.setTimeout(() => onDoneRef.current(), durationMs);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationMs]);

  return (
    <div className={styles.wrap}>
      <PixelPanel seed={seed}>
        <p className={styles.text}>{t(line)}</p>
      </PixelPanel>
    </div>
  );
}
