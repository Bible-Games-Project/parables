import { useState } from "react";
import { PixelPanel } from "@/ui/PixelPanel";
import { PixelButton } from "@/ui/PixelButton";
import { Portrait } from "@/ui/Portrait";
import { useT } from "@/locales/useT";
import type { LocaleKey } from "@/locales/en";
import type { Expression } from "@/pixel-art/portraits";
import { SPEAKER_PORTRAITS } from "@/world/speakerPortraits";
import styles from "@/ui/DialogueOverlay.module.css";

interface DialogueOverlayProps {
  lines: LocaleKey[];
  /** Optional speaker name per line (same index as `lines`) — omit for unattributed narration, which shows Jesus's portrait as the parable's storyteller. */
  speakers?: (LocaleKey | undefined)[];
  /** Optional facial expression per line (same index as `lines`) — defaults to "neutral" when omitted or unset for a given line. */
  expressions?: Expression[];
  onComplete: () => void;
  /** When provided, a third "Back" button appears (leftmost) for conversations that lead toward starting a parable — leaving via Back means the player declined and never enters it, unlike Skip which still proceeds. Omit for dialogue that doesn't precede a parable (e.g. a parable's own intro/conclusion beats). */
  onBack?: () => void;
  seed?: string;
}

/** Sequential narrative text box, reused for every parable's intro/victory beats and every Israel conversation. */
export function DialogueOverlay({ lines, speakers, expressions, onComplete, onBack, seed = "dialogue" }: DialogueOverlayProps) {
  const t = useT();
  const [index, setIndex] = useState(0);
  const isLast = index >= lines.length - 1;
  const speakerKey = speakers?.[index];
  // Narration with no named speaker is always the parable's storyteller — Jesus.
  const portraitId = speakerKey ? SPEAKER_PORTRAITS[speakerKey] : "jesus";
  const expression = expressions?.[index] ?? "neutral";

  const advance = () => {
    if (isLast) onComplete();
    else setIndex((current) => current + 1);
  };

  return (
    <div className={styles.wrap}>
      <PixelPanel seed={seed}>
        <div className={styles.body}>
          {portraitId && <Portrait portraitId={portraitId} expression={expression} />}
          <div className={styles.textColumn}>
            {speakerKey && <p className={styles.speaker}>{t(speakerKey)}</p>}
            <p className={styles.text}>{t(lines[index])}</p>
          </div>
        </div>
        <div className={styles.actions}>
          <div className={styles.secondaryGroup}>
            {onBack && (
              <PixelButton className={styles.back} onClick={onBack}>
                {t("common.back")}
              </PixelButton>
            )}
            <PixelButton className={styles.skip} onClick={onComplete}>
              {t("common.skip")}
            </PixelButton>
          </div>
          <PixelButton className={styles.continue} onClick={advance}>
            {t("common.continue")}
          </PixelButton>
        </div>
      </PixelPanel>
    </div>
  );
}
