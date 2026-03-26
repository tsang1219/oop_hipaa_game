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
  private transitioning = false;
  private lastFootstepTime = 0;

  constructor() {
    super({ key: 'HubWorld' });
  }

  create() {
    // Floor — polished hospital linoleum with beveled tiles
    const floorGraphics = this.add.graphics();
    const floorShades = [0xd4c5a9, 0xcabc9e, 0xd0c0a0, 0xc8b896];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const tx = x * TILE_SIZE;
        const ty = y * TILE_SIZE;
        // Pick shade from a pseudo-random but deterministic pattern
        const shadeIdx = ((x * 3 + y * 7) % 4);
        const baseColor = floorShades[shadeIdx];

        // Fill base tile
        floorGraphics.fillStyle(baseColor, 1);
        floorGraphics.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);

        // Beveled edges — lighter top/left highlight
        floorGraphics.fillStyle(0xdfd3be, 0.6);
        floorGraphics.fillRect(tx, ty, TILE_SIZE, 1); // top edge
        floorGraphics.fillRect(tx, ty, 1, TILE_SIZE); // left edge

        // Beveled edges — darker bottom/right shadow
        floorGraphics.fillStyle(0xb0a48a, 0.6);
        floorGraphics.fillRect(tx, ty + TILE_SIZE - 1, TILE_SIZE, 1); // bottom edge
        floorGraphics.fillRect(tx + TILE_SIZE - 1, ty, 1, TILE_SIZE); // right edge

        // Subtle specular highlight on some tiles for polish effect
        if ((x + y) % 5 === 0) {
          floorGraphics.fillStyle(0xffffff, 0.08);
          floorGraphics.fillRect(tx + 8, ty + 6, 6, 2);
        }

        // Subtle cross-pattern on alternating tiles
        if ((x + y) % 2 === 0) {
          floorGraphics.fillStyle(0xdfd3be, 0.12);
          floorGraphics.fillRect(tx + 4, ty + 15, 24, 1);
        }
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

    // Subtle breathing animation on the title
    this.tweens.add({
      targets: this.titleText,
      alpha: { from: 1, to: 0.85 },
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

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

    // Random idle head turn — NPC occasionally faces different direction
    this.time.addEvent({
      delay: 3000 + Math.random() * 4000,
      callback: () => {
        if (!npc || !npc.active) return;
        // Randomly pick a direction: 0=down, 3=left, 6=right, 9=up (frame indices)
        const directions = [0, 3, 6]; // Don't turn up (looks weird)
        const frame = directions[Math.floor(Math.random() * directions.length)];
        npc.setFrame(frame);
      },
      loop: true
    });

    // NPC speech bubble with typing effect
    const bubbleBg = this.add.rectangle(
      10 * TILE_SIZE + 16, 7 * TILE_SIZE - 4,
      56, 16, 0x333333
    ).setOrigin(0.5).setDepth(8);

    const welcomeText = this.add.text(10 * TILE_SIZE + 16, 7 * TILE_SIZE - 4, '', {
      fontFamily: '"Press Start 2P"',
      fontSize: '6px',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(9);

    // Typing effect
    const fullText = 'Welcome!';
    let charIndex = 0;
    this.time.addEvent({
      delay: 80,
      callback: () => {
        charIndex++;
        welcomeText.setText(fullText.slice(0, charIndex));
      },
      repeat: fullText.length - 1
    });

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

    // Ambient dust particles — very subtle floating motes
    const dustEmitter = this.add.particles(0, 0, 'particle_circle', {
      x: { min: TILE_SIZE, max: (COLS - 1) * TILE_SIZE },
      y: { min: TILE_SIZE, max: (ROWS - 1) * TILE_SIZE },
      speedY: { min: -15, max: -5 },
      speedX: { min: -3, max: 3 },
      alpha: { start: 0.15, end: 0.05 },
      scale: { start: 0.3, end: 0.1 },
      lifespan: { min: 4000, max: 7000 },
      frequency: 650,
      tint: 0xd4c5a9,
    });
    dustEmitter.setDepth(5);

    // Subtle floor shine — tiny specular highlights on scattered tiles
    const shineGfx = this.add.graphics().setDepth(1);
    for (let y = 1; y < ROWS - 1; y++) {
      for (let x = 1; x < COLS - 1; x++) {
        // Place a shine on roughly every 7th-8th tile using deterministic hash
        if (((x * 13 + y * 29) % 7) === 0) {
          const sx = x * TILE_SIZE + 10 + ((x * 7 + y * 3) % 12);
          const sy = y * TILE_SIZE + 8 + ((x * 5 + y * 11) % 14);
          shineGfx.fillStyle(0xffffff, 0.06 + ((x + y) % 3) * 0.01);
          shineGfx.fillRect(sx, sy, 2, 2);
        }
      }
    }

    // Fade-in from black on scene entrance
    this.cameras.main.fadeIn(600, 0, 0, 0);

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

    // Footstep sound + dust puff
    const isMoving = left || right || up || down;
    if (isMoving && this.time.now - this.lastFootstepTime > 350) {
      this.sound.play('sfx_footstep', { volume: 0.25 });
      this.lastFootstepTime = this.time.now;

      // Footstep dust puff
      if (this.textures.exists('particle_circle')) {
        const dustEmitter = this.add.particles(
          this.player.x + 16, this.player.y + 28, 'particle_circle', {
          speed: { min: 5, max: 15 },
          angle: { min: 220, max: 320 },
          scale: { start: 0.3, end: 0 },
          alpha: { start: 0.2, end: 0 },
          lifespan: 300,
          tint: 0xccbb99,
          frequency: -1,
        });
        dustEmitter.setDepth(1);
        dustEmitter.explode(2);
        this.time.delayedCall(400, () => {
          if (dustEmitter && dustEmitter.active) dustEmitter.destroy();
        });
      }
    }

    // Check door proximity
    this.checkDoorProximity();

    // Interact
    if (Phaser.Input.Keyboard.JustDown(this.interactKey) && this.nearDoor && !this.transitioning) {
      this.transitioning = true;

      // Dramatic door enter transition
      this.cameras.main.flash(300, 255, 255, 255, false);
      this.cameras.main.fade(400, 0, 0, 0);

      // Brief pause for the fade, then emit
      this.time.delayedCall(350, () => {
        eventBridge.emit(BRIDGE_EVENTS.HUB_SELECT_GAME, this.nearDoor);
      });
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
    const wallGfx = this.add.graphics();

    const drawWallTile = (tx: number, ty: number, isTop: boolean, isBottom: boolean, isLeft: boolean, isRight: boolean) => {
      const wx = tx * TILE_SIZE;
      const wy = ty * TILE_SIZE;

      // Base wall color with subtle variation
      const shade = (tx + ty) % 2 === 0 ? 0x5d4e37 : 0x605139;
      wallGfx.fillStyle(shade, 1);
      wallGfx.fillRect(wx, wy, TILE_SIZE, TILE_SIZE);

      // Mortar lines between bricks — horizontal
      wallGfx.fillStyle(0x4a3f2e, 0.5);
      wallGfx.fillRect(wx, wy + Math.floor(TILE_SIZE / 2), TILE_SIZE, 1);

      // Mortar lines — vertical offset pattern (brick stagger)
      const vOffset = ty % 2 === 0 ? 0 : Math.floor(TILE_SIZE / 2);
      wallGfx.fillRect(wx + vOffset, wy, 1, TILE_SIZE);
      if (vOffset === 0) {
        wallGfx.fillRect(wx + TILE_SIZE - 1, wy, 1, TILE_SIZE);
      }

      // 1px highlight at wall top edge (where wall meets ceiling/void)
      if (isTop || ty === 0) {
        wallGfx.fillStyle(0x7a6b52, 0.8);
        wallGfx.fillRect(wx, wy, TILE_SIZE, 1);
      }

      // 2px darker shadow at wall base (where wall meets floor)
      if (isBottom || ty === ROWS - 1) {
        wallGfx.fillStyle(0x2a2218, 0.8);
        wallGfx.fillRect(wx, wy + TILE_SIZE - 2, TILE_SIZE, 2);
      }

      // Interior-facing shadow for left/right walls
      if (isLeft) {
        wallGfx.fillStyle(0x2a2218, 0.6);
        wallGfx.fillRect(wx + TILE_SIZE - 2, wy, 2, TILE_SIZE);
      }
      if (isRight) {
        wallGfx.fillStyle(0x2a2218, 0.6);
        wallGfx.fillRect(wx, wy, 2, TILE_SIZE);
      }

      // Physics wall body
      const wall = this.add.rectangle(wx + 16, wy + 16, TILE_SIZE, TILE_SIZE);
      wall.setVisible(false);
      this.walls.add(wall);
    };

    // Top wall
    for (let x = 0; x < COLS; x++) {
      drawWallTile(x, 0, true, true, false, false);
    }
    // Bottom wall
    for (let x = 0; x < COLS; x++) {
      drawWallTile(x, ROWS - 1, true, true, false, false);
    }
    // Left wall
    for (let y = 1; y < ROWS - 1; y++) {
      drawWallTile(0, y, false, false, true, false);
    }
    // Right wall
    for (let y = 1; y < ROWS - 1; y++) {
      drawWallTile(COLS - 1, y, false, false, false, true);
    }

    // Floor shadow strip along interior base of walls (ambient occlusion effect)
    const shadowGfx = this.add.graphics();
    shadowGfx.fillStyle(0x000000, 0.08);
    // Along top wall interior
    shadowGfx.fillRect(TILE_SIZE, TILE_SIZE, (COLS - 2) * TILE_SIZE, 3);
    // Along bottom wall interior
    shadowGfx.fillRect(TILE_SIZE, (ROWS - 2) * TILE_SIZE + TILE_SIZE - 3, (COLS - 2) * TILE_SIZE, 3);
    // Along left wall interior
    shadowGfx.fillRect(TILE_SIZE, TILE_SIZE, 3, (ROWS - 2) * TILE_SIZE);
    // Along right wall interior
    shadowGfx.fillRect((COLS - 1) * TILE_SIZE - 3, TILE_SIZE, 3, (ROWS - 2) * TILE_SIZE);
  }

  private createDoor(tileX: number, tileY: number, label: string, color: number, description: string) {
    const x = tileX * TILE_SIZE;
    const y = tileY * TILE_SIZE;
    const doorWidth = 3 * TILE_SIZE;
    const doorHeight = 3 * TILE_SIZE;
    const cx = x + doorWidth / 2;
    const cy = y + doorHeight / 2;
    const gfx = this.add.graphics();

    // Drop shadow behind entire door area
    gfx.fillStyle(0x000000, 0.25);
    gfx.fillRect(x - 2 + 3, y - 2 + 3, doorWidth + 12, doorHeight + 12);

    // Outer door frame — thick decorative trim
    gfx.fillStyle(0x444444, 1);
    gfx.fillRect(x - 6, y - 6, doorWidth + 12, doorHeight + 12);
    // Frame highlight (top/left)
    gfx.fillStyle(0x666666, 1);
    gfx.fillRect(x - 6, y - 6, doorWidth + 12, 2);
    gfx.fillRect(x - 6, y - 6, 2, doorHeight + 12);
    // Frame shadow (bottom/right)
    gfx.fillStyle(0x222222, 1);
    gfx.fillRect(x - 6, y + doorHeight + 4, doorWidth + 12, 2);
    gfx.fillRect(x + doorWidth + 4, y - 6, 2, doorHeight + 12);

    // Inner frame — recessed border
    gfx.fillStyle(0x555555, 1);
    gfx.fillRect(x - 2, y - 2, doorWidth + 4, doorHeight + 4);

    // Door surface with gradient-like bands for depth
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    // Slightly darker top band
    const darker = ((Math.max(0, r - 25) << 16) | (Math.max(0, g - 25) << 8) | Math.max(0, b - 25));
    const lighter = ((Math.min(255, r + 20) << 16) | (Math.min(255, g + 20) << 8) | Math.min(255, b + 20));

    gfx.fillStyle(color, 1);
    gfx.fillRect(x, y, doorWidth, doorHeight);

    // Top highlight strip
    gfx.fillStyle(lighter, 0.5);
    gfx.fillRect(x, y, doorWidth, 4);
    // Bottom shadow strip
    gfx.fillStyle(darker, 0.6);
    gfx.fillRect(x, y + doorHeight - 4, doorWidth, 4);
    // Left highlight
    gfx.fillStyle(lighter, 0.3);
    gfx.fillRect(x, y, 2, doorHeight);
    // Right shadow
    gfx.fillStyle(darker, 0.4);
    gfx.fillRect(x + doorWidth - 2, y, 2, doorHeight);

    // Panel insets on door surface (decorative rectangles like real doors)
    gfx.fillStyle(darker, 0.3);
    gfx.fillRect(x + 8, y + 8, doorWidth - 16, Math.floor(doorHeight * 0.35));
    gfx.fillRect(x + 8, y + doorHeight - 8 - Math.floor(doorHeight * 0.35), doorWidth - 16, Math.floor(doorHeight * 0.35));
    // Panel inset highlights
    gfx.fillStyle(lighter, 0.2);
    gfx.fillRect(x + 8, y + 8, doorWidth - 16, 1);
    gfx.fillRect(x + 8, y + doorHeight - 8 - Math.floor(doorHeight * 0.35), doorWidth - 16, 1);

    // Door handle — metallic look
    gfx.fillStyle(0xdaa520, 1);
    gfx.fillCircle(x + doorWidth - 12, cy, 5);
    gfx.fillStyle(0xffd700, 1);
    gfx.fillCircle(x + doorWidth - 13, cy - 1, 3);
    gfx.fillStyle(0xffecb3, 0.8);
    gfx.fillCircle(x + doorWidth - 14, cy - 2, 1);

    // Floor threshold / mat below door
    gfx.fillStyle(0x6d5d3a, 1);
    gfx.fillRect(x - 2, y + doorHeight + 6, doorWidth + 4, 6);
    gfx.fillStyle(0x7d6d4a, 0.8);
    gfx.fillRect(x - 2, y + doorHeight + 6, doorWidth + 4, 1);
    gfx.fillStyle(0x4d3d2a, 0.6);
    gfx.fillRect(x - 2, y + doorHeight + 11, doorWidth + 4, 1);

    // Sign background with glow effect
    const signW = doorWidth - 8;
    const signH = 28;
    const signX = cx - signW / 2;
    const signY = cy - 18;

    // Glow layers (outer to inner)
    gfx.fillStyle(color, 0.15);
    gfx.fillRect(signX - 4, signY - 4, signW + 8, signH + 8);
    gfx.fillStyle(color, 0.1);
    gfx.fillRect(signX - 6, signY - 6, signW + 12, signH + 12);

    // Sign plate
    gfx.fillStyle(0x1a1a2e, 0.85);
    gfx.fillRect(signX, signY, signW, signH);
    // Sign border highlight
    gfx.fillStyle(0xffffff, 0.2);
    gfx.fillRect(signX, signY, signW, 1);
    gfx.fillRect(signX, signY, 1, signH);
    gfx.fillStyle(0x000000, 0.3);
    gfx.fillRect(signX, signY + signH - 1, signW, 1);
    gfx.fillRect(signX + signW - 1, signY, 1, signH);

    // Label text — drop shadow then white text
    const shadowLabel = this.add.text(cx + 1, cy - 9, label, {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: '#000000',
      align: 'center',
    }).setOrigin(0.5).setAlpha(0.5);

    const labelText = this.add.text(cx, cy - 10, label, {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5);

    // Subtle pulse glow on the sign label
    this.tweens.add({
      targets: labelText,
      alpha: { from: 1.0, to: 0.7 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Description below door (with drop shadow)
    this.add.text(x + doorWidth / 2 + 1, y + doorHeight + 20, description, {
      fontFamily: '"Press Start 2P"',
      fontSize: '5px',
      color: '#222222',
      align: 'center',
      lineSpacing: 4,
    }).setOrigin(0.5, 0).setAlpha(0.4);

    this.add.text(x + doorWidth / 2, y + doorHeight + 19, description, {
      fontFamily: '"Press Start 2P"',
      fontSize: '5px',
      color: '#444444',
      align: 'center',
      lineSpacing: 4,
    }).setOrigin(0.5, 0);

    // Add door as wall (player walks up to it, doesn't walk through)
    const wallBlock = this.add.rectangle(cx, cy, doorWidth, doorHeight);
    wallBlock.setVisible(false);
    this.walls.add(wallBlock);

    // Pulsing door glow
    const doorGlow = this.add.rectangle(
      tileX * TILE_SIZE + TILE_SIZE * 1.5,
      tileY * TILE_SIZE + TILE_SIZE * 1.5,
      TILE_SIZE * 3 + 4, TILE_SIZE * 3 + 4
    ).setStrokeStyle(2, color, 0).setFillStyle(color, 0).setDepth(0);

    this.tweens.add({
      targets: doorGlow,
      strokeAlpha: 0.3,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createFurniture() {
    const gfx = this.add.graphics();

    // Reception desk (center) — detailed hospital front desk
    const deskX = 8 * TILE_SIZE;
    const deskY = 8 * TILE_SIZE;
    const deskW = TILE_SIZE * 4;
    const deskH = TILE_SIZE;
    const deskCx = deskX + TILE_SIZE * 2;
    const deskCy = deskY + TILE_SIZE / 2;

    // Desk shadow on floor
    gfx.fillStyle(0x000000, 0.1);
    gfx.fillRect(deskX + 3, deskY + 3, deskW, deskH);

    // Desk body — wood grain effect
    gfx.fillStyle(0x8b6f47, 1);
    gfx.fillRect(deskX, deskY, deskW, deskH);

    // Wood grain lines
    gfx.fillStyle(0x7a6039, 0.3);
    for (let i = 0; i < 5; i++) {
      gfx.fillRect(deskX + 2, deskY + 3 + i * 6, deskW - 4, 1);
    }

    // Desk top edge highlight
    gfx.fillStyle(0xa88860, 0.8);
    gfx.fillRect(deskX, deskY, deskW, 2);
    // Desk left edge highlight
    gfx.fillStyle(0x9a7a50, 0.5);
    gfx.fillRect(deskX, deskY, 2, deskH);
    // Desk bottom/right shadow
    gfx.fillStyle(0x5d4e37, 0.8);
    gfx.fillRect(deskX, deskY + deskH - 2, deskW, 2);
    gfx.fillRect(deskX + deskW - 2, deskY, 2, deskH);

    // Front panel detail (facing player)
    gfx.fillStyle(0x7a6039, 0.5);
    gfx.fillRect(deskX + 4, deskY + deskH - 8, deskW - 8, 6);

    // Desktop items — small computer monitor
    gfx.fillStyle(0x333333, 1);
    gfx.fillRect(deskX + 10, deskY - 10, 20, 14);
    gfx.fillStyle(0x4488aa, 1);
    gfx.fillRect(deskX + 12, deskY - 8, 16, 10);
    // Monitor stand
    gfx.fillStyle(0x444444, 1);
    gfx.fillRect(deskX + 17, deskY + 4, 6, 3);

    // Desktop items — small stack of papers
    gfx.fillStyle(0xf5f5f0, 1);
    gfx.fillRect(deskX + deskW - 28, deskY - 4, 14, 10);
    gfx.fillStyle(0xe8e8e0, 1);
    gfx.fillRect(deskX + deskW - 27, deskY - 3, 14, 10);
    // Lines on paper
    gfx.fillStyle(0xcccccc, 0.5);
    gfx.fillRect(deskX + deskW - 25, deskY, 8, 1);
    gfx.fillRect(deskX + deskW - 25, deskY + 3, 8, 1);

    // "RECEPTION" label on desk front
    this.add.text(deskCx, deskCy + 2, 'RECEPTION', {
      fontFamily: '"Press Start 2P"',
      fontSize: '5px',
      color: '#c8b896',
    }).setOrigin(0.5);

    // Desk physics body
    const deskBody = this.add.rectangle(deskCx, deskCy, deskW, deskH);
    deskBody.setVisible(false);
    this.walls.add(deskBody);

    // Potted plants
    this.createPlant(2, 7);
    this.createPlant(17, 7);
    this.createPlant(2, 12);
    this.createPlant(17, 12);

    // Waiting chairs (bottom area) — using SpriteFactory furn_chair texture
    const placeChair = (tx: number, ty: number) => {
      const cx = tx * TILE_SIZE;
      const cy = ty * TILE_SIZE;
      this.add.sprite(cx, cy, 'furn_chair').setOrigin(0, 0).setDepth(10);

      // Physics body (centered on tile)
      const chairBody = this.add.rectangle(cx + 16, cy + 16, TILE_SIZE - 4, TILE_SIZE - 4);
      chairBody.setVisible(false);
      this.walls.add(chairBody);
    };

    for (let i = 0; i < 3; i++) {
      placeChair(5 + i * 2, 12);
    }
    for (let i = 0; i < 3; i++) {
      placeChair(12 + i * 2, 12);
    }

    // Info board (left wall) — cork board with pins
    const drawInfoBoard = (bx: number, by: number) => {
      // Board shadow
      gfx.fillStyle(0x000000, 0.15);
      gfx.fillRect(bx - 13, by - TILE_SIZE + 3, TILE_SIZE - 2, TILE_SIZE * 2 + 2);

      // Board backing
      gfx.fillStyle(0xd4a574, 1);
      gfx.fillRect(bx - 14, by - TILE_SIZE, TILE_SIZE - 4, TILE_SIZE * 2);

      // Cork texture
      gfx.fillStyle(0xc49a6c, 0.4);
      gfx.fillRect(bx - 10, by - TILE_SIZE + 4, 8, 8);
      gfx.fillRect(bx - 4, by - 4, 6, 10);
      gfx.fillRect(bx - 12, by + 8, 10, 6);

      // White paper notes pinned
      gfx.fillStyle(0xf8f8f0, 1);
      gfx.fillRect(bx - 10, by - TILE_SIZE + 6, 12, 10);
      gfx.fillStyle(0xf0f0e8, 1);
      gfx.fillRect(bx - 8, by + 4, 10, 8);
      gfx.fillStyle(0xfff8e0, 1);
      gfx.fillRect(bx - 11, by - 8, 11, 9);

      // Colored pins
      gfx.fillStyle(0xe74c3c, 1);
      gfx.fillCircle(bx - 4, by - TILE_SIZE + 6, 2);
      gfx.fillStyle(0x2ecc71, 1);
      gfx.fillCircle(bx - 3, by + 4, 2);
      gfx.fillStyle(0xf1c40f, 1);
      gfx.fillCircle(bx - 5, by - 8, 2);

      // Frame border
      gfx.fillStyle(0x8b7355, 1);
      gfx.fillRect(bx - 14, by - TILE_SIZE, TILE_SIZE - 4, 2);
      gfx.fillRect(bx - 14, by + TILE_SIZE - 2, TILE_SIZE - 4, 2);
      gfx.fillRect(bx - 14, by - TILE_SIZE, 2, TILE_SIZE * 2);
      gfx.fillRect(bx + TILE_SIZE - 18, by - TILE_SIZE, 2, TILE_SIZE * 2);
    };

    drawInfoBoard(Math.floor(1.5 * TILE_SIZE), 5 * TILE_SIZE);
    drawInfoBoard(Math.floor((COLS - 1.5) * TILE_SIZE), 5 * TILE_SIZE);
  }

  private createPlant(tileX: number, tileY: number) {
    const x = tileX * TILE_SIZE + 16;
    const y = tileY * TILE_SIZE + 16;
    const gfx = this.add.graphics();

    // Shadow on floor
    gfx.fillStyle(0x000000, 0.08);
    gfx.fillEllipse(x + 2, y + 13, 18, 6);

    // Pot — terracotta with shading
    // Pot base (wider)
    gfx.fillStyle(0x9e4a1c, 1);
    gfx.fillRect(x - 9, y + 8, 18, 4);
    // Pot body
    gfx.fillStyle(0xb5651d, 1);
    gfx.fillRect(x - 8, y + 1, 16, 10);
    // Pot rim (top lip)
    gfx.fillStyle(0xc47a3a, 1);
    gfx.fillRect(x - 9, y - 1, 18, 3);
    // Pot highlight (left side)
    gfx.fillStyle(0xd4894a, 0.5);
    gfx.fillRect(x - 8, y + 1, 3, 8);
    // Pot shadow (right side)
    gfx.fillStyle(0x8b4513, 0.5);
    gfx.fillRect(x + 5, y + 1, 3, 8);
    // Soil visible at top
    gfx.fillStyle(0x5a3a1a, 1);
    gfx.fillRect(x - 6, y, 12, 2);

    // Stem
    gfx.fillStyle(0x1e8449, 1);
    gfx.fillRect(x - 1, y - 8, 2, 9);

    // Foliage — multiple shades for depth
    // Back leaves (darker)
    gfx.fillStyle(0x1e8449, 1);
    gfx.fillCircle(x - 2, y - 7, 8);
    gfx.fillCircle(x + 2, y - 6, 7);

    // Mid leaves (medium green)
    gfx.fillStyle(0x27ae60, 1);
    gfx.fillCircle(x, y - 9, 7);
    gfx.fillCircle(x - 6, y - 3, 6);
    gfx.fillCircle(x + 6, y - 3, 6);

    // Front leaves (bright green highlights)
    gfx.fillStyle(0x2ecc71, 1);
    gfx.fillCircle(x - 3, y - 10, 4);
    gfx.fillCircle(x + 4, y - 8, 4);
    gfx.fillCircle(x - 5, y - 5, 3);
    gfx.fillCircle(x + 5, y - 5, 3);

    // Leaf highlights (lightest)
    gfx.fillStyle(0x58d68d, 0.6);
    gfx.fillCircle(x - 1, y - 12, 3);
    gfx.fillCircle(x + 3, y - 10, 2);

    // Add as obstacle
    const plantBlock = this.add.rectangle(x, y, TILE_SIZE - 4, TILE_SIZE - 4);
    plantBlock.setVisible(false);
    this.walls.add(plantBlock);
  }
}
