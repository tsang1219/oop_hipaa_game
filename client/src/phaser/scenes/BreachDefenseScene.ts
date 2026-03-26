import Phaser from 'phaser';
import { eventBridge, BRIDGE_EVENTS } from '../EventBridge';
import {
  GRID_COLS, GRID_ROWS, CELL_SIZE, PATHS, TOWERS, THREATS, THREAT_COLORS, WAVES, WAVE_BUDGETS
} from '../../game/breach-defense/constants';

type TowerType = keyof typeof TOWERS;
type ThreatType = keyof typeof THREATS;

interface EnemyData {
  id: string;
  type: ThreatType;
  hp: number;
  maxHp: number;
  pathIndex: number;
  waypointIndex: number;
  speed: number;
  sprite: Phaser.GameObjects.Sprite;
  hpBarBg: Phaser.GameObjects.Rectangle;
  hpBarFill: Phaser.GameObjects.Rectangle;
  flashUntil: number;
  strongFlashUntil: number;
  strongFlashColor: number;
}

interface TowerData {
  id: string;
  type: TowerType;
  gridX: number;
  gridY: number;
  sprite: Phaser.GameObjects.Sprite;
  lastFired: number;
}

interface ProjectileData {
  id: string;
  x: number;
  y: number;
  targetId: string;
  damage: number;
  speed: number;
  color: number;
  graphics: Phaser.GameObjects.Arc;
  isStrong: boolean;
}

interface WaveState {
  enemiesSpawned: number;
  nextSpawnTime: number;
  active: boolean;
  threatIndex: number;
  spawnedPerThreat: number[];
}

type GameState = 'WAITING' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'VICTORY';

export class BreachDefenseScene extends Phaser.Scene {
  // Game state
  private gameState: GameState = 'WAITING';
  private securityScore = 100;
  private budget = 0;
  private wave = 1;
  private grantedStipends = new Set<number>();

  // Entities
  private enemies: EnemyData[] = [];
  private towers: TowerData[] = [];
  private projectiles: ProjectileData[] = [];

  // Wave spawning
  private waveState: WaveState = {
    enemiesSpawned: 0,
    nextSpawnTime: 0,
    active: false,
    threatIndex: 0,
    spawnedPerThreat: []
  };

  // UI elements
  private hoverRect!: Phaser.GameObjects.Rectangle;
  private rangeGraphics!: Phaser.GameObjects.Graphics;
  private selectedTowerType: TowerType | null = null;
  private shownWaveSplashes = new Set<number>();
  private shownWaveStartBanners = new Set<number>();
  private waveKillCount = 0;

  // Kill streak tracking
  private killStreak = 0;
  private lastKillTime = 0;
  private killStreakText?: Phaser.GameObjects.Text;

  // Ambient decorations
  private scanLine?: Phaser.GameObjects.Rectangle;
  private headerText?: Phaser.GameObjects.Text;
  private statusText?: Phaser.GameObjects.Text;
  private statusCursor?: Phaser.GameObjects.Text;

  // Danger vignette for low security score
  private dangerVignette?: Phaser.GameObjects.Graphics;

  // Background music
  private bgMusic?: Phaser.Sound.BaseSound;
  private readonly musicBaseVolume = 0.35;

  // State broadcast throttle
  private lastBroadcast = 0;

  constructor() {
    super({ key: 'BreachDefense' });
  }

  init() {
    this.enemies = [];
    this.towers = [];
    this.projectiles = [];
    this.gameState = 'WAITING';
    this.securityScore = 100;
    this.budget = WAVE_BUDGETS[0] || 150;
    this.wave = 1;
    this.grantedStipends = new Set([1]);
    this.waveState = {
      enemiesSpawned: 0,
      nextSpawnTime: 0,
      active: false,
      threatIndex: 0,
      spawnedPerThreat: []
    };
    this.selectedTowerType = null;
    this.shownWaveSplashes = new Set();
    this.shownWaveStartBanners = new Set();
    this.waveKillCount = 0;
    this.killStreak = 0;
    this.lastKillTime = 0;
    if (this.killStreakText) {
      this.killStreakText.destroy();
      this.killStreakText = undefined;
    }
    this.lastBroadcast = 0;
    if (this.dangerVignette) {
      this.dangerVignette.destroy();
      this.dangerVignette = undefined;
    }
  }

  create() {
    // ── Draw grid ──────────────────────────────────────────────
    const pathSet = new Set<string>();
    PATHS[0].forEach(p => pathSet.add(`${p.x},${p.y}`));

    // Build a direction map for path cells so we can draw directional indicators
    const pathDirMap = new Map<string, { dx: number; dy: number }>();
    for (let i = 0; i < PATHS[0].length - 1; i++) {
      const curr = PATHS[0][i];
      const next = PATHS[0][i + 1];
      pathDirMap.set(`${curr.x},${curr.y}`, { dx: next.x - curr.x, dy: next.y - curr.y });
    }

    const gridGfx = this.add.graphics().setDepth(0);

    // Simple seeded random for deterministic circuit-trace placement
    const seededRand = (x: number, y: number): number => {
      let h = (x * 374761393 + y * 668265263 + 1274126177) | 0;
      h = ((h ^ (h >> 13)) * 1274126177) | 0;
      return (h >>> 0) / 4294967296;
    };

    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const isPath = pathSet.has(`${x},${y}`);
        const cx = x * CELL_SIZE + CELL_SIZE / 2;
        const cy = y * CELL_SIZE + CELL_SIZE / 2;

        // Cell fill: brighter tech-themed colors
        let shade: number;
        if (isPath) {
          shade = (x + y) % 2 === 0 ? 0x3d2d5e : 0x352855;
        } else {
          shade = (x + y) % 2 === 0 ? 0x2a2d4e : 0x252845;
        }

        gridGfx.fillStyle(shade, 1);
        gridGfx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

        // 1px grid lines between cells
        gridGfx.lineStyle(1, 0x3a3d6e, 0.6);
        gridGfx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

        // Path cells get extra visual treatment
        if (isPath) {
          // Subtle inner border to highlight the path lane
          gridGfx.lineStyle(1, 0x6b5b95, 0.3);
          gridGfx.strokeRect(x * CELL_SIZE + 3, y * CELL_SIZE + 3, CELL_SIZE - 6, CELL_SIZE - 6);

          // Directional dot: larger and brighter so the path route is obvious
          const dir = pathDirMap.get(`${x},${y}`);
          if (dir) {
            gridGfx.fillStyle(0x9b8bbf, 0.7);
            gridGfx.fillCircle(cx + dir.dx * 14, cy + dir.dy * 14, 4);
            // Secondary smaller dot closer to center for a "trail" feel
            gridGfx.fillStyle(0x7b6b9f, 0.45);
            gridGfx.fillCircle(cx + dir.dx * 4, cy + dir.dy * 4, 3);
          } else {
            // Last path cell: draw a target-like indicator
            gridGfx.fillStyle(0xbb4444, 0.6);
            gridGfx.fillCircle(cx, cy, 5);
            gridGfx.fillStyle(0xff6666, 0.4);
            gridGfx.fillCircle(cx, cy, 2);
          }
        } else {
          // Non-path cells: faint corner dots for a digital grid feel
          gridGfx.fillStyle(0x4a4d7e, 0.25);
          gridGfx.fillCircle(x * CELL_SIZE + 2, y * CELL_SIZE + 2, 1);

          // Circuit-trace decoration on ~30% of empty cells
          const rVal = seededRand(x, y);
          if (rVal < 0.3) {
            const cellLeft = x * CELL_SIZE;
            const cellTop = y * CELL_SIZE;
            gridGfx.lineStyle(1, 0x3a4d6e, 0.3);
            if (rVal < 0.15) {
              // Horizontal trace with dot at end
              const traceY = cellTop + 20 + Math.floor(seededRand(x + 7, y + 3) * 24);
              const startX = cellLeft + 8;
              const traceLen = 18 + Math.floor(seededRand(x + 13, y + 5) * 20);
              gridGfx.beginPath();
              gridGfx.moveTo(startX, traceY);
              gridGfx.lineTo(startX + traceLen, traceY);
              gridGfx.strokePath();
              gridGfx.fillStyle(0x4a6d8e, 0.35);
              gridGfx.fillCircle(startX + traceLen, traceY, 1.5);
            } else {
              // Vertical trace with dot at end
              const traceX = cellLeft + 20 + Math.floor(seededRand(x + 11, y + 7) * 24);
              const startY = cellTop + 8;
              const traceLen = 18 + Math.floor(seededRand(x + 17, y + 9) * 20);
              gridGfx.beginPath();
              gridGfx.moveTo(traceX, startY);
              gridGfx.lineTo(traceX, startY + traceLen);
              gridGfx.strokePath();
              gridGfx.fillStyle(0x4a6d8e, 0.35);
              gridGfx.fillCircle(traceX, startY + traceLen, 1.5);
            }
          }
        }
      }
    }

    // ── Header bar: network defense grid label ───────────────
    const headerGfx = this.add.graphics().setDepth(8);
    headerGfx.fillStyle(0x0e1020, 0.85);
    headerGfx.fillRect(0, 0, GRID_COLS * CELL_SIZE, 20);
    // Thin bottom border on the header
    headerGfx.lineStyle(1, 0x3a5d8e, 0.6);
    headerGfx.beginPath();
    headerGfx.moveTo(0, 20);
    headerGfx.lineTo(GRID_COLS * CELL_SIZE, 20);
    headerGfx.strokePath();

    this.headerText = this.add.text(GRID_COLS * CELL_SIZE / 2, 10, 'NETWORK DEFENSE GRID', {
      fontFamily: '"Press Start 2P"',
      fontSize: '7px',
      color: '#00d4aa',
      align: 'center'
    }).setOrigin(0.5, 0.5).setDepth(9);

    // Pulse tween on header — subtle alpha oscillation like an active monitor
    this.tweens.add({
      targets: this.headerText,
      alpha: 0.7,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Column labels (A-J) just below the header bar
    const colLabels = 'ABCDEFGHIJ';
    for (let c = 0; c < GRID_COLS; c++) {
      this.add.text(c * CELL_SIZE + CELL_SIZE / 2, 26, colLabels[c], {
        fontFamily: '"Press Start 2P"',
        fontSize: '5px',
        color: '#556688',
        align: 'center'
      }).setOrigin(0.5, 0.5).setDepth(9).setAlpha(0.6);
    }

    // Row labels (1-6) along the left edge
    for (let r = 0; r < GRID_ROWS; r++) {
      this.add.text(4, r * CELL_SIZE + CELL_SIZE / 2, `${r + 1}`, {
        fontFamily: '"Press Start 2P"',
        fontSize: '5px',
        color: '#556688',
        align: 'left'
      }).setOrigin(0, 0.5).setDepth(1).setAlpha(0.6);
    }

    // ── Bottom area: terminal status panel ───────────────────
    const bottomY = GRID_ROWS * CELL_SIZE;
    const bottomH = 96;
    const bottomGfx = this.add.graphics().setDepth(0);
    // Dark background fill
    bottomGfx.fillStyle(0x141628, 1);
    bottomGfx.fillRect(0, bottomY, GRID_COLS * CELL_SIZE, bottomH);
    // Thin bright separator line at the top
    bottomGfx.lineStyle(1, 0x3a5d8e, 0.8);
    bottomGfx.beginPath();
    bottomGfx.moveTo(0, bottomY);
    bottomGfx.lineTo(GRID_COLS * CELL_SIZE, bottomY);
    bottomGfx.strokePath();
    // Faint scan lines for terminal aesthetic
    for (let sy = bottomY + 2; sy < bottomY + bottomH; sy += 4) {
      bottomGfx.fillStyle(0xffffff, 0.012);
      bottomGfx.fillRect(0, sy, GRID_COLS * CELL_SIZE, 1);
    }

    // Terminal status text lines
    const statusFont = { fontFamily: '"Press Start 2P"', fontSize: '6px', color: '#2a8a5a' };
    this.add.text(10, bottomY + 14, 'SYSTEM: Network monitoring active', statusFont)
      .setDepth(1).setAlpha(0.4);
    this.statusText = this.add.text(10, bottomY + 32, 'AWAITING AUTHORIZATION...', statusFont)
      .setDepth(1).setAlpha(0.4);
    this.add.text(10, bottomY + 50, 'THREATS: Scanning...', statusFont)
      .setDepth(1).setAlpha(0.4);

    // Blinking cursor after the authorization text
    const cursorX = this.statusText.x + this.statusText.width + 4;
    this.statusCursor = this.add.text(cursorX, bottomY + 32, '_', statusFont)
      .setDepth(1).setAlpha(0.4);
    this.tweens.add({
      targets: this.statusCursor,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Stepped'
    });

    // ── Vignette overlay — subtle edge darkening for cinematic framing ──
    const camW = this.cameras.main.width;
    const camH = this.cameras.main.height;
    const vignette = this.add.graphics();
    // Outer ring: 16px border at 20% opacity
    vignette.fillStyle(0x000000, 0.2);
    vignette.fillRect(0, 0, camW, 16);               // top
    vignette.fillRect(0, camH - 16, camW, 16);       // bottom
    vignette.fillRect(0, 16, 16, camH - 32);         // left
    vignette.fillRect(camW - 16, 16, 16, camH - 32); // right
    // Inner ring: next 16px at 10% opacity
    vignette.fillStyle(0x000000, 0.1);
    vignette.fillRect(16, 16, camW - 32, 16);               // top inner
    vignette.fillRect(16, camH - 32, camW - 32, 16);        // bottom inner
    vignette.fillRect(16, 32, 16, camH - 64);               // left inner
    vignette.fillRect(camW - 32, 32, 16, camH - 64);        // right inner
    vignette.setDepth(50);
    vignette.setScrollFactor(0);

    // ── Animated scan line — faint horizontal sweep like a network monitor ──
    const gridWidth = GRID_COLS * CELL_SIZE;
    const scanTop = 20;
    const scanBottom = GRID_ROWS * CELL_SIZE;
    this.scanLine = this.add.rectangle(gridWidth / 2, scanTop, gridWidth, 2, 0x00d4aa, 0.15)
      .setDepth(7);
    this.tweens.add({
      targets: this.scanLine,
      y: scanBottom,
      duration: 4000,
      repeat: -1,
      ease: 'Linear',
      onRepeat: () => {
        if (this.scanLine) this.scanLine.y = scanTop;
      }
    });

    // ── Corner bracket decorations on the grid frame ──
    const gridRight = GRID_COLS * CELL_SIZE;
    const gridBottom = GRID_ROWS * CELL_SIZE;
    const bracketGfx = this.add.graphics().setDepth(8);
    const bracketLen = 12;
    bracketGfx.lineStyle(1, 0x00d4aa, 0.4);
    // Top-left bracket
    bracketGfx.beginPath();
    bracketGfx.moveTo(0, bracketLen);
    bracketGfx.lineTo(0, 0);
    bracketGfx.lineTo(bracketLen, 0);
    bracketGfx.strokePath();
    // Top-right bracket
    bracketGfx.beginPath();
    bracketGfx.moveTo(gridRight - bracketLen, 0);
    bracketGfx.lineTo(gridRight, 0);
    bracketGfx.lineTo(gridRight, bracketLen);
    bracketGfx.strokePath();
    // Bottom-left bracket
    bracketGfx.beginPath();
    bracketGfx.moveTo(0, gridBottom - bracketLen);
    bracketGfx.lineTo(0, gridBottom);
    bracketGfx.lineTo(bracketLen, gridBottom);
    bracketGfx.strokePath();
    // Bottom-right bracket
    bracketGfx.beginPath();
    bracketGfx.moveTo(gridRight - bracketLen, gridBottom);
    bracketGfx.lineTo(gridRight, gridBottom);
    bracketGfx.lineTo(gridRight, gridBottom - bracketLen);
    bracketGfx.strokePath();

    // ── Hover indicator ────────────────────────────────────────
    this.hoverRect = this.add.rectangle(0, 0, CELL_SIZE - 2, CELL_SIZE - 2)
      .setStrokeStyle(2, 0x5588cc, 0.3)
      .setFillStyle(0x5588cc, 0.06)
      .setVisible(false)
      .setDepth(5);

    // ── Range indicator ────────────────────────────────────────
    this.rangeGraphics = this.add.graphics().setDepth(4);

    // ── Input handlers ─────────────────────────────────────────
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.gameState !== 'PLAYING' && this.gameState !== 'WAITING') return;
      const gridX = Math.floor(pointer.x / CELL_SIZE);
      const gridY = Math.floor(pointer.y / CELL_SIZE);

      if (gridX < 0 || gridX >= GRID_COLS || gridY < 0 || gridY >= GRID_ROWS) {
        this.hoverRect.setVisible(false);
        this.rangeGraphics.clear();
        return;
      }

      this.hoverRect.setPosition(
        gridX * CELL_SIZE + CELL_SIZE / 2,
        gridY * CELL_SIZE + CELL_SIZE / 2
      ).setVisible(true);

      // Show range circle for selected tower type
      this.rangeGraphics.clear();
      if (this.selectedTowerType) {
        const stats = TOWERS[this.selectedTowerType];
        const isPath = pathSet.has(`${gridX},${gridY}`);
        const occupied = this.towers.some(t => t.gridX === gridX && t.gridY === gridY);
        const canPlace = !occupied && (this.selectedTowerType === 'FIREWALL' || !isPath);

        // Color based on validity
        const color = canPlace ? 0x44ff44 : 0xff4444;
        this.hoverRect.setStrokeStyle(2, color, 0.7);
        this.hoverRect.setFillStyle(color, 0.1);

        this.rangeGraphics.lineStyle(1, color, 0.25);
        this.rangeGraphics.fillStyle(color, 0.06);
        this.rangeGraphics.fillCircle(
          gridX * CELL_SIZE + CELL_SIZE / 2,
          gridY * CELL_SIZE + CELL_SIZE / 2,
          stats.range * CELL_SIZE
        );
        this.rangeGraphics.strokeCircle(
          gridX * CELL_SIZE + CELL_SIZE / 2,
          gridY * CELL_SIZE + CELL_SIZE / 2,
          stats.range * CELL_SIZE
        );
        // Outer soft glow ring for depth
        this.rangeGraphics.lineStyle(2, color, 0.1);
        this.rangeGraphics.strokeCircle(
          gridX * CELL_SIZE + CELL_SIZE / 2,
          gridY * CELL_SIZE + CELL_SIZE / 2,
          stats.range * CELL_SIZE + 8
        );
      } else {
        this.hoverRect.setStrokeStyle(2, 0x5588cc, 0.3);
        this.hoverRect.setFillStyle(0x5588cc, 0.06);
      }
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.gameState !== 'PLAYING' && this.gameState !== 'WAITING') return;
      if (!this.selectedTowerType) return;

      const gridX = Math.floor(pointer.x / CELL_SIZE);
      const gridY = Math.floor(pointer.y / CELL_SIZE);

      if (gridX < 0 || gridX >= GRID_COLS || gridY < 0 || gridY >= GRID_ROWS) return;

      this.placeTowerAt(this.selectedTowerType, gridX, gridY);
    });

    // ── EventBridge listeners ──────────────────────────────────
    eventBridge.on(BRIDGE_EVENTS.REACT_SELECT_TOWER_TYPE, this.onSelectTowerType, this);
    eventBridge.on(BRIDGE_EVENTS.REACT_START_BREACH, this.onStartGame, this);
    eventBridge.on(BRIDGE_EVENTS.REACT_DISMISS_TUTORIAL, this.onDismissTutorial, this);
    eventBridge.on(BRIDGE_EVENTS.REACT_RESTART_BREACH, this.onRestart, this);

    // Sync mute state from localStorage before any audio plays
    if (localStorage.getItem('sfx_muted') === 'true') {
      this.sound.mute = true;
    }

    // Background music — fade in gently after a beat
    const userVol = parseFloat(localStorage.getItem('music_volume') ?? '0.6');
    const targetVol = this.musicBaseVolume * userVol;
    if (userVol > 0) {
      this.bgMusic = this.sound.add('music_breach', { loop: true, volume: 0 });
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

    // Emit ready
    eventBridge.emit(BRIDGE_EVENTS.SCENE_READY, 'BreachDefense');
  }

  // ── Event handlers ─────────────────────────────────────────────

  private onSelectTowerType(data: { type: TowerType | null }) {
    this.selectedTowerType = data.type;
  }

  private onStartGame() {
    this.gameState = 'PLAYING';
    // Update terminal status now that authorization is granted
    if (this.statusText) {
      this.statusText.setText('STATUS: Defenses deployed');
    }
    if (this.statusCursor) {
      this.tweens.killTweensOf(this.statusCursor);
      this.statusCursor.setAlpha(0);
    }
    // Emit wave start banner for wave 1
    if (!this.shownWaveStartBanners.has(1)) {
      this.shownWaveStartBanners.add(1);
      const waveData = WAVES[0];
      eventBridge.emit(BRIDGE_EVENTS.BREACH_WAVE_START, {
        wave: 1,
        name: waveData.name,
        intro: waveData.intro,
        suggestedTowers: waveData.suggestedTowers,
        threats: waveData.threats,
      });
    }
    // Trigger wave 1 splash (delayed so banner shows first)
    if (!this.shownWaveSplashes.has(1)) {
      this.shownWaveSplashes.add(1);
      this.gameState = 'PAUSED';
      this.time.delayedCall(3500, () => {
        eventBridge.emit(BRIDGE_EVENTS.BREACH_TUTORIAL_TRIGGER, { tutorialKey: 'wave_1' });
      });
    }
    this.broadcastState();
  }

  private onDismissTutorial() {
    this.gameState = 'PLAYING';
    if (!this.waveState.active) {
      this.activateWave();
      this.waveState.nextSpawnTime = this.time.now + 2000;
    }
  }

  private onRestart() {
    // Destroy all game objects (kill active tweens first to prevent errors mid-animation)
    this.enemies.forEach(e => {
      this.tweens.killTweensOf(e.sprite);
      e.sprite.destroy();
      e.hpBarBg.destroy();
      e.hpBarFill.destroy();
    });
    this.towers.forEach(t => t.sprite.destroy());
    this.projectiles.forEach(p => p.graphics.destroy());

    this.enemies = [];
    this.towers = [];
    this.projectiles = [];
    this.securityScore = 100;
    this.budget = WAVE_BUDGETS[0] || 150;
    this.wave = 1;
    this.grantedStipends = new Set([1]);
    this.waveState = {
      enemiesSpawned: 0,
      nextSpawnTime: 0,
      active: false,
      threatIndex: 0,
      spawnedPerThreat: []
    };
    this.selectedTowerType = null;
    this.shownWaveSplashes = new Set();
    this.shownWaveStartBanners = new Set();
    this.waveKillCount = 0;
    this.gameState = 'WAITING';
    // Reset terminal status text for waiting state
    if (this.statusText) {
      this.statusText.setText('AWAITING AUTHORIZATION...');
    }
    if (this.statusCursor) {
      this.statusCursor.setAlpha(0.4);
      this.tweens.add({
        targets: this.statusCursor,
        alpha: 0,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Stepped'
      });
    }
    this.broadcastState();
  }

  // ── Tower placement ────────────────────────────────────────────

  private placeTowerAt(type: TowerType, gridX: number, gridY: number): boolean {
    const stats = TOWERS[type];
    if (this.budget < stats.cost) return false;

    const isPath = PATHS[0].some(p => p.x === gridX && p.y === gridY);
    if (type !== 'FIREWALL' && isPath) return false;

    const occupied = this.towers.some(t => t.gridX === gridX && t.gridY === gridY);
    if (occupied) return false;

    // Check wave unlock
    if (this.wave < stats.unlockWave) return false;

    this.budget -= stats.cost;

    const px = gridX * CELL_SIZE + CELL_SIZE / 2;
    const py = gridY * CELL_SIZE + CELL_SIZE / 2;

    const sprite = this.add.sprite(px, py, `tower_${type}`)
      .setDisplaySize(56, 56)
      .setDepth(10);

    const tower: TowerData = {
      id: Phaser.Math.RND.uuid(),
      type,
      gridX,
      gridY,
      sprite,
      lastFired: 0
    };
    this.towers.push(tower);

    this.sound.play('sfx_tower_place', { volume: 0.5 });

    // ── Tower placement visual burst ──
    const towerColor = parseInt(stats.color.replace('#', ''), 16);
    // Particle burst at placement point
    const placeEmitter = this.add.particles(px, py, 'particle_circle', {
      speed: { min: 30, max: 80 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 250,
      tint: towerColor,
      frequency: -1
    });
    placeEmitter.setDepth(18);
    placeEmitter.explode(8);
    this.time.delayedCall(350, () => {
      if (placeEmitter && placeEmitter.active) placeEmitter.destroy();
    });

    // Scale pulse on the newly placed tower sprite
    this.tweens.add({
      targets: sprite,
      scale: [0.5, 1.15, 0.95, 1.0],
      duration: 350,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Idle breathing animation for placed towers
        this.tweens.add({
          targets: sprite,
          y: py - 2,
          duration: 1200 + Math.random() * 600,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    });

    // Brief glow ring that scales up and fades out
    const glowRing = this.add.circle(px, py, 8, towerColor, 0.4)
      .setStrokeStyle(2, towerColor, 0.6)
      .setDepth(9);
    this.tweens.add({
      targets: glowRing,
      scale: 3,
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => glowRing.destroy()
    });

    // If this is the first tower and wave hasn't started, start spawning
    if (this.towers.length === 1 && !this.waveState.active && this.gameState === 'PLAYING') {
      this.waveState.active = true;
      this.waveState.nextSpawnTime = this.time.now + 2000;
    }

    eventBridge.emit(BRIDGE_EVENTS.BREACH_TOWER_PLACED, {
      type,
      cost: stats.cost,
      newBudget: this.budget
    });

    return true;
  }

  // ── Enemy spawning ─────────────────────────────────────────────

  private spawnEnemy(type: ThreatType, waveNumber: number) {
    const stats = THREATS[type];
    const path = PATHS[0];
    const start = path[0];

    // HP scaling
    const tier = Math.ceil(waveNumber / 2);
    const scalingRate = tier >= 4 ? 0.15 : 0.20;
    const hpMultiplier = 1 + (tier - 1) * scalingRate;
    const scaledHp = Math.round(stats.hp * hpMultiplier);

    const startX = start.x - 1;
    const startY = start.y;
    const px = startX * CELL_SIZE + CELL_SIZE / 2;
    const py = startY * CELL_SIZE + CELL_SIZE / 2;

    const sprite = this.add.sprite(px, py, `threat_${type}`)
      .setDisplaySize(48, 48)
      .setDepth(15);

    // Dramatic entrance animation — spawn from nothing
    sprite.setAlpha(0).setScale(0.3);
    this.tweens.add({
      targets: sprite,
      alpha: 1,
      scaleX: 48 / sprite.width,
      scaleY: 48 / sprite.height,
      duration: 300,
      ease: 'Back.easeOut'
    });

    // HP bar background
    const hpBarBg = this.add.rectangle(px, py - 30, 40, 5, 0x333333)
      .setDepth(16);
    // HP bar fill
    const hpBarFill = this.add.rectangle(px, py - 30, 40, 5, 0x44ff44)
      .setDepth(17);

    // HP bars fade in after a brief delay
    hpBarBg.setAlpha(0);
    hpBarFill.setAlpha(0);
    this.tweens.add({ targets: [hpBarBg, hpBarFill], alpha: 1, duration: 200, delay: 200 });

    const enemy: EnemyData = {
      id: Phaser.Math.RND.uuid(),
      type,
      hp: scaledHp,
      maxHp: scaledHp,
      pathIndex: 0,
      waypointIndex: 0,
      speed: stats.speed,
      sprite,
      hpBarBg,
      hpBarFill,
      flashUntil: 0,
      strongFlashUntil: 0,
      strongFlashColor: 0
    };
    this.enemies.push(enemy);
  }

  // ── VFX Helpers ────────────────────────────────────────────────

  private spawnDeathParticles(x: number, y: number, color: number): void {
    const emitter = this.add.particles(x, y, 'particle_circle', {
      speed: { min: 40, max: 110 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 300,
      tint: color,
      frequency: -1
    });
    emitter.setDepth(18);
    emitter.explode(10);
    this.time.delayedCall(400, () => {
      if (emitter && emitter.active) emitter.destroy();
    });
  }

  private playRecoilTween(sprite: Phaser.GameObjects.Sprite): void {
    this.tweens.add({
      targets: sprite,
      scale: [1.0, 1.15, 0.95, 1.0],
      duration: 200,
      ease: 'Quad.easeOut'
    });
  }

  // ── Helpers ────────────────────────────────────────────────────

  private getTrainingBuff(towerX: number, towerY: number): number {
    let buff = 1.0;
    for (const t of this.towers) {
      if (t.type === 'TRAINING') {
        const dx = t.gridX - towerX;
        const dy = t.gridY - towerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const trainingStats = TOWERS.TRAINING;
        if (dist <= (trainingStats.buffRadius || 2)) {
          buff = Math.max(buff, trainingStats.buffAmount || 1.25);
        }
      }
    }
    return buff;
  }

  private broadcastState() {
    eventBridge.emit(BRIDGE_EVENTS.BREACH_STATE_UPDATE, {
      securityScore: this.securityScore,
      budget: this.budget,
      wave: this.wave,
      gameState: this.gameState,
      enemyCount: this.enemies.length,
      towerCount: this.towers.length
    });
  }

  private activateWave() {
    // Tension buildup before wave starts
    if (this.headerText) {
      const origColor = this.headerText.style.color;
      this.headerText.setColor('#ff4444');
      this.time.delayedCall(600, () => {
        if (this.headerText) this.headerText.setColor(origColor || '#00d4aa');
      });
    }

    const warningText = this.add.text(
      GRID_COLS * CELL_SIZE / 2, GRID_ROWS * CELL_SIZE / 2,
      'INCOMING THREATS DETECTED',
      { fontFamily: '"Press Start 2P"', fontSize: '9px', color: '#ff6644', stroke: '#000000', strokeThickness: 2 }
    ).setOrigin(0.5).setDepth(50);

    this.tweens.add({
      targets: warningText,
      alpha: { from: 1, to: 0.2 },
      duration: 200,
      yoyo: true,
      repeat: 2,
      onComplete: () => warningText.destroy()
    });

    this.waveState.active = true;
    this.sound.play('sfx_wave_start', { volume: 0.7 });
  }

  // ── Main game loop ─────────────────────────────────────────────

  update(time: number, delta: number) {
    if (this.gameState !== 'PLAYING') return;

    const dt = Math.min(delta / 1000, 0.1);

    // ── Phase 1: Wave spawning ─────────────────────────────────
    const currentWaveData = WAVES[this.wave - 1];
    if (this.waveState.active && currentWaveData) {
      const totalThreats = currentWaveData.threats.reduce((acc, t) => acc + t.count, 0);

      if (this.waveState.enemiesSpawned < totalThreats) {
        if (time > this.waveState.nextSpawnTime) {
          // Find which threat config to spawn from
          let spawnIdx = 0;
          let accumulated = 0;
          for (let i = 0; i < currentWaveData.threats.length; i++) {
            accumulated += currentWaveData.threats[i].count;
            if (this.waveState.enemiesSpawned < accumulated) {
              spawnIdx = i;
              break;
            }
          }

          const threatConfig = currentWaveData.threats[spawnIdx];
          this.spawnEnemy(threatConfig.type as ThreatType, this.wave);
          this.waveState.enemiesSpawned++;
          this.waveState.nextSpawnTime = time + threatConfig.interval;
        }
      } else if (this.enemies.length === 0) {
        // Wave complete
        if (this.wave < WAVES.length) {
          const concept = currentWaveData.concept;
          eventBridge.emit(BRIDGE_EVENTS.BREACH_WAVE_COMPLETE, {
            wave: this.wave,
            concept,
            endMessage: currentWaveData.endMessage,
            stats: {
              threatsStop: this.waveKillCount,
              threatsTotal: this.waveState.enemiesSpawned,
              towersActive: this.towers.length
            }
          });
          this.waveKillCount = 0;

          // ── Wave complete celebration effects ──
          this.cameras.main.flash(400, 100, 255, 100, false);
          this.cameras.main.shake(200, 0.008);

          const clearedText = this.add.text(
            GRID_COLS * CELL_SIZE / 2, GRID_ROWS * CELL_SIZE / 2,
            `WAVE ${this.wave} CLEARED!`,
            { fontFamily: '"Press Start 2P"', fontSize: '14px', color: '#44ff44', stroke: '#000000', strokeThickness: 3 }
          ).setOrigin(0.5).setDepth(50).setAlpha(0);

          this.tweens.add({
            targets: clearedText,
            alpha: 1, scale: { from: 0.3, to: 1.2 },
            duration: 400, ease: 'Back.easeOut',
            onComplete: () => {
              this.tweens.add({
                targets: clearedText,
                alpha: 0, y: clearedText.y - 40,
                duration: 600, delay: 800, ease: 'Quad.easeIn',
                onComplete: () => clearedText.destroy()
              });
            }
          });

          // Celebration particles at center of grid
          const celebCenterX = GRID_COLS * CELL_SIZE / 2;
          const celebCenterY = GRID_ROWS * CELL_SIZE / 2;
          const celebEmitter = this.add.particles(celebCenterX, celebCenterY, 'particle_circle', {
            speed: { min: 40, max: 110 },
            angle: { min: 0, max: 360 },
            scale: { start: 1.2, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 400,
            tint: 0x44ff44,
            frequency: -1
          });
          celebEmitter.setDepth(18);
          celebEmitter.explode(20);
          this.time.delayedCall(500, () => {
            if (celebEmitter && celebEmitter.active) celebEmitter.destroy();
          });

          this.wave++;

          // Grant stipend
          if (!this.grantedStipends.has(this.wave)) {
            this.grantedStipends.add(this.wave);
            this.budget += WAVE_BUDGETS[this.wave - 1] || 100;
          }

          // Reset wave state
          this.waveState = {
            enemiesSpawned: 0,
            nextSpawnTime: time + 3000,
            active: false,
            threatIndex: 0,
            spawnedPerThreat: []
          };

          // Emit wave start data for next wave
          if (!this.shownWaveStartBanners.has(this.wave)) {
            this.shownWaveStartBanners.add(this.wave);
            const nextWaveData = WAVES[this.wave - 1];
            if (nextWaveData) {
              eventBridge.emit(BRIDGE_EVENTS.BREACH_WAVE_START, {
                wave: this.wave,
                name: nextWaveData.name,
                intro: nextWaveData.intro,
                suggestedTowers: nextWaveData.suggestedTowers,
                threats: nextWaveData.threats,
              });
            }
          }

          // Check for wave splash screen
          if ([1, 3, 5, 7, 9].includes(this.wave) && !this.shownWaveSplashes.has(this.wave)) {
            this.shownWaveSplashes.add(this.wave);
            this.gameState = 'PAUSED';
            this.time.delayedCall(3500, () => {
              eventBridge.emit(BRIDGE_EVENTS.BREACH_TUTORIAL_TRIGGER, {
                tutorialKey: `wave_${this.wave}`
              });
            });
          } else {
            // Auto-start next wave after delay
            this.activateWave();
          }
        } else {
          // Victory!
          this.gameState = 'VICTORY';

          // ── Victory celebration effects ──
          this.cameras.main.flash(800, 255, 215, 0, false);
          this.cameras.main.shake(400, 0.012);

          // Confetti-like particle bursts at random positions
          const confettiColors = [0xffd700, 0x44ff44, 0x00d4aa, 0xffffff];
          for (let i = 0; i < 5; i++) {
            const cx = Phaser.Math.Between(CELL_SIZE * 2, (GRID_COLS - 2) * CELL_SIZE);
            const cy = Phaser.Math.Between(CELL_SIZE * 2, (GRID_ROWS - 2) * CELL_SIZE);
            const confettiEmitter = this.add.particles(cx, cy, 'particle_circle', {
              speed: { min: 50, max: 140 },
              angle: { min: 0, max: 360 },
              scale: { start: 1.0, end: 0 },
              alpha: { start: 1, end: 0 },
              lifespan: 600,
              tint: confettiColors[i % confettiColors.length],
              frequency: -1
            });
            confettiEmitter.setDepth(18);
            confettiEmitter.explode(12);
            this.time.delayedCall(700, () => {
              if (confettiEmitter && confettiEmitter.active) confettiEmitter.destroy();
            });
          }

          // "NETWORK SECURED!" dramatic text
          const victoryText = this.add.text(
            GRID_COLS * CELL_SIZE / 2, GRID_ROWS * CELL_SIZE / 2,
            'NETWORK SECURED!',
            { fontFamily: '"Press Start 2P"', fontSize: '18px', color: '#ffd700', stroke: '#000000', strokeThickness: 4 }
          ).setOrigin(0.5).setDepth(50).setAlpha(0);

          this.tweens.add({
            targets: victoryText,
            alpha: 1, scale: { from: 0.2, to: 1.3 },
            duration: 500, ease: 'Back.easeOut',
            onComplete: () => {
              this.tweens.add({
                targets: victoryText,
                alpha: 0, y: victoryText.y - 50,
                duration: 800, delay: 1200, ease: 'Quad.easeIn',
                onComplete: () => victoryText.destroy()
              });
            }
          });

          eventBridge.emit(BRIDGE_EVENTS.BREACH_VICTORY, {
            securityScore: this.securityScore,
            wavesCompleted: this.wave,
            towersPlaced: this.towers.length
          });
        }
      }
    }

    // ── Phase 2: Enemy movement ────────────────────────────────
    for (const enemy of this.enemies) {
      const path = PATHS[enemy.pathIndex];
      const target = path[enemy.waypointIndex];

      // Grid-unit position from sprite pixel position
      let ex = (enemy.sprite.x - CELL_SIZE / 2) / CELL_SIZE;
      let ey = (enemy.sprite.y - CELL_SIZE / 2) / CELL_SIZE;

      if (!target) {
        // Past end of path — keep moving right
        if (ex < GRID_COLS) {
          ex += enemy.speed * dt;
        }
      } else {
        const dx = target.x - ex;
        const dy = target.y - ey;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 0.1) {
          enemy.waypointIndex++;
        } else {
          ex += (dx / dist) * enemy.speed * dt;
          ey += (dy / dist) * enemy.speed * dt;
        }
      }

      // Update sprite position
      const px = ex * CELL_SIZE + CELL_SIZE / 2;
      const py = ey * CELL_SIZE + CELL_SIZE / 2;
      enemy.sprite.setPosition(px, py);
      // Trail ghost for moving enemies (every ~200ms)
      if (Math.random() < 0.08) { // ~8% chance per frame ≈ every 200ms at 60fps
        const ghost = this.add.sprite(enemy.sprite.x, enemy.sprite.y, enemy.sprite.texture.key)
          .setDisplaySize(48, 48)
          .setAlpha(0.3)
          .setTint(THREAT_COLORS[enemy.type] || 0xffffff)
          .setDepth(14);
        this.tweens.add({
          targets: ghost,
          alpha: 0,
          scale: ghost.scaleX * 0.7,
          duration: 400,
          onComplete: () => ghost.destroy()
        });
      }
      enemy.hpBarBg.setPosition(px, py - 30);
      enemy.hpBarFill.setPosition(px, py - 30);

      // Update HP bar width
      const hpRatio = Math.max(0, enemy.hp / enemy.maxHp);
      enemy.hpBarFill.setDisplaySize(40 * hpRatio, 5);
      enemy.hpBarFill.setPosition(px - 20 * (1 - hpRatio), py - 30);

      // HP bar color
      if (hpRatio > 0.5) {
        enemy.hpBarFill.setFillStyle(0x44ff44);
      } else if (hpRatio > 0.25) {
        enemy.hpBarFill.setFillStyle(0xffaa00);
      } else {
        enemy.hpBarFill.setFillStyle(0xff4444);
      }

      // Flash effect: red on any hit, then tower color on strong-match hit
      if (enemy.flashUntil > time) {
        enemy.sprite.setTint(0xff0000);
      } else if (enemy.strongFlashUntil > time) {
        enemy.sprite.setTint(enemy.strongFlashColor);
      } else {
        enemy.sprite.clearTint();
      }
    }

    // ── Phase 3: Breach detection ──────────────────────────────
    const breaching: EnemyData[] = [];
    for (const enemy of this.enemies) {
      const ex = (enemy.sprite.x - CELL_SIZE / 2) / CELL_SIZE;
      if (ex >= GRID_COLS - 0.5) {
        breaching.push(enemy);
      }
    }

    if (breaching.length > 0) {
      this.securityScore = Math.max(0, this.securityScore - breaching.length * 20);
      this.sound.play('sfx_breach_alert', { volume: 0.85 });

      // ── Breach alert screen edge pulse ──
      const borderFlash = this.add.rectangle(
        GRID_COLS * CELL_SIZE / 2, GRID_ROWS * CELL_SIZE / 2,
        GRID_COLS * CELL_SIZE, GRID_ROWS * CELL_SIZE
      ).setStrokeStyle(4, 0xff0000, 0.8).setFillStyle(0xff0000, 0.1).setDepth(40);

      this.tweens.add({
        targets: borderFlash,
        alpha: 0, duration: 400, ease: 'Quad.easeOut',
        onComplete: () => borderFlash.destroy()
      });

      this.cameras.main.shake(150, 0.005);

      for (const enemy of breaching) {
        enemy.sprite.destroy();
        enemy.hpBarBg.destroy();
        enemy.hpBarFill.destroy();
      }
      this.enemies = this.enemies.filter(e => !breaching.includes(e));

      if (this.securityScore <= 0) {
        this.gameState = 'GAMEOVER';

        // ── Game over effects ──
        this.cameras.main.flash(600, 255, 50, 50, false);
        this.cameras.main.shake(500, 0.015);

        // "SYSTEM COMPROMISED" text with red glitch-like entrance
        const gameOverText = this.add.text(
          GRID_COLS * CELL_SIZE / 2, GRID_ROWS * CELL_SIZE / 2,
          'SYSTEM COMPROMISED',
          { fontFamily: '"Press Start 2P"', fontSize: '14px', color: '#ff3333', stroke: '#000000', strokeThickness: 4 }
        ).setOrigin(0.5).setDepth(50).setAlpha(0);

        // Glitch effect: rapid x-offset jitter then settle
        this.tweens.add({
          targets: gameOverText,
          alpha: 1,
          duration: 100,
          onComplete: () => {
            // Jitter phase
            let jitterCount = 0;
            const jitterEvent = this.time.addEvent({
              delay: 50,
              repeat: 7,
              callback: () => {
                jitterCount++;
                gameOverText.x = GRID_COLS * CELL_SIZE / 2 + Phaser.Math.Between(-8, 8);
                gameOverText.y = GRID_ROWS * CELL_SIZE / 2 + Phaser.Math.Between(-3, 3);
              }
            });
            this.time.delayedCall(400, () => {
              jitterEvent.destroy();
              gameOverText.setPosition(GRID_COLS * CELL_SIZE / 2, GRID_ROWS * CELL_SIZE / 2);
              // Fade out after settling
              this.tweens.add({
                targets: gameOverText,
                alpha: 0,
                duration: 800, delay: 1000, ease: 'Quad.easeIn',
                onComplete: () => gameOverText.destroy()
              });
            });
          }
        });

        eventBridge.emit(BRIDGE_EVENTS.BREACH_GAME_OVER, {
          wavesCompleted: this.wave - 1,
          towersPlaced: this.towers.length
        });
      }
    }

    // ── Low-security danger vignette ──────────────────────────
    if (this.securityScore <= 40 && this.gameState === 'PLAYING') {
      if (!this.dangerVignette) {
        this.dangerVignette = this.add.graphics().setDepth(35).setScrollFactor(0);
      }
      const intensity = Math.max(0, (40 - this.securityScore) / 40); // 0 at 40%, 1 at 0%
      this.dangerVignette.clear();
      // Red edges that get more intense as score drops
      const w = GRID_COLS * CELL_SIZE;
      const h = GRID_ROWS * CELL_SIZE + 96;
      const edgeWidth = 30 + intensity * 40;
      this.dangerVignette.fillStyle(0xff0000, intensity * 0.15);
      // Top edge
      this.dangerVignette.fillRect(0, 0, w, edgeWidth);
      // Bottom edge
      this.dangerVignette.fillRect(0, h - edgeWidth, w, edgeWidth);
      // Left edge
      this.dangerVignette.fillRect(0, 0, edgeWidth, h);
      // Right edge
      this.dangerVignette.fillRect(w - edgeWidth, 0, edgeWidth, h);
    } else if (this.dangerVignette) {
      this.dangerVignette.destroy();
      this.dangerVignette = undefined;
    }

    // ── Phase 4: Tower targeting & firing ──────────────────────
    for (const tower of this.towers) {
      const stats = TOWERS[tower.type];
      if (time - tower.lastFired < stats.cooldown) continue;

      const trainingBuff = tower.type !== 'TRAINING' ? this.getTrainingBuff(tower.gridX, tower.gridY) : 1.0;

      let bestTarget: EnemyData | undefined;
      let bestScore = -1;

      for (const enemy of this.enemies) {
        const ex = (enemy.sprite.x - CELL_SIZE / 2) / CELL_SIZE;
        const ey = (enemy.sprite.y - CELL_SIZE / 2) / CELL_SIZE;
        const dx = ex - tower.gridX;
        const dy = ey - tower.gridY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= stats.range) {
          const enemyTags = THREATS[enemy.type]?.tags || [];
          const isStrong = stats.strongAgainst?.some((tag: string) => enemyTags.includes(tag));
          const isWeak = stats.weakAgainst?.some((tag: string) => enemyTags.includes(tag));

          let score = 100 - dist * 10;
          if (isStrong) score += 50;
          if (isWeak) score -= 30;

          if (score > bestScore) {
            bestScore = score;
            bestTarget = enemy;
          }
        }
      }

      if (bestTarget) {
        const enemyTags = THREATS[bestTarget.type]?.tags || [];
        const isStrong = stats.strongAgainst?.some((tag: string) => enemyTags.includes(tag));
        const isWeak = stats.weakAgainst?.some((tag: string) => enemyTags.includes(tag));

        let damage = stats.damage * trainingBuff;
        if (isStrong) damage *= 1.5;
        if (isWeak) damage *= 0.5;

        const colorNum = parseInt(stats.color.replace('#', ''), 16);
        const towerPx = tower.gridX * CELL_SIZE + CELL_SIZE / 2;
        const towerPy = tower.gridY * CELL_SIZE + CELL_SIZE / 2;

        const arc = this.add.circle(towerPx, towerPy, 4, colorNum).setDepth(20);

        this.projectiles.push({
          id: Phaser.Math.RND.uuid(),
          x: towerPx,
          y: towerPy,
          targetId: bestTarget.id,
          damage: Math.round(damage),
          speed: 2.5,
          color: colorNum,
          graphics: arc,
          isStrong: !!isStrong
        });

        // Brief targeting beam from tower to target
        const beamLine = this.add.graphics().setDepth(19);
        beamLine.lineStyle(1.5, colorNum, 0.4);
        beamLine.beginPath();
        beamLine.moveTo(towerPx, towerPy);
        beamLine.lineTo(bestTarget.sprite.x, bestTarget.sprite.y);
        beamLine.strokePath();
        this.tweens.add({
          targets: beamLine,
          alpha: 0,
          duration: 150,
          onComplete: () => beamLine.destroy()
        });

        tower.lastFired = time;
        this.playRecoilTween(tower.sprite);
      }
    }

    // ── Phase 5: Projectile movement ───────────────────────────
    for (const proj of this.projectiles) {
      const target = this.enemies.find(e => e.id === proj.targetId);
      if (!target) {
        proj.damage = 0;
        continue;
      }

      const dx = target.sprite.x - proj.x;
      const dy = target.sprite.y - proj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < CELL_SIZE * 0.2) {
        // Hit!
        target.hp -= proj.damage;
        target.flashUntil = time + 120;
        if (proj.isStrong) {
          target.strongFlashUntil = time + 120 + 150;
          target.strongFlashColor = proj.color;
        }

        // Impact particles at hit point
        const impactEmitter = this.add.particles(proj.x, proj.y, 'particle_circle', {
          speed: { min: 20, max: 60 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.6, end: 0 },
          alpha: { start: 0.8, end: 0 },
          lifespan: 200,
          tint: proj.color,
          frequency: -1
        });
        impactEmitter.setDepth(20);
        impactEmitter.explode(4);
        this.time.delayedCall(300, () => {
          if (impactEmitter && impactEmitter.active) impactEmitter.destroy();
        });

        // Screen shake on strong hits
        if (proj.isStrong) {
          this.cameras.main.shake(80, 0.003);
        }

        // Floating damage number
        const dmgText = this.add.text(proj.x, proj.y - 10, `-${proj.damage}`, {
          fontFamily: '"Press Start 2P"',
          fontSize: proj.isStrong ? '8px' : '6px',
          color: proj.isStrong ? '#ff6644' : '#ffffff',
          stroke: '#000000',
          strokeThickness: 2,
        }).setDepth(25).setOrigin(0.5);

        this.tweens.add({
          targets: dmgText,
          y: dmgText.y - 25,
          alpha: 0,
          duration: 600,
          ease: 'Quad.easeOut',
          onComplete: () => dmgText.destroy()
        });

        proj.damage = 0;
      } else {
        proj.x += (dx / dist) * proj.speed * CELL_SIZE * dt;
        proj.y += (dy / dist) * proj.speed * CELL_SIZE * dt;
        proj.graphics.setPosition(proj.x, proj.y);
      }
    }

    // ── Phase 6: Cleanup ───────────────────────────────────────
    // Remove dead projectiles
    const deadProj = this.projectiles.filter(p => p.damage <= 0);
    for (const p of deadProj) p.graphics.destroy();
    this.projectiles = this.projectiles.filter(p => p.damage > 0);

    // Remove dead enemies (with particle burst + fade animation + SFX + floating label)
    const deadEnemies = this.enemies.filter(e => e.hp <= 0);
    this.waveKillCount += deadEnemies.length;
    for (const e of deadEnemies) {
      this.sound.play('sfx_enemy_death', { volume: 0.6 });

      const threatName = THREATS[e.type]?.name || e.type;
      const label = this.add.text(e.sprite.x, e.sprite.y - 20, threatName, {
        fontFamily: '"Press Start 2P"',
        fontSize: '7px',
        color: '#44ff44',
        stroke: '#000000',
        strokeThickness: 2,
      }).setDepth(30).setOrigin(0.5);

      this.tweens.add({
        targets: label,
        y: label.y - 44,
        alpha: 0,
        duration: 900,
        ease: 'Cubic.easeOut',
        onComplete: () => { label.destroy(); }
      });

      e.hpBarBg.destroy();
      e.hpBarFill.destroy();
      const dyingSprite = e.sprite;
      this.spawnDeathParticles(dyingSprite.x, dyingSprite.y, THREAT_COLORS[e.type]);
      this.tweens.add({
        targets: dyingSprite,
        alpha: 0,
        scale: 0.3,
        duration: 300,
        ease: 'Quad.easeIn',
        onComplete: () => {
          if (dyingSprite.active) dyingSprite.destroy();
        }
      });
    }
    this.enemies = this.enemies.filter(e => e.hp > 0);

    // ── Kill streak tracking ────────────────────────────────────
    if (deadEnemies.length > 0) {
      const now = this.time.now;
      if (now - this.lastKillTime < 2000) {
        this.killStreak += deadEnemies.length;
      } else {
        this.killStreak = deadEnemies.length;
      }
      this.lastKillTime = now;

      // Show streak text at 3+ kills
      if (this.killStreak >= 3) {
        if (this.killStreakText) this.killStreakText.destroy();

        const streakLabels: Record<number, string> = {
          3: 'TRIPLE KILL!',
          5: 'KILLING SPREE!',
          8: 'UNSTOPPABLE!',
          10: 'GODLIKE!'
        };
        // Find the highest matching label
        let label = `${this.killStreak}x STREAK!`;
        for (const [threshold, text] of Object.entries(streakLabels)) {
          if (this.killStreak >= parseInt(threshold)) label = text;
        }

        this.killStreakText = this.add.text(
          GRID_COLS * CELL_SIZE / 2, 40,
          label,
          { fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#ffd700', stroke: '#000000', strokeThickness: 3 }
        ).setOrigin(0.5).setDepth(45).setAlpha(0);

        this.tweens.add({
          targets: this.killStreakText,
          alpha: 1,
          scale: { from: 0.5, to: 1.1 },
          duration: 300,
          ease: 'Back.easeOut',
          onComplete: () => {
            if (this.killStreakText) {
              this.tweens.add({
                targets: this.killStreakText,
                alpha: 0,
                duration: 400,
                delay: 1200,
                onComplete: () => {
                  if (this.killStreakText) {
                    this.killStreakText.destroy();
                    this.killStreakText = undefined;
                  }
                }
              });
            }
          }
        });
      }
    }

    // ── Phase 7: Broadcast state (throttled) ───────────────────
    if (time - this.lastBroadcast > 200) {
      this.broadcastState();
      this.lastBroadcast = time;
    }
  }

  private onMusicVolume = (vol: number) => {
    if (this.bgMusic) {
      (this.bgMusic as Phaser.Sound.WebAudioSound).volume = this.musicBaseVolume * vol;
    }
  };

  shutdown() {
    if (this.killStreakText) {
      this.killStreakText.destroy();
      this.killStreakText = undefined;
    }
    if (this.dangerVignette) {
      this.dangerVignette.destroy();
      this.dangerVignette = undefined;
    }
    if (this.bgMusic) {
      this.bgMusic.stop();
      this.bgMusic = undefined;
    }
    eventBridge.off(BRIDGE_EVENTS.REACT_SET_MUSIC_VOLUME, this.onMusicVolume, this);
    eventBridge.off(BRIDGE_EVENTS.REACT_SELECT_TOWER_TYPE, this.onSelectTowerType, this);
    eventBridge.off(BRIDGE_EVENTS.REACT_START_BREACH, this.onStartGame, this);
    eventBridge.off(BRIDGE_EVENTS.REACT_DISMISS_TUTORIAL, this.onDismissTutorial, this);
    eventBridge.off(BRIDGE_EVENTS.REACT_RESTART_BREACH, this.onRestart, this);
  }
}
