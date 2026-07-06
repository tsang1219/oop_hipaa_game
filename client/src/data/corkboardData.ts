/**
 * Staff Corkboard — break-room "take down the PHI" beat (HIPAA-is-the-game pass).
 *
 * Six pinned notes; three violate HIPAA and must come down, three are fine and
 * must stay. The classic real-world lesson: PHI leaks into staff spaces on
 * paper — baby-photo walls, parked discharge summaries, "whose labs are
 * these?" postings. Reasonable safeguards (§164.530(c)) apply everywhere,
 * including next to the microwave.
 *
 * The NICU baby wall grants identifier #17 (full-face photos) to The Eighteen
 * codex — the one identifier the PHI Sorter never hands out.
 *
 * Per CLAUDE.md: all game data lives in TypeScript constants files.
 */

export type CorkboardNote = {
  id: string;
  title: string;             // pinned header — Press Start 2P, ALL CAPS
  body: string;              // 1-2 short lines, body font
  kind: 'violation' | 'fine';
  emoji?: string;            // large decoration row (👶👶👶 for the baby wall)
  teach: string;             // shown after the player acts on this note
  identifierKey?: string;    // The Eighteen grant on correct pull (phi18.ts key)
  tilt: number;              // resting rotation in degrees
};

export const CORKBOARD_NOTES: CorkboardNote[] = [
  {
    id: 'baby-wall',
    title: 'OUR NICU GRADS!',
    body: 'Little Ava H., Marcus T., and Diya P. — look how big they got!',
    kind: 'violation',
    emoji: '👶👶👶',
    teach: 'Full-face photos are identifier #17 — and the names make it worse. ' +
      'Baby walls need signed authorization from the parents. Down it comes.',
    identifierKey: 'photo',
    tilt: -3,
  },
  {
    id: 'potluck',
    title: 'POTLUCK FRIDAY',
    body: 'Sign-up sheet below. Roberto is bringing "the beans" again. Brace accordingly.',
    kind: 'fine',
    emoji: '🥘',
    teach: 'HIPAA has no opinion on Roberto\'s beans. The potluck stays.',
    tilt: 2,
  },
  {
    id: 'shredder-parking',
    title: 'FOR THE SHREDDER RUN',
    body: 'Complete discharge summary, one (1) patient. Parked here since Tuesday. — Kevin',
    kind: 'violation',
    emoji: '📄',
    teach: 'PHI doesn\'t get a layover on the snack wall. Secure disposal means the locked ' +
      'shred bin — not "wherever Kevin was standing."',
    tilt: 4,
  },
  {
    id: 'plant-roster',
    title: 'PLANT ROSTER',
    body: 'This week: Marcus. The ficus remembers who forgot last time.',
    kind: 'fine',
    emoji: '🪴',
    teach: 'Watering schedules identify no patients. The ficus\'s grudge is not PHI.',
    tilt: -2,
  },
  {
    id: 'mystery-labs',
    title: 'WHOSE LABS ARE THESE??',
    body: 'Found by the microwave. MRN #88231. Claim within 3 days.',
    kind: 'violation',
    emoji: '🧪',
    teach: 'An MRN is identifier #8 — posting it to find the owner broadcasts exactly what ' +
      'you\'re trying to protect. Route it to Records. Quietly.',
    tilt: 3,
  },
  {
    id: 'cpr-class',
    title: 'CPR RECERT — THURS 3PM',
    body: 'Conference B. Dummies provided. Please stop naming the dummies.',
    kind: 'fine',
    emoji: '🫀',
    teach: 'Training announcements are safe to post. The dummies\' names are between you and the dummies.',
    tilt: -4,
  },
];

export const CORKBOARD_VIOLATION_COUNT = CORKBOARD_NOTES.filter((n) => n.kind === 'violation').length;

/** Compliance score awarded on first completion of the corkboard cleanup. */
export const CORKBOARD_SCORE = 6;
