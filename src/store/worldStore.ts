import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WorldState {
  /** Jesus's last position in Israel, restored on return from a parable (or a fresh launch) instead of always respawning at the world's entrance. */
  jesusPosition: { x: number; y: number } | null;
  setJesusPosition: (position: { x: number; y: number }) => void;
}

export const useWorldStore = create<WorldState>()(
  persist(
    (set) => ({
      jesusPosition: null,
      setJesusPosition: (position) => set({ jesusPosition: position }),
    }),
    { name: "bible-parables-world" },
  ),
);
