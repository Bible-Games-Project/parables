import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { PixelSurface } from "@/ui/PixelSurface";
import styles from "@/ui/PixelButton.module.css";

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  size?: "default" | "large";
  icon?: ReactNode;
  /** Overrides the wood-grain seed (otherwise derived from string children, or a generic fallback for non-string children like a label+value row). */
  seed?: string;
}

export function PixelButton({ children, size = "default", icon, seed, className, disabled, ...rest }: PixelButtonProps) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);

  const state = disabled ? "disabled" : pressed ? "active" : hovered ? "hover" : "idle";

  return (
    <button
      type="button"
      className={[styles.button, size === "large" ? styles.large : "", className ?? ""].join(" ").trim()}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      {...rest}
    >
      <PixelSurface
        seed={seed ?? (typeof children === "string" ? children : "button")}
        state={state}
        cornerRadius={10}
        dimForText
      />
      {icon}
      <span className={styles.label}>{children}</span>
    </button>
  );
}
