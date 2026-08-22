import Phaser from 'phaser';

import { generateNPCTextures } from './npcTextures';
import { generateFurnitureTextures } from './furniture';

/**
 * Generates all programmatic sprite textures used across PrivacyQuest scenes.
 * Call once from BootScene.create() after preload completes.
 */
export function generateAllTextures(scene: Phaser.Scene) {
  generateNPCTextures(scene);
  // Run 11: object sprites (poster / manual / computer / whiteboard) now come from
  // the LimeZu atlas — see systems/exploration/art/objectFrames.ts.
  generateFurnitureTextures(scene);
}
