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
    this.lastBroadcast = 0;
  }

  create() {
    // ── Draw grid ──────────────────────────────────────────────
    const pathSet = new Set<string>();
    PATHS[0].forEach(p => pathSet.add(`${p.x},${p.y}`));

    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const isPath = pathSet.has(`${x},${y}`);
        const shade = isPath
          ? ((x + y) % 2 === 0 ? 0x4a3f6b : 0x3d3460)
          : ((x + y) % 2 === 0 ? 0x2a2a3e : 0x24243a);
        this.add.rectangle(
          x * CELL_SIZE + CELL_SIZE / 2,
          y * CELL_SIZE + CELL_SIZE / 2,
          CELL_SIZE, CELL_SIZE, shade
        ).setStrokeStyle(1, 0x1a1a2e);
      }
    }

    // Path direction arrows (small dots along the path)
    for (let i = 0; i < PATHS[0].length - 1; i++) {
      const curr = PATHS[0][i];
      const next = PATHS[0][i + 1];
      const cx = curr.x * CELL_SIZE + CELL_SIZE / 2;
      const cy = curr.y * CELL_SIZE + CELL_SIZE / 2;
      const dx = next.x - curr.x;
      const dy = next.y - curr.y;
      // Small arrow indicator offset toward next cell
      this.add.circle(cx + dx * 12, cy + dy * 12, 3, 0x6b5b95, 0.5).setDepth(1);
    }

    // Bottom dark area (below the grid)
    this.add.rectangle(320, 384 + 48, 640, 96, 0x111122);

    // ── Hover indicator ────────────────────────────────────────
    this.hoverRect = this.add.rectangle(0, 0, CELL_SIZE - 2, CELL_SIZE - 2)
      .setStrokeStyle(2, 0xffffff, 0.5)
      .setFillStyle(0xffffff, 0.08)
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
      } else {
        this.hoverRect.setStrokeStyle(2, 0xffffff, 0.5);
        this.hoverRect.setFillStyle(0xffffff, 0.08);
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

    // Emit ready
    eventBridge.emit(BRIDGE_EVENTS.SCENE_READY, 'BreachDefense');
  }

  // ── Event handlers ─────────────────────────────────────────────

  private onSelectTowerType(data: { type: TowerType | null }) {
    this.selectedTowerType = data.type;
  }

  private onStartGame() {
    this.gameState = 'PLAYING';
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

    // HP bar background
    const hpBarBg = this.add.rectangle(px, py - 30, 40, 5, 0x333333)
      .setDepth(16);
    // HP bar fill
    const hpBarFill = this.add.rectangle(px, py - 30, 40, 5, 0x44ff44)
      .setDepth(17);

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

      for (const enemy of breaching) {
        enemy.sprite.destroy();
        enemy.hpBarBg.destroy();
        enemy.hpBarFill.destroy();
      }
      this.enemies = this.enemies.filter(e => !breaching.includes(e));

      if (this.securityScore <= 0) {
        this.gameState = 'GAMEOVER';
        eventBridge.emit(BRIDGE_EVENTS.BREACH_GAME_OVER, {
          wavesCompleted: this.wave - 1,
          towersPlaced: this.towers.length
        });
      }
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

      const label = this.add.text(e.sprite.x, e.sprite.y - 20, `${e.type} blocked!`, {
        fontFamily: '"Press Start 2P"',
        fontSize: '7px',
        color: '#ffff44',
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

    // ── Phase 7: Broadcast state (throttled) ───────────────────
    if (time - this.lastBroadcast > 200) {
      this.broadcastState();
      this.lastBroadcast = time;
    }
  }

  shutdown() {
    eventBridge.off(BRIDGE_EVENTS.REACT_SELECT_TOWER_TYPE, this.onSelectTowerType, this);
    eventBridge.off(BRIDGE_EVENTS.REACT_START_BREACH, this.onStartGame, this);
    eventBridge.off(BRIDGE_EVENTS.REACT_DISMISS_TUTORIAL, this.onDismissTutorial, this);
    eventBridge.off(BRIDGE_EVENTS.REACT_RESTART_BREACH, this.onRestart, this);
  }
}
