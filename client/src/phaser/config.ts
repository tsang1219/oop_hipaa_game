import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { HubWorldScene } from './scenes/HubWorldScene';
import { ExplorationScene } from './scenes/ExplorationScene';
import { BreachDefenseScene } from './scenes/BreachDefenseScene';

export function createGameConfig(options: {
  parent: HTMLElement;
  width: number;
  height: number;
}): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: options.parent,
    width: options.width,
    height: options.height,
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, HubWorldScene, ExplorationScene, BreachDefenseScene],
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    backgroundColor: '#1a1a2e',
  };
}
