import Phaser from 'phaser';
import { eventBridge, BRIDGE_EVENTS } from '../EventBridge';
import {
  GRID_COLS, GRID_ROWS, CELL_SIZE, PATHS, TOWERS, THREATS, THREAT_COLORS, WAVES, WAVE_BUDGETS,
  ENCOUNTER_WAVES_INBOUND,
} from '../../game/breach-defense/constants';
import { renderBattlefield } from '../systems/breach/gridRenderer';
import {
  playTowerPlacementFx, spawnDeathParticles, playRecoilTween, playEnemySpawnFx,
  playImpactFx, maybeSpawnTrailGhost, maybeSpawnProjectileTrail, showKillLabel,
  playBreachBorderFlash,
} from '../systems/breach/battleVfx';
import {
  playWaveClearedFx, playVictoryFx, playGameOverFx, runPrepCountdown,
} from '../systems/breach/celebrationVfx';

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
  hpBarBorder: Phaser.GameObjects.Rectangle;
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

export interface BreachDefenseInitData {
  encounterId?: string;          // undefined = standalone arcade mode
  waveSubset?: typeof ENCOUNTER_WAVES_INBOUND;  // encounter wave data; null = use full WAVES
  availableTowerIds?: string[];  // tower type filter; null = all towers
  budgetOverride?: readonly number[];  // per-wave budgets; null = use WAVE_BUDGETS
}

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

  // Wave counter text
  private waveCounterText?: Phaser.GameObjects.Text;

  // Background music
  private bgMusic?: Phaser.Sound.BaseSound;
  private readonly musicBaseVolume = 0.20;

  // Onboarding cell highlights
  private onboardingHighlights: Phaser.GameObjects.Rectangle[] = [];

  // Encounter mode (null = standalone)
  private encounterId: string | null = null;
  private encounterWaves: typeof ENCOUNTER_WAVES_INBOUND | null = null;
  private availableTowerFilter: Set<string> | null = null;
  private encounterBudgets: readonly number[] | null = null;

  // State broadcast throttle
  private lastBroadcast = 0;

  constructor() {
    super({ key: 'BreachDefense' });
  }

  init(data: BreachDefenseInitData = {}) {
    this.encounterId = data.encounterId ?? null;
    this.encounterWaves = data.waveSubset ?? null;
    this.availableTowerFilter = data.availableTowerIds
      ? new Set(data.availableTowerIds)
      : null;
    this.encounterBudgets = data.budgetOverride ?? null;

    this.enemies = [];
    this.towers = [];
    this.projectiles = [];
    this.gameState = 'WAITING';
    this.securityScore = 100;
    this.budget = (this.encounterBudgets?.[0] ?? WAVE_BUDGETS[0]) || 150;
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
    this.waveCounterText = undefined;
    if (this.dangerVignette) {
      this.dangerVignette.destroy();
      this.dangerVignette = undefined;
    }
  }

  private getActiveWaves() {
    return this.encounterWaves ?? WAVES;
  }

  /** Called in encounter mode when all 4 waves are cleared. */
  private onEncounterVictory(): void {
    if (!this.encounterId) return;

    const scoreContribution = Math.round((this.securityScore / 100) * 12);

    this.registry.set(`encounterResult_${this.encounterId}`, {
      type: 'td-inbound',
      score: this.securityScore,
      completed: true,
      outcome: 'victory',
      scoreContribution,
    });

    eventBridge.emit(BRIDGE_EVENTS.ENCOUNTER_COMPLETE, {
      encounterId: this.encounterId,
      outcome: 'victory',
      securityScore: this.securityScore,
      scoreContribution,
    });
    // React shows the debrief screen; user clicks "Return to Hospital"
    // which emits REACT_RETURN_FROM_ENCOUNTER → ExplorationScene handles cleanup.
  }

  /** Called in encounter mode when securityScore reaches 0 (game over). */
  private onEncounterGameOver(): void {
    if (!this.encounterId) return;

    const scoreContribution = Math.round((this.securityScore / 100) * 12);

    this.registry.set(`encounterResult_${this.encounterId}`, {
      type: 'td-inbound',
      score: this.securityScore,
      completed: true,
      outcome: 'defeat',
      scoreContribution,
    });

    eventBridge.emit(BRIDGE_EVENTS.ENCOUNTER_COMPLETE, {
      encounterId: this.encounterId,
      outcome: 'defeat',
      securityScore: this.securityScore,
      scoreContribution,
    });
    // React shows the debrief screen; user clicks "Return to Hospital"
    // which emits REACT_RETURN_FROM_ENCOUNTER → ExplorationScene handles cleanup.
  }

  create() {
    // F-25 fix (Run 07): Phaser never auto-calls a method named shutdown() —
    // the cleanup block at the bottom of this class was dead code, so every
    // scene start stacked duplicate eventBridge listeners on the singleton
    // bridge. Wire it, and de-dup defensively (shutdown() is idempotent).
    this.shutdown();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.shutdown, this);

    const { headerText, statusText, statusCursor, waveCounterText, scanLine, pathSet } =
      renderBattlefield(this, this.wave, this.getActiveWaves().length);
    this.headerText = headerText;
    this.statusText = statusText;
    this.statusCursor = statusCursor;
    this.waveCounterText = waveCounterText;
    this.scanLine = scanLine;

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
      if (this.gameState === 'GAMEOVER' || this.gameState === 'VICTORY') return;
      const gridX = Math.floor(pointer.worldX / CELL_SIZE);
      const gridY = Math.floor(pointer.worldY / CELL_SIZE);

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
      if (this.gameState === 'GAMEOVER' || this.gameState === 'VICTORY') return;
      if (!this.selectedTowerType) return;

      const gridX = Math.floor(pointer.worldX / CELL_SIZE);
      const gridY = Math.floor(pointer.worldY / CELL_SIZE);

      if (gridX < 0 || gridX >= GRID_COLS || gridY < 0 || gridY >= GRID_ROWS) return;

      this.placeTowerAt(this.selectedTowerType, gridX, gridY);
    });

    // ── EventBridge listeners ──────────────────────────────────
    eventBridge.on(BRIDGE_EVENTS.REACT_SELECT_TOWER_TYPE, this.onSelectTowerType, this);
    eventBridge.on(BRIDGE_EVENTS.REACT_START_BREACH, this.onStartGame, this);
    eventBridge.on(BRIDGE_EVENTS.REACT_DISMISS_TUTORIAL, this.onDismissTutorial, this);
    eventBridge.on(BRIDGE_EVENTS.REACT_RESTART_BREACH, this.onRestart, this);
    eventBridge.on(BRIDGE_EVENTS.REACT_START_PREP, this.onStartPrepCountdown, this);
    eventBridge.on(BRIDGE_EVENTS.REACT_START_NEXT_WAVE, this.onStartNextWave, this);
    eventBridge.on(BRIDGE_EVENTS.REACT_ONBOARDING_HIGHLIGHT, this.showPlacementHighlights, this);
    eventBridge.on(BRIDGE_EVENTS.REACT_ONBOARDING_CLEAR, this.clearPlacementHighlights, this);

    // Sync mute state from localStorage before any audio plays
    if (localStorage.getItem('sfx_muted') === 'true') {
      this.sound.mute = true;
    }

    // ExplorationScene now fades out its own music before launching this scene,
    // so no need for stopAll() (which would kill SFX too).

    // Background music — fade in gently after a beat
    const userVol = parseFloat(localStorage.getItem('music_volume') ?? '0.6');
    const targetVol = this.musicBaseVolume * userVol;
    if (userVol > 0) {
      this.bgMusic = this.sound.add('music_breach', { loop: true, volume: 0, mute: true });
      const playMusic = () => {
        if (!this.bgMusic || !this.scene.isActive()) return;
        this.bgMusic.play();
        this.time.delayedCall(0, () => {
          if (!this.bgMusic || !this.scene.isActive()) return;
          const ws = this.bgMusic as Phaser.Sound.WebAudioSound;
          ws.setMute(false);
          ws.volume = 0;
          this.tweens.add({ targets: this.bgMusic, volume: targetVol, duration: 1500, ease: 'Sine.easeIn' });
        });
      };
      if (this.sound.locked) {
        this.sound.once('unlocked', playMusic);
      } else {
        this.time.delayedCall(300, playMusic);
      }
    }

    eventBridge.on(BRIDGE_EVENTS.REACT_SET_MUSIC_VOLUME, this.onMusicVolume, this);

    // Center the grid in the camera viewport.
    // Account for top HUD (~40px wave/budget bar) and bottom HUD
    // (~160px tower panel + threat strip) so the grid's bottom row
    // isn't covered by the tower selection panel.
    {
      const gw = GRID_COLS * CELL_SIZE;
      const gh = GRID_ROWS * CELL_SIZE;
      const cw = this.cameras.main.width;
      const ch = this.cameras.main.height;
      const TOP_HUD = 44;
      const BOTTOM_HUD = 168;
      const availableH = ch - TOP_HUD - BOTTOM_HUD;
      this.cameras.main.scrollX = -(cw - gw) / 2;
      this.cameras.main.scrollY = -(TOP_HUD + (availableH - gh) / 2);

      // Fill the area outside the grid with a dark tech background
      const bgGfx = this.add.graphics().setDepth(-1);
      bgGfx.fillStyle(0x0a0c1a, 1);
      bgGfx.fillRect(-200, -200, gw + 400, gh + 400);
    }

    // Emit ready
    eventBridge.emit(BRIDGE_EVENTS.SCENE_READY, 'BreachDefense');

    // Scene entrance fade-in (matching Hub and Exploration)
    this.cameras.main.fadeIn(400, 0, 0, 0);

  }

  // ── Event handlers ─────────────────────────────────────────────

  private onSelectTowerType(data: { type: TowerType | null }) {
    this.selectedTowerType = data.type;
    if (data.type) {
      this.sound.play('sfx_interact', { volume: 0.2, rate: 1.2 });
    }
  }

  private onStartGame() {
    // Don't start gameplay yet — wait for tutorials to complete.
    // React drives the tutorial chain (welcome → firstTower → wave_1).
    // The scene stays PAUSED until React emits REACT_DISMISS_TUTORIAL.
    this.gameState = 'PAUSED';

    // Update terminal status
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

    this.broadcastState();
  }

  /** Standalone-mode handler: player clicked "START NEXT WAVE" button.
   * Resumes from PAUSED and activates the wave. Wave 1 still uses the prep
   * countdown path (auto-armed by the standalone-launch useEffect). */
  private onStartNextWave() {
    if (this.gameState !== 'PAUSED' || this.encounterId !== null) return;
    if (this.waveState.active) return;
    this.gameState = 'PLAYING';
    this.activateWave();
    this.waveState.nextSpawnTime = this.time.now + 1500;
    this.broadcastState();
  }

  private onDismissTutorial() {
    this.gameState = 'PLAYING';
    // For mid-game tutorials (wave 3, 5, 7, 9), activate the next wave after a brief delay.
    // Wave 1 is handled separately by the prep countdown.
    if (this.wave > 1 && !this.waveState.active) {
      this.time.delayedCall(2000, () => {
        if (!this.waveState.active && this.gameState === 'PLAYING') {
          this.activateWave();
          this.waveState.nextSpawnTime = this.time.now + 1500;
        }
      });
    }
    this.broadcastState();
  }

  /**
   * Start a visible countdown on the Phaser canvas, then activate the wave.
   * Called from React after the tutorial chain completes.
   */
  private onStartPrepCountdown() {
    if (this.waveState.active) return;
    this.gameState = 'PLAYING';

    runPrepCountdown(this, 8, () => {
      this.activateWave();
      this.waveState.nextSpawnTime = this.time.now + 1500;
    });
    this.broadcastState();
  }

  private onRestart() {
    // Kill all active tweens first to prevent orphaned animations (kill streak, wave counter, etc.)
    this.tweens.killAll();

    // Destroy all game objects
    this.enemies.forEach(e => {
      e.sprite.destroy();
      e.hpBarBg.destroy();
      e.hpBarFill.destroy();
      e.hpBarBorder.destroy();
    });
    this.towers.forEach(t => t.sprite.destroy());
    this.projectiles.forEach(p => p.graphics.destroy());

    this.enemies = [];
    this.towers = [];
    this.projectiles = [];
    this.securityScore = 100;
    this.budget = (this.encounterBudgets?.[0] ?? WAVE_BUDGETS[0]) || 150;
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

    if (this.availableTowerFilter && !this.availableTowerFilter.has(type)) {
      return false;  // Tower type not available in this encounter
    }

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

    playTowerPlacementFx(this, sprite, px, py, type, stats, this.towers, tower.id, gridX, gridY);

    // Wave spawning is controlled by the prep countdown — not by tower placement

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

    // Size scales with HP — tougher enemies are larger
    const baseSize = 48;
    const sizeBonus = Math.min(12, Math.floor(scaledHp / 30)); // up to +12px for high HP
    const enemySize = baseSize + sizeBonus;

    const sprite = this.add.sprite(px, py, `threat_${type}`)
      .setDisplaySize(enemySize, enemySize)
      .setDepth(15);

    // Dramatic entrance animation — spawn from nothing
    playEnemySpawnFx(this, sprite, enemySize);

    // HP bar background
    const hpBarBg = this.add.rectangle(px, py - 30, 40, 5, 0x333333)
      .setDepth(16);
    // HP bar fill
    const hpBarFill = this.add.rectangle(px, py - 30, 40, 5, 0x44ff44)
      .setDepth(17);

    // HP bar border for definition
    const hpBarBorder = this.add.rectangle(px, py - 30, 42, 7, 0x000000, 0)
      .setStrokeStyle(1, 0x555555, 0.5)
      .setDepth(16);

    // Subtle spawn sound
    this.sound.play('sfx_interact', { volume: 0.15 });

    // HP bars fade in after a brief delay
    hpBarBg.setAlpha(0);
    hpBarFill.setAlpha(0);
    hpBarBorder.setAlpha(0);
    this.tweens.add({ targets: [hpBarBg, hpBarFill, hpBarBorder], alpha: 1, duration: 200, delay: 200 });

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
      hpBarBorder,
      flashUntil: 0,
      strongFlashUntil: 0,
      strongFlashColor: 0
    };
    this.enemies.push(enemy);
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

  // ── Onboarding highlights ────────────────────────────────────

  private showPlacementHighlights() {
    this.clearPlacementHighlights();

    // Suggested cells near the path — good strategic positions for wave 1
    const suggestedCells = [
      { x: 1, y: 2 }, // above path start
      { x: 2, y: 2 }, // above path
      { x: 4, y: 4 }, // below path bend
    ];

    for (const cell of suggestedCells) {
      const rect = this.add.rectangle(
        cell.x * CELL_SIZE + CELL_SIZE / 2,
        cell.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE - 4, CELL_SIZE - 4,
        0x44ff44, 0.15
      ).setStrokeStyle(2, 0x44ff44, 0.5).setDepth(6);

      this.tweens.add({
        targets: rect,
        alpha: { from: 0.15, to: 0.5 },
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      this.onboardingHighlights.push(rect);
    }
  }

  private clearPlacementHighlights() {
    for (const rect of this.onboardingHighlights) {
      this.tweens.killTweensOf(rect);
      rect.destroy();
    }
    this.onboardingHighlights = [];
  }

  private broadcastState() {
    eventBridge.emit(BRIDGE_EVENTS.BREACH_STATE_UPDATE, {
      securityScore: this.securityScore,
      budget: this.budget,
      wave: this.wave,
      // Phase 19: include totalWaves so EncounterGameUI's HUD shows the right
      // denominator in both modes. Encounter mode uses the 4-wave subset; standalone
      // mode falls back to the full WAVES set (10 waves).
      totalWaves: this.getActiveWaves().length,
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
    // Broadcast state even when not PLAYING so React HUD shows correct budget/wave
    if (time - this.lastBroadcast > 200) {
      this.broadcastState();
      this.lastBroadcast = time;
    }

    if (this.gameState !== 'PLAYING') return;

    const dt = Math.min(delta / 1000, 0.1);

    // ── Phase 1: Wave spawning ─────────────────────────────────
    const currentWaveData = this.getActiveWaves()[this.wave - 1];
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
        if (this.wave < this.getActiveWaves().length) {
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
          const waveKills = this.waveKillCount;
          this.waveKillCount = 0;

          playWaveClearedFx(this, this.wave, waveKills);

          this.wave++;

          // Grant stipend
          if (!this.grantedStipends.has(this.wave)) {
            this.grantedStipends.add(this.wave);
            const budgets = this.encounterBudgets ?? WAVE_BUDGETS;
            this.budget += budgets[this.wave - 1] || 100;
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
            const nextWaveData = this.getActiveWaves()[this.wave - 1];
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

          // Standalone mode (encounterId === null): pause between EVERY wave
          // and wait for the player to click "START NEXT WAVE". Bloons / Kingdom
          // Rush genre convention — gives breathing room to place towers and
          // is bug-resistant (no auto-advance state desync).
          // Encounter mode keeps the legacy auto-advance flow.
          if (this.encounterId === null) {
            this.gameState = 'PAUSED';
          } else {
            // Auto-start next wave with brief prep time
            this.time.delayedCall(3000, () => {
              this.activateWave();
              this.waveState.nextSpawnTime = this.time.now + 1500;
            });
          }
        } else {
          // Victory!
          this.gameState = 'VICTORY';

          playVictoryFx(this);

          if (this.encounterId === null) {
            eventBridge.emit(BRIDGE_EVENTS.BREACH_VICTORY, {
              securityScore: this.securityScore,
              wavesCompleted: this.wave,
              towersPlaced: this.towers.length,
            });
          } else {
            this.onEncounterVictory();
          }
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
      maybeSpawnTrailGhost(this, enemy.sprite, THREAT_COLORS[enemy.type] || 0xffffff);
      enemy.hpBarBg.setPosition(px, py - 30);
      enemy.hpBarFill.setPosition(px, py - 30);
      enemy.hpBarBorder.setPosition(px, py - 30);

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
      playBreachBorderFlash(this);

      for (const enemy of breaching) {
        enemy.sprite.destroy();
        enemy.hpBarBg.destroy();
        enemy.hpBarFill.destroy();
        enemy.hpBarBorder.destroy();
      }
      this.enemies = this.enemies.filter(e => !breaching.includes(e));

      if (this.securityScore <= 0) {
        this.gameState = 'GAMEOVER';

        playGameOverFx(this);

        if (this.encounterId === null) {
          eventBridge.emit(BRIDGE_EVENTS.BREACH_GAME_OVER, {
            wavesCompleted: this.wave - 1,
            towersPlaced: this.towers.length,
          });
        } else {
          this.onEncounterGameOver();
        }
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
        this.sound.play('sfx_tower_place', { volume: 0.15, rate: 1.5 });
        playRecoilTween(this, tower.sprite);

        // Brief range flash on fire
        const rangeFlash = this.add.circle(
          towerPx, towerPy,
          stats.range * CELL_SIZE,
          colorNum, 0
        ).setStrokeStyle(1, colorNum, 0.25).setDepth(3);

        this.tweens.add({
          targets: rangeFlash,
          strokeAlpha: 0,
          duration: 300,
          ease: 'Quad.easeOut',
          onComplete: () => rangeFlash.destroy()
        });
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
        this.sound.play('sfx_enemy_death', { volume: 0.12, rate: 1.4 });
        if (proj.isStrong) {
          target.strongFlashUntil = time + 120 + 150;
          target.strongFlashColor = proj.color;
        }

        playImpactFx(this, proj.x, proj.y, proj.color, proj.isStrong, proj.damage);

        proj.damage = 0;
      } else {
        proj.x += (dx / dist) * proj.speed * CELL_SIZE * dt;
        proj.y += (dy / dist) * proj.speed * CELL_SIZE * dt;
        proj.graphics.setPosition(proj.x, proj.y);

        // Projectile trail dot
        maybeSpawnProjectileTrail(this, proj.x, proj.y, proj.color);
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
      showKillLabel(this, e.sprite.x, e.sprite.y, threatName);

      e.hpBarBg.destroy();
      e.hpBarFill.destroy();
      e.hpBarBorder.destroy();
      const dyingSprite = e.sprite;
      spawnDeathParticles(this, dyingSprite.x, dyingSprite.y, THREAT_COLORS[e.type]);

      // Extra effects for high-HP threats (mini-bosses)
      if (e.maxHp >= 100) {
        this.cameras.main.shake(120, 0.006);
        // Extra particle burst
        spawnDeathParticles(this, e.sprite.x, e.sprite.y, 0xffd700);
      }

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
    if (this.waveCounterText) {
      this.waveCounterText.setText(`WAVE ${this.wave}/${this.getActiveWaves().length}`);
    }

    // Dynamic header color based on threat level
    if (this.headerText) {
      if (this.securityScore <= 25) {
        this.headerText.setColor('#ff4444'); // Critical
      } else if (this.securityScore <= 50) {
        this.headerText.setColor('#ffaa44'); // Warning
      } else {
        this.headerText.setColor('#00d4aa'); // Normal
      }
    }

    // Dynamic status text reflecting current game state
    if (this.statusText) {
      if (this.enemies.length > 0) {
        this.statusText.setText(`ACTIVE THREATS: ${this.enemies.length}`);
        this.statusText.setColor('#ff8844');
      } else {
        this.statusText.setText('MONITORING...');
        this.statusText.setColor('#2a8a5a');
      }
    }

    // Dynamic music intensity based on threat level
    if (this.bgMusic && this.bgMusic instanceof Phaser.Sound.WebAudioSound) {
      const targetVol = this.securityScore <= 30
        ? this.musicBaseVolume * 1.3  // Louder when critical
        : this.securityScore <= 60
        ? this.musicBaseVolume * 1.1  // Slightly louder when threatened
        : this.musicBaseVolume;

      // Smooth interpolation toward target
      const currentVol = this.bgMusic.volume;
      const newVol = currentVol + (targetVol - currentVol) * 0.02;
      this.bgMusic.volume = newVol;
    }

  }

  private onMusicVolume = (vol: number) => {
    if (this.bgMusic) {
      (this.bgMusic as Phaser.Sound.WebAudioSound).volume = this.musicBaseVolume * vol;
    }
  };

  /** F-25 (Run 07): now actually invoked — wired in create() via
   *  events.once(SHUTDOWN/DESTROY), plus called defensively at create() start
   *  to de-dup. Throw-proofed since the DESTROY path runs with plugins
   *  partially torn down. */
  shutdown() {
    try {
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
    } catch (_) { /* destroyed objects on the DESTROY path */ }
    // Clean up sound unlock listener
    try { this.sound.off('unlocked'); } catch (_) {}
    // Clean up input handlers
    try { this.input.off('pointermove'); } catch (_) {}
    try { this.input.off('pointerdown'); } catch (_) {}
    // Clean up EventBridge listeners
    eventBridge.off(BRIDGE_EVENTS.REACT_SET_MUSIC_VOLUME, this.onMusicVolume, this);
    eventBridge.off(BRIDGE_EVENTS.REACT_SELECT_TOWER_TYPE, this.onSelectTowerType, this);
    eventBridge.off(BRIDGE_EVENTS.REACT_START_BREACH, this.onStartGame, this);
    eventBridge.off(BRIDGE_EVENTS.REACT_DISMISS_TUTORIAL, this.onDismissTutorial, this);
    eventBridge.off(BRIDGE_EVENTS.REACT_START_PREP, this.onStartPrepCountdown, this);
    eventBridge.off(BRIDGE_EVENTS.REACT_START_NEXT_WAVE, this.onStartNextWave, this);
    eventBridge.off(BRIDGE_EVENTS.REACT_ONBOARDING_HIGHLIGHT, this.showPlacementHighlights, this);
    eventBridge.off(BRIDGE_EVENTS.REACT_ONBOARDING_CLEAR, this.clearPlacementHighlights, this);
    try { this.clearPlacementHighlights(); } catch (_) {}
    eventBridge.off(BRIDGE_EVENTS.REACT_RESTART_BREACH, this.onRestart, this);
    // Kill all tweens to prevent leaked infinite loops
    try { this.tweens.killAll(); } catch (_) {}
  }
}
