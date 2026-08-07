import type { ComponentType } from "react";
import { sheepIcon } from "@/pixel-art/icons";
import type { PixelGridSprite } from "@/pixel-art/pixelGrid";
import type { LocaleKey } from "@/locales/en";
import type { ParableResult } from "@/store/progressStore";
import { LostSheepScene } from "@/parables/lost-sheep/LostSheepScene";

/**
 * The contract every playable parable scene implements. `onVictory` is the
 * only way a scene reports success back out — it hands up a `ParableResult`
 * (its own honest 1-3 star grade) and nothing else; the scene never touches
 * the progress store or navigation itself, so a parable can't get the
 * "return to Israel" behavior wrong even if it wanted to.
 */
export interface ParableSceneProps {
  onExit: () => void;
  onRetry: () => void;
  onVictory: (result: ParableResult) => void;
}

export interface ParableDefinition {
  id: string;
  titleKey: LocaleKey;
  icon: PixelGridSprite;
  /** Whether this parable has a real playable scene yet. */
  playable: boolean;
  /** The playable scene component, present only once `playable` is true. */
  component?: ComponentType<ParableSceneProps>;
}

/**
 * Every parable in the game, in Book order. Adding parable #2 means adding
 * an entry here (with its `component`), plus a folder under
 * src/parables/<id>/, plus one encounter in src/world/encounters.ts — no
 * other engine code needs to change.
 */
export const PARABLES: ParableDefinition[] = [
  { id: "lost-sheep", titleKey: "parable.lostSheep.title", icon: sheepIcon, playable: true, component: LostSheepScene },
  { id: "good-samaritan", titleKey: "parable.goodSamaritan.title", icon: sheepIcon, playable: false },
  { id: "sower", titleKey: "parable.sower.title", icon: sheepIcon, playable: false },
  { id: "prodigal-son", titleKey: "parable.prodigalSon.title", icon: sheepIcon, playable: false },
  { id: "lost-coin", titleKey: "parable.lostCoin.title", icon: sheepIcon, playable: false },
  { id: "wise-builders", titleKey: "parable.wiseBuilders.title", icon: sheepIcon, playable: false },
  { id: "mustard-seed", titleKey: "parable.mustardSeed.title", icon: sheepIcon, playable: false },
  { id: "talents", titleKey: "parable.talents.title", icon: sheepIcon, playable: false },
  { id: "ten-virgins", titleKey: "parable.tenVirgins.title", icon: sheepIcon, playable: false },
  { id: "hidden-treasure", titleKey: "parable.hiddenTreasure.title", icon: sheepIcon, playable: false },
  { id: "pearl", titleKey: "parable.pearl.title", icon: sheepIcon, playable: false },
  { id: "wheat-weeds", titleKey: "parable.wheatWeeds.title", icon: sheepIcon, playable: false },
];

export function getParable(id: string): ParableDefinition | undefined {
  return PARABLES.find((parable) => parable.id === id);
}
