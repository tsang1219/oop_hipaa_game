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

    // Load character spritesheets — 32x32 frames, 3 cols x 4 rows
    // Row order: down(0), left(1), right(2), up(3) — 3 frames per direction
    const CHAR_FRAME = { frameWidth: 32, frameHeight: 32 };
    this.load.spritesheet('player_sheet', '/attached_assets/generated_images/privacyquest/characters/player.png', CHAR_FRAME);
    this.load.spritesheet('npc_receptionist_sheet', '/attached_assets/generated_images/privacyquest/characters/npc_receptionist.png', CHAR_FRAME);
    this.load.spritesheet('npc_nurse_sheet', '/attached_assets/generated_images/privacyquest/characters/npc_nurse.png', CHAR_FRAME);
    this.load.spritesheet('npc_doctor_sheet', '/attached_assets/generated_images/privacyquest/characters/npc_doctor.png', CHAR_FRAME);
    this.load.spritesheet('npc_it_tech_sheet', '/attached_assets/generated_images/privacyquest/characters/npc_it_tech.png', CHAR_FRAME);
    this.load.spritesheet('npc_officer_sheet', '/attached_assets/generated_images/privacyquest/characters/npc_officer.png', CHAR_FRAME);
    this.load.spritesheet('npc_boss_sheet', '/attached_assets/generated_images/privacyquest/characters/npc_boss.png', CHAR_FRAME);
    this.load.spritesheet('npc_staff_sheet', '/attached_assets/generated_images/privacyquest/characters/npc_staff.png', CHAR_FRAME);
    this.load.spritesheet('npc_patient_sheet', '/attached_assets/generated_images/privacyquest/characters/npc_patient.png', CHAR_FRAME);
    this.load.spritesheet('npc_visitor_sheet', '/attached_assets/generated_images/privacyquest/characters/npc_visitor.png', CHAR_FRAME);

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

    // Load SFX — loaded once here, available to all scenes globally
    this.load.audio('sfx_footstep',    '/attached_assets/audio/sfx_footstep.ogg');
    this.load.audio('sfx_interact',    '/attached_assets/audio/sfx_interact.ogg');
    this.load.audio('sfx_tower_place', '/attached_assets/audio/sfx_tower_place.ogg');
    this.load.audio('sfx_enemy_death', '/attached_assets/audio/sfx_enemy_death.ogg');
    this.load.audio('sfx_breach_alert','/attached_assets/audio/sfx_breach_alert.ogg');
    this.load.audio('sfx_wave_start',  '/attached_assets/audio/sfx_wave_start.ogg');
  }

  create() {
    // Spritesheet frame constants:
    // Direction rows: down=0, left=1, right=2, up=3 (from CREDITS.md)
    // Frame index = row * COLS + col, where COLS=3 (idle=0, walk-A=1, walk-B=2)
    const COLS = 3;

    // Idle frame indices per direction (first frame of each row)
    // down=0, left=3, right=6, up=9
    // (These are exported for use in ExplorationScene and HubWorldScene)

    // Keep programmatic player textures as fallback — they're used if spritesheet fails
    // and still referenced in BootScene internal methods below.
    // Note: generatePlayerTexture() generates texture keys like 'player_down', 'player_up', etc.
    // These fallback textures remain in the cache but are superseded by spritesheet frames.
    this.generatePlayerTexture();
    this.generateNPCTextures();

    // Generate all additional textures (objects, furniture, extra NPCs)
    generateAllTextures(this);

    // Register global 4-direction walk animations for player (spritesheet-based, 3-frame cycle)
    const WALK_DIRS = ['down', 'left', 'right', 'up'] as const;
    for (let i = 0; i < WALK_DIRS.length; i++) {
      const dir = WALK_DIRS[i];
      const startFrame = i * COLS;
      const animKey = `walk_${dir}`;
      if (this.anims.exists(animKey)) this.anims.remove(animKey);
      this.anims.create({
        key: animKey,
        frames: this.anims.generateFrameNumbers('player_sheet', {
          start: startFrame, end: startFrame + COLS - 1,
        }),
        frameRate: 8,
        repeat: -1,
      });
    }

    // Register NPC walk animations for all 9 NPC types (4 directions x 9 types = 36 anims)
    const NPC_TYPES = [
      'receptionist', 'nurse', 'doctor', 'it_tech',
      'officer', 'boss', 'staff', 'patient', 'visitor',
    ] as const;
    for (const type of NPC_TYPES) {
      const sheetKey = `npc_${type}_sheet`;
      for (let i = 0; i < WALK_DIRS.length; i++) {
        const dir = WALK_DIRS[i];
        const startFrame = i * COLS;
        const animKey = `npc_${type}_walk_${dir}`;
        if (!this.anims.exists(animKey)) {
          this.anims.create({
            key: animKey,
            frames: this.anims.generateFrameNumbers(sheetKey, {
              start: startFrame, end: startFrame + COLS - 1,
            }),
            frameRate: 8,
            repeat: -1,
          });
        }
      }
    }

    // Generate particle texture for BreachDefense VFX
    this.generateParticleTexture();

    // Verify critical programmatic textures were generated successfully
    const criticalTextures = [
      'player_down', 'player_up', 'player_left', 'player_right',
      'npc_receptionist', 'npc_nurse', 'npc_doctor', 'npc_it_tech',
      'npc_boss', 'npc_staff', 'npc_patient', 'npc_visitor', 'npc_officer',
    ];
    for (const key of criticalTextures) {
      if (!this.textures.exists(key)) {
        console.error(`[BootScene] Texture '${key}' failed to generate`);
      }
    }

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

    // ── Walk frame 2 textures (legs-only animation) ────────────────
    // player_down_walk: front view, left leg forward / right leg back
    if (!this.textures.exists('player_down_walk')) {
      const gDownWalk = this.add.graphics();
      // Upper body (identical to player_down)
      gDownWalk.fillStyle(0x4a90e2);
      gDownWalk.fillRect(10, 14, 12, 10);
      gDownWalk.fillStyle(0xfdbcb4);
      gDownWalk.fillRect(12, 6, 8, 8);
      gDownWalk.fillStyle(0x4a90e2);
      gDownWalk.fillRect(11, 5, 10, 3);
      gDownWalk.fillRect(10, 6, 2, 4);
      gDownWalk.fillRect(20, 6, 2, 4);
      gDownWalk.fillStyle(0x000000);
      gDownWalk.fillRect(14, 9, 2, 2);
      gDownWalk.fillRect(18, 9, 2, 2);
      // Left leg forward
      gDownWalk.fillStyle(0x2c3e50);
      gDownWalk.fillRect(8, 22, 5, 4);
      gDownWalk.fillStyle(0x8b4513);
      gDownWalk.fillRect(8, 26, 5, 2);
      // Right leg back
      gDownWalk.fillStyle(0x2c3e50);
      gDownWalk.fillRect(19, 26, 5, 4);
      gDownWalk.fillStyle(0x8b4513);
      gDownWalk.fillRect(19, 30, 5, 2);
      gDownWalk.generateTexture('player_down_walk', TILE_SIZE, TILE_SIZE);
      gDownWalk.destroy();
    }

    // player_up_walk: back view, left leg forward / right leg back (mirrored)
    if (!this.textures.exists('player_up_walk')) {
      const gUpWalk = this.add.graphics();
      // Upper body (identical to player_up)
      gUpWalk.fillStyle(0x4a90e2);
      gUpWalk.fillRect(10, 14, 12, 10);
      gUpWalk.fillStyle(0xfdbcb4);
      gUpWalk.fillRect(12, 6, 8, 8);
      gUpWalk.fillStyle(0x4a90e2);
      gUpWalk.fillRect(11, 4, 10, 6);
      gUpWalk.fillRect(10, 6, 2, 4);
      gUpWalk.fillRect(20, 6, 2, 4);
      // Left leg forward
      gUpWalk.fillStyle(0x2c3e50);
      gUpWalk.fillRect(8, 22, 5, 4);
      gUpWalk.fillStyle(0x8b4513);
      gUpWalk.fillRect(8, 26, 5, 2);
      // Right leg back
      gUpWalk.fillStyle(0x2c3e50);
      gUpWalk.fillRect(19, 26, 5, 4);
      gUpWalk.fillStyle(0x8b4513);
      gUpWalk.fillRect(19, 30, 5, 2);
      gUpWalk.generateTexture('player_up_walk', TILE_SIZE, TILE_SIZE);
      gUpWalk.destroy();
    }

    // player_left_walk: side view, horizontal leg splay in direction of travel
    if (!this.textures.exists('player_left_walk')) {
      const gLeftWalk = this.add.graphics();
      // Upper body (identical to player_left)
      gLeftWalk.fillStyle(0x4a90e2);
      gLeftWalk.fillRect(10, 14, 12, 10);
      gLeftWalk.fillStyle(0xfdbcb4);
      gLeftWalk.fillRect(12, 6, 8, 8);
      gLeftWalk.fillStyle(0x4a90e2);
      gLeftWalk.fillRect(11, 5, 10, 3);
      gLeftWalk.fillRect(10, 6, 2, 4);
      gLeftWalk.fillRect(20, 6, 2, 4);
      gLeftWalk.fillStyle(0x000000);
      gLeftWalk.fillRect(13, 9, 2, 2);
      // Front leg (toward travel direction - left)
      gLeftWalk.fillStyle(0x2c3e50);
      gLeftWalk.fillRect(8, 24, 5, 4);
      gLeftWalk.fillStyle(0x8b4513);
      gLeftWalk.fillRect(8, 28, 5, 2);
      // Back leg (trailing - right)
      gLeftWalk.fillStyle(0x2c3e50);
      gLeftWalk.fillRect(19, 24, 5, 4);
      gLeftWalk.fillStyle(0x8b4513);
      gLeftWalk.fillRect(19, 28, 5, 2);
      gLeftWalk.generateTexture('player_left_walk', TILE_SIZE, TILE_SIZE);
      gLeftWalk.destroy();
    }

    // player_right_walk: side view, horizontal leg splay in direction of travel
    if (!this.textures.exists('player_right_walk')) {
      const gRightWalk = this.add.graphics();
      // Upper body (identical to player_right)
      gRightWalk.fillStyle(0x4a90e2);
      gRightWalk.fillRect(10, 14, 12, 10);
      gRightWalk.fillStyle(0xfdbcb4);
      gRightWalk.fillRect(12, 6, 8, 8);
      gRightWalk.fillStyle(0x4a90e2);
      gRightWalk.fillRect(11, 5, 10, 3);
      gRightWalk.fillRect(10, 6, 2, 4);
      gRightWalk.fillRect(20, 6, 2, 4);
      gRightWalk.fillStyle(0x000000);
      gRightWalk.fillRect(17, 9, 2, 2);
      // Front leg (toward travel direction - right)
      gRightWalk.fillStyle(0x2c3e50);
      gRightWalk.fillRect(19, 24, 5, 4);
      gRightWalk.fillStyle(0x8b4513);
      gRightWalk.fillRect(19, 28, 5, 2);
      // Back leg (trailing - left)
      gRightWalk.fillStyle(0x2c3e50);
      gRightWalk.fillRect(8, 24, 5, 4);
      gRightWalk.fillStyle(0x8b4513);
      gRightWalk.fillRect(8, 28, 5, 2);
      gRightWalk.generateTexture('player_right_walk', TILE_SIZE, TILE_SIZE);
      gRightWalk.destroy();
    }
  }

  private generateParticleTexture(): void {
    if (this.textures.exists('particle_circle')) return;
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(3, 3, 3);   // 6x6 white circle, tinted at emit time
    g.generateTexture('particle_circle', 6, 6);
    g.destroy();
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
