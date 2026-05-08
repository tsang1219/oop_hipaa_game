/**
 * sponsorConfig.ts — Pluggable sponsor identity for the v2.2 Sponsor Demo.
 *
 * CERT-04: Editing this single file changes the sponsor identity (name, end-NPC
 * sprite, two end-of-demo dialogue lines, redemption code) with no source-code
 * changes elsewhere. Phase 21 populates these fields per-sponsor; Phase 18
 * establishes the shape and sensible placeholder defaults so consumers can
 * import and type-check today.
 *
 * Consumed by Phase 21's completion sequence (certificate + end NPC).
 */

export interface SponsorConfig {
  /** Display name shown on completion certificate (e.g., "Out-of-Pocket"). */
  name: string;
  /**
   * Sprite asset KEY (matches a key registered in BootScene), e.g.,
   * "npc_staff_sheet". Phase 21 will use this to render the end NPC.
   */
  character_sprite: string;
  /** Two NPC lines used by the end-of-demo NPC. Tuple to enforce exactly two. */
  two_dialogue_lines: [string, string];
  /** Sponsor-provided redemption code revealed at the end of the demo. */
  code: string;
}

export const SPONSOR_CONFIG: SponsorConfig = {
  name: 'Sponsor TBD',
  character_sprite: 'npc_staff_sheet',
  two_dialogue_lines: [
    'Nice work today.',
    'Tell them I sent you.',
  ],
  code: 'DEMO-CODE-PLACEHOLDER',
};
