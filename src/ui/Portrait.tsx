import { useEffect, useState } from "react";
import jesusTalk from "@/assets/portraits/jesus-talk.png";
import jesusNeutral from "@/assets/portraits/jesus-neutral.png";
import jesusBlink from "@/assets/portraits/jesus-blink.png";
import jesusTalkBlink from "@/assets/portraits/jesus-talk-blink.png";
import styles from "@/ui/Portrait.module.css";

interface JesusPortraitProps {
  /** True while Jesus's line is the one currently on screen — drives the subtle talking cycle. */
  speaking: boolean;
}

const MOUTH_BASE_MS = 260;
const MOUTH_JITTER_MS = 220;
const BLINK_BASE_MS = 2400;
const BLINK_JITTER_MS = 2600;
const BLINK_DURATION_MS = 110;
/** Every 5-7 normal blinks, do a quick double blink instead — occasional, not mechanically regular. */
const DOUBLE_BLINK_EVERY_MIN = 5;
const DOUBLE_BLINK_EVERY_RANGE = 3;
const DOUBLE_BLINK_GAP_MS = 500;

/**
 * A handful of pre-rendered pixel-art frames (derived directly from the
 * reference image, never redrawn) swapped on independent timers — a subtle
 * mouth-talk cycle gated by `speaking`, and an occasional blink that runs
 * regardless. No procedural drawing, no deformation.
 */
export function JesusPortrait({ speaking }: JesusPortraitProps) {
  const [mouthOpen, setMouthOpen] = useState(false);
  const [eyesClosed, setEyesClosed] = useState(false);

  useEffect(() => {
    if (!speaking) {
      setMouthOpen(false);
      return;
    }
    let timeout: ReturnType<typeof setTimeout>;
    const tick = () => {
      setMouthOpen((open) => !open);
      timeout = setTimeout(tick, MOUTH_BASE_MS + Math.random() * MOUTH_JITTER_MS);
    };
    timeout = setTimeout(tick, MOUTH_BASE_MS + Math.random() * MOUTH_JITTER_MS);
    return () => clearTimeout(timeout);
  }, [speaking]);

  useEffect(() => {
    let waitTimeout: ReturnType<typeof setTimeout>;
    let closeTimeout: ReturnType<typeof setTimeout>;
    let gapTimeout: ReturnType<typeof setTimeout>;
    let secondCloseTimeout: ReturnType<typeof setTimeout>;
    let blinksSinceDouble = 0;
    let nextDoubleAt = DOUBLE_BLINK_EVERY_MIN + Math.floor(Math.random() * DOUBLE_BLINK_EVERY_RANGE);

    const singleBlink = (onDone: () => void) => {
      setEyesClosed(true);
      return setTimeout(() => {
        setEyesClosed(false);
        onDone();
      }, BLINK_DURATION_MS);
    };

    const scheduleBlink = () => {
      waitTimeout = setTimeout(() => {
        blinksSinceDouble += 1;
        if (blinksSinceDouble >= nextDoubleAt) {
          blinksSinceDouble = 0;
          nextDoubleAt = DOUBLE_BLINK_EVERY_MIN + Math.floor(Math.random() * DOUBLE_BLINK_EVERY_RANGE);
          closeTimeout = singleBlink(() => {
            gapTimeout = setTimeout(() => {
              secondCloseTimeout = singleBlink(scheduleBlink);
            }, DOUBLE_BLINK_GAP_MS);
          });
        } else {
          closeTimeout = singleBlink(scheduleBlink);
        }
      }, BLINK_BASE_MS + Math.random() * BLINK_JITTER_MS);
    };
    scheduleBlink();
    return () => {
      clearTimeout(waitTimeout);
      clearTimeout(closeTimeout);
      clearTimeout(gapTimeout);
      clearTimeout(secondCloseTimeout);
    };
  }, []);

  const frame = eyesClosed ? (mouthOpen ? jesusTalkBlink : jesusBlink) : mouthOpen ? jesusTalk : jesusNeutral;

  return <img src={frame} alt="" aria-hidden="true" draggable={false} className={styles.portrait} />;
}
