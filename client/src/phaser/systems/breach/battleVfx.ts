import Phaser from 'phaser';
import { GRID_COLS, GRID_ROWS, CELL_SIZE } from '../../../game/breach-defense/constants';

/**
 * Fire-and-forget battle VFX for BreachDefenseScene, moved verbatim
 * (refactor round 5). Each function creates objects, tweens them, and
 * destroys on complete. No simulation state is read or written — all
 * values arrive as arguments.
 */

/** ── Tower placement visual burst ── (from placeTowerAt) */
export function playTowerPlacementFx(
  scene: Phaser.Scene,
  sprite: Phaser.GameObjects.Sprite,
  px: number,
  py: number,
  type: string,
  stats: { color: string; range: number },
  towers: ReadonlyArray<{ id: string; gridX: number; gridY: number }>,
  towerId: string,
  gridX: number,
  gridY: number,
): void {
  // Capture the base scale set by setDisplaySize (varies per PNG resolution)
  const baseScaleX = sprite.scaleX;
  const baseScaleY = sprite.scaleY;

  const towerColor = parseInt(stats.color.replace('#', ''), 16);
  // Particle burst at placement point
  const placeEmitter = scene.add.particles(px, py, 'particle_circle', {
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
  scene.time.delayedCall(350, () => {
    if (placeEmitter && placeEmitter.active) placeEmitter.destroy();
  });

  // Scale pulse on the newly placed tower sprite (relative to display size)
  sprite.setScale(baseScaleX * 0.5, baseScaleY * 0.5);
  scene.tweens.add({
    targets: sprite,
    scaleX: { from: baseScaleX * 0.5, to: baseScaleX },
    scaleY: { from: baseScaleY * 0.5, to: baseScaleY },
    duration: 350,
    ease: 'Back.easeOut',
    onComplete: () => {
      sprite.setScale(baseScaleX, baseScaleY);
      // Idle breathing animation for placed towers
      scene.tweens.add({
        targets: sprite,
        y: py - 2,
        duration: 1200 + Math.random() * 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  });

  // Tower base glow (placed beneath tower)
  const baseGlow = scene.add.ellipse(px, py + 20, 40, 16, towerColor, 0.15)
    .setDepth(9);
  // Subtle pulse on base glow
  scene.tweens.add({
    targets: baseGlow,
    alpha: { from: 0.15, to: 0.08 },
    scaleX: { from: 1, to: 1.1 },
    duration: 2000,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });

  // Tower status ring (always-visible range indicator)
  const statusRing = scene.add.circle(px, py, stats.range * CELL_SIZE * 0.3, 0x000000, 0)
    .setStrokeStyle(1, towerColor, 0.12)
    .setDepth(8);

  // Brief glow ring that scales up and fades out
  const glowRing = scene.add.circle(px, py, 8, towerColor, 0.4)
    .setStrokeStyle(2, towerColor, 0.6)
    .setDepth(9);
  scene.tweens.add({
    targets: glowRing,
    scale: 3,
    alpha: 0,
    duration: 400,
    ease: 'Quad.easeOut',
    onComplete: () => glowRing.destroy()
  });

  // Tower type label beneath sprite
  const labelText = scene.add.text(px, py + 28, type, {
    fontFamily: '"Press Start 2P"',
    fontSize: '4px',
    color: stats.color,
    stroke: '#000000',
    strokeThickness: 1,
  }).setOrigin(0.5).setDepth(11).setAlpha(0.6);

  // Draw connection lines to nearby towers
  for (const other of towers) {
    if (other.id === towerId) continue;
    const dx = other.gridX - gridX;
    const dy = other.gridY - gridY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= 2) { // Adjacent or diagonal
      const line = scene.add.graphics().setDepth(1);
      line.lineStyle(1, 0x3a5d8e, 0.2);
      line.beginPath();
      line.moveTo(px, py);
      line.lineTo(other.gridX * CELL_SIZE + CELL_SIZE / 2, other.gridY * CELL_SIZE + CELL_SIZE / 2);
      line.strokePath();

      // Fade in
      line.setAlpha(0);
      scene.tweens.add({
        targets: line,
        alpha: 1,
        duration: 400,
        ease: 'Sine.easeIn'
      });
    }
  }

}

export function spawnDeathParticles(scene: Phaser.Scene, x: number, y: number, color: number): void {
  if (!scene.scene.isActive()) return;
  const emitter = scene.add.particles(x, y, 'particle_circle', {
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
  scene.time.delayedCall(400, () => {
    if (emitter && emitter.active) emitter.destroy();
  });
}

export function playRecoilTween(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite): void {
  // Use relative scale — tower PNGs are 1024x1024, displayed at 56x56
  const baseX = sprite.scaleX;
  const baseY = sprite.scaleY;
  scene.tweens.add({
    targets: sprite,
    scaleX: [baseX, baseX * 1.15, baseX * 0.95, baseX],
    scaleY: [baseY, baseY * 1.15, baseY * 0.95, baseY],
    duration: 200,
    ease: 'Quad.easeOut'
  });
}

/** Dramatic entrance animation — spawn from nothing (from spawnEnemy) */
export function playEnemySpawnFx(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, enemySize: number): void {
  sprite.setAlpha(0).setScale(0.3);
  scene.tweens.add({
    targets: sprite,
    alpha: 1,
    scaleX: enemySize / sprite.width,
    scaleY: enemySize / sprite.height,
    duration: 300,
    ease: 'Back.easeOut'
  });
}

/** Impact particles + strong-hit shake + floating damage number (from update() Phase 5) */
export function playImpactFx(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: number,
  isStrong: boolean,
  damage: number,
): void {
  // Impact particles at hit point
  const impactEmitter = scene.add.particles(x, y, 'particle_circle', {
    speed: { min: 20, max: 60 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.6, end: 0 },
    alpha: { start: 0.8, end: 0 },
    lifespan: 200,
    tint: color,
    frequency: -1
  });
  impactEmitter.setDepth(20);
  impactEmitter.explode(4);
  scene.time.delayedCall(300, () => {
    if (impactEmitter && impactEmitter.active) impactEmitter.destroy();
  });

  // Screen shake on strong hits
  if (isStrong) {
    scene.cameras.main.shake(80, 0.003);
  }

  // Floating damage number
  const dmgText = scene.add.text(x, y - 10, `-${damage}`, {
    fontFamily: '"Press Start 2P"',
    fontSize: isStrong ? '8px' : '6px',
    color: isStrong ? '#ff6644' : '#ffffff',
    stroke: '#000000',
    strokeThickness: 2,
  }).setDepth(25).setOrigin(0.5);

  scene.tweens.add({
    targets: dmgText,
    y: dmgText.y - 25,
    alpha: 0,
    duration: 600,
    ease: 'Quad.easeOut',
    onComplete: () => dmgText.destroy()
  });
}

/** Trail ghost for moving enemies (every ~200ms) (from update() Phase 2) */
export function maybeSpawnTrailGhost(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, tint: number): void {
  if (Math.random() < 0.08) { // ~8% chance per frame ≈ every 200ms at 60fps
    const ghost = scene.add.sprite(sprite.x, sprite.y, sprite.texture.key)
      .setDisplaySize(48, 48)
      .setAlpha(0.3)
      .setTint(tint)
      .setDepth(14);
    scene.tweens.add({
      targets: ghost,
      alpha: 0,
      scale: ghost.scaleX * 0.7,
      duration: 400,
      onComplete: () => ghost.destroy()
    });
  }
}

/** Projectile trail dot (from update() Phase 5) */
export function maybeSpawnProjectileTrail(scene: Phaser.Scene, x: number, y: number, color: number): void {
  if (Math.random() < 0.3) {
    const trail = scene.add.circle(x, y, 2, color, 0.4).setDepth(19);
    scene.tweens.add({
      targets: trail,
      alpha: 0,
      scale: 0.2,
      duration: 200,
      onComplete: () => trail.destroy()
    });
  }
}

/** Floating kill label with occasional witty messages (from update() Phase 6) */
export function showKillLabel(scene: Phaser.Scene, x: number, y: number, threatName: string): void {
  // Occasional witty kill messages for variety
  const killMessages = [
    'NEUTRALIZED!',
    'ACCESS DENIED!',
    'BLOCKED!',
    'QUARANTINED!',
    'PATCHED!',
  ];
  const displayText = Math.random() < 0.3
    ? killMessages[Math.floor(Math.random() * killMessages.length)]
    : threatName;
  const label = scene.add.text(x, y - 20, displayText, {
    fontFamily: '"Press Start 2P"',
    fontSize: '7px',
    color: '#44ff44',
    stroke: '#000000',
    strokeThickness: 2,
  }).setDepth(30).setOrigin(0.5);

  scene.tweens.add({
    targets: label,
    y: label.y - 44,
    alpha: 0,
    duration: 900,
    ease: 'Cubic.easeOut',
    onComplete: () => { label.destroy(); }
  });
}

/** ── Breach alert screen edge pulse ── (from update() Phase 3) */
export function playBreachBorderFlash(scene: Phaser.Scene): void {
  const borderFlash = scene.add.rectangle(
    GRID_COLS * CELL_SIZE / 2, GRID_ROWS * CELL_SIZE / 2,
    GRID_COLS * CELL_SIZE, GRID_ROWS * CELL_SIZE
  ).setStrokeStyle(4, 0xff0000, 0.8).setFillStyle(0xff0000, 0.1).setDepth(40);

  scene.tweens.add({
    targets: borderFlash,
    alpha: 0, duration: 400, ease: 'Quad.easeOut',
    onComplete: () => borderFlash.destroy()
  });

  scene.cameras.main.shake(150, 0.005);
}
