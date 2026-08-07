import type { Rect } from "@/engine/collision";
import { BRIDGE, RIVER } from "@/world/map";

/**
 * Stars unlock parts of Israel instead of parables unlocking directly — this
 * is the whole mechanism, proven here with one gate (the river crossing).
 * Adding another just means another entry here plus wiring its walls into
 * the terrain the same way `buildIsraelTerrain` does for this one.
 */
export interface WorldGate {
  id: string;
  unlockAtStars: number;
  /** Solid only while the gate is locked — removed from collision entirely once unlocked. */
  walls: Rect[];
}

export const BRIDGE_GATE: WorldGate = {
  id: "river-bridge",
  unlockAtStars: 1,
  walls: [{ x: BRIDGE.xStart, y: RIVER.yTop, width: BRIDGE.width, height: RIVER.yBottom - RIVER.yTop }],
};

export const WORLD_GATES: WorldGate[] = [BRIDGE_GATE];

export function isGateUnlocked(gate: WorldGate, totalStars: number): boolean {
  return totalStars >= gate.unlockAtStars;
}

/** Every wall that's still solid, given the player's current total stars. */
export function activeGateWalls(totalStars: number): Rect[] {
  return WORLD_GATES.filter((gate) => !isGateUnlocked(gate, totalStars)).flatMap((gate) => gate.walls);
}
