import { useState } from "react";
import { PixelPanel } from "@/ui/PixelPanel";
import { PixelButton } from "@/ui/PixelButton";
import { useT } from "@/locales/useT";
import type { LocaleKey } from "@/locales/en";
import styles from "@/ui/DialogueOverlay.module.css";

interface DialogueOverlayProps {
  lines: LocaleKey[];
  onComplete: () => void;
  seed?: string;
}

/** Sequential narrative text box, reused for every parable's intro/victory beats. */
export function DialogueOverlay({ lines, onComplete, seed = "dialogue" }: DialogueOverlayProps) {
  const t = useT();
  const [index, setIndex] = useState(0);
  const isLast = index >= lines.length - 1;

  const advance = () => {
    if (isLast) onComplete();
    else setIndex((current) => current + 1);
  };

  return (
    <div className={styles.wrap}>
      <PixelPanel seed={seed}>
        <p className={styles.text}>{t(lines[index])}</p>
        <div className={styles.actions}>
          <PixelButton onClick={onComplete}>{t("common.skip")}</PixelButton>
          <PixelButton onClick={advance}>{t("common.continue")}</PixelButton>
        </div>
      </PixelPanel>
    </div>
  );
}
