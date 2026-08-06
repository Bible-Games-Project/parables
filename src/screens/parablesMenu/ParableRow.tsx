import { useState } from "react";
import { PixelSurface } from "@/ui/PixelSurface";
import { PixelIcon } from "@/ui/PixelIcon";
import { lockIcon, checkIcon } from "@/pixel-art/icons";
import { useT } from "@/locales/useT";
import type { ParableDefinition } from "@/parables/registry";
import styles from "@/screens/parablesMenu/ParableRow.module.css";

interface ParableRowProps {
  parable: ParableDefinition;
  unlocked: boolean;
  completed: boolean;
  onSelect: (id: string) => void;
}

export function ParableRow({ parable, unlocked, completed, onSelect }: ParableRowProps) {
  const t = useT();
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const disabled = !unlocked;
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
        {disabled && (
          <>
            <PixelIcon sprite={lockIcon} size={18} />
            {t("common.locked")}
          </>
        )}
        {!disabled && completed && (
          <>
            <PixelIcon sprite={checkIcon} size={18} />
            {t("common.completed")}
          </>
        )}
      </span>
    </button>
  );
}
