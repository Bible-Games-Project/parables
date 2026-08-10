import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ParableResult {
  /** 1-3, computed by the parable itself from its own performance metrics — never gameplay-affecting, purely a grade. */
  stars: 1 | 2 | 3;
  /** Optional: seconds taken, kept for a "best completion" display in the Book. */
  timeSeconds?: number;
}

interface ProgressState {
  /** Parables the player has discovered/can access the world-encounter for. Not the same as "selectable in the Book" — that's `completedParableIds`. */
  unlockedParableIds: string[];
  completedParableIds: string[];
  /** Best (highest) star rating ever earned per parable. */
  stars: Record<string, number>;
  /** Best (lowest) completion time per parable, in seconds, if the parable reports one. */
  bestTimeSeconds: Record<string, number>;
  unlockParable: (parableId: string) => void;
  /** Records a completion, keeping the best stars/time ever achieved — replaying to improve your score never loses a better previous result. */
  completeParable: (parableId: string, result: ParableResult) => void;
  isUnlocked: (parableId: string) => boolean;
  isCompleted: (parableId: string) => boolean;
  totalStars: () => number;
  /** Debug-only "Reset Game Data": wipes every earned result back to a fresh save. Never touches `settingsStore` — language/audio/debug-mode itself are not progression. */
  resetProgress: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      unlockedParableIds: ["lost-sheep"],
      completedParableIds: [],
      stars: {},
      bestTimeSeconds: {},
      unlockParable: (parableId) =>
        set((state) =>
          state.unlockedParableIds.includes(parableId)
            ? state
            : { unlockedParableIds: [...state.unlockedParableIds, parableId] },
        ),
      completeParable: (parableId, result) =>
        set((state) => {
          const completedParableIds = state.completedParableIds.includes(parableId)
            ? state.completedParableIds
            : [...state.completedParableIds, parableId];
          const bestStars = Math.max(state.stars[parableId] ?? 0, result.stars);
          const stars = { ...state.stars, [parableId]: bestStars };
          const bestTimeSeconds = { ...state.bestTimeSeconds };
          if (result.timeSeconds !== undefined) {
            const prevBest = bestTimeSeconds[parableId];
            bestTimeSeconds[parableId] = prevBest === undefined ? result.timeSeconds : Math.min(prevBest, result.timeSeconds);
          }
          return { completedParableIds, stars, bestTimeSeconds };
        }),
      isUnlocked: (parableId) => get().unlockedParableIds.includes(parableId),
      isCompleted: (parableId) => get().completedParableIds.includes(parableId),
      totalStars: () => Object.values(get().stars).reduce((sum, value) => sum + value, 0),
      resetProgress: () =>
        set({
          unlockedParableIds: ["lost-sheep"],
          completedParableIds: [],
          stars: {},
          bestTimeSeconds: {},
        }),
    }),
    { name: "bible-parables-progress" },
  ),
);
