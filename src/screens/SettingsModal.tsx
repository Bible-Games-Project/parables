import { Modal } from "@/ui/Modal";
import { PixelButton } from "@/ui/PixelButton";
import { PixelSlider } from "@/ui/PixelSlider";
import { PixelToggle } from "@/ui/PixelToggle";
import { useT } from "@/locales/useT";
import { useSettingsStore } from "@/store/settingsStore";
import { LOCALE_CODES, LOCALE_NAMES } from "@/locales/i18n";
import styles from "@/screens/SettingsModal.module.css";

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const t = useT();
  const locale = useSettingsStore((state) => state.locale);
  const setLocale = useSettingsStore((state) => state.setLocale);
  const audioEnabled = useSettingsStore((state) => state.audioEnabled);
  const volume = useSettingsStore((state) => state.volume);
  const toggleAudio = useSettingsStore((state) => state.toggleAudio);
  const setVolume = useSettingsStore((state) => state.setVolume);

  return (
    <Modal title={t("settings.title")} onClose={onClose} seed="settings-modal">
      <div className={styles.section}>
        <div className={styles.sectionTitle}>{t("language.title")}</div>
        <div className={styles.languageGrid}>
          {LOCALE_CODES.map((code) => (
            <PixelButton
              key={code}
              className={styles.languageOption}
              disabled={code === locale}
              onClick={() => setLocale(code)}
            >
              {LOCALE_NAMES[code]}
            </PixelButton>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>{t("settings.audio")}</div>
        <PixelToggle label={t("settings.music")} on={audioEnabled} onToggle={toggleAudio} />
        <PixelSlider label={t("settings.volume")} value={volume} onChange={setVolume} disabled={!audioEnabled} />
      </div>
    </Modal>
  );
}
