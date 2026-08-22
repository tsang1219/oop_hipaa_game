#!/usr/bin/env node
/**
 * Run 12 — the audio map. Scans the client for every sound key that is
 * LOADED (BootScene / DeferredAudioScene) and every place a key is PLAYED
 * (playSfx / playRoundRobin / playStinger / uiSfx / REACT_PLAY_SFX), and
 * prints a markdown table: key → file → call sites. A loaded key with no
 * call site, or a played key that is never loaded, is flagged.
 *
 *   node scripts/audio-map.mjs            # markdown to stdout
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..');
const SRC = path.join(ROOT, 'client/src');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}
const files = walk(SRC);
const rel = (p) => path.relative(ROOT, p);

// 1. loaded keys
const loaded = new Map(); // key -> file
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  // direct
  for (const m of s.matchAll(/this\.load\.audio\('([^']+)',\s*`([^`]+)`\)/g)) loaded.set(m[1], m[2].replace(/\$\{[A-Z]+\}\//, '').replace(/\$\{base\}/, ''));
  // loops: for (let i = 0; i < N; i++) this.load.audio(`prefix_${i}`, `${DIR}/name_00${i + 1}.ogg`)
  for (const m of s.matchAll(/for \(let i = 0; i < (\d+); i\+\+\) this\.load\.audio\(`([^`]+)`,\s*`([^`]+)`\)/g)) {
    const n = +m[1];
    for (let i = 0; i < n; i++) {
      const key = m[2].replace('${i}', String(i));
      const file = m[3].replace(/\$\{[A-Z]+\}\//, '').replace('${i + 1}', String(i + 1)).replace('${i}', String(i));
      loaded.set(key, file);
    }
  }
  // footstep loop in BootScene
  if (/FOOTSTEP_MATERIALS/.test(s)) {
    for (const mat of ['wood', 'concrete', 'carpet']) for (let i = 0; i < 5; i++) loaded.set(`sfx_step_${mat}_${i}`, `footstep_${mat}_00${i}.ogg`);
  }
}

// 2. played keys → call sites
const played = new Map(); // key -> Set(site)
const add = (key, site) => { if (!played.has(key)) played.set(key, new Set()); played.get(key).add(site); };
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  const lines = s.split('\n');
  lines.forEach((line, i) => {
    const site = `${rel(f)}:${i + 1}`;
    for (const m of line.matchAll(/(?:playSfx|playBusSfx)\([^,]+,\s*'([^']+)'/g)) add(m[1], site);
    for (const m of line.matchAll(/key:\s*'([^']+)'/g)) add(m[1], site);
    for (const m of line.matchAll(/\['(sfx_[^\]]+)'\]/g)) for (const k of m[1].split(/',\s*'/)) add(k, site);
    for (const m of line.matchAll(/'(sfx_[a-z0-9_]+)'/g)) if (/playRoundRobin|roundRobinPlay|keys:|STINGERS|\bkeys\b/.test(line)) add(m[1], site);
  });
}
// families expressed via range('sfx_step_…', 5)
for (const mat of ['wood', 'concrete', 'carpet']) for (let i = 0; i < 5; i++) add(`sfx_step_${mat}_${i}`, 'client/src/phaser/systems/exploration/footsteps.ts (round-robin family)');
// uiSfx names → keys (UI_KEYS table)
const ui = fs.readFileSync(path.join(SRC, 'lib/uiSfx.ts'), 'utf8');
for (const m of ui.matchAll(/^\s*(\w+):\s*\{ keys: \[([^\]]+)\]/gm)) {
  for (const k of m[2].split(',').map(x => x.trim().replace(/'/g, ''))) add(k, `uiSfx('${m[1]}')`);
}
// stingers
const mixer = fs.readFileSync(path.join(SRC, 'phaser/systems/exploration/audioMixer.ts'), 'utf8');
for (const m of mixer.matchAll(/^\s*(\w+):\s*'(sfx_[a-z0-9_]+)'/gm)) add(m[2], `playStinger('${m[1]}')`);

// music is started by MusicController.startRoomMusic / crossfadeTo, not playSfx
for (const k of loaded.keys()) if (k.startsWith('music_')) add(k, 'client/src/phaser/systems/exploration/MusicController.ts (room seating plan)');
add('music_breach', 'client/src/phaser/scenes/BreachDefenseScene.ts (tower-defense bed)');

// 3. report — sound keys only
const isSound = (k) => /^(sfx_|music_|voice:)/.test(k) && !/_$/.test(k);
const keys = [...new Set([...loaded.keys(), ...played.keys()])].filter(isSound).sort();
let md = '| key | file | where it plays |\n|---|---|---|\n';
let unused = [], unloaded = [];
for (const k of keys) {
  const file = loaded.get(k) ?? '**NOT LOADED**';
  const sites = [...(played.get(k) ?? [])].filter(s => !/BootScene|DeferredAudioScene/.test(s));
  if (!loaded.has(k)) unloaded.push(k);
  if (sites.length === 0) unused.push(k);
  md += `| \`${k}\` | ${file} | ${sites.length ? sites.map(s => `\`${s}\``).join('<br>') : '— (loaded, never played)'} |\n`;
}
console.log(`Loaded keys: ${loaded.size} · played keys: ${played.size}\n`);
console.log(md);
console.log(`\nLoaded but never played: ${unused.length ? unused.join(', ') : 'none'}`);
console.log(`Played but never loaded: ${unloaded.filter(k => !/^voice:/.test(k)).join(', ') || 'none'}`);
