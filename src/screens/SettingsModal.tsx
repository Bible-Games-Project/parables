import { useState } from "react";
import { Modal } from "@/ui/Modal";
import { PixelButton } from "@/ui/PixelButton";
import { PixelSlider } from "@/ui/PixelSlider";
import { PixelToggle } from "@/ui/PixelToggle";
import { useT } from "@/locales/useT";
import { useSettingsStore } from "@/store/settingsStore";
import { useProgressStore } from "@/store/progressStore";
import { useWorldStore } from "@/store/worldStore";
import { LOCALE_CODES, LOCALE_NAMES } from "@/locales/i18n";
import styles from "@/screens/SettingsModal.module.css";

interface SettingsModalProps {
  onClose: () => void;
}

type SettingsPanel = "language" | "audio" | "debug" | null;

export function SettingsModal({ onClose }: SettingsModalProps) {
  const t = useT();
  const locale = useSettingsStore((state) => state.locale);
  const setLocale = useSettingsStore((state) => state.setLocale);
  const musicEnabled = useSettingsStore((state) => state.musicEnabled);
  const musicVolume = useSettingsStore((state) => state.musicVolume);
  const toggleMusic = useSettingsStore((state) => state.toggleMusic);
  const setMusicVolume = useSettingsStore((state) => state.setMusicVolume);
  const soundsEnabled = useSettingsStore((state) => state.soundsEnabled);
  const soundsVolume = useSettingsStore((state) => state.soundsVolume);
  const toggleSounds = useSettingsStore((state) => state.toggleSounds);
  const setSoundsVolume = useSettingsStore((state) => state.setSoundsVolume);
  const debugMode = useSettingsStore((state) => state.debugMode);
  const toggleDebugMode = useSettingsStore((state) => state.toggleDebugMode);
  const resetProgress = useProgressStore((state) => state.resetProgress);
  const resetWorld = useWorldStore((state) => state.resetWorld);

  // Only one panel open at a time — pressing a button that's already open closes it.
  const [openPanel, setOpenPanel] = useState<SettingsPanel>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const togglePanel = (panel: SettingsPanel) => setOpenPanel((current) => (current === panel ? null : panel));

  const handleConfirmReset = () => {
    // Only gameplay/progression is wiped — resetProgress/resetWorld never touch
    // this store, so language, audio, and debugMode itself all survive untouched.
    resetProgress();
    resetWorld();
    setConfirmingReset(false);
  };

  return (
    <Modal title={t("settings.title")} onClose={onClose} seed="settings-modal" closeVariant="back">
      <div className={styles.mainButtons}>
        <PixelButton
          className={styles.mainButton}
          size="large"
          onClick={() => togglePanel("language")}
          aria-expanded={openPanel === "language"}
        >
          {`${t("language.title")} — ${LOCALE_NAMES[locale]}`}
        </PixelButton>
        {openPanel === "language" && (
          <div className={styles.panel}>
            <div className={styles.languageGrid}>
              {LOCALE_CODES.map((code) => (
                <PixelButton
                  key={code}
                  className={styles.languageOption}
                  disabled={code === locale}
                  onClick={() => {
                    setLocale(code);
                    setOpenPanel(null);
                  }}
                >
                  {LOCALE_NAMES[code]}
                </PixelButton>
              ))}
            </div>
          </div>
        )}

        <PixelButton
          className={styles.mainButton}
          size="large"
          onClick={() => togglePanel("audio")}
          aria-expanded={openPanel === "audio"}
        >
          {t("settings.audio")}
        </PixelButton>
        {openPanel === "audio" && (
          <div className={styles.panel}>
            <PixelToggle label={t("settings.music")} on={musicEnabled} onToggle={toggleMusic} />
            <PixelSlider label={t("settings.volume")} value={musicVolume} onChange={setMusicVolume} disabled={!musicEnabled} />
            <PixelToggle label={t("settings.sounds")} on={soundsEnabled} onToggle={toggleSounds} />
            <PixelSlider label={t("settings.volume")} value={soundsVolume} onChange={setSoundsVolume} disabled={!soundsEnabled} />
          </div>
        )}

        <PixelButton
          className={styles.mainButton}
          size="large"
          onClick={() => togglePanel("debug")}
          aria-expanded={openPanel === "debug"}
        >
          {t("settings.debug.title")}
        </PixelButton>
        {openPanel === "debug" && (
          <div className={styles.panel}>
            <PixelToggle label={t("settings.debug.mode")} on={debugMode} onToggle={toggleDebugMode} />
            <PixelButton className={styles.resetButton} onClick={() => setConfirmingReset(true)}>
              {t("settings.debug.reset")}
            </PixelButton>
          </div>
        )}
      </div>

      {confirmingReset && (
        <Modal title={t("settings.debug.resetConfirmTitle")} onClose={() => setConfirmingReset(false)} seed="reset-confirm">
          <div className={styles.confirmActions}>
            <PixelButton onClick={() => setConfirmingReset(false)}>{t("common.cancel")}</PixelButton>
            <PixelButton onClick={handleConfirmReset}>{t("settings.debug.resetConfirm")}</PixelButton>
          </div>
        </Modal>
      )}
    </Modal>
  );
}
