import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ProgressState {
  unlockedParableIds: string[];
  completedParableIds: string[];
  unlockParable: (parableId: string) => void;
  completeParable: (parableId: string) => void;
  isUnlocked: (parableId: string) => boolean;
  isCompleted: (parableId: string) => boolean;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      unlockedParableIds: ["lost-sheep"],
      completedParableIds: [],
      unlockParable: (parableId) =>
        set((state) =>
          state.unlockedParableIds.includes(parableId)
            ? state
            : { unlockedParableIds: [...state.unlockedParableIds, parableId] },
        ),
      completeParable: (parableId) =>
        set((state) =>
          state.completedParableIds.includes(parableId)
            ? state
            : { completedParableIds: [...state.completedParableIds, parableId] },
        ),
      isUnlocked: (parableId) => get().unlockedParableIds.includes(parableId),
      isCompleted: (parableId) => get().completedParableIds.includes(parableId),
    }),
    { name: "bible-parables-progress" },
  ),
);
