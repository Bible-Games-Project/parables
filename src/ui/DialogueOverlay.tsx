import { useState } from "react";
import { PixelPanel } from "@/ui/PixelPanel";
import { PixelButton } from "@/ui/PixelButton";
import { useT } from "@/locales/useT";
import type { LocaleKey } from "@/locales/en";
import styles from "@/ui/DialogueOverlay.module.css";

interface DialogueOverlayProps {
  lines: LocaleKey[];
  /** Optional speaker name per line (same index as `lines`) — omit for unattributed narration. */
  speakers?: (LocaleKey | undefined)[];
  onComplete: () => void;
  seed?: string;
}

/** Sequential narrative text box, reused for every parable's intro/victory beats and every Israel conversation. */
export function DialogueOverlay({ lines, speakers, onComplete, seed = "dialogue" }: DialogueOverlayProps) {
  const t = useT();
  const [index, setIndex] = useState(0);
  const isLast = index >= lines.length - 1;
  const speakerKey = speakers?.[index];

  const advance = () => {
    if (isLast) onComplete();
    else setIndex((current) => current + 1);
  };

  return (
    <div className={styles.wrap}>
      <PixelPanel seed={seed}>
        {speakerKey && <p className={styles.speaker}>{t(speakerKey)}</p>}
        <p className={styles.text}>{t(lines[index])}</p>
        <div className={styles.actions}>
          <PixelButton className={styles.skip} onClick={onComplete}>
            {t("common.skip")}
          </PixelButton>
          <PixelButton className={styles.continue} size="large" onClick={advance}>
            {t("common.continue")}
          </PixelButton>
        </div>
      </PixelPanel>
    </div>
  );
}
