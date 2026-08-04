import { Modal } from "@/ui/Modal";
import { PixelButton } from "@/ui/PixelButton";
import { useT } from "@/locales/useT";
import { useSettingsStore } from "@/store/settingsStore";
import { LOCALE_CODES, LOCALE_NAMES } from "@/locales/i18n";
import styles from "@/screens/LanguageModal.module.css";

interface LanguageModalProps {
  onClose: () => void;
}

export function LanguageModal({ onClose }: LanguageModalProps) {
  const t = useT();
  const locale = useSettingsStore((state) => state.locale);
  const setLocale = useSettingsStore((state) => state.setLocale);

  return (
    <Modal title={t("language.title")} onClose={onClose} seed="language-modal">
      <div className={styles.list}>
        {LOCALE_CODES.map((code) => (
          <PixelButton
            key={code}
            className={styles.option}
            disabled={code === locale}
            onClick={() => {
              setLocale(code);
              onClose();
            }}
          >
            {LOCALE_NAMES[code]}
          </PixelButton>
        ))}
      </div>
    </Modal>
  );
}
