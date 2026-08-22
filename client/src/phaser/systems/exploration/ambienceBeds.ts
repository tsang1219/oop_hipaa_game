import Phaser from 'phaser';
import { getAudioContext, getMasterDestination, getBusVolume, logAudio } from './audioMixer';
import { getAudioDev } from './audioConfig';

/**
 * AUD-06 — ambient room beds.
 *
 * None of the 230 Kenney files on disk is an ambience-length loop, so the
 * beds are synthesized: a few WebAudio oscillators and a filtered-noise
 * source per room, mixed at very low gain and routed through Phaser's master
 * mute node (so the mute button and master volume apply). Each room gets a
 * recognisable "place" sound even with the music off:
 *
 *   lobby/reception  — HVAC air + an occasional two-note PA chime
 *   ER               — patient monitor beep + HVAC
 *   lab              — centrifuge whir with a slow wobble + fume-hood air
 *   records          — fluorescent buzz + HVAC (dry, papery)
 *   IT office        — server fan band + a high whine, LED ticks
 *   break room       — fridge compressor hum (60 Hz + harmonics), wobbling
 *   hallways         — HVAC, quieter
 *   supply closet    — the cat purring. Of course.
 *
 * One instance per ExplorationScene; start(roomId) on create, stop() on
 * shutdown / encounter launch. Gains are modest on purpose (Protect: "mix
 * everything under the music, not over it").
 */

type Layer = {
  nodes: AudioNode[];
  sources: Array<OscillatorNode | AudioBufferSourceNode>;
  timers: Phaser.Time.TimerEvent[];
  name: string;
};

interface RoomBedSpec {
  gain: number;           // overall bed gain before bus level
  layers: Array<(ctx: AudioContext, out: GainNode, scene: Phaser.Scene) => Layer>;
}

export class AmbienceBeds {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private layers: Layer[] = [];
  private roomId: string | null = null;
  private roomGain = 0;
  private onMixChanged = () => this.applyBusLevel();
  private unlockedHandler: (() => void) | null = null;

  constructor(private scene: Phaser.Scene) {}

  get running(): boolean { return this.layers.length > 0; }

  layerNames(): string[] { return this.layers.map(l => l.name); }

  start(roomId: string): void {
    this.stop(0);
    if (!getAudioDev().ambienceBeds) return;
    const spec = BEDS[roomId] ?? (roomId.startsWith('hallway_') ? BEDS.__hallway : null);
    if (!spec) return;
    this.roomId = roomId;
    this.roomGain = spec.gain;
    const startNow = () => this.build(spec);
    const sm = this.scene.sound as Phaser.Sound.BaseSoundManager;
    if (sm.locked) {
      this.unlockedHandler = () => { this.unlockedHandler = null; if (this.roomId === roomId) startNow(); };
      sm.once('unlocked', this.unlockedHandler);
    } else {
      startNow();
    }
  }

  private build(spec: RoomBedSpec): void {
    const ctx = getAudioContext(this.scene);
    const dest = getMasterDestination(this.scene);
    if (!ctx || !dest) return;
    this.ctx = ctx;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.connect(dest);
    this.master = master;
    for (const make of spec.layers) {
      try { this.layers.push(make(ctx, master, this.scene)); } catch (_) { /* a layer failing is not fatal */ }
    }
    this.applyBusLevel(1200);
    window.addEventListener('pq:mix-changed', this.onMixChanged);
    logAudio({ t: this.scene.time.now, key: `ambience:${this.roomId}:${this.layerNames().join('+')}`, bus: 'ambience', volume: this.roomGain });
    this.publish();
  }

  /** Re-apply the ambience bus level (with a short ramp). */
  private applyBusLevel(rampMs = 200): void {
    if (!this.ctx || !this.master) return;
    const target = Math.max(0.0001, this.roomGain * getBusVolume('ambience'));
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(Math.max(0.0001, this.master.gain.value), t);
    this.master.gain.exponentialRampToValueAtTime(target, t + rampMs / 1000);
  }

  /** Duck the bed (e.g. under dialogue). factor 1 = full. */
  duck(factor: number, rampMs = 250): void {
    if (!this.ctx || !this.master) return;
    const target = Math.max(0.0001, this.roomGain * getBusVolume('ambience') * factor);
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(Math.max(0.0001, this.master.gain.value), t);
    this.master.gain.exponentialRampToValueAtTime(target, t + rampMs / 1000);
  }

  stop(fadeMs = 400): void {
    window.removeEventListener('pq:mix-changed', this.onMixChanged);
    if (this.unlockedHandler) {
      try { (this.scene.sound as Phaser.Sound.BaseSoundManager).off('unlocked', this.unlockedHandler); } catch (_) { /* */ }
      this.unlockedHandler = null;
    }
    const layers = this.layers;
    const master = this.master;
    const ctx = this.ctx;
    this.layers = [];
    this.master = null;
    this.roomId = null;
    for (const l of layers) for (const tm of l.timers) { try { tm.remove(false); } catch (_) { /* */ } }
    if (!ctx || !master) { this.publish(); return; }
    const t = ctx.currentTime;
    try {
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), t);
      master.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.01, fadeMs / 1000));
    } catch (_) { /* */ }
    const teardown = () => {
      for (const l of layers) {
        for (const s of l.sources) { try { s.stop(); } catch (_) { /* already stopped */ } }
        for (const n of l.nodes) { try { n.disconnect(); } catch (_) { /* */ } }
      }
      try { master.disconnect(); } catch (_) { /* */ }
    };
    setTimeout(teardown, fadeMs + 60);
    this.publish();
  }

  private publish(): void {
    try {
      const qa = (window as unknown as { __QA__?: Record<string, unknown> }).__QA__;
      if (qa) qa.ambience = { roomId: this.roomId, running: this.running, layers: this.layerNames() };
    } catch (_) { /* */ }
  }
}

// ── Layer builders ───────────────────────────────────────────────────────

let noiseBuffer: AudioBuffer | null = null;
function getNoise(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) return noiseBuffer;
  const seconds = 2;
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buf.getChannelData(0);
  // Pink-ish noise (Paul Kellet's economy filter) — white noise reads as hiss.
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + white * 0.099046;
    b1 = 0.96300 * b1 + white * 0.2965164;
    b2 = 0.57000 * b2 + white * 1.0526913;
    data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.12;
  }
  noiseBuffer = buf;
  return buf;
}

function noiseLayer(name: string, filterHz: number, q: number, gain: number, type: BiquadFilterType = 'lowpass', wobbleHz = 0, wobbleDepth = 0) {
  return (ctx: AudioContext, out: GainNode): Layer => {
    const src = ctx.createBufferSource();
    src.buffer = getNoise(ctx);
    src.loop = true;
    const filt = ctx.createBiquadFilter();
    filt.type = type;
    filt.frequency.value = filterHz;
    filt.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(filt); filt.connect(g); g.connect(out);
    const sources: Array<OscillatorNode | AudioBufferSourceNode> = [src];
    const nodes: AudioNode[] = [src, filt, g];
    if (wobbleHz > 0) {
      const lfo = ctx.createOscillator();
      lfo.frequency.value = wobbleHz;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = gain * wobbleDepth;
      lfo.connect(lfoGain); lfoGain.connect(g.gain);
      lfo.start();
      sources.push(lfo); nodes.push(lfo, lfoGain);
    }
    src.start();
    return { name, nodes, sources, timers: [] };
  };
}

function humLayer(name: string, partials: Array<[number, number]>, gain: number, wobbleHz = 0.15, wobbleDepth = 0.35, wave: OscillatorType = 'sine') {
  return (ctx: AudioContext, out: GainNode): Layer => {
    const g = ctx.createGain();
    g.gain.value = gain;
    g.connect(out);
    const sources: Array<OscillatorNode | AudioBufferSourceNode> = [];
    const nodes: AudioNode[] = [g];
    for (const [hz, rel] of partials) {
      const osc = ctx.createOscillator();
      osc.type = wave;
      osc.frequency.value = hz;
      const pg = ctx.createGain();
      pg.gain.value = rel;
      osc.connect(pg); pg.connect(g);
      osc.start();
      sources.push(osc); nodes.push(osc, pg);
    }
    if (wobbleHz > 0) {
      const lfo = ctx.createOscillator();
      lfo.frequency.value = wobbleHz;
      const lg = ctx.createGain();
      lg.gain.value = gain * wobbleDepth;
      lfo.connect(lg); lg.connect(g.gain);
      lfo.start();
      sources.push(lfo); nodes.push(lfo, lg);
    }
    return { name, nodes, sources, timers: [] };
  };
}

/** Periodic short tone (monitor beep, LED tick, PA chime). */
function beepLayer(name: string, opts: { everyMs: number; jitterMs?: number; notes: number[]; noteMs: number; gain: number; wave?: OscillatorType; gapMs?: number }) {
  return (ctx: AudioContext, out: GainNode, scene: Phaser.Scene): Layer => {
    const g = ctx.createGain();
    g.gain.value = 1;
    g.connect(out);
    const nodes: AudioNode[] = [g];
    const sources: Array<OscillatorNode | AudioBufferSourceNode> = [];
    const fire = () => {
      if (ctx.state !== 'running') return;
      let t = ctx.currentTime + 0.01;
      for (const hz of opts.notes) {
        const osc = ctx.createOscillator();
        osc.type = opts.wave ?? 'sine';
        osc.frequency.value = hz;
        const eg = ctx.createGain();
        eg.gain.setValueAtTime(0.0001, t);
        eg.gain.exponentialRampToValueAtTime(opts.gain, t + 0.008);
        eg.gain.exponentialRampToValueAtTime(0.0001, t + opts.noteMs / 1000);
        osc.connect(eg); eg.connect(g);
        osc.start(t); osc.stop(t + opts.noteMs / 1000 + 0.02);
        osc.onended = () => { try { osc.disconnect(); eg.disconnect(); } catch (_) { /* */ } };
        t += (opts.noteMs + (opts.gapMs ?? 40)) / 1000;
      }
    };
    const timers: Phaser.Time.TimerEvent[] = [];
    const schedule = () => {
      const delay = opts.everyMs + (opts.jitterMs ? (Math.random() * 2 - 1) * opts.jitterMs : 0);
      timers[0] = scene.time.addEvent({ delay, callback: () => { fire(); schedule(); } });
    };
    schedule();
    return {
      name, nodes, sources,
      get timers() { return timers; },
    } as Layer;
  };
}

/** Cat purr: filtered noise with a ~24 Hz tremolo and slow breathing. */
function purrLayer(gain: number) {
  return (ctx: AudioContext, out: GainNode): Layer => {
    const src = ctx.createBufferSource();
    src.buffer = getNoise(ctx);
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 180; lp.Q.value = 2;
    const trem = ctx.createGain();
    trem.gain.value = 0.5;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 24;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 0.5;
    lfo.connect(lfoG); lfoG.connect(trem.gain);
    const breath = ctx.createGain();
    breath.gain.value = gain;
    const bLfo = ctx.createOscillator();
    bLfo.frequency.value = 0.45;
    const bG = ctx.createGain();
    bG.gain.value = gain * 0.6;
    bLfo.connect(bG); bG.connect(breath.gain);
    src.connect(lp); lp.connect(trem); trem.connect(breath); breath.connect(out);
    src.start(); lfo.start(); bLfo.start();
    return { name: 'purr', nodes: [src, lp, trem, lfo, lfoG, breath, bLfo, bG], sources: [src, lfo, bLfo], timers: [] };
  };
}

const HVAC = (gain: number) => noiseLayer('hvac', 420, 0.7, gain, 'lowpass', 0.08, 0.25);

const BEDS: Record<string, RoomBedSpec> = {
  hospital_entrance: {
    gain: 0.9,
    layers: [
      HVAC(0.05),
      beepLayer('pa-chime', { everyMs: 34000, jitterMs: 9000, notes: [1046.5, 783.99], noteMs: 220, gain: 0.035, gapMs: 80 }),
    ],
  },
  reception: {
    gain: 0.9,
    layers: [
      HVAC(0.045),
      beepLayer('pa-chime', { everyMs: 42000, jitterMs: 12000, notes: [1046.5, 783.99], noteMs: 220, gain: 0.03, gapMs: 80 }),
    ],
  },
  er: {
    gain: 1,
    layers: [
      beepLayer('monitor', { everyMs: 1120, jitterMs: 40, notes: [880], noteMs: 70, gain: 0.055 }),
      HVAC(0.04),
    ],
  },
  lab: {
    gain: 1,
    layers: [
      humLayer('centrifuge', [[86, 1], [172, 0.45], [258, 0.2]], 0.03, 3.1, 0.3, 'sawtooth'),
      noiseLayer('fume-hood', 900, 0.6, 0.035, 'bandpass', 0.05, 0.2),
    ],
  },
  records_room: {
    gain: 0.9,
    layers: [
      humLayer('fluorescent', [[120, 1], [240, 0.35], [360, 0.15]], 0.012, 0.9, 0.5, 'square'),
      HVAC(0.04),
    ],
  },
  it_office: {
    gain: 1,
    layers: [
      noiseLayer('server-fans', 260, 1.4, 0.06, 'bandpass', 0.21, 0.2),
      humLayer('server-whine', [[2400, 1], [4800, 0.2]], 0.006, 2.7, 0.4),
      beepLayer('led-tick', { everyMs: 3600, jitterMs: 1800, notes: [2200], noteMs: 18, gain: 0.012, wave: 'square' }),
    ],
  },
  break_room: {
    gain: 1,
    layers: [
      humLayer('fridge', [[60, 1], [120, 0.55], [180, 0.25], [240, 0.12]], 0.05, 0.13, 0.4),
      HVAC(0.02),
    ],
  },
  supply_closet: {
    gain: 1,
    layers: [purrLayer(0.06), HVAC(0.012)],
  },
  __hallway: {
    gain: 0.8,
    layers: [HVAC(0.035)],
  },
};

export const AMBIENCE_ROOM_IDS = Object.keys(BEDS).filter(k => !k.startsWith('__'));
