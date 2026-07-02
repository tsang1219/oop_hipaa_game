/**
 * PHI Sorter NPC Reaction Bank — Phase 22 (expanded Phase 23)
 *
 * The trigger NPC (Aiyana / Marcus / Dr. Tovar) stays present during the sort via a speech bubble
 * (NPCReactionBubble.tsx, Phase 22 Plan 03). After each item drop, PHISorterOverlay (Phase 22 Plan 04)
 * queries this bank for the appropriate reaction text:
 *   1. Try getNPCReactionForItem(npcId, itemId, isCorrect) — specific-item reaction
 *   2. Fall back to getNPCFallbackReaction(npcId, currentAccuracyBand, nonce) — band line
 *
 * Phase 23 (SORTV2-10): Each band now has exactly 3 lines per NPC (9 band lines per NPC, 27 total).
 * Band selection drives enthusiasm scaling — tone is felt, not stated:
 *   strong = escalate (enthusiastic)  — NPC is genuinely delighted, shows it in their own voice
 *   good   = steady, warm (neutral)   — workmanlike, encouraging
 *   shaky  = deflated but kind (thoughtful) — a beat of worry, then encouragement; never scolding
 * No line mentions percentages, accuracy, scores, or streaks.
 *
 * Voice differentiation lives in the COPY, not in any structural difference between banks.
 *   - Aiyana (Reception): warm, professional, mildly anxious about the auditor. Full sentences.
 *     Calls items by what they are ("the social security one", "the date").
 *   - Marcus (Lab): laid-back, college-aged, slightly punny. Shorter sentences. Calls items by
 *     tone ("the network one", "the sketchy one"). Less formal but never unprofessional.
 *   - Dr. Tovar (Records): authoritative-but-kind, compliance-lead voice. Uses "Safe Harbor" by name
 *     once or twice across their bank.
 *
 * Item IDs MUST correspond to actual items in sorterData.ts — otherwise reactions never fire.
 */

export type ReactionVariant = 'neutral' | 'enthusiastic' | 'thoughtful';
export type AccuracyBand = 'shaky' | 'good' | 'strong';
export type NPCSorterId = 'aiyana' | 'marcus' | 'tovar';

export type NPCReaction = {
  /** Present = fires when player drops this specific item id (correctly or wrong — see `onCorrect`). */
  itemId?: string;
  /** If `itemId` is set: 'correct' fires only on right-bucket drop; 'wrong' on misclassification; 'either' for both. */
  onCorrect?: 'correct' | 'wrong' | 'either';
  /** Present = fires as fallback based on running accuracy. Exactly 3 per bank (one per band). */
  accuracyBand?: AccuracyBand;
  /** Display text — 1-2 sentences in the NPC's voice. */
  text: string;
  /** Visual hint for NPCReactionBubble (Plan 03 may use to vary tint/iconography). */
  variant?: ReactionVariant;
};

export type NPCReactionBank = {
  npcId: NPCSorterId;
  reactions: NPCReaction[];
};

// ── AIYANA (Reception, Set 1) ─────────────────────────────────────────────────
//
// Note: sorterData.ts's Set 1 uses `npcId: 'receptionist_riley'` historically, but the *trigger* NPC
// in roomData is `aiyana_intake`. Plan 04 maps the encounter NPC to the reaction bank via a small
// switch — for Phase 22, treat the Set 1 trigger NPC as Aiyana.

const AIYANA_BANK: NPCReactionBank = {
  npcId: 'aiyana',
  reactions: [
    // ≥4 specific-item reactions using itemIds from sorterData.ts Set 1
    {
      itemId: 's1-patient-name',
      onCorrect: 'correct',
      text: "Yeah — name on an intake form is the easy one. That's the whole point.",
      variant: 'neutral',
    },
    {
      itemId: 's1-ssn',
      onCorrect: 'correct',
      text: "Good. The social security one's always PHI — never need it on anything that leaves the desk.",
      variant: 'enthusiastic',
    },
    {
      itemId: 's1-room-temp',
      onCorrect: 'correct',
      text: "Right? Room temperature isn't health info, it's HVAC info.",
      variant: 'neutral',
    },
    {
      itemId: 's1-hospital-address',
      onCorrect: 'correct',
      text: "Yep — that's the building's address, not a patient's. We can put that on a billboard if we want.",
      variant: 'thoughtful',
    },
    {
      itemId: 's1-home-address',
      onCorrect: 'wrong',
      text: "Hmm — actually that one's PHI. Street address plus the fact that they're here is an identifier.",
      variant: 'thoughtful',
    },
    {
      itemId: 's1-dob',
      onCorrect: 'correct',
      text: "Full date of birth — that's identifier #3. Even the auditor knows this one.",
      variant: 'neutral',
    },
    // 3 accuracy-band fallbacks — Phase 22 (1 per band) + Phase 23 adds 2 more per band = 3 each
    // shaky band (3 lines, variant: 'thoughtful')
    {
      accuracyBand: 'shaky',
      text: "It's okay — take your time. The auditor can wait another minute.",
      variant: 'thoughtful',
    },
    {
      accuracyBand: 'shaky',
      text: "Deep breath. The forms aren't going anywhere — well, they ARE, that's the problem, but slowly.",
      variant: 'thoughtful',
    },
    {
      accuracyBand: 'shaky',
      text: "No rush. Read it again and trust your gut — these trip everyone up at first.",
      variant: 'thoughtful',
    },
    // good band (3 lines, variant: 'neutral')
    {
      accuracyBand: 'good',
      text: "Nice. You're getting the rhythm.",
      variant: 'neutral',
    },
    {
      accuracyBand: 'good',
      text: "Exactly. Keep going — you've got this stack handled.",
      variant: 'neutral',
    },
    {
      accuracyBand: 'good',
      text: "That's it. Steady hands, steady forms.",
      variant: 'neutral',
    },
    // strong band (3 lines, variant: 'enthusiastic')
    {
      accuracyBand: 'strong',
      text: "Honestly? You're faster at this than I am.",
      variant: 'enthusiastic',
    },
    {
      accuracyBand: 'strong',
      text: "Okay, wow. I'm going to stop double-checking your stack.",
      variant: 'enthusiastic',
    },
    {
      accuracyBand: 'strong',
      text: "If the auditor asks who sorted these, I am absolutely giving her your name.",
      variant: 'enthusiastic',
    },
  ],
};

// ── MARCUS (Lab, Set 2) ───────────────────────────────────────────────────────
const MARCUS_BANK: NPCReactionBank = {
  npcId: 'marcus',
  reactions: [
    {
      itemId: 's2-device-serial',
      onCorrect: 'correct',
      text: "Yeah — device serial counts. Even without a name on it.",
      variant: 'neutral',
    },
    {
      itemId: 's2-ip-address',
      onCorrect: 'correct',
      text: "Nice — the network one. Always PHI when it's tied to a portal session.",
      variant: 'enthusiastic',
    },
    {
      itemId: 's2-diagnosis-with-mrn',
      onCorrect: 'correct',
      text: "Yep — F33 plus the patient number. That's the combo that hurts.",
      variant: 'enthusiastic',
    },
    {
      itemId: 's2-diagnosis-only',
      onCorrect: 'correct',
      text: "Code alone is just a code. No identifier, no PHI. You're good.",
      variant: 'neutral',
    },
    {
      itemId: 's2-lab-test-type',
      onCorrect: 'correct',
      text: "CBC by itself? That's just a test name. No person attached — you're solid.",
      variant: 'neutral',
    },
    {
      itemId: 's2-biometric',
      onCorrect: 'correct',
      text: "Oh yeah — the spooky one. Fingerprint in a health record is always PHI, no debate.",
      variant: 'thoughtful',
    },
    // 3 accuracy-band fallbacks per band
    // shaky band (3 lines, variant: 'thoughtful')
    {
      accuracyBand: 'shaky',
      text: "All good — these subtle ones are why I asked.",
      variant: 'thoughtful',
    },
    {
      accuracyBand: 'shaky',
      text: "Hey, no stress. The manifest software gets these wrong too. Constantly.",
      variant: 'thoughtful',
    },
    {
      accuracyBand: 'shaky',
      text: "Tricky batch. Don't overthink it — go with the identifier question.",
      variant: 'thoughtful',
    },
    // good band (3 lines, variant: 'neutral')
    {
      accuracyBand: 'good',
      text: "Solid. Keep going.",
      variant: 'neutral',
    },
    {
      accuracyBand: 'good',
      text: "Yeah, that tracks. Moving on.",
      variant: 'neutral',
    },
    {
      accuracyBand: 'good',
      text: "You're reading these right. Good pace.",
      variant: 'neutral',
    },
    // strong band (3 lines, variant: 'enthusiastic')
    {
      accuracyBand: 'strong',
      text: "Okay — I'm just gonna let you finish. You're better at this than the manifest software.",
      variant: 'enthusiastic',
    },
    {
      accuracyBand: 'strong',
      text: "Dude. You're a sorting machine. A HIPAA-potamus.",
      variant: 'enthusiastic',
    },
    {
      accuracyBand: 'strong',
      text: "Honestly I'm taking notes. Is this what they teach you before day one?",
      variant: 'enthusiastic',
    },
  ],
};

// ── DR. TOVAR (Records, Set 3) ────────────────────────────────────────────────
const TOVAR_BANK: NPCReactionBank = {
  npcId: 'tovar',
  reactions: [
    {
      itemId: 's3-zip5',
      onCorrect: 'correct',
      text: "Correct. Full ZIP is geographic identifier #2 — Safe Harbor won't accept it.",
      variant: 'thoughtful',
    },
    {
      itemId: 's3-zip3',
      onCorrect: 'correct',
      text: "Good call. ZIP3 passes here — but only because the prefix covers more than 20,000 people.",
      variant: 'thoughtful',
    },
    {
      itemId: 's3-year-only',
      onCorrect: 'correct',
      text: "Year alone is fine. Safe Harbor strips elements more specific than year.",
      variant: 'neutral',
    },
    {
      itemId: 's3-age-90-plus',
      onCorrect: 'correct',
      text: "Right — ages 90 and above re-identify. We group them as 90-or-older on any research set.",
      variant: 'thoughtful',
    },
    {
      itemId: 's3-admission-month-year',
      onCorrect: 'correct',
      text: "Month plus year is more specific than year. That's the catch most people miss.",
      variant: 'neutral',
    },
    // 3 accuracy-band fallbacks per band
    // shaky band (3 lines, variant: 'thoughtful')
    {
      accuracyBand: 'shaky',
      text: "These edges are why I still keep the regulation tab open.",
      variant: 'thoughtful',
    },
    {
      accuracyBand: 'shaky',
      text: "Slow down a touch. Read the field, then decide. The regulation rewards patience.",
      variant: 'thoughtful',
    },
    {
      accuracyBand: 'shaky',
      text: "Don't guess. The Safe Harbor list exists precisely so you don't have to guess.",
      variant: 'thoughtful',
    },
    // good band (3 lines, variant: 'neutral')
    {
      accuracyBand: 'good',
      text: "You're reading them carefully. That's the work.",
      variant: 'neutral',
    },
    {
      accuracyBand: 'good',
      text: "Consistent. That's what I look for on a review.",
      variant: 'neutral',
    },
    {
      accuracyBand: 'good',
      text: "Solid instincts. Keep applying them.",
      variant: 'neutral',
    },
    // strong band (3 lines, variant: 'enthusiastic')
    {
      accuracyBand: 'strong',
      text: "Honestly impressive. You can audit me next time.",
      variant: 'enthusiastic',
    },
    {
      accuracyBand: 'strong',
      text: "I mean this professionally: it is a pleasure to watch you work.",
      variant: 'enthusiastic',
    },
    {
      accuracyBand: 'strong',
      text: "At this rate, I'm forwarding your name to the Privacy Board. They could use someone who actually reads the list.",
      variant: 'enthusiastic',
    },
  ],
};

export const NPC_REACTION_BANKS: Record<NPCSorterId, NPCReactionBank> = {
  aiyana: AIYANA_BANK,
  marcus: MARCUS_BANK,
  tovar: TOVAR_BANK,
};

/**
 * Look up a specific-item reaction for an NPC.
 * Returns undefined if no reaction matches — caller should fall back to getNPCFallbackReaction.
 */
export function getNPCReactionForItem(
  npcId: NPCSorterId,
  itemId: string,
  isCorrect: boolean,
): NPCReaction | undefined {
  const bank = NPC_REACTION_BANKS[npcId];
  if (!bank) return undefined;
  const wanted = isCorrect ? 'correct' : 'wrong';
  return bank.reactions.find(
    (r) => r.itemId === itemId && (r.onCorrect === 'either' || r.onCorrect === wanted),
  );
}

/**
 * Look up an accuracy-band fallback line for an NPC.
 * 'shaky' = <50% running accuracy, 'good' = 50-79%, 'strong' = ≥80%.
 *
 * Phase 23: nonce parameter cycles through the 3 lines in the band deterministically
 * (nonce % lineCount). Typically pass the running drop count as nonce so consecutive
 * fallbacks in the same band don't repeat the identical line.
 * Same nonce → same line (deterministic, testable). Backward compatible — existing
 * two-arg call sites still compile and receive the first band line (nonce=0).
 *
 * Always returns a reaction (each bank guarantees 3 per band).
 */
export function getNPCFallbackReaction(
  npcId: NPCSorterId,
  band: AccuracyBand,
  nonce: number = 0,
): NPCReaction {
  const bank = NPC_REACTION_BANKS[npcId];
  const lines = bank?.reactions.filter((r) => r.accuracyBand === band) ?? [];
  if (lines.length === 0) {
    // Should be unreachable — defensive default for runtime safety
    return { text: 'Nice work.', variant: 'neutral', accuracyBand: band };
  }
  return lines[nonce % lines.length];
}

/**
 * F-14 (Run 07): dedicated shift-opener lines. The overlay used to seed the
 * bubble with a good-band fallback line ("Nice. You're getting the rhythm.")
 * before the player had stamped anything — praise for work not yet done.
 * Openers set the scene instead of grading it.
 */
const SORTER_OPENER_LINES: Record<NPCSorterId, NPCReaction> = {
  aiyana: { text: "Okay — charts incoming. REDACT anything that could identify someone. KEEP what's safe.", variant: 'neutral' },
  marcus: { text: "First one's on your desk. If it can point to a patient, it gets the REDACT stamp.", variant: 'neutral' },
  tovar:  { text: "Same standard as always: if it identifies a patient, it does not leave this room.", variant: 'neutral' },
};

export function getNPCOpenerLine(npcId: NPCSorterId): NPCReaction {
  return SORTER_OPENER_LINES[npcId] ?? { text: 'Ready when you are.', variant: 'neutral' };
}

/**
 * Convenience: convert a running correct/total ratio into the accuracy band used by fallback lookup.
 */
export function accuracyToBand(correct: number, total: number): AccuracyBand {
  if (total === 0) return 'good'; // neutral default before any drops
  const ratio = correct / total;
  if (ratio < 0.5) return 'shaky';
  if (ratio < 0.8) return 'good';
  return 'strong';
}
