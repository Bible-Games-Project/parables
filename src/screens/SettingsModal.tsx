import { Modal } from "@/ui/Modal";
import { PixelSlider } from "@/ui/PixelSlider";
import { PixelToggle } from "@/ui/PixelToggle";
import { useT } from "@/locales/useT";
import { useSettingsStore } from "@/store/settingsStore";

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const t = useT();
  const musicVolume = useSettingsStore((state) => state.musicVolume);
  const soundVolume = useSettingsStore((state) => state.soundVolume);
  const musicEnabled = useSettingsStore((state) => state.musicEnabled);
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const setMusicVolume = useSettingsStore((state) => state.setMusicVolume);
  const setSoundVolume = useSettingsStore((state) => state.setSoundVolume);
  const toggleMusic = useSettingsStore((state) => state.toggleMusic);
  const toggleSound = useSettingsStore((state) => state.toggleSound);

  return (
    <Modal title={t("settings.title")} onClose={onClose} seed="settings-modal">
      <PixelSlider label={t("settings.musicVolume")} value={musicVolume} onChange={setMusicVolume} />
      <PixelSlider label={t("settings.soundVolume")} value={soundVolume} onChange={setSoundVolume} />
      <PixelToggle label={t("settings.music")} on={musicEnabled} onToggle={toggleMusic} />
      <PixelToggle label={t("settings.sound")} on={soundEnabled} onToggle={toggleSound} />
    </Modal>
  );
}
