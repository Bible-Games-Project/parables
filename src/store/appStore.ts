import { create } from "zustand";

export type AppScreen = "home" | "moreGames" | "premium" | "parablesMenu" | "parable";

interface AppState {
  screen: AppScreen;
  activeParableId: string | null;
  settingsOpen: boolean;
  navigate: (screen: AppScreen) => void;
  openParable: (parableId: string) => void;
  exitParable: () => void;
  openSettings: () => void;
  closeSettings: () => void;
}

export const useAppStore = create<AppState>()((set) => ({
  screen: "home",
  activeParableId: null,
  settingsOpen: false,
  navigate: (screen) => set({ screen, activeParableId: null }),
  openParable: (parableId) => set({ screen: "parable", activeParableId: parableId }),
  exitParable: () => set({ screen: "parablesMenu", activeParableId: null }),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
}));
