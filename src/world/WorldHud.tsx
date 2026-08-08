import { PixelIcon } from "@/ui/PixelIcon";
import { starIcon, bookIcon } from "@/pixel-art/icons";
import styles from "@/world/WorldHud.module.css";

interface WorldHudProps {
  stars: number;
  completed: number;
  total: number;
}

/** A small, permanent readout of overall progress while exploring Israel — always visible, never intrusive. */
export function WorldHud({ stars, completed, total }: WorldHudProps) {
  return (
    <div className={styles.hud}>
      <div className={styles.stat}>
        <PixelIcon sprite={starIcon} size={15} />
        <span>{stars}</span>
      </div>
      <div className={styles.divider} />
      <div className={styles.stat}>
        <PixelIcon sprite={bookIcon} size={15} />
        <span>
          {completed} / {total}
        </span>
      </div>
    </div>
  );
}
