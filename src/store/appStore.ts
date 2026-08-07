import { create } from "zustand";

export type AppScreen = "home" | "moreGames" | "premium" | "israel" | "parablesMenu" | "parable";

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
  // Israel is the hub: a parable always hands the player back to the open
  // world when it ends, whether it was triggered by a live encounter or
  // launched as a replay from the Parables Book — never back into a menu.
  exitParable: () => set({ screen: "israel", activeParableId: null }),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
}));
