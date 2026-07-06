/**
 * Whimsy content — moments of pure play (IDENTITY_AUDIT.md §3).
 *
 * Everything in this file deliberately teaches nothing. No HIPAA, no scoring,
 * no completion requirements. Heart and texture only:
 *
 *   - GERALD, the printer fleet — a recurring gag across Reception, Records,
 *     and the IT Office. One shared escalation counter; the bit pays off on
 *     the eighth interaction and settles into a gentle hum forever after.
 *     (IT names every printer Gerald so the tickets sort together.)
 *   - Supply Closet B — a hidden room off the break↔lab hallway. Inside:
 *     Mr. Whiskers (yes, THE Mr. Whiskers, of emergency-contact fame) and
 *     Zz Test, the patient who isn't real.
 *   - Zz Test carries the game's ONE fourth-wall moment (GAME_DESIGN_PRINCIPLES
 *     caps it at one or two — this is it, hidden behind a secret door),
 *     grounded in the real EHR convention of ZZTEST patients.
 *
 * Voice rules (OOP_HUMOR_PLAYBOOK): flat narration, diegetic captions,
 * fragments in character mouths, nobody announces a punchline.
 *
 * Per CLAUDE.md: all game data lives in TypeScript constants files.
 */

// ── Persistence keys (localStorage — whimsy state never touches the save blob) ──

export const PRINTER_COUNT_KEY = 'pq:whimsy:printer';
export const CAT_PETS_KEY = 'pq:whimsy:catpets';
export const ZZ_LINE_KEY = 'pq:whimsy:zz';
export const CLOSET_FOUND_KEY = 'pq:whimsy:closetfound';

export function closetFound(): boolean {
  try { return localStorage.getItem(CLOSET_FOUND_KEY) === '1'; } catch { return false; }
}
export function markClosetFound(): void {
  try { localStorage.setItem(CLOSET_FOUND_KEY, '1'); } catch { /* ignore */ }
}

/** Read/advance a whimsy counter. Returns the value BEFORE the increment. */
export function bumpCounter(key: string): number {
  let n = 0;
  try { n = parseInt(localStorage.getItem(key) ?? '0', 10) || 0; } catch { /* ignore */ }
  try { localStorage.setItem(key, String(n + 1)); } catch { /* ignore */ }
  return n;
}

// ── GERALD — the printer fleet ───────────────────────────────────────────────

export type PrinterFx = 'quiet' | 'paper' | 'grind' | 'payoff';

export type PrinterBeat = {
  line: string;      // flat narration — the artifact indicts itself
  fx: PrinterFx;
};

/** One shared script across all three printers — they are, after all, all Gerald. */
export const PRINTER_BEATS: PrinterBeat[] = [
  { fx: 'quiet',  line: 'The display reads: PC LOAD LETTER. Every tray has letter.' },
  { fx: 'paper',  line: 'It prints three pages. Nobody has sent a job today.' },
  { fx: 'grind',  line: 'Display: OUT OF CYAN. The job was black and white.' },
  { fx: 'paper',  line: 'It prints a test page. For a printer on another floor.' },
  { fx: 'quiet',  line: 'The jam light is on. You check. There is no jam. The light stays on.' },
  { fx: 'quiet',  line: 'A note taped to the tray: "DO NOT UNPLUG. IT REMEMBERS. — Facilities"' },
  { fx: 'grind',  line: 'Display: PLEASE WAIT. It has said this since March.' },
  { fx: 'payoff', line: 'It aligns something deep inside itself — and prints one perfect page: "THANK YOU FOR YOUR PATIENCE."' },
];

/** After the payoff, Gerald is at peace. These cycle forever. */
export const PRINTER_AFTER_LINES: string[] = [
  'The printer hums. At peace.',
  'A page drifts out: a photocopy of a single paw print. You have questions.',
];

export const PRINTER_PROMPT = 'Check on GERALD';

/** Where each Gerald lives: roomId → tile. (IT Office anchors to the existing
 *  printer_station obstacle; the other two get their own small stations.) */
export const PRINTER_SPOTS: Record<string, { x: number; y: number }> = {
  reception: { x: 3, y: 1 },
  records_room: { x: 12, y: 11 },
  it_office: { x: 16, y: 10 }, // center of the 3x2 printer_station — (15,10) tied with the fax zone's approach tile for proximity
};

// ── Supply Closet B ──────────────────────────────────────────────────────────

export const CLOSET_ROOM_ID = 'supply_closet';

/** Hidden-door prompt shown before the closet has been found. */
export const HIDDEN_DOOR_PROMPT = '...purring?';

// Mr. Whiskers — of "emergency contact: Mr. Whiskers (cat), no phone, lives in
// same house" fame. He lives here now. The staff have opinions about whose cat
// he is. He has no opinions about being anyone's cat.

export const CAT_PET_LINES: string[] = [
  '(a low, industrial purr)',
  'He accepts this.',
  'He rolls over. This is a trap. You know it is a trap.',
  '(purring intensifies)',
  'He looks at you like you\'re late.',
];

/** Tenth pet — he renders his verdict. */
export const CAT_MILESTONE_PETS = 10;
export const CAT_MILESTONE_LINE = 'He has decided you may stay.';

export const CAT_AMBIENT_LINE = '(purrs in his sleep)';
export const CAT_PROMPT = 'Pet the cat';

export const BOWL_LINE = 'The bowl says MR. WHISKERS in marker. Underneath, smaller: "yes, THE Mr. Whiskers."';
export const BOWL_PROMPT = 'Look at the bowl';

export const ROTA_LINE = 'FEEDING ROTA — Mon: "someone". Tue: "someone". Wed: Kevin (we all know, Kevin). DO NOT TELL FACILITIES.';
export const ROTA_PROMPT = 'Read the sign-up sheet';

// ── Zz Test — the patient who isn't real ─────────────────────────────────────
// Real hospitals keep test patients in the EHR (ZZTEST, sorts last, DO NOT
// USE). Zz has been here since go-live. Line 5 is the game's one fourth-wall
// moment; it stays quiet and it stays his.

export const ZZ_NAME = 'Zz Test';

export const ZZ_LINES: string[] = [
  'Oh — a visitor. I\'m Zz. Zz Test. Two z\'s, so I sort last and don\'t bother anyone.',
  'Admitted eleven thousand times. Discharged eleven thousand times. Never once billed. It\'s a quiet life.',
  'Every hospital keeps someone who isn\'t real, to make sure things are safe for the ones who are. That\'s me. I don\'t mind.',
  'The cat can see me. That\'s not nothing.',
  'Between us — some days I think this whole hospital is somebody\'s practice run. You\'d know better than I would.',
  'You can pet the cat again. He counts.',
];

/** After the script runs out, he settles into these (indexes into ZZ_LINES). */
export const ZZ_LOOP_INDEXES = [3, 4, 5];

export const ZZ_PROMPT = 'Talk to Zz';
