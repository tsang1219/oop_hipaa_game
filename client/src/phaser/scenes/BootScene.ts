import Phaser from 'phaser';
import { eventBridge, BRIDGE_EVENTS } from '../EventBridge';
import { generateAllTextures } from '../SpriteFactory';

const TILE_SIZE = 32;

/**
 * BootScene: Loads all shared assets, generates sprite textures, then starts HubWorld.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  preload() {
    // Show loading progress
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 15, 320, 30);

    const loadingText = this.add.text(width / 2, height / 2 - 40, 'LOADING...', {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      color: '#ffffff',
    });
    loadingText.setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xff6b9d, 1);
      progressBar.fillRect(width / 2 - 155, height / 2 - 10, 310 * value, 20);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Load background images
    this.load.image('hospital_bg', '/attached_assets/generated_images/Hospital_corridor_pixel_background_72c96c5f.png');

    // Load BreachDefense tower sprites
    this.load.image('tower_MFA', '/attached_assets/generated_images/mfa_tower_pixel_sprite.png');
    this.load.image('tower_PATCH', '/attached_assets/generated_images/patch_cannon_pixel_sprite.png');
    this.load.image('tower_FIREWALL', '/attached_assets/generated_images/firewall_tower_pixel_sprite.png');
    this.load.image('tower_ENCRYPTION', '/attached_assets/generated_images/encryption_tower_pixel_sprite.png');
    this.load.image('tower_TRAINING', '/attached_assets/generated_images/training_beacon_tower_sprite.png');
    this.load.image('tower_ACCESS', '/attached_assets/generated_images/access_control_gate_sprite.png');

    // Load BreachDefense threat sprites
    this.load.image('threat_PHISHING', '/attached_assets/generated_images/phishing_threat_pixel_sprite.png');
    this.load.image('threat_CREDENTIAL', '/attached_assets/generated_images/credential_harvester_enemy_sprite.png');
    this.load.image('threat_RANSOMWARE', '/attached_assets/generated_images/ransomware_threat_pixel_sprite.png');
    this.load.image('threat_INSIDER', '/attached_assets/generated_images/insider_threat_pixel_sprite.png');
    this.load.image('threat_ZERODAY', '/attached_assets/generated_images/zero-day_exploit_enemy_sprite.png');
    this.load.image('threat_BRUTEFORCE', '/attached_assets/generated_images/brute_force_bot_enemy_sprite.png');
    this.load.image('threat_DEVICETHIEF', '/attached_assets/generated_images/device_thief_enemy_sprite.png');
    this.load.image('threat_SOCIAL', '/attached_assets/generated_images/social_engineer_enemy_sprite.png');
  }

  create() {
    // Generate player sprite texture programmatically (blue character, facing down)
    this.generatePlayerTexture();
    this.generateNPCTextures();

    // Generate all additional textures (objects, furniture, extra NPCs)
    generateAllTextures(this);

    // Start the hub world
    this.scene.start('HubWorld');
    eventBridge.emit(BRIDGE_EVENTS.SCENE_READY, 'Boot');
  }

  private generatePlayerTexture() {
    // Blue character - down facing (default)
    const g = this.add.graphics();

    // Body
    g.fillStyle(0x4a90e2); // Blue shirt
    g.fillRect(10, 14, 12, 10);

    // Head
    g.fillStyle(0xfdbcb4); // Skin
    g.fillRect(12, 6, 8, 8);

    // Hair
    g.fillStyle(0x4a90e2);
    g.fillRect(11, 5, 10, 3);
    g.fillRect(10, 6, 2, 4);
    g.fillRect(20, 6, 2, 4);

    // Eyes
    g.fillStyle(0x000000);
    g.fillRect(14, 9, 2, 2);
    g.fillRect(18, 9, 2, 2);

    // Pants
    g.fillStyle(0x2c3e50);
    g.fillRect(10, 24, 5, 4);
    g.fillRect(17, 24, 5, 4);

    // Shoes
    g.fillStyle(0x8b4513);
    g.fillRect(10, 28, 5, 2);
    g.fillRect(17, 28, 5, 2);

    g.generateTexture('player_down', TILE_SIZE, TILE_SIZE);
    g.destroy();

    // Player facing up
    const gUp = this.add.graphics();
    gUp.fillStyle(0x4a90e2);
    gUp.fillRect(10, 14, 12, 10);
    gUp.fillStyle(0xfdbcb4);
    gUp.fillRect(12, 6, 8, 8);
    gUp.fillStyle(0x4a90e2);
    gUp.fillRect(11, 4, 10, 6);
    gUp.fillRect(10, 6, 2, 4);
    gUp.fillRect(20, 6, 2, 4);
    gUp.fillStyle(0x2c3e50);
    gUp.fillRect(10, 24, 5, 4);
    gUp.fillRect(17, 24, 5, 4);
    gUp.fillStyle(0x8b4513);
    gUp.fillRect(10, 28, 5, 2);
    gUp.fillRect(17, 28, 5, 2);
    gUp.generateTexture('player_up', TILE_SIZE, TILE_SIZE);
    gUp.destroy();

    // Player facing left
    const gLeft = this.add.graphics();
    gLeft.fillStyle(0x4a90e2);
    gLeft.fillRect(10, 14, 12, 10);
    gLeft.fillStyle(0xfdbcb4);
    gLeft.fillRect(12, 6, 8, 8);
    gLeft.fillStyle(0x4a90e2);
    gLeft.fillRect(11, 5, 10, 3);
    gLeft.fillRect(10, 6, 2, 4);
    gLeft.fillRect(20, 6, 2, 4);
    gLeft.fillStyle(0x000000);
    gLeft.fillRect(13, 9, 2, 2);
    gLeft.fillStyle(0x2c3e50);
    gLeft.fillRect(10, 24, 5, 4);
    gLeft.fillRect(17, 24, 5, 4);
    gLeft.fillStyle(0x8b4513);
    gLeft.fillRect(10, 28, 5, 2);
    gLeft.fillRect(17, 28, 5, 2);
    gLeft.generateTexture('player_left', TILE_SIZE, TILE_SIZE);
    gLeft.destroy();

    // Player facing right
    const gRight = this.add.graphics();
    gRight.fillStyle(0x4a90e2);
    gRight.fillRect(10, 14, 12, 10);
    gRight.fillStyle(0xfdbcb4);
    gRight.fillRect(12, 6, 8, 8);
    gRight.fillStyle(0x4a90e2);
    gRight.fillRect(11, 5, 10, 3);
    gRight.fillRect(10, 6, 2, 4);
    gRight.fillRect(20, 6, 2, 4);
    gRight.fillStyle(0x000000);
    gRight.fillRect(17, 9, 2, 2);
    gRight.fillStyle(0x2c3e50);
    gRight.fillRect(10, 24, 5, 4);
    gRight.fillRect(17, 24, 5, 4);
    gRight.fillStyle(0x8b4513);
    gRight.fillRect(10, 28, 5, 2);
    gRight.fillRect(17, 28, 5, 2);
    gRight.generateTexture('player_right', TILE_SIZE, TILE_SIZE);
    gRight.destroy();
  }

  private generateNPCTextures() {
    // Receptionist NPC (green scrubs)
    const g = this.add.graphics();
    g.fillStyle(0x2ecc71);
    g.fillRect(10, 14, 12, 10);
    g.fillStyle(0xfdbcb4);
    g.fillRect(12, 6, 8, 8);
    g.fillStyle(0x654321);
    g.fillRect(11, 4, 10, 4);
    g.fillStyle(0x000000);
    g.fillRect(14, 9, 2, 2);
    g.fillRect(18, 9, 2, 2);
    g.fillStyle(0x2c3e50);
    g.fillRect(10, 24, 5, 4);
    g.fillRect(17, 24, 5, 4);
    g.fillStyle(0xffffff);
    g.fillRect(10, 28, 5, 2);
    g.fillRect(17, 28, 5, 2);
    g.generateTexture('npc_receptionist', TILE_SIZE, TILE_SIZE);
    g.destroy();

    // IT Tech NPC (dark shirt)
    const g2 = this.add.graphics();
    g2.fillStyle(0x34495e);
    g2.fillRect(10, 14, 12, 10);
    g2.fillStyle(0xfdbcb4);
    g2.fillRect(12, 6, 8, 8);
    g2.fillStyle(0x2c3e50);
    g2.fillRect(11, 4, 10, 4);
    g2.fillStyle(0x000000);
    g2.fillRect(14, 9, 2, 2);
    g2.fillRect(18, 9, 2, 2);
    g2.fillStyle(0x2c3e50);
    g2.fillRect(10, 24, 5, 4);
    g2.fillRect(17, 24, 5, 4);
    g2.fillStyle(0x333333);
    g2.fillRect(10, 28, 5, 2);
    g2.fillRect(17, 28, 5, 2);
    g2.generateTexture('npc_it_tech', TILE_SIZE, TILE_SIZE);
    g2.destroy();
  }
}
