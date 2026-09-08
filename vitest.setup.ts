/**
 * jsdom Storage bridge.
 *
 * Vitest 4 does not hand tests the jsdom window itself — it builds its own global
 * `window` and copies jsdom's property descriptors onto it. That works for plain
 * values, but jsdom implements `localStorage` / `sessionStorage` as getters that
 * are brand-checked against the real jsdom Window instance. Copied onto a
 * different object, those getters fail their brand check and return `undefined`,
 * so every test that touches storage dies on `localStorage.clear()`.
 *
 * Vitest does expose the real instance as `globalThis.jsdom`, so we re-point the
 * two accessors at it. This keeps genuine jsdom Storage semantics (real quota,
 * real key coercion, real `storage` events) rather than swapping in a Map-backed
 * fake, and it stays correct if vitest fixes the descriptor copy upstream —
 * the guard below only installs the bridge when the global is actually missing.
 */
const dom = (globalThis as { jsdom?: { window: Window & typeof globalThis } }).jsdom;

if (dom?.window) {
  for (const key of ['localStorage', 'sessionStorage'] as const) {
    if (typeof (globalThis as Record<string, unknown>)[key] !== 'undefined') continue;

    const descriptor: PropertyDescriptor = {
      configurable: true,
      enumerable: false,
      get: () => dom.window[key],
    };

    Object.defineProperty(globalThis, key, descriptor);
    // Code under test reaches for the bare global, but `window.localStorage`
    // should not disagree with it.
    if (globalThis.window && globalThis.window !== dom.window) {
      Object.defineProperty(globalThis.window, key, descriptor);
    }
  }
}
