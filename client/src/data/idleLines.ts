/**
 * Idle eavesdrop lines — ambient NPC muttering (IDENTITY_AUDIT.md §3,
 * "Idle NPCs you can eavesdrop on").
 *
 * Every ~12-20s of exploration, one on-screen NPC shows a small bubble for a
 * few seconds. Nothing here teaches HIPAA. These are people having a day:
 * Riley's vending-machine feud, the lab tech's pour-over doctrine, the
 * printer-fleet thread (GERALD, see whimsyData.ts), and two soft breadcrumbs
 * toward Supply Closet B.
 *
 * Voice rules (OOP_HUMOR_PLAYBOOK + VOICE doc): fragments, mundane-human,
 * at most one wry line per NPC, nobody performs. Targets are never patients.
 *
 * Per CLAUDE.md: all game data lives in TypeScript constants files.
 */

export const IDLE_LINES: Record<string, string[]> = {
  // ── Hospital Entrance ──────────────────────────────────────────
  riley_entrance: [
    'Deep breath. Front-desk face.',
    'The lobby plant is fake. The dust on it is real. How.',
  ],
  aiyana_intake: [
    'Twenty minutes. I can sort a stack in twenty minutes.',
    'The auditor "says hi." To the forms.',
  ],

  // ── Reception ──────────────────────────────────────────────────
  riley: [
    'Machine took my dollar again. Fourth this month. I keep a ledger now.',
    'It stocks grape soda. Nobody here drinks grape. It restocks itself.',
    'Breathe in. Smile. Next patient.',
  ],
  nervous_patient: [
    'Okay. When they call my name, stand up normal.',
    'Everyone walking past looks so calm. Suspiciously calm.',
  ],
  chatty_visitor: [
    '...and THAT is why her sister is not invited. Anyway.',
    'Gift shop\'s down to one card. It says "Get Well Eventually."',
  ],

  // ── Break Room ─────────────────────────────────────────────────
  gossiping_coworker: [
    'I\'m not saying anything. I\'m just saying.',
    'Third floor swears there\'s a cat. Facilities swears there isn\'t.',
  ],
  friend_fishing: [
    'So how\'s YOUR floor. Anything... interesting.',
    'I\'m only here for the coffee. The good coffee. Yours.',
  ],
  tired_employee: [
    'Break ends in four minutes. I can feel it.',
    'I heard purring near the lab hallway. I chose to keep walking.',
  ],
  hr_director: [
    'Coffee first. Then I\'ll care about onboarding.',
    'The mug says WORLD\'S OKAYEST. It came with the office.',
  ],
  selfie_coworker: [
    'No faces, no badges, just the latte art. I\'ve learned.',
    'Last post got two likes. One was my mom. Both were my mom.',
  ],

  // ── Lab ────────────────────────────────────────────────────────
  lab_tech: [
    'Pour-over isn\'t slow. It\'s deliberate.',
    'Centrifuge three is making the noise again. The fine noise. It\'s fine.',
  ],
  marcus_lab_aide: [
    'Label, log, tray. Label, log, tray.',
    'The manifest printer printed something. None of us sent it.',
  ],
  researcher: [
    'Grant renews in June. Everything is fine.',
    'An n of one is an anecdote. An n of two is a trend, if you\'re brave.',
  ],
  courier: [
    'Fourteen stops. This is nine. Or ten.',
    'The van smells like ice packs. Home smells like ice packs now.',
  ],

  // ── Records Room ───────────────────────────────────────────────
  records_clerk: [
    'In by two, filed by four. That\'s the covenant.',
    'If GERALD asks, I\'m not here.',
  ],
  patient_request: [
    'I just want my own file. It\'s my knee in there.',
  ],
  attorney: [
    'The meter\'s running. It\'s always running. Even now.',
  ],
  compliance_officer: [
    'The week\'s not over. The week is never over.',
  ],
  dr_tovar: [
    'One clean data set. That\'s all I ask. Annually.',
  ],

  // ── IT Office ──────────────────────────────────────────────────
  security_analyst: [
    'Ticket 4401: "printer haunted." Assigned: me. Category: hardware, I guess.',
    'A password. On a sticky note. In THIS office. We have posters.',
  ],
  vendor: [
    'One signature. One. I\'ve been here since Tuesday.',
  ],
  workaround_employee: [
    'It\'s not a workaround. It\'s a shortcut with steps.',
  ],

  // ── ER ─────────────────────────────────────────────────────────
  dr_martinez: [
    'Bay two, then three, then charts. Then food? Then charts.',
    'My kid drew our fridge. On paper. We taped it to the fridge.',
  ],
  officer: [
    'Just waiting on paperwork. Protect and serve. Mostly waiting.',
  ],
  frantic_family: [
    'She said "stable." Stable-good, or stable-just-not-worse?',
  ],
  priya_privacy_officer: [
    'Inbox zero. For nine minutes. Once. In March.',
    'The fax machine and I have an understanding. Neither of us is happy about it.',
  ],
};

// ── Ambient cadence ──────────────────────────────────────────────
export const AMBIENT_MIN_MS = 12_000;   // earliest gap between eavesdrop bubbles
export const AMBIENT_JITTER_MS = 8_000; // + up to this much randomness
export const AMBIENT_DWELL_MS = 3_400;  // bubble hold time
export const AMBIENT_VOLUME = 0.08;     // barely-there blip — it's a mutter, not a beat
