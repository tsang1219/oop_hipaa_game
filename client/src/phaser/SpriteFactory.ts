import Phaser from 'phaser';

import { generateNPCTextures, npcTextureKey, npcTypeFromId } from './sprites/npcTextures';
import { generateObjectTextures, objectTextureKey } from './sprites/objectTextures';
import { generateFurnitureTextures, furnitureTextureKey } from './sprites/furniture';

/**
 * Generates all programmatic sprite textures used across PrivacyQuest scenes.
 * Call once from BootScene.create() after preload completes.
 */
export function generateAllTextures(scene: Phaser.Scene) {
  generateNPCTextures(scene);
  generateObjectTextures(scene);
  generateFurnitureTextures(scene);
}

export { furnitureTextureKey, npcTextureKey, npcTypeFromId, objectTextureKey };
