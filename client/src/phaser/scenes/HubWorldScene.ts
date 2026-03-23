import Phaser from 'phaser';
import { eventBridge, BRIDGE_EVENTS } from '../EventBridge';

const TILE_SIZE = 32;
const COLS = 20;
const ROWS = 15;
const MOVE_SPEED = 120; // pixels per second

/**
 * HubWorldScene: Hospital lobby hub world.
 * Player walks around and can enter two doors:
 *   - Left door: Privacy Quest (exploration game)
 *   - Right door: Breach Defense (tower defense game)
 */
export class HubWorldScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private nearDoor: 'privacy-quest' | 'breach-defense' | null = null;
  private promptText!: Phaser.GameObjects.Text;
  private titleText!: Phaser.GameObjects.Text;
  private bgMusic?: Phaser.Sound.BaseSound;
  private readonly musicBaseVolume = 0.3;
  // Idle frame index per direction: down=0, left=3, right=6, up=9 (row*3+0)
  private lastFacingFrame = 0;

  constructor() {
    super({ key: 'HubWorld' });
  }

  create() {
    // Floor
    const floorGraphics = this.add.graphics();
    floorGraphics.fillStyle(0xd4c5a9, 1); // Warm tile floor
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const shade = (x + y) % 2 === 0 ? 0xd4c5a9 : 0xcabc9e;
        floorGraphics.fillStyle(shade, 1);
        floorGraphics.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }

    // Walls (top, left, right, bottom perimeter)
    this.walls = this.physics.add.staticGroup();
    this.createWalls();

    // Title
    this.titleText = this.add.text(COLS * TILE_SIZE / 2, 44, 'HIPAA TRAINING CENTER', {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      color: '#1a1a2e',
    });
    this.titleText.setOrigin(0.5);

    // Subtitle
    this.add.text(COLS * TILE_SIZE / 2, 62, 'Choose your training module', {
      fontFamily: '"Press Start 2P"',
      fontSize: '7px',
      color: '#666666',
    }).setOrigin(0.5);

    // -- LEFT DOOR: Privacy Quest --
    this.createDoor(3, 3, 'PRIVACY\nQUEST', 0x4a90e2, 'Explore hospital rooms\nand learn HIPAA Privacy');

    // -- RIGHT DOOR: Breach Defense --
    this.createDoor(14, 3, 'BREACH\nDEFENSE', 0xff6b9d, 'Defend the network\nfrom cyber threats');

    // Decorative elements
    this.createFurniture();

    // Receptionist NPC near center — frame 0 = idle facing down
    const npc = this.add.sprite(10 * TILE_SIZE, 8 * TILE_SIZE, 'npc_receptionist_sheet', 0);
    npc.setOrigin(0, 0);

    // Idle breathing tween for receptionist
    this.tweens.add({
      targets: npc,
      scaleY: { from: 1.0, to: 1.02 },
      duration: 1500 + Math.random() * 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // NPC speech bubble
    this.add.text(10 * TILE_SIZE + 16, 7 * TILE_SIZE - 4, 'Welcome!', {
      fontFamily: '"Press Start 2P"',
      fontSize: '6px',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 4, y: 3 },
    }).setOrigin(0.5);

    // Player — frame 0 = idle facing down
    this.player = this.physics.add.sprite(
      10 * TILE_SIZE,
      11 * TILE_SIZE,
      'player_sheet',
      0, // frame 0 = idle facing down
    );
    this.player.setOrigin(0, 0);

    // Idle breathing tween for player
    this.tweens.add({
      targets: this.player,
      scaleY: { from: 1.0, to: 1.02 },
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    playerBody.setSize(24, 24);
    playerBody.setOffset(4, 4);
    playerBody.setCollideWorldBounds(true);

    // Collisions
    this.physics.add.collider(this.player, this.walls);
    this.physics.world.setBounds(0, 0, COLS * TILE_SIZE, ROWS * TILE_SIZE);

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Interaction prompt (hidden by default)
    this.promptText = this.add.text(COLS * TILE_SIZE / 2, ROWS * TILE_SIZE - 20, '', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: '#ffffff',
      backgroundColor: '#1a1a2e',
      padding: { x: 8, y: 4 },
    });
    this.promptText.setOrigin(0.5);
    this.promptText.setVisible(false);
    this.promptText.setDepth(10);

    // Sync mute state from localStorage before any audio plays (avoids race with React useEffect)
    if (localStorage.getItem('sfx_muted') === 'true') {
      this.sound.mute = true;
    }

    // Background music — fade in gently after a beat
    const userVol = parseFloat(localStorage.getItem('music_volume') ?? '0.6');
    const targetVol = this.musicBaseVolume * userVol;
    if (userVol > 0) {
      this.bgMusic = this.sound.add('music_hub', { loop: true, volume: 0 });
      const playMusic = () => {
        if (!this.bgMusic || !this.scene.isActive()) return;
        this.bgMusic.play();
        this.tweens.add({ targets: this.bgMusic, volume: targetVol, duration: 1500, ease: 'Sine.easeIn' });
      };
      if (this.sound.locked) {
        this.sound.once('unlocked', playMusic);
      } else {
        this.time.delayedCall(300, playMusic);
      }
    }

    eventBridge.on(BRIDGE_EVENTS.REACT_SET_MUSIC_VOLUME, this.onMusicVolume, this);
    eventBridge.emit(BRIDGE_EVENTS.SCENE_READY, 'HubWorld');
  }

  shutdown() {
    if (this.bgMusic) {
      this.bgMusic.stop();
      this.bgMusic = undefined;
    }
    eventBridge.off(BRIDGE_EVENTS.REACT_SET_MUSIC_VOLUME, this.onMusicVolume, this);
  }

  private onMusicVolume = (vol: number) => {
    if (this.bgMusic) {
      (this.bgMusic as Phaser.Sound.WebAudioSound).volume = this.musicBaseVolume * vol;
    }
  };

  update() {
    // Idle frame indices per direction: down=0, left=3, right=6, up=9 (row*3+0)
    const IDLE_DOWN = 0; const IDLE_LEFT = 3; const IDLE_RIGHT = 6; const IDLE_UP = 9;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);

    // Movement
    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;
    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;

    if (left) {
      body.setVelocityX(-MOVE_SPEED);
      this.player.anims.play('walk_left', true);
      this.lastFacingFrame = IDLE_LEFT;
    } else if (right) {
      body.setVelocityX(MOVE_SPEED);
      this.player.anims.play('walk_right', true);
      this.lastFacingFrame = IDLE_RIGHT;
    }

    if (up) {
      body.setVelocityY(-MOVE_SPEED);
      if (!left && !right) {
        this.player.anims.play('walk_up', true);
        this.lastFacingFrame = IDLE_UP;
      }
    } else if (down) {
      body.setVelocityY(MOVE_SPEED);
      if (!left && !right) {
        this.player.anims.play('walk_down', true);
        this.lastFacingFrame = IDLE_DOWN;
      }
    }

    if (!left && !right && !up && !down) {
      this.player.anims.stop();
      this.player.setFrame(this.lastFacingFrame);
    }

    // Normalize diagonal movement
    if ((left || right) && (up || down)) {
      body.velocity.normalize().scale(MOVE_SPEED);
    }

    // Check door proximity
    this.checkDoorProximity();

    // Interact
    if (Phaser.Input.Keyboard.JustDown(this.interactKey) && this.nearDoor) {
      eventBridge.emit(BRIDGE_EVENTS.HUB_SELECT_GAME, this.nearDoor);
    }
  }

  private checkDoorProximity() {
    const px = this.player.x + 16;
    const py = this.player.y + 16;

    // Privacy Quest door zone (left side, tiles 2-6, rows 3-5)
    const leftDoorX = 4 * TILE_SIZE;
    const leftDoorY = 4 * TILE_SIZE;
    const dxLeft = Math.abs(px - leftDoorX);
    const dyLeft = Math.abs(py - leftDoorY);

    // Breach Defense door zone (right side, tiles 13-17, rows 3-5)
    const rightDoorX = 15 * TILE_SIZE;
    const rightDoorY = 4 * TILE_SIZE;
    const dxRight = Math.abs(px - rightDoorX);
    const dyRight = Math.abs(py - rightDoorY);

    const threshold = 2.5 * TILE_SIZE;

    if (dxLeft < threshold && dyLeft < threshold) {
      this.nearDoor = 'privacy-quest';
      this.promptText.setText('[SPACE] Enter Privacy Quest');
      this.promptText.setVisible(true);
    } else if (dxRight < threshold && dyRight < threshold) {
      this.nearDoor = 'breach-defense';
      this.promptText.setText('[SPACE] Enter Breach Defense');
      this.promptText.setVisible(true);
    } else {
      this.nearDoor = null;
      this.promptText.setVisible(false);
    }
  }

  private createWalls() {
    // Top wall
    for (let x = 0; x < COLS; x++) {
      const wall = this.add.rectangle(x * TILE_SIZE + 16, 16, TILE_SIZE, TILE_SIZE, 0x5d4e37);
      wall.setStrokeStyle(1, 0x4a3f2e);
      this.walls.add(wall);
    }

    // Bottom wall
    for (let x = 0; x < COLS; x++) {
      const wall = this.add.rectangle(x * TILE_SIZE + 16, (ROWS - 1) * TILE_SIZE + 16, TILE_SIZE, TILE_SIZE, 0x5d4e37);
      wall.setStrokeStyle(1, 0x4a3f2e);
      this.walls.add(wall);
    }

    // Left wall (skip top/bottom, already covered)
    for (let y = 1; y < ROWS - 1; y++) {
      const wall = this.add.rectangle(16, y * TILE_SIZE + 16, TILE_SIZE, TILE_SIZE, 0x5d4e37);
      wall.setStrokeStyle(1, 0x4a3f2e);
      this.walls.add(wall);
    }

    // Right wall
    for (let y = 1; y < ROWS - 1; y++) {
      const wall = this.add.rectangle((COLS - 1) * TILE_SIZE + 16, y * TILE_SIZE + 16, TILE_SIZE, TILE_SIZE, 0x5d4e37);
      wall.setStrokeStyle(1, 0x4a3f2e);
      this.walls.add(wall);
    }
  }

  private createDoor(tileX: number, tileY: number, label: string, color: number, description: string) {
    const x = tileX * TILE_SIZE;
    const y = tileY * TILE_SIZE;
    const doorWidth = 3 * TILE_SIZE;
    const doorHeight = 3 * TILE_SIZE;

    // Door frame
    const frame = this.add.rectangle(
      x + doorWidth / 2, y + doorHeight / 2,
      doorWidth + 8, doorHeight + 8,
      0x333333
    );
    frame.setStrokeStyle(3, 0x000000);

    // Door surface
    const door = this.add.rectangle(
      x + doorWidth / 2, y + doorHeight / 2,
      doorWidth, doorHeight,
      color
    );
    door.setStrokeStyle(2, 0x000000);

    // Door handle
    this.add.circle(x + doorWidth - 8, y + doorHeight / 2, 4, 0xffd700);

    // Label
    this.add.text(x + doorWidth / 2, y + doorHeight / 2 - 10, label, {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5);

    // Description below door
    this.add.text(x + doorWidth / 2, y + doorHeight + 12, description, {
      fontFamily: '"Press Start 2P"',
      fontSize: '5px',
      color: '#444444',
      align: 'center',
      lineSpacing: 4,
    }).setOrigin(0.5, 0);

    // Add door as wall (player walks up to it, doesn't walk through)
    const wallBlock = this.add.rectangle(x + doorWidth / 2, y + doorHeight / 2, doorWidth, doorHeight);
    wallBlock.setVisible(false);
    this.walls.add(wallBlock);
  }

  private createFurniture() {
    // Reception desk (center)
    const deskX = 8 * TILE_SIZE;
    const deskY = 8 * TILE_SIZE;
    const desk = this.add.rectangle(deskX + TILE_SIZE * 2, deskY + TILE_SIZE / 2, TILE_SIZE * 4, TILE_SIZE, 0x8b6f47);
    desk.setStrokeStyle(2, 0x5d4e37);
    this.walls.add(desk);

    // Potted plants
    this.createPlant(2, 7);
    this.createPlant(17, 7);
    this.createPlant(2, 12);
    this.createPlant(17, 12);

    // Waiting chairs (bottom area)
    for (let i = 0; i < 3; i++) {
      const chair = this.add.rectangle(
        (5 + i * 2) * TILE_SIZE + 16, 12 * TILE_SIZE + 16,
        TILE_SIZE - 4, TILE_SIZE - 4, 0x3498db
      );
      chair.setStrokeStyle(1, 0x2980b9);
      this.walls.add(chair);
    }
    for (let i = 0; i < 3; i++) {
      const chair = this.add.rectangle(
        (12 + i * 2) * TILE_SIZE + 16, 12 * TILE_SIZE + 16,
        TILE_SIZE - 4, TILE_SIZE - 4, 0x3498db
      );
      chair.setStrokeStyle(1, 0x2980b9);
      this.walls.add(chair);
    }

    // Info board (left wall)
    this.add.rectangle(1.5 * TILE_SIZE, 5 * TILE_SIZE, TILE_SIZE - 4, TILE_SIZE * 2, 0xecf0f1).setStrokeStyle(2, 0xbdc3c7);

    // Info board (right wall)
    this.add.rectangle((COLS - 1.5) * TILE_SIZE, 5 * TILE_SIZE, TILE_SIZE - 4, TILE_SIZE * 2, 0xecf0f1).setStrokeStyle(2, 0xbdc3c7);
  }

  private createPlant(tileX: number, tileY: number) {
    const x = tileX * TILE_SIZE + 16;
    const y = tileY * TILE_SIZE + 16;

    // Pot
    this.add.rectangle(x, y + 6, 16, 12, 0xb5651d).setStrokeStyle(1, 0x8b4513);
    // Foliage
    this.add.circle(x, y - 4, 10, 0x27ae60);
    this.add.circle(x - 6, y, 7, 0x2ecc71);
    this.add.circle(x + 6, y, 7, 0x2ecc71);

    // Add as obstacle
    const plantBlock = this.add.rectangle(x, y, TILE_SIZE - 4, TILE_SIZE - 4);
    plantBlock.setVisible(false);
    this.walls.add(plantBlock);
  }
}
