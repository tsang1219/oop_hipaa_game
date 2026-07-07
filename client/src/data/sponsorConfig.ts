/**
 * sponsorConfig.ts — Pluggable sponsor identity.
 *
 * CERT-04: Editing this single file changes the sponsor identity (name, end-NPC
 * sprite, two end-of-demo dialogue lines, redemption code) with no source-code
 * changes elsewhere.
 *
 * Consumed by:
 *   - CertificateOverlay (demo capstone: certificate + end-NPC handoff)
 *   - StartMenu (footer "presented by" credit)
 *   - EndScreen (full-game win: thanks-for-playing credit)
 *
 * Current identity: Out-of-Pocket. When a different sponsor signs, swap the
 * four fields below — keep the dialogue lines in a character's voice (the end
 * NPC is Riley from the front desk), never in ad copy.
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
  name: 'Out-of-Pocket',
  // Riley bookends the demo: first face you meet at the entrance, last face
  // handing you the certificate.
  character_sprite: 'npc_receptionist_sheet',
  two_dialogue_lines: [
    'Four rooms. Zero leaks. The break room is already talking about you — no names, obviously.',
    "This one's from our friends at Out-of-Pocket. Don't spend it all in one waiting room.",
  ],
  code: 'MINIMUM-NECESSARY',
};
