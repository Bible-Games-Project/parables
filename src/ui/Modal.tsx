import type { ReactNode } from "react";
import { PixelPanel } from "@/ui/PixelPanel";
import { useT } from "@/locales/useT";
import styles from "@/ui/Modal.module.css";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  seed?: string;
}

export function Modal({ title, onClose, children, seed = "modal" }: ModalProps) {
  const t = useT();
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(event) => event.stopPropagation()}>
        <PixelPanel seed={seed}>
          <div className={styles.header}>
            <span className={styles.title}>{title}</span>
            <button className={styles.closeButton} onClick={onClose} aria-label={t("common.close")}>
              ✕
            </button>
          </div>
          {children}
        </PixelPanel>
      </div>
    </div>
  );
}
