/**
 * objectFrames.ts — Run 11. Replaces sprites/objectTextures.ts (the four
 * hand-drawn obj_* textures) with LimeZu atlas frames. Interactable zones and
 * educational items render through these.
 */
import { ATLAS_KEY, type AtlasFrame } from './atlasFrames.generated';

export const OBJECT_FRAMES: Record<string, AtlasFrame> = {
  poster: 'prop.clipboard.blue',
  manual: 'prop.binders',
  computer: 'prop.monitor.pc',
  whiteboard: 'prop.sign.chart',
};

export interface TextureRef { key: string; frame: string }

/** Atlas key + frame for an object sprite type (poster / manual / computer / whiteboard). */
export function objectTexture(spriteType: string): TextureRef {
  return { key: ATLAS_KEY, frame: OBJECT_FRAMES[spriteType] ?? OBJECT_FRAMES.computer };
}

export function atlasRef(frame: AtlasFrame): TextureRef {
  return { key: ATLAS_KEY, frame };
}
