/**
 * useIntegerZoom — Run 11 follow-up. The game renders at 640×480 and must be shown at an
 * INTEGER multiple of that, or pixel art gets uneven (a 1.5× nearest-neighbour upscale
 * doubles every other row — that was the "spotty floor"). Picks the largest integer zoom
 * that fits the window (1×–3×), letterboxed by the page. Only when the window cannot even
 * fit 1× does it fall back to a fractional fit, and then the canvas is smoothed instead of
 * pixelated so it degrades to "soft", never "uneven".
 */
import { useEffect, useState } from 'react';

export const BASE_W = 640;
export const BASE_H = 480;
const MAX_ZOOM = 3;
/** page border (4px×2) + shadow (8px) + breathing room */
const MARGIN = 40;

export interface GameFit {
  width: number;
  height: number;
  zoom: number;
  /** true when zoom is an integer → keep the canvas pixelated */
  crisp: boolean;
}

export function computeGameFit(viewportW: number, viewportH: number): GameFit {
  const fit = Math.min((viewportW - MARGIN) / BASE_W, (viewportH - MARGIN) / BASE_H);
  const zoom = fit >= 1 ? Math.min(MAX_ZOOM, Math.floor(fit)) : Math.max(0.5, fit);
  return { width: Math.round(BASE_W * zoom), height: Math.round(BASE_H * zoom), zoom, crisp: Number.isInteger(zoom) };
}

function current(): GameFit {
  if (typeof window === 'undefined') return computeGameFit(BASE_W * 2 + MARGIN, BASE_H * 2 + MARGIN);
  return computeGameFit(window.innerWidth, window.innerHeight);
}

export function useIntegerZoom(): GameFit {
  const [fit, setFit] = useState<GameFit>(current);
  useEffect(() => {
    let timer: number | undefined;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setFit(prev => {
        const next = current();
        return prev.width === next.width && prev.height === next.height ? prev : next;
      }), 80);
    };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); window.clearTimeout(timer); };
  }, []);
  return fit;
}
