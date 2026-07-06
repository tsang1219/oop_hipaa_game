#!/usr/bin/env node
/**
 * Bulk-generate 8-bit dialogue portraits for every PrivacyQuest character via
 * the Gemini image API ("nano banana"). Zero dependencies — raw fetch on Node 18+.
 *
 * USAGE
 *   export GEMINI_API_KEY=your_key_here          # aistudio.google.com/apikey
 *   node scripts/generate-portraits.mjs          # generates all missing portraits
 *   node scripts/generate-portraits.mjs --force  # regenerate even if the PNG exists
 *   node scripts/generate-portraits.mjs aiyana_intake marcus_lab_aide   # just these
 *
 * Options via env:
 *   MODEL=gemini-2.5-flash-image   (default; try gemini-2.5-flash-image-preview if 404)
 *   USE_REFERENCE=1                pass each character's walk sprite as an image
 *                                  reference (keeps hair/skin/clothing on-model)
 *
 * Output → client/public/attached_assets/generated_images/privacyquest/portraits/<id>.png
 * The game picks them up automatically (getNPCPortraitImage + onError fallback).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'client/public/attached_assets/generated_images/privacyquest/portraits');
const CHAR_DIR = join(ROOT, 'client/public/attached_assets/generated_images/privacyquest/characters');

// Auto-load a repo-root .env (zero-dep) so the key in .env "just works" without
// having to `export` it first. Real env vars still win over the file.
if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY && existsSync(join(ROOT, '.env'))) {
  for (const line of readFileSync(join(ROOT, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const MODEL = process.env.MODEL || 'gemini-2.5-flash-image';
const USE_REFERENCE = process.env.USE_REFERENCE === '1';
// STYLE_ANCHOR=<npcId> — the single most important knob for a consistent set.
// Point it at ONE approved portrait; every other generation is told to match its
// exact style/palette/framing. Workflow: make + approve the anchor first, then
// run again with STYLE_ANCHOR set (the anchor file is skipped as "already done").
const STYLE_ANCHOR = process.env.STYLE_ANCHOR;

if (!KEY) {
  console.error('✗ Set GEMINI_API_KEY (get one free at https://aistudio.google.com/apikey), then re-run.');
  process.exit(1);
}

// Shared style — prepended to every character. Written to be as DETERMINISTIC
// as possible (locked palette/framing/lighting/outline) so independent
// generations drift as little as possible even before the STYLE_ANCHOR pass.
const SHARED_STYLE =
  '16-bit SNES-era pixel-art character portrait in a consistent house style. ' +
  'STYLE (identical every time): chunky visible pixels as if drawn on a ~64x64 grid, ' +
  'flat cel-shading, a limited ~24-color palette, 1px near-black outline, NO anti-aliasing, ' +
  'NO smooth gradients. LIGHTING (identical): one soft key light from the top-left. ' +
  'FRAMING (identical): head-and-shoulders bust, subject fills ~70% of the frame, centered, ' +
  'facing forward with a slight 3/4 turn, eyes at ~40% from the top. ' +
  'BACKGROUND (identical): solid dark navy #1a1a2e, nothing else in frame. ' +
  'Square 1:1. Friendly, readable, Chrono Trigger / EarthBound / Stardew Valley energy. ' +
  'No text, no logo, no border, no watermark. Subject: ';

// id = output filename (matches roomData npcId). type = walk-sheet ref (npc_<type>.png).
const CHARACTERS = [
  ['riley_entrance',        'receptionist', 'warm, upbeat hospital front-desk receptionist on their first day, bright welcoming smile, coral-red scrub top, tidy hair'],
  ['riley',                 'receptionist', 'friendly composed front-desk coordinator, helpful expression, coral-red top'],
  ['aiyana_intake',         'officer',      'calm precise young intake volunteer, steady focused eyes, sky-teal volunteer vest, lanyard badge'],
  ['marcus_lab_aide',       'staff',        'deadpan-warm lab aide with a faint smirk, amber-orange tee under a white lab coat, safety goggles pushed up on forehead'],
  ['dr_tovar',              'officer',      'cool exact compliance scholar, calm confident expression, mint-teal collared shirt, thin glasses'],
  ['priya_privacy_officer', 'officer',      'privacy officer with urgency worn calmly, alert but composed, rose-pink blazer, ID badge'],
  ['dr_martinez',           'doctor',       'harried ER physician mid-rush, slightly sweaty and focused, green scrubs, stethoscope, white coat'],
  ['nervous_patient',       'patient',      'anxious middle-aged man in a hospital waiting room, worried furrowed brow, periwinkle-blue shirt'],
  ['chatty_visitor',        'visitor',      'chatty hospital administrator caught mid-sentence, over-friendly grin, lime-green polo, visitor badge'],
  ['officer',               'officer',      'by-the-book city police officer, neutral firm expression, navy uniform, gold badge'],
  ['frantic_family',        'visitor',      'frantic worried family member, wide anxious eyes, peach sweater'],
  ['nurse_nina',            'nurse',        'caring night-shift ICU nurse with tired-kind eyes, teal scrubs, hair tied back'],
  ['lab_tech',              'it_tech',      'focused lab technician, cyan-accented lab coat, nitrile gloves, safety glasses'],
  ['researcher',            'doctor',       'inquisitive faculty researcher with bright curious eyes, spearmint cardigan under a lab coat'],
  ['courier',               'visitor',      'cheerful reference-lab courier in motion, lime delivery polo, cap, cooler-bag strap'],
  ['records_clerk',         'receptionist', 'helpful medical-records clerk with a kind patient smile, salmon blouse, reading glasses on a chain'],
  ['patient_request',       'patient',      'ordinary patient politely requesting their records, periwinkle gown-shirt'],
  ['attorney',              'boss',         'sharp cool-confident attorney, slate-gray suit and tie, holding a folded document'],
  ['compliance_officer',    'officer',      'stern authoritative chief compliance officer, azure-blue suit, badge'],
  ['security_analyst',      'it_tech',      'sharp IT security analyst, hoodie over a collared shirt, cyan screen-glow on the face'],
  ['vendor',                'visitor',      'smooth persuasive sales vendor with a grin, lime polo and company lanyard, holding a tablet'],
  ['workaround_employee',   'staff',        'harried employee in a hurry with a pleading look, apricot scrub top'],
  ['gossiping_coworker',    'nurse',        'gossipy coworker leaning in conspiratorially, raised eyebrow, pink scrubs'],
  ['friend_fishing',        'staff',        'overly-friendly coworker fishing for information, too-wide smile, deep-apricot cardigan'],
  ['tired_employee',        'patient',      'utterly exhausted employee with heavy eye-bags and half-lidded eyes, wrinkled periwinkle scrubs, holding a coffee cup'],
  ['hr_director',           'boss',         'polished HR director holding a coffee, orchid-purple dress shirt, corporate smile'],
  ['selfie_coworker',       'visitor',      'coworker holding a phone up for a selfie, cheesy grin, lime tee'],
];

const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function generateOne(id, type, subject) {
  const parts = [];
  // Style anchor first (strongest influence): match an approved portrait exactly.
  if (STYLE_ANCHOR && id !== STYLE_ANCHOR) {
    const anchor = join(OUT_DIR, `${STYLE_ANCHOR}.png`);
    if (existsSync(anchor)) {
      parts.push({ text: 'CRITICAL — match the attached reference image EXACTLY: same art style, ' +
        'color palette, pixel size, outline weight, cel-shading, framing, lighting, and #1a1a2e ' +
        'background. Reproduce that identical house style. Change ONLY the person, to the subject below.' });
      parts.push({ inlineData: { mimeType: 'image/png', data: readFileSync(anchor).toString('base64') } });
    }
  }
  parts.push({ text: SHARED_STYLE + subject });
  if (USE_REFERENCE) {
    const ref = join(CHAR_DIR, `npc_${type}.png`);
    if (existsSync(ref)) {
      parts.push({ text: 'Use this reference only for hair color, skin tone, and clothing colors; redraw as a proper bust portrait.' });
      parts.push({ inlineData: { mimeType: 'image/png', data: readFileSync(ref).toString('base64') } });
    }
  }
  const body = { contents: [{ parts }], generationConfig: { responseModalities: ['IMAGE'] } };

  for (let attempt = 1; attempt <= 4; attempt++) {
    let res;
    try {
      res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
        body: JSON.stringify(body),
      });
    } catch (e) {
      if (attempt === 4) throw e;
      await sleep(1500 * attempt); continue;
    }
    if (res.status === 429 || res.status >= 500) {           // throttled / transient
      if (attempt === 4) throw new Error(`HTTP ${res.status} after retries`);
      await sleep(2500 * attempt); continue;
    }
    const json = await res.json();
    if (json.error) throw new Error(json.error.message || JSON.stringify(json.error));
    const imgPart = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
    if (!imgPart) {
      const txt = json.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join(' ');
      throw new Error(`no image returned${txt ? ` — model said: ${txt.slice(0, 160)}` : ''}`);
    }
    writeFileSync(join(OUT_DIR, `${id}.png`), Buffer.from(imgPart.inlineData.data, 'base64'));
    return;
  }
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const only = args.filter((a) => !a.startsWith('--'));
  const todo = CHARACTERS.filter(([id]) => (only.length ? only.includes(id) : true))
                         .filter(([id]) => force || !existsSync(join(OUT_DIR, `${id}.png`)));

  console.log(`Model: ${MODEL}  ·  style-anchor: ${STYLE_ANCHOR || 'none'}  ·  ref: ${USE_REFERENCE ? 'on' : 'off'}  ·  ${todo.length} to generate\n`);
  if (!STYLE_ANCHOR && todo.length > 1) {
    console.log('TIP: for a consistent set, generate + approve ONE portrait first, then re-run with\n     STYLE_ANCHOR=<that_npcId> so the rest match its style.\n');
  }
  let ok = 0, fail = 0;
  for (const [id, type, subject] of todo) {
    process.stdout.write(`  ${id.padEnd(24)} … `);
    try { await generateOne(id, type, subject); console.log('✓'); ok++; }
    catch (e) { console.log(`✗ ${e.message}`); fail++; }
    await sleep(1200); // gentle pacing
  }
  console.log(`\nDone. ${ok} generated, ${fail} failed. → ${OUT_DIR.replace(ROOT + '/', '')}`);
  if (fail) console.log('Re-run to retry the failures (existing files are skipped unless --force).');
}

main().catch((e) => { console.error(e); process.exit(1); });
