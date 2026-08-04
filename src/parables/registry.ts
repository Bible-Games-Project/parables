import { sheepIcon } from "@/pixel-art/icons";
import type { PixelGridSprite } from "@/pixel-art/pixelGrid";
import type { LocaleKey } from "@/locales/en";

export interface ParableDefinition {
  id: string;
  titleKey: LocaleKey;
  icon: PixelGridSprite;
  /** Whether this parable has a real playable scene yet. */
  playable: boolean;
}

/**
 * Every parable in the game, in menu order. Adding parable #2 means adding
 * an entry here plus a folder under src/parables/<id>/ — no engine code
 * needs to change.
 */
export const PARABLES: ParableDefinition[] = [
  { id: "lost-sheep", titleKey: "parable.lostSheep.title", icon: sheepIcon, playable: true },
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

export function getNextParableId(id: string): string | undefined {
  const index = PARABLES.findIndex((parable) => parable.id === id);
  if (index === -1) return undefined;
  return PARABLES[index + 1]?.id;
}
