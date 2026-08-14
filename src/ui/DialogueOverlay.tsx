import { useEffect, useState } from "react";
import { PixelPanel } from "@/ui/PixelPanel";
import { PixelButton } from "@/ui/PixelButton";
import { JesusPortrait } from "@/ui/Portrait";
import { useT } from "@/locales/useT";
import type { LocaleKey } from "@/locales/en";
import styles from "@/ui/DialogueOverlay.module.css";

/** Unattributed lines (no `speakers` prop at all) default to Jesus as narrator. */
const JESUS_SPEAKER_KEY: LocaleKey = "world.speaker.jesus";

/** ~35 chars/sec — fast enough to feel like speech, not a wait. */
const TYPEWRITER_MS_PER_CHAR = 1000 / 35;

interface DialogueOverlayProps {
  lines: LocaleKey[];
  /** Optional speaker name per line (same index as `lines`) — omit for unattributed narration. */
  speakers?: (LocaleKey | undefined)[];
  onComplete: () => void;
  /** When provided, a third "Back" button appears (leftmost) for conversations that lead toward starting a parable — leaving via Back means the player declined and never enters it, unlike Skip which still proceeds. Omit for dialogue that doesn't precede a parable (e.g. a parable's own intro/conclusion beats). */
  onBack?: () => void;
  seed?: string;
}

/** Sequential narrative text box, reused for every parable's intro/victory beats and every Israel conversation. */
export function DialogueOverlay({ lines, speakers, onComplete, onBack, seed = "dialogue" }: DialogueOverlayProps) {
  const t = useT();
  const [index, setIndex] = useState(0);
  const isLast = index >= lines.length - 1;
  const speakerKey = speakers?.[index];
  const isJesusSpeaking = speakerKey === JESUS_SPEAKER_KEY || !speakers;

  const fullText = t(lines[index]);
  const [typedLength, setTypedLength] = useState(0);
  const isTyping = typedLength < fullText.length;

  useEffect(() => {
    setTypedLength(0);
  }, [index]);

  useEffect(() => {
    if (!isTyping) return;
    const timeout = setTimeout(() => setTypedLength((length) => length + 1), TYPEWRITER_MS_PER_CHAR);
    return () => clearTimeout(timeout);
  }, [isTyping, typedLength]);

  const advance = () => {
    if (isTyping) {
      setTypedLength(fullText.length);
      return;
    }
    if (isLast) onComplete();
    else setIndex((current) => current + 1);
  };

  return (
    <div className={styles.wrap}>
      <PixelPanel seed={seed}>
        <div className={styles.body}>
          {isJesusSpeaking && <JesusPortrait speaking={isTyping} />}
          <div className={styles.textColumn}>
            {speakerKey && <p className={styles.speaker}>{t(speakerKey)}</p>}
            <p className={styles.text}>{fullText.slice(0, typedLength)}</p>
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
