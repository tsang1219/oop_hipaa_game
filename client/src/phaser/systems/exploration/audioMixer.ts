import Phaser from 'phaser';
import type { MusicController } from './MusicController';
import { voiceProfileForColor, voicePitchForColor } from '../../../lib/voicePitch';
import { getAudioDev } from './audioConfig';
import { eventBridge, BRIDGE_EVENTS } from '../../EventBridge';

/**
 * AUD-05 — the mixer.
 *
 * Four buses: music / sfx / voice / ambience. Bus levels persist to
 * localStorage (`music_volume` for music — unchanged so MusicController and
 * the existing slider keep working — and `pq:audio:mix:v1` for the rest).
 * They are deliberately NOT part of the pq:save:v2 save file: they're
 * device preferences, not progress, and localStorage already survives a
 * reload. Flagged in RUN_REPORT-12.md per the brief.
 *
 * Every SFX in the game routes through playSfx(): it applies the bus level,
 * honours a per-site cooldown so nothing can be machine-gunned by mashing,
 * and logs the play to window.__QA__.audioLog so Playwright can prove
 * "interaction X made sound Y" instead of trusting the code.
 */

export type Bus = 'music' | 'sfx' | 'voice' | 'ambience';

/** Anything that owns a sound manager + audio cache: a Scene or the Game
 *  itself (the React→SFX bridge plays through the Game so menus and the
 *  standalone tower defense get sound without an exploration scene). */
export interface SfxHost {
  sound: Phaser.Sound.BaseSoundManager;
  cache: Phaser.Cache.CacheManager;
  time?: { now: number };
}

function hostNow(host: SfxHost): number {
  return host.time?.now ?? performance.now();
}

const MIX_KEY = 'pq:audio:mix:v1';
const MUSIC_KEY = 'music_volume';
const MIX_DEFAULTS: Record<Exclude<Bus, 'music'>, number> = { sfx: 0.7, voice: 0.7, ambience: 0.7 }; // under the music, not over it

function readMix(): Record<Exclude<Bus, 'music'>, number> {
  try {
    const raw = localStorage.getItem(MIX_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Record<Bus, number>>;
      return {
        sfx: clamp01(parsed.sfx ?? MIX_DEFAULTS.sfx),
        voice: clamp01(parsed.voice ?? MIX_DEFAULTS.voice),
        ambience: clamp01(parsed.ambience ?? MIX_DEFAULTS.ambience),
      };
    }
    // One-time migration from the Run 12 WIP's single sfx_volume key.
    const legacy = localStorage.getItem('sfx_volume');
    if (legacy !== null) {
      const v = clamp01(parseFloat(legacy));
      return { sfx: v, voice: v, ambience: MIX_DEFAULTS.ambience };
    }
  } catch (_) { /* fall through */ }
  return { ...MIX_DEFAULTS };
}

function clamp01(v: number): number {
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0;
}

export function getBusVolume(bus: Bus): number {
  if (bus === 'music') {
    try {
      const raw = localStorage.getItem(MUSIC_KEY);
      return raw === null ? 0.6 : clamp01(parseFloat(raw));
    } catch (_) { return 0.6; }
  }
  return readMix()[bus];
}

export function getMix(): Record<Bus, number> {
  const m = readMix();
  return { music: getBusVolume('music'), ...m };
}

/** Persist a bus level and tell anyone live (music controller, ambience
 *  beds, React sliders) about it. */
export function setBusVolume(bus: Bus, vol: number): void {
  const v = clamp01(vol);
  try {
    if (bus === 'music') {
      localStorage.setItem(MUSIC_KEY, String(v));
      eventBridge.emit(BRIDGE_EVENTS.REACT_SET_MUSIC_VOLUME, v);
    } else {
      const m = readMix();
      m[bus] = v;
      localStorage.setItem(MIX_KEY, JSON.stringify(m));
    }
    window.dispatchEvent(new CustomEvent('pq:mix-changed', { detail: { bus, volume: v } }));
  } catch (_) { /* storage unavailable */ }
}

export function isMasterMuted(): boolean {
  try { return localStorage.getItem('sfx_muted') === 'true'; } catch (_) { return false; }
}

// ── Audio event log (QA proof) ───────────────────────────────────────────
export interface AudioLogEntry { t: number; key: string; bus: Bus; volume: number; rate?: number }
const AUDIO_LOG_MAX = 120;
export function logAudio(entry: AudioLogEntry): void {
  try {
    const qa = (window as unknown as { __QA__?: { audioLog?: AudioLogEntry[] } }).__QA__;
    if (!qa) return;
    if (!qa.audioLog) qa.audioLog = [];
    qa.audioLog.push(entry);
    if (qa.audioLog.length > AUDIO_LOG_MAX) qa.audioLog.splice(0, qa.audioLog.length - AUDIO_LOG_MAX);
  } catch (_) { /* ignore */ }
}

// ── Cooldowns + round-robin ──────────────────────────────────────────────
const cooldowns = new Map<string, number>();
const bags = new Map<string, number[]>();

function cooldownOk(key: string | undefined, ms: number | undefined, now: number): boolean {
  if (!key || !ms) return true;
  const last = cooldowns.get(key) ?? -Infinity;
  if (now - last < ms) return false;
  cooldowns.set(key, now);
  return true;
}

/** Shuffled-bag index: never the same variant twice in a row, every variant
 *  heard before any repeats. */
export function nextVariant(namespace: string, count: number): number {
  let bag = bags.get(namespace);
  if (!bag || bag.length === 0) {
    bag = [];
    for (let i = 0; i < count; i++) bag.push(i);
    Phaser.Utils.Array.Shuffle(bag);
    // avoid the new bag starting with the variant the old one ended on
    const last = lastVariant.get(namespace);
    if (bag.length > 1 && bag[0] === last) bag.push(bag.shift()!);
    bags.set(namespace, bag);
  }
  const idx = bag.shift()!;
  lastVariant.set(namespace, idx);
  return idx;
}
const lastVariant = new Map<string, number>();

export interface PlayOpts {
  bus?: Bus;
  volume?: number;
  rate?: number;
  detune?: number;
  /** Per-call-site throttle: two plays with the same key inside cooldownMs collapse to one. */
  cooldownKey?: string;
  cooldownMs?: number;
}

/** The one way to play a sound effect. Returns true if it actually played. */
export function playSfx(host: SfxHost, key: string, opts: PlayOpts = {}): boolean {
  const bus: Bus = opts.bus ?? 'sfx';
  if (!host || !host.sound || !host.cache) return false;
  if (!host.cache.audio.has(key)) return false;
  const now = hostNow(host);
  if (!cooldownOk(opts.cooldownKey ?? key, opts.cooldownMs ?? 45, now)) return false;
  const level = getBusVolume(bus);
  if (level <= 0) return false;
  const volume = (opts.volume ?? 0.5) * level;
  if (volume <= 0) return false;
  try {
    host.sound.play(key, { volume, rate: opts.rate ?? 1, detune: opts.detune ?? 0 });
    logAudio({ t: now, key, bus, volume, rate: opts.rate });
    return true;
  } catch (_) {
    return false; // sound manager mid-teardown
  }
}

/** Round-robin over a variant set (footsteps, door creaks, UI ticks…). */
export function playRoundRobin(host: SfxHost, namespace: string, keys: string[], opts: PlayOpts = {}): boolean {
  if (keys.length === 0) return false;
  const now = hostNow(host);
  if (!cooldownOk(opts.cooldownKey ?? namespace, opts.cooldownMs ?? 45, now)) return false;
  const idx = nextVariant(namespace, keys.length);
  return playSfx(host, keys[idx], { ...opts, cooldownKey: `${namespace}:rr:${idx}`, cooldownMs: 0 });
}

/** Legacy names kept for call sites written against the Run 12 WIP. */
export const playBusSfx = playSfx;
export function roundRobinPlay(host: SfxHost, namespace: string, keys: string[], opts: PlayOpts = {}): void {
  playRoundRobin(host, namespace, keys, opts);
}

// ── AUD-07 — the stinger set ─────────────────────────────────────────────
// Distinct, short, reused consistently so the player learns what each means
// without being told. One key per meaning; never reuse a stinger for
// something else.
export const STINGERS = {
  discovery:   'sfx_stinger_discovery',  // first time talking to someone new
  itemGet:     'sfx_stinger_itemget',    // a fact/item collected
  correct:     'sfx_sorter_correct',     // right answer (same chime the sorter uses)
  wrong:       'sfx_sorter_wrong',       // wrong answer (a wince, not a scold)
  roomClear:   'sfx_fanfare',            // department complete
  actChange:   'sfx_stinger_actchange',  // act transition
  secretFound: 'sfx_stinger_secret',     // hidden door / optional content
} as const;
export type StingerName = keyof typeof STINGERS;

export function playStinger(host: SfxHost, name: StingerName, volume = 0.6): boolean {
  return playSfx(host, STINGERS[name], { bus: 'sfx', volume, cooldownKey: `stinger:${name}`, cooldownMs: 250 });
}

// ── AUD-04 — per-character voice blips ───────────────────────────────────
// Two implementations behind the voiceBlipMode dev toggle (audioConfig.ts):
//   synth  — a tiny WebAudio oscillator note per syllable. Pitch and timbre
//            come from the NPC's signature colour (hue → pitch, saturation →
//            waveform), so every character has a recognisable voice and the
//            whole thing costs zero asset bytes.
//   sample — the two Kenney pluck samples, rate-shifted per colour.
const VOICE_SAMPLE_KEYS = ['sfx_voice_blip_0', 'sfx_voice_blip_1'];
const VOICE_COOLDOWN_MS = 58; // ~17 blips/sec hard ceiling regardless of typewriter speed

export interface VoiceBlipOpts {
  /** Signature colour hex, e.g. '#FF7A6B'. Drives pitch + timbre. */
  color: string;
  /** 0..1 — which syllable this is; used to vary the note so it doesn't drone. */
  seed?: number;
  volume?: number;
}

export function playVoiceBlip(host: SfxHost, opts: VoiceBlipOpts): boolean {
  const mode = getAudioDev().voiceBlipMode;
  const level = getBusVolume('voice');
  if (level <= 0 || isMasterMuted()) return false;
  const now = hostNow(host);
  if (!cooldownOk('voice_blip', VOICE_COOLDOWN_MS, now)) return false;
  const seed = opts.seed ?? Math.random();

  if (mode === 'sample') {
    const rate = voicePitchForColor(opts.color) * (0.96 + seed * 0.08);
    const idx = nextVariant('voice_sample', VOICE_SAMPLE_KEYS.length);
    const key = VOICE_SAMPLE_KEYS[idx];
    if (!host.cache.audio.has(key)) return false;
    try {
      host.sound.play(key, { volume: (opts.volume ?? 0.16) * level, rate });
      logAudio({ t: now, key, bus: 'voice', volume: (opts.volume ?? 0.16) * level, rate });
      return true;
    } catch (_) { return false; }
  }

  const ctx = getAudioContext(host);
  const dest = getMasterDestination(host);
  if (!ctx || !dest || ctx.state !== 'running') return false;
  const profile = voiceProfileForColor(opts.color);
  // Per-syllable variation: a small pitch wobble around the character's note,
  // every third blip a fifth up — the "sing-song" of Animal Crossing speech.
  const interval = seed < 0.18 ? 1.5 : seed < 0.4 ? 1.19 : 1;
  const freq = profile.baseHz * interval * (0.97 + ((seed * 7919) % 1) * 0.06);
  const dur = profile.durationMs / 1000;
  const t0 = ctx.currentTime;
  try {
    const osc = ctx.createOscillator();
    osc.type = profile.wave;
    osc.frequency.setValueAtTime(freq, t0);
    osc.frequency.exponentialRampToValueAtTime(freq * profile.chirp, t0 + dur);
    const g = ctx.createGain();
    const peak = (opts.volume ?? 0.11) * level * profile.gain;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    // a gentle low-pass takes the edge off square waves at speech volume
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = profile.lowpassHz;
    osc.connect(lp); lp.connect(g); g.connect(dest);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
    osc.onended = () => { try { osc.disconnect(); lp.disconnect(); g.disconnect(); } catch (_) { /* */ } };
    logAudio({ t: now, key: `voice:synth:${profile.wave}@${Math.round(freq)}`, bus: 'voice', volume: peak });
    return true;
  } catch (_) {
    return false;
  }
}

// ── WebAudio plumbing shared with the ambience beds ──────────────────────
export function getAudioContext(host: SfxHost): AudioContext | null {
  const sm = host.sound as unknown as { context?: AudioContext };
  return sm && sm.context instanceof AudioContext ? sm.context : null;
}

/** Phaser's master mute node — anything connected here obeys the game's mute
 *  button and master volume exactly like Phaser's own sounds. */
export function getMasterDestination(host: SfxHost): AudioNode | null {
  const sm = host.sound as unknown as { destination?: AudioNode; context?: AudioContext };
  if (sm?.destination) return sm.destination;
  return sm?.context ? sm.context.destination : null;
}

// ── AUD-05 — ducking ──────────────────────────────────────────────────────
export function duckMusic(music: MusicController, amount = 0.45): void {
  music.duckTo(amount, 180);
}
export function unduckMusic(music: MusicController): void {
  music.duckTo(1, 320);
}
