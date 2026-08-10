import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WorldState {
  /** Jesus's last position in Israel, restored on return from a parable (or a fresh launch) instead of always respawning at the world's entrance. */
  jesusPosition: { x: number; y: number } | null;
  setJesusPosition: (position: { x: number; y: number }) => void;
  /** The encounter whose live Talk conversation just sent the player into a parable — read once on the next Israel mount to continue the conversation naturally (the NPC reacting to what just happened) instead of leaving the exchange hanging. Cleared as soon as it's consumed. */
  pendingReturnEncounterId: string | null;
  setPendingReturnEncounterId: (id: string | null) => void;
  /** Debug-only "Reset Game Data": drops Jesus's saved position so Israel falls back to `JESUS_START` next time it mounts, and clears any pending return conversation. */
  resetWorld: () => void;
}

export const useWorldStore = create<WorldState>()(
  persist(
    (set) => ({
      jesusPosition: null,
      setJesusPosition: (position) => set({ jesusPosition: position }),
      pendingReturnEncounterId: null,
      setPendingReturnEncounterId: (id) => set({ pendingReturnEncounterId: id }),
      resetWorld: () => set({ jesusPosition: null, pendingReturnEncounterId: null }),
    }),
    { name: "bible-parables-world" },
  ),
);
