import { PixelIcon } from "@/ui/PixelIcon";
import type { PixelGridSprite } from "@/pixel-art/pixelGrid";
import styles from "@/ui/HealthBar.module.css";

interface HealthBarProps {
  icon: PixelGridSprite;
  current: number;
  max: number;
  /** Pulses the bar continuously — used once real danger begins (e.g. the lost sheep's wound starts bleeding it out), so the player always has a live sense of urgency. */
  blinking?: boolean;
}

export function HealthBar({ icon, current, max, blinking = false }: HealthBarProps) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
  const fillClass = ratio > 0.6 ? styles.fillHigh : ratio > 0.3 ? styles.fillMid : styles.fill;

  return (
    <div className={[styles.wrap, blinking ? styles.blinking : ""].join(" ").trim()}>
      <PixelIcon sprite={icon} size={20} />
      <div className={styles.track}>
        <div className={[styles.fill, fillClass].join(" ")} style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}
