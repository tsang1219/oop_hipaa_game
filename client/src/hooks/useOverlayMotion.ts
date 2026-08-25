import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * UI-04 — shared open/close motion for overlays and modals.
 *
 * Every overlay plays a short enter animation on mount (pure CSS, no state),
 * and exits through `close(cb)`: the exit animation plays, then `cb` fires
 * (typically the parent's onClose/onDismiss that unmounts the component).
 *
 * Input safety (FEEL-23): the enter animation is cosmetic only — components
 * attach their key/click handlers on mount as before, so no keypress is ever
 * eaten while the overlay animates in. `close()` is idempotent: repeated
 * calls during the exit window are ignored, so a mashed SPACE can't
 * double-fire the close callback.
 *
 * Usage:
 *   const motion = useOverlayMotion();
 *   <div className={`... ${motion.className}`}> ... </div>
 *   // instead of onClose():
 *   motion.close(onClose);
 *
 * Variants: 'pop' (scale+fade, default for centered modals), 'rise'
 * (slide-up+fade, for bottom sheets/trays), 'fade' (backdrops, full-screen
 * scenes). Pair backdrops with `motion.backdropClassName`.
 */
export type OverlayMotionVariant = 'pop' | 'rise' | 'fade';

/** Exit animation duration — keep in sync with the overlay-*-out keyframes. */
export const OVERLAY_EXIT_MS = 150;

export function useOverlayMotion(variant: OverlayMotionVariant = 'pop') {
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const close = useCallback((cb?: () => void) => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    timerRef.current = setTimeout(() => cb?.(), OVERLAY_EXIT_MS);
  }, []);

  return {
    /** True while the exit animation is playing. */
    isClosing: closing,
    /** Class for the overlay panel itself. */
    className: closing ? `overlay-${variant}-out` : `overlay-${variant}-in`,
    /** Class for a dimmed backdrop behind the panel. */
    backdropClassName: closing ? 'overlay-fade-out' : 'overlay-fade-in',
    /** Play the exit animation, then invoke the callback (once). */
    close,
  };
}
