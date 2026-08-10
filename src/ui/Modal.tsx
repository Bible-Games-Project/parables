import type { ReactNode } from "react";
import { PixelPanel } from "@/ui/PixelPanel";
import { PixelIconButton } from "@/ui/PixelIconButton";
import { backIcon } from "@/pixel-art/icons";
import { useT } from "@/locales/useT";
import styles from "@/ui/Modal.module.css";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  seed?: string;
  /** "x" (default) is the plain close glyph; "back" reuses the same pixel-art back-arrow button used during gameplay, for screens the player thinks of as a place to navigate back from rather than a dismissible popup. */
  closeVariant?: "x" | "back";
}

export function Modal({ title, onClose, children, seed = "modal", closeVariant = "x" }: ModalProps) {
  const t = useT();
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(event) => event.stopPropagation()}>
        <PixelPanel seed={seed}>
          <div className={styles.header}>
            <span className={styles.title}>{title}</span>
            {closeVariant === "back" ? (
              <PixelIconButton
                sprite={backIcon}
                seed={`${seed}-back`}
                className={styles.backButton}
                onClick={onClose}
                aria-label={t("common.back")}
              />
            ) : (
              <button className={styles.closeButton} onClick={onClose} aria-label={t("common.close")}>
                ✕
              </button>
            )}
          </div>
          {children}
        </PixelPanel>
      </div>
    </div>
  );
}
