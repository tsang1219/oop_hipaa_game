import Phaser from 'phaser';

import { generateNPCTextures } from './npcTextures';

/**
 * Generates all programmatic sprite textures used across PrivacyQuest scenes.
 * Call once from BootScene.create() after preload completes.
 */
export function generateAllTextures(scene: Phaser.Scene) {
  generateNPCTextures(scene);
  // Run 11: floors, walls, furniture and object sprites all come from the LimeZu
  // atlas (systems/exploration/art/). Only the NPC fallback sheets are still drawn.
}
