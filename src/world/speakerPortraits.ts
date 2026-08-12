import type { LocaleKey } from "@/locales/en";
import type { PortraitId } from "@/pixel-art/portraits";

/**
 * Maps a dialogue speaker's display-name key (`ParableEncounter.dialogueSpeakers`,
 * etc.) to the portrait that should render for it. A speaker with no entry
 * here just gets no portrait (the text column takes the full row) — this is
 * the only place a future NPC needs a new line when it starts speaking.
 */
export const SPEAKER_PORTRAITS: Partial<Record<LocaleKey, PortraitId>> = {
  "world.speaker.jesus": "jesus",
  "world.speaker.shepherd": "shepherd-david",
};
