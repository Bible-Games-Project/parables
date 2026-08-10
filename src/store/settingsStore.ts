import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_LOCALE, type LocaleCode } from "@/locales/i18n";

interface SettingsState {
  locale: LocaleCode;
  musicEnabled: boolean;
  musicVolume: number;
  soundsEnabled: boolean;
  soundsVolume: number;
  /** Developer-only override: unlocks every parable and every star-gated area in Israel for testing, without touching real progression. Never surfaced outside Settings. */
  debugMode: boolean;
  setLocale: (locale: LocaleCode) => void;
  toggleMusic: () => void;
  setMusicVolume: (volume: number) => void;
  toggleSounds: () => void;
  setSoundsVolume: (volume: number) => void;
  toggleDebugMode: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      musicEnabled: true,
      musicVolume: 0.7,
      soundsEnabled: true,
      soundsVolume: 0.7,
      debugMode: false,
      setLocale: (locale) => set({ locale }),
      toggleMusic: () => set((state) => ({ musicEnabled: !state.musicEnabled })),
      setMusicVolume: (volume) => set({ musicVolume: clamp01(volume) }),
      toggleSounds: () => set((state) => ({ soundsEnabled: !state.soundsEnabled })),
      setSoundsVolume: (volume) => set({ soundsVolume: clamp01(volume) }),
      toggleDebugMode: () => set((state) => ({ debugMode: !state.debugMode })),
    }),
    { name: "bible-parables-settings" },
  ),
);

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
