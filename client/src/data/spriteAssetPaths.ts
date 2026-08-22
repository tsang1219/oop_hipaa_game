/**
 * spriteAssetPaths.ts — React-side mirror of BootScene NPC spritesheet preload paths.
 *
 * Phase 21 (Sponsor Demo capstone): the CertificateOverlay renders the configured
 * end-NPC sprite as a plain <img>/CSS-background element — no Phaser canvas. Phaser
 * texture keys (e.g., 'npc_staff_sheet') don't carry their source paths into React,
 * so this small map mirrors BootScene.preload() to resolve them.
 *
 * Phase 25 (Dialogue Portraits): getNPCPortraitPath() uses this map as the backing
 * store for the data-driven npcId → sheet path resolver. Both Phase 21 sponsor
 * capstone and Phase 25 dialogue portraits resolve through SPONSOR_SPRITE_PATHS.
 *
 * Sheet geometry (all 9 NPC sheets share this layout):
 *   96×128 PNG · 3 columns × 4 rows · 32×32 px per frame
 *   Frame 0 (top-left, row 0 col 0) = idle-down — the canonical portrait frame.
 *   CSS crop: background-position: 0px 0px; background-size: 96px 128px; width: 32px; height: 32px
 *   (scale ×3 or ×4 for the overlay; image-rendering: pixelated)
 *
 * Keys here match the sprite keys BootScene registers (and the values
 * SPONSOR_CONFIG.character_sprite is allowed to take). Keep in sync with
 * BootScene if NPC sheets are added or renamed.
 */

import roomData from './roomData.json';

const base = import.meta.env.BASE_URL;

export const SPONSOR_SPRITE_PATHS: Record<string, string> = {
  npc_receptionist_sheet: `${base}attached_assets/generated_images/privacyquest/characters/npc_receptionist.png`,
  npc_nurse_sheet:        `${base}attached_assets/generated_images/privacyquest/characters/npc_nurse.png`,
  npc_doctor_sheet:       `${base}attached_assets/generated_images/privacyquest/characters/npc_doctor.png`,
  npc_it_tech_sheet:      `${base}attached_assets/generated_images/privacyquest/characters/npc_it_tech.png`,
  npc_officer_sheet:      `${base}attached_assets/generated_images/privacyquest/characters/npc_officer.png`,
  npc_boss_sheet:         `${base}attached_assets/generated_images/privacyquest/characters/npc_boss.png`,
  npc_staff_sheet:        `${base}attached_assets/generated_images/privacyquest/characters/npc_staff.png`,
  npc_patient_sheet:      `${base}attached_assets/generated_images/privacyquest/characters/npc_patient.png`,
  npc_visitor_sheet:      `${base}attached_assets/generated_images/privacyquest/characters/npc_visitor.png`,
  npc_lawyer_sheet:       `${base}attached_assets/generated_images/privacyquest/characters/npc_lawyer.png`,
};

/**
 * Module-level index: npcId → sprite type string, built from roomData.json at
 * module load time. After Phase 25 Task 2, every named NPC carries a sprite field,
 * so this map is complete. Entries without a sprite field are skipped defensively.
 */
const NPC_SPRITE_TYPE_BY_ID: Record<string, string> = (() => {
  const index: Record<string, string> = {};
  const rooms = (roomData as { rooms: Array<{ npcs?: Array<{ id: string; sprite?: string }> }> }).rooms;
  for (const room of rooms) {
    for (const npc of room.npcs ?? []) {
      if (npc.id && npc.sprite) {
        index[npc.id] = npc.sprite;
      }
    }
  }
  return index;
})();

/**
 * Index: normalized NPC display-name → npcId, built from roomData.json.
 * Lets us resolve a gameData scene's `character` string ("Nina", "Dr. Tovar")
 * back to the roomData NPC whose sprite/color/portrait we should show.
 */
const NPC_ID_BY_NAME: Record<string, string> = (() => {
  const index: Record<string, string> = {};
  const rooms = (roomData as { rooms: Array<{ npcs?: Array<{ id: string; name?: string }> }> }).rooms;
  for (const room of rooms) {
    for (const npc of room.npcs ?? []) {
      if (npc.id && npc.name) index[npc.name.trim().toLowerCase()] = npc.id;
    }
  }
  return index;
})();

const slugifyName = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

/**
 * Resolve a dialogue scene's `character` string to the npcId whose portrait,
 * name colour, and sprite it should drive. Fixes the bug where a multi-speaker
 * dialogue chain kept showing the first (interacted) NPC's portrait.
 *
 * Returns null for narration/internal-monologue speakers ("Observation",
 * "You …") and any string that doesn't map to a real character — callers should
 * then fall back to the interacted NPC.
 */
export function resolveSpeakerNpcId(character: string | undefined | null): string | null {
  if (!character) return null;
  const raw = character.trim();
  if (/^(observation|narrat|you\b|you\s*\()/i.test(raw)) return null;
  const byName = NPC_ID_BY_NAME[raw.toLowerCase()];
  if (byName) return byName;
  const slug = slugifyName(raw);
  if (NPC_SPRITE_TYPE_BY_ID[slug]) return slug;
  return null;
}

/**
 * Resolve a dialogue speaker's npcId to the PNG sheet path BootScene preloads.
 *
 * Resolution chain:
 *   1. Look up npcId in NPC_SPRITE_TYPE_BY_ID (built from roomData.json sprite fields)
 *   2. Build sheet key: `npc_${type}_sheet`
 *   3. Return SPONSOR_SPRITE_PATHS[sheetKey] when present
 *   4. Fallback: emit console.warn in dev mode, return npc_staff_sheet path
 *
 * The fallback is intentionally loud — named characters should always resolve.
 * If you see the warning, add a sprite field to the NPC in roomData.json.
 */
/** F-13 (Run 07): true when the id resolves to a real character sheet.
 *  Zone/item dialogues (sign-in sheet, shredder, …) have no mapping — they are
 *  THINGS, and should not borrow a random staff face. */
export function hasNPCPortrait(npcId: string): boolean {
  const spriteType = NPC_SPRITE_TYPE_BY_ID[npcId];
  return !!(spriteType && SPONSOR_SPRITE_PATHS[`npc_${spriteType}_sheet`]);
}

// F-13 (Run 07): warn once per unmapped id — the old unconditional warn fired
// dozens of times per playthrough for every zone dialogue.
const warnedPortraitIds = new Set<string>();

export function getNPCPortraitPath(npcId: string): string {
  const spriteType = NPC_SPRITE_TYPE_BY_ID[npcId];
  if (spriteType) {
    const sheetKey = `npc_${spriteType}_sheet`;
    const path = SPONSOR_SPRITE_PATHS[sheetKey];
    if (path) {
      return path;
    }
  }

  if (import.meta.env.DEV && !warnedPortraitIds.has(npcId)) {
    warnedPortraitIds.add(npcId);
    console.warn(
      `[DialoguePortrait] No sprite mapping for NPC id "${npcId}" — falling back to staff sheet. ` +
      `Add a sprite field in roomData.json.`
    );
  }
  return SPONSOR_SPRITE_PATHS.npc_staff_sheet;
}

/**
 * Resolve a sponsor character_sprite key to its source path. Falls back to the
 * generic staff sheet if the key is not in the map — guards against config typos
 * without breaking the capstone.
 */
export function getSponsorSpritePath(spriteKey: string): string {
  return SPONSOR_SPRITE_PATHS[spriteKey] ?? SPONSOR_SPRITE_PATHS.npc_staff_sheet;
}

// ── Dedicated dialogue portraits (drop-in) ───────────────────────────────────
//
// A character's dialogue portrait defaults to a crop of their tiny walk sheet
// (frame 0) — small and generic. To give a character a proper generated 8-bit
// BUST portrait, drop a PNG here (no code change needed):
//
//   client/public/attached_assets/generated_images/privacyquest/portraits/<npcId>.png
//
// getNPCPortraitImage() returns that URL by convention; the portrait components
// try it first and fall back to the sheet crop if the file 404s. Bulk-generate
// all of them with scripts/generate-portraits.mjs. See .planning/PORTRAIT_GENERATION.md.
const PORTRAIT_DIR = `${base}attached_assets/generated_images/privacyquest/portraits/`;

/** Full generated-portrait URL (by convention) + the sheet-crop fallback URL. */
export function getNPCPortraitImage(npcId: string): { fullUrl: string; sheetUrl: string } {
  return { fullUrl: `${PORTRAIT_DIR}${npcId}.png`, sheetUrl: getNPCPortraitPath(npcId) };
}

// ── Cast identity colors (Run 08 initial pass) ──────────────────────────────
//
// Every named NPC gets a signature color used wherever they speak: dialogue
// portrait frame + name plate, dialogue panel top stripe, sorter reaction
// bubble, encounter request modal. System chrome stays UI pink (#FF6B9D) —
// speaker color means "a person is talking," pink means "the game is talking."
//
// Two layers:
//   1. NPC_TYPE_COLORS — one hue per spritesheet type (the 9-hue wheel).
//      Fallback for any future NPC that ships without an explicit color.
//   2. NPC_COLOR_BY_ID — persona-matched per-npcId assignment for the named
//      cast, hand-spread so no two NPCs in the same room share a hue and the
//      major cast (Riley/Aiyana/Marcus/Tovar/Priya) never collide anywhere.
//
// All values chosen for contrast on the dark dialogue navy (#1a1a2e/#16213e).

export const NPC_TYPE_COLORS: Record<string, string> = {
  receptionist: '#FF7A6B', // front-desk coral — the warm first hello
  nurse:        '#FF9EC4', // scrub pink
  doctor:       '#45D483', // scrub green
  it_tech:      '#38E5FF', // terminal cyan
  officer:      '#FFC94D', // badge gold
  boss:         '#C77DFF', // executive orchid
  staff:        '#FFA94D', // hi-vis apricot
  patient:      '#9FB4FF', // gown periwinkle
  visitor:      '#B4E33D', // visitor-badge lime
  lawyer:       '#E8C33A', // the gold tie, worn as a signature
};

const NPC_COLOR_BY_ID: Record<string, string> = {
  // ── Major cast — maximally separated on the wheel ──
  riley_entrance:        '#FF7A6B', // Riley — coral; greets you twice, same warmth both times
  riley:                 '#FF7A6B',
  aiyana_intake:         '#4FB3D9', // Aiyana — sky teal; calm sorter precision (matches her context card)
  marcus_lab_aide:       '#FFAA33', // Marcus — amber; deadpan warmth, nickname energy
  dr_tovar:              '#2DD4BF', // Dr. Tovar — mint; Safe-Harbor scholar, cool and exact
  priya_privacy_officer: '#FB6489', // Priya — triage rose; urgency worn calmly
  dr_martinez:           '#45D483', // rushed ER doctor — scrub green at a jog

  // ── Reception ──
  nervous_patient:       '#9FB4FF', // gown periwinkle, fidgeting
  chatty_visitor:        '#B4E33D', // visitor lime, will not stop talking

  // ── ER ──
  officer:               '#FFC94D', // police officer — literal badge gold
  frantic_family:        '#FFB59E', // anxious peach

  // ── Lab ──
  lab_tech:              '#38E5FF', // terminal cyan
  researcher:            '#7FE3A8', // curious spearmint (reads apart from Martinez's green)
  courier:               '#B4E33D', // visitor lime, in and out

  // ── Records ──
  records_clerk:         '#F4978E', // dusty salmon — reception family, not Riley's coral
  patient_request:       '#9FB4FF', // gown periwinkle
  attorney:              '#E8C33A', // the gold tie — matches his sprite, reads apart from the room's blues
  compliance_officer:    '#5B8DEF', // by-the-book azure

  // ── IT Office ──
  security_analyst:      '#38E5FF', // terminal cyan
  vendor:                '#B4E33D', // visitor lime with a contract
  workaround_employee:   '#FFA94D', // hi-vis apricot, in a hurry

  // ── Break Room ──
  gossiping_coworker:    '#FF9EC4', // gossip pink
  friend_fishing:        '#F59E6C', // warm apricot-deep, overly friendly
  tired_employee:        '#9FB4FF', // running on periwinkle fumes
  hr_director:           '#C77DFF', // executive orchid, holding coffee
  selfie_coworker:       '#B4E33D', // visitor-energy lime, phone out
};

/** UI pink — what the game itself speaks in. Fallback when no NPC color resolves. */
export const DEFAULT_SPEAKER_COLOR = '#FF6B9D';

/**
 * Resolve an npcId to its signature color.
 * Chain: per-NPC assignment → sprite-type wheel → UI pink.
 * Never warns — unlike portraits, a fallback color is not a content bug.
 */
export function getNPCColor(npcId: string): string {
  const assigned = NPC_COLOR_BY_ID[npcId];
  if (assigned) return assigned;
  const spriteType = NPC_SPRITE_TYPE_BY_ID[npcId];
  if (spriteType && NPC_TYPE_COLORS[spriteType]) return NPC_TYPE_COLORS[spriteType];
  return DEFAULT_SPEAKER_COLOR;
}
