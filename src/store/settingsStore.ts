import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_LOCALE, type LocaleCode } from "@/locales/i18n";

interface SettingsState {
  locale: LocaleCode;
  audioEnabled: boolean;
  volume: number;
  setLocale: (locale: LocaleCode) => void;
  setVolume: (volume: number) => void;
  toggleAudio: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      audioEnabled: true,
      volume: 0.7,
      setLocale: (locale) => set({ locale }),
      setVolume: (volume) => set({ volume: clamp01(volume) }),
      toggleAudio: () => set((state) => ({ audioEnabled: !state.audioEnabled })),
    }),
    { name: "bible-parables-settings" },
  ),
);

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
