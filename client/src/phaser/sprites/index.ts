import Phaser from 'phaser';

import { generateNPCTextures } from './npcTextures';
import { generateObjectTextures } from './objectTextures';
import { generateFurnitureTextures } from './furniture';

/**
 * Generates all programmatic sprite textures used across PrivacyQuest scenes.
 * Call once from BootScene.create() after preload completes.
 */
export function generateAllTextures(scene: Phaser.Scene) {
  generateNPCTextures(scene);
  generateObjectTextures(scene);
  generateFurnitureTextures(scene);
}
