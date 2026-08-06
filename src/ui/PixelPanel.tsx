import type { HTMLAttributes, ReactNode } from "react";
import { PixelSurface } from "@/ui/PixelSurface";
import styles from "@/ui/PixelPanel.module.css";

interface PixelPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  seed?: string;
}

export function PixelPanel({ children, seed = "panel", className, ...rest }: PixelPanelProps) {
  return (
    <div className={[styles.panel, className ?? ""].join(" ").trim()} {...rest}>
      <PixelSurface seed={seed} state="idle" cornerRadius={14} dimForText />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
