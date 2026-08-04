import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_LOCALE, type LocaleCode } from "@/locales/i18n";

interface SettingsState {
  locale: LocaleCode;
  musicVolume: number;
  soundVolume: number;
  musicEnabled: boolean;
  soundEnabled: boolean;
  setLocale: (locale: LocaleCode) => void;
  setMusicVolume: (volume: number) => void;
  setSoundVolume: (volume: number) => void;
  toggleMusic: () => void;
  toggleSound: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      musicVolume: 0.6,
      soundVolume: 0.8,
      musicEnabled: true,
      soundEnabled: true,
      setLocale: (locale) => set({ locale }),
      setMusicVolume: (musicVolume) => set({ musicVolume: clamp01(musicVolume) }),
      setSoundVolume: (soundVolume) => set({ soundVolume: clamp01(soundVolume) }),
      toggleMusic: () => set((state) => ({ musicEnabled: !state.musicEnabled })),
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
    }),
    { name: "bible-parables-settings" },
  ),
);

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
