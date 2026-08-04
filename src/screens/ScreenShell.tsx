import type { ReactNode } from "react";
import { PixelIconButton } from "@/ui/PixelIconButton";
import { backIcon } from "@/pixel-art/icons";
import { useT } from "@/locales/useT";
import styles from "@/screens/ScreenShell.module.css";

interface ScreenShellProps {
  title: string;
  onBack: () => void;
  children: ReactNode;
}

/** Shared chrome for secondary screens: back button, title, scrollable content area. */
export function ScreenShell({ title, onBack, children }: ScreenShellProps) {
  const t = useT();
  return (
    <div className={styles.shell}>
      <PixelIconButton
        sprite={backIcon}
        seed="back"
        className={styles.backButton}
        onClick={onBack}
        aria-label={t("common.back")}
      />
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
