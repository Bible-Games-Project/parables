import type { Vector2 } from "@/engine/input";
import type { LocaleKey } from "@/locales/en";
import { SHEPHERD_CAMP } from "@/world/map";

/**
 * A handcrafted situation the player can find in Israel — never a generic
 * marker, always tied to one specific parable. Adding a new parable means
 * adding one entry here (its own unique position and dialogue) plus
 * registering the parable itself in `parables/registry.ts`.
 */
export interface ParableEncounter {
  id: string;
  parableId: string;
  position: Vector2;
  /** How close Jesus must be before the Talk button appears. */
  radius: number;
  dialogueLines: LocaleKey[];
  /** Speaker name shown above each line, same index as `dialogueLines`. */
  dialogueSpeakers: LocaleKey[];
}

export const PARABLE_ENCOUNTERS: ParableEncounter[] = [
  {
    id: "shepherd-searching",
    parableId: "lost-sheep",
    position: SHEPHERD_CAMP,
    radius: 46,
    dialogueLines: ["world.encounter.lostSheep.line1", "world.encounter.lostSheep.line2"],
    dialogueSpeakers: ["world.speaker.shepherd", "world.speaker.jesus"],
  },
];
