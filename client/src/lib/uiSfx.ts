import { useEffect } from 'react';
import { eventBridge, BRIDGE_EVENTS } from '@/phaser/EventBridge';

/**
 * Run 12 (AUD-02) — the React side of "no interaction is silent".
 *
 * Everything here is one emit away from the mixer: REACT_PLAY_SFX is handled
 * game-wide in PhaserGame.tsx, so these work on the title screen and in the
 * standalone tower defense, not just inside a room.
 */

export type UiSound =
  | 'click' | 'hover' | 'confirm' | 'back' | 'open' | 'close' | 'select' | 'error' | 'toggle'
  | 'scoreUp' | 'scoreDown' | 'bell' | 'cardFlip' | 'pin' | 'trayDrop' | 'glass';

const UI_KEYS: Record<UiSound, { keys: string[]; volume: number; rate?: number; cooldownMs?: number }> = {
  click:     { keys: ['sfx_ui_click_0', 'sfx_ui_click_1', 'sfx_ui_click_2', 'sfx_ui_click_3'], volume: 0.3, cooldownMs: 60 },
  hover:     { keys: ['sfx_ui_hover'], volume: 0.06, rate: 1.3, cooldownMs: 110 },
  confirm:   { keys: ['sfx_ui_confirm'], volume: 0.45, cooldownMs: 120 },
  back:      { keys: ['sfx_ui_back'], volume: 0.35, cooldownMs: 120 },
  open:      { keys: ['sfx_ui_open_0', 'sfx_ui_open_1'], volume: 0.3, cooldownMs: 150 },
  close:     { keys: ['sfx_ui_close_0', 'sfx_ui_close_1'], volume: 0.28, cooldownMs: 150 },
  select:    { keys: ['sfx_ui_select_0', 'sfx_ui_select_1', 'sfx_ui_select_2'], volume: 0.38, cooldownMs: 60 },
  error:     { keys: ['sfx_ui_error'], volume: 0.4, cooldownMs: 200 },
  toggle:    { keys: ['sfx_ui_toggle'], volume: 0.3, cooldownMs: 80 },
  scoreUp:   { keys: ['sfx_score_up'], volume: 0.4, cooldownMs: 150 },
  scoreDown: { keys: ['sfx_score_down'], volume: 0.35, cooldownMs: 150 },
  bell:      { keys: ['sfx_bell'], volume: 0.35, cooldownMs: 300 },
  cardFlip:  { keys: ['sfx_card_flip'], volume: 0.35, cooldownMs: 80 },
  pin:       { keys: ['sfx_pin'], volume: 0.45, cooldownMs: 80 },
  trayDrop:  { keys: ['sfx_tray_drop_0', 'sfx_tray_drop_1'], volume: 0.4, cooldownMs: 80 },
  glass:     { keys: ['sfx_glass_0', 'sfx_glass_1'], volume: 0.3, cooldownMs: 80 },
};

const rr = new Map<UiSound, number>();

/** Play one UI sound (round-robin over its variants). */
export function uiSfx(sound: UiSound, overrides: { volume?: number; rate?: number } = {}): void {
  const spec = UI_KEYS[sound];
  if (!spec) return;
  const n = (rr.get(sound) ?? Math.floor(Math.random() * spec.keys.length)) % spec.keys.length;
  rr.set(sound, n + 1);
  eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, {
    key: spec.keys[n],
    volume: overrides.volume ?? spec.volume,
    rate: overrides.rate ?? spec.rate ?? 1,
    cooldownKey: `ui:${sound}`,
    cooldownMs: spec.cooldownMs ?? 60,
  });
}

/**
 * Overlay open/close grammar. Call from any modal/overlay component: plays
 * `open` on mount and `close` on unmount. Components that already play a
 * purpose-fit sound on close (e.g. a confirm) can pass close: null.
 */
export function useOverlaySfx(open: UiSound | null = 'open', close: UiSound | null = 'close'): void {
  useEffect(() => {
    if (open) uiSfx(open);
    return () => { if (close) uiSfx(close); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

let installed = false;
let lastSfxEmitAt = -Infinity;
const SUPPRESS_WINDOW_MS = 40;

/**
 * Delegated click/hover sound for every <button> in the app — installed
 * once. Buttons that carry their own purpose-fit sound opt out with
 * data-sfx="none"; data-sfx="confirm|back|select|…" picks a different voice.
 */
export function installGlobalUiSfx(): () => void {
  if (installed || typeof document === 'undefined') return () => {};
  installed = true;
  const pick = (el: Element | null): { el: HTMLElement; sound: UiSound | 'none' } | null => {
    const btn = el?.closest?.('button, [role="button"], input[type="range"], a[href]') as HTMLElement | null;
    if (!btn) return null;
    const attr = (btn.getAttribute('data-sfx') ?? '') as UiSound | 'none' | '';
    if (attr === 'none') return { el: btn, sound: 'none' };
    if (btn instanceof HTMLInputElement) return { el: btn, sound: 'none' }; // sliders have their own tick
    return { el: btn, sound: (attr || 'click') as UiSound };
  };
  const onEmit = () => { lastSfxEmitAt = performance.now(); };
  eventBridge.on(BRIDGE_EVENTS.REACT_PLAY_SFX, onEmit);
  const onClick = (e: Event) => {
    const hit = pick(e.target as Element);
    if (!hit || hit.sound === 'none') return;
    // The button's own handler already voiced this click — don't double it.
    if (performance.now() - lastSfxEmitAt < SUPPRESS_WINDOW_MS) return;
    if ((hit.el as HTMLButtonElement).disabled) { uiSfx('error', { volume: 0.2 }); return; }
    uiSfx(hit.sound);
  };
  let lastHover: Element | null = null;
  const onOver = (e: Event) => {
    const hit = pick(e.target as Element);
    if (!hit || hit.sound === 'none' || hit.el === lastHover) { if (!hit) lastHover = null; return; }
    lastHover = hit.el;
    if ((hit.el as HTMLButtonElement).disabled) return;
    uiSfx('hover');
  };
  // Bubble phase on document: React's root listeners (and any purpose-fit
  // sound they emit) run first, so the suppression window above works.
  document.addEventListener('click', onClick);
  document.addEventListener('mouseover', onOver);
  return () => {
    eventBridge.off(BRIDGE_EVENTS.REACT_PLAY_SFX, onEmit);
    document.removeEventListener('click', onClick);
    document.removeEventListener('mouseover', onOver);
    installed = false;
  };
}
