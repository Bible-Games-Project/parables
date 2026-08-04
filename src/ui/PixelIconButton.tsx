import { useState, type ButtonHTMLAttributes } from "react";
import { PixelSurface } from "@/ui/PixelSurface";
import { PixelIcon } from "@/ui/PixelIcon";
import type { PixelGridSprite } from "@/pixel-art/pixelGrid";
import styles from "@/ui/PixelIconButton.module.css";

interface PixelIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  sprite: PixelGridSprite;
  seed: string;
}

export function PixelIconButton({ sprite, seed, className, ...rest }: PixelIconButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const state = pressed ? "active" : hovered ? "hover" : "idle";

  return (
    <button
      type="button"
      className={[styles.button, className ?? ""].join(" ").trim()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      {...rest}
    >
      <PixelSurface seed={seed} state={state} cornerRadius={8} />
      <PixelIcon sprite={sprite} size={26} className={styles.icon} />
    </button>
  );
}
