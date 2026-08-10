import { useState } from "react";
import { PixelSurface } from "@/ui/PixelSurface";
import { PixelIcon } from "@/ui/PixelIcon";
import { StarRow } from "@/ui/StarRow";
import { lockIcon } from "@/pixel-art/icons";
import { useT } from "@/locales/useT";
import type { ParableDefinition } from "@/parables/registry";
import styles from "@/screens/parablesMenu/ParableRow.module.css";

interface ParableRowProps {
  parable: ParableDefinition;
  completed: boolean;
  stars: number;
  onSelect: (id: string) => void;
  /** Debug Mode override: makes every row selectable regardless of `completed`, for testing. Never changes what's actually recorded as completed. */
  debugUnlocked?: boolean;
}

/** One entry in the Book of Parables. Selectable only once completed — an uncompleted parable is discovered by meeting its encounter in Israel, not picked from this list (unless Debug Mode is on). */
export function ParableRow({ parable, completed, stars, onSelect, debugUnlocked }: ParableRowProps) {
  const t = useT();
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const disabled = !completed && !debugUnlocked;
  const state = disabled ? "disabled" : pressed ? "active" : hovered ? "hover" : "idle";

  return (
    <button
      type="button"
      className={styles.row}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onClick={() => onSelect(parable.id)}
    >
      <PixelSurface seed={parable.id} state={state} cornerRadius={10} dimForText />
      <PixelIcon sprite={parable.icon} size={30} className={styles.icon} />
      <span className={styles.title}>{t(parable.titleKey)}</span>
      <span className={styles.status}>
        {disabled ? (
          <>
            <PixelIcon sprite={lockIcon} size={18} />
            {t("common.locked")}
          </>
        ) : (
          <>
            <StarRow stars={stars} />
            <span className={styles.replay}>{t("parablesMenu.replay")}</span>
          </>
        )}
      </span>
    </button>
  );
}
