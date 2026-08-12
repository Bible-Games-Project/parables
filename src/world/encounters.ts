import type { Vector2 } from "@/engine/input";
import type { LocaleKey } from "@/locales/en";
import type { Expression } from "@/pixel-art/portraits";
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
  /** Portrait facial expression per line, same index as `dialogueLines` — defaults to "neutral" where omitted. */
  dialogueExpressions?: Expression[];
  /**
   * A short follow-up exchange, played automatically (no Talk button needed)
   * the moment the player returns to Israel after completing this encounter's
   * parable live — the NPC reacting to the lesson rather than the
   * conversation just hanging. Every encounter should have one: it's what
   * closes the loop opened by `dialogueLines`.
   */
  returnDialogueLines: LocaleKey[];
  returnDialogueSpeakers: LocaleKey[];
  returnDialogueExpressions?: Expression[];
  /**
   * A very short exchange offering to play the parable again — shown right
   * after `returnDialogueLines` finishes on the first live completion, and
   * from then on every time the player presses Talk on an already-completed
   * encounter (replacing `dialogueLines`, since the NPC's original problem
   * was already resolved). Ends the same way `dialogueLines` does: Continue
   * leads into the parable, Back leaves without entering it.
   */
  replayDialogueLines: LocaleKey[];
  replayDialogueSpeakers: LocaleKey[];
  replayDialogueExpressions?: Expression[];
}

/**
 * Every encounter follows the same narrative shape (see AGENTS.md's "parable
 * encounter narrative rule"): the NPC's opening lines are a human problem —
 * never the literal subject of the parable — and the return lines are their
 * emotional reaction once they've understood the lesson.
 */
export const PARABLE_ENCOUNTERS: ParableEncounter[] = [
  {
    id: "shepherd-searching",
    parableId: "lost-sheep",
    position: SHEPHERD_CAMP,
    radius: 46,
    dialogueLines: [
      "world.encounter.lostSheep.line1",
      "world.encounter.lostSheep.line2",
      "world.encounter.lostSheep.line3",
      "world.encounter.lostSheep.line4",
    ],
    dialogueSpeakers: ["world.speaker.shepherd", "world.speaker.jesus", "world.speaker.shepherd", "world.speaker.jesus"],
    dialogueExpressions: ["sad", "concerned", "sad", "warm"],
    returnDialogueLines: [
      "world.encounter.lostSheep.return1",
      "world.encounter.lostSheep.return2",
      "world.encounter.lostSheep.return3",
    ],
    returnDialogueSpeakers: ["world.speaker.shepherd", "world.speaker.jesus", "world.speaker.shepherd"],
    returnDialogueExpressions: ["concerned", "warm", "joyful"],
    replayDialogueLines: ["world.encounter.lostSheep.replay1", "world.encounter.lostSheep.replay2"],
    replayDialogueSpeakers: ["world.speaker.shepherd", "world.speaker.jesus"],
    replayDialogueExpressions: ["neutral", "warm"],
  },
];
