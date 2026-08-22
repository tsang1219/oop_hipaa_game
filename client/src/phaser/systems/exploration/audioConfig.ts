/**
 * Run 12 — dev toggles for the sound choices that could go two ways.
 *
 * Defaults are what ships. Flip one at runtime (no rebuild) from DevTools:
 *
 *     localStorage.setItem('pq:audio:dev', JSON.stringify({ voiceBlipMode: 'sample' }))
 *
 * then reload. `window.__AUDIO_DEV__` shows the resolved values in-game.
 */
export interface AudioDevToggles {
  /** AUD-04 — 'synth': WebAudio blips pitched + timbred per signature colour
   *  (Animal Crossing style). 'sample': the two Kenney pluck samples,
   *  rate-shifted per colour (the Run 12 WIP approach). */
  voiceBlipMode: 'synth' | 'sample';
  /** AUD-01 — hallways: 'inherit' keeps the previous room's track playing
   *  through the corridor (areas share a theme); 'act' uses the act default
   *  (the pre-Run-12 behaviour). */
  hallwayMusic: 'inherit' | 'act';
  /** AUD-06 — synthesized room beds under the music. */
  ambienceBeds: boolean;
  /** FEEL-20 — the 3-frame world freeze on interaction (squash stays on). */
  hitStop: boolean;
  /** AUD-03 — footstep families by floor material (false = one generic step). */
  materialFootsteps: boolean;
}

export const AUDIO_DEV_DEFAULTS: AudioDevToggles = {
  voiceBlipMode: 'synth',
  hallwayMusic: 'inherit',
  ambienceBeds: true,
  hitStop: true,
  materialFootsteps: true,
};

let cached: AudioDevToggles | null = null;

export function getAudioDev(): AudioDevToggles {
  if (cached) return cached;
  let overrides: Partial<AudioDevToggles> = {};
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('pq:audio:dev') : null;
    if (raw) overrides = JSON.parse(raw) as Partial<AudioDevToggles>;
  } catch (_) { /* ignore malformed overrides */ }
  cached = { ...AUDIO_DEV_DEFAULTS, ...overrides };
  try { (window as unknown as { __AUDIO_DEV__?: AudioDevToggles }).__AUDIO_DEV__ = cached; } catch (_) { /* SSR/tests */ }
  return cached;
}
