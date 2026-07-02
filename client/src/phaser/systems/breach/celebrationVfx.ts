import Phaser from 'phaser';
import { GRID_COLS, GRID_ROWS, CELL_SIZE } from '../../../game/breach-defense/constants';
import { spawnDeathParticles } from './battleVfx';

/**
 * Celebration/game-over spectacle for BreachDefenseScene, moved verbatim
 * (refactor round 5). State transitions (wave++, stipends, gameState changes,
 * activateWave) stay in the scene — only the spectacle lives here. Where a
 * sequence triggers scene logic on completion, it takes a callback.
 */

/** ── Wave complete celebration effects ── (from update() Phase 1) */
export function playWaveClearedFx(scene: Phaser.Scene, wave: number, waveKills: number): void {
  scene.sound.play('sfx_wave_start', { volume: 0.5, rate: 1.2 });
  scene.cameras.main.flash(400, 100, 255, 100, false);
  scene.cameras.main.shake(200, 0.008);

  const clearedText = scene.add.text(
    GRID_COLS * CELL_SIZE / 2, GRID_ROWS * CELL_SIZE / 2,
    `WAVE ${wave} CLEARED!`,
    { fontFamily: '"Press Start 2P"', fontSize: '14px', color: '#44ff44', stroke: '#000000', strokeThickness: 3 }
  ).setOrigin(0.5).setDepth(50).setAlpha(0);

  scene.tweens.add({
    targets: clearedText,
    alpha: 1, scale: { from: 0.3, to: 1.2 },
    duration: 400, ease: 'Back.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: clearedText,
        alpha: 0, y: clearedText.y - 40,
        duration: 600, delay: 800, ease: 'Quad.easeIn',
        onComplete: () => clearedText.destroy()
      });
    }
  });

  // Wave stats beneath the cleared text
  const statsText = scene.add.text(
    GRID_COLS * CELL_SIZE / 2, GRID_ROWS * CELL_SIZE / 2 + 25,
    `${waveKills} threats stopped`,
    { fontFamily: '"Press Start 2P"', fontSize: '7px', color: '#aaffaa', stroke: '#000000', strokeThickness: 2 }
  ).setOrigin(0.5).setDepth(50).setAlpha(0);

  scene.tweens.add({
    targets: statsText,
    alpha: 1,
    duration: 300,
    delay: 400,
    ease: 'Sine.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: statsText,
        alpha: 0,
        duration: 400,
        delay: 1000,
        onComplete: () => statsText.destroy()
      });
    }
  });

  // Celebration particles at center of grid
  const celebCenterX = GRID_COLS * CELL_SIZE / 2;
  const celebCenterY = GRID_ROWS * CELL_SIZE / 2;
  const celebEmitter = scene.add.particles(celebCenterX, celebCenterY, 'particle_circle', {
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
  scene.time.delayedCall(500, () => {
    if (celebEmitter && celebEmitter.active) celebEmitter.destroy();
  });
}

/** ── Victory celebration effects ── (from update() Phase 1) */
export function playVictoryFx(scene: Phaser.Scene): void {
  scene.cameras.main.flash(800, 255, 215, 0, false);
  scene.cameras.main.shake(400, 0.012);

  // Confetti-like particle bursts at random positions
  const confettiColors = [0xffd700, 0x44ff44, 0x00d4aa, 0xffffff];
  for (let i = 0; i < 5; i++) {
    const cx = Phaser.Math.Between(CELL_SIZE * 2, (GRID_COLS - 2) * CELL_SIZE);
    const cy = Phaser.Math.Between(CELL_SIZE * 2, (GRID_ROWS - 2) * CELL_SIZE);
    const confettiEmitter = scene.add.particles(cx, cy, 'particle_circle', {
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
    scene.time.delayedCall(700, () => {
      if (confettiEmitter && confettiEmitter.active) confettiEmitter.destroy();
    });
  }

  // Second round of confetti after a beat — extended celebration
  scene.time.delayedCall(1500, () => {
    if (!scene.scene.isActive()) return;
    for (let i = 0; i < 3; i++) {
      const rx = Math.random() * GRID_COLS * CELL_SIZE;
      const ry = Math.random() * GRID_ROWS * CELL_SIZE * 0.5;
      const colors = [0xffd700, 0x44ff44, 0x00d4aa, 0xff6b9d];
      spawnDeathParticles(scene, rx, ry, colors[i % colors.length]);
    }
  });

  // Golden victory screen tint
  const victoryTint = scene.add.rectangle(
    GRID_COLS * CELL_SIZE / 2, (GRID_ROWS * CELL_SIZE + 96) / 2,
    GRID_COLS * CELL_SIZE, GRID_ROWS * CELL_SIZE + 96,
    0xffd700, 0
  ).setDepth(40);
  scene.tweens.add({
    targets: victoryTint,
    fillAlpha: 0.05,
    duration: 1000,
    delay: 500,
    yoyo: true,
    repeat: 1,
    onComplete: () => victoryTint.destroy()
  });

  // "NETWORK SECURED!" dramatic text
  const victoryText = scene.add.text(
    GRID_COLS * CELL_SIZE / 2, GRID_ROWS * CELL_SIZE / 2,
    'NETWORK SECURED!',
    { fontFamily: '"Press Start 2P"', fontSize: '18px', color: '#ffd700', stroke: '#000000', strokeThickness: 4 }
  ).setOrigin(0.5).setDepth(50).setAlpha(0);

  scene.tweens.add({
    targets: victoryText,
    alpha: 1, scale: { from: 0.2, to: 1.3 },
    duration: 500, ease: 'Back.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: victoryText,
        alpha: 0, y: victoryText.y - 50,
        duration: 800, delay: 1200, ease: 'Quad.easeIn',
        onComplete: () => victoryText.destroy()
      });
    }
  });
}

/** ── Game over effects ── (from update() Phase 3) */
export function playGameOverFx(scene: Phaser.Scene): void {
  scene.cameras.main.flash(600, 255, 50, 50, false);
  scene.cameras.main.shake(500, 0.015);

  // "SYSTEM COMPROMISED" text with red glitch-like entrance
  const gameOverText = scene.add.text(
    GRID_COLS * CELL_SIZE / 2, GRID_ROWS * CELL_SIZE / 2,
    'SYSTEM COMPROMISED',
    { fontFamily: '"Press Start 2P"', fontSize: '14px', color: '#ff3333', stroke: '#000000', strokeThickness: 4 }
  ).setOrigin(0.5).setDepth(50).setAlpha(0);

  // Glitch effect: rapid x-offset jitter then settle
  scene.tweens.add({
    targets: gameOverText,
    alpha: 1,
    duration: 100,
    onComplete: () => {
      // Jitter phase
      let jitterCount = 0;
      const jitterEvent = scene.time.addEvent({
        delay: 50,
        repeat: 7,
        callback: () => {
          jitterCount++;
          gameOverText.x = GRID_COLS * CELL_SIZE / 2 + Phaser.Math.Between(-8, 8);
          gameOverText.y = GRID_ROWS * CELL_SIZE / 2 + Phaser.Math.Between(-3, 3);
        }
      });
      scene.time.delayedCall(400, () => {
        jitterEvent.destroy();
        gameOverText.setPosition(GRID_COLS * CELL_SIZE / 2, GRID_ROWS * CELL_SIZE / 2);
        // Fade out after settling
        scene.tweens.add({
          targets: gameOverText,
          alpha: 0,
          duration: 800, delay: 1000, ease: 'Quad.easeIn',
          onComplete: () => gameOverText.destroy()
        });
      });
    }
  });
}

/**
 * Visible countdown on the Phaser canvas, then invoke `onDone` (the scene
 * activates the wave there). From onStartPrepCountdown.
 */
export function runPrepCountdown(scene: Phaser.Scene, totalSeconds: number, onDone: () => void): void {
  const countdownText = scene.add.text(
    GRID_COLS * CELL_SIZE / 2, GRID_ROWS * CELL_SIZE / 2 - 20,
    '',
    { fontFamily: '"Press Start 2P"', fontSize: '11px', color: '#00d4aa', stroke: '#000000', strokeThickness: 3 }
  ).setOrigin(0.5).setDepth(50);

  const hintText = scene.add.text(
    GRID_COLS * CELL_SIZE / 2, GRID_ROWS * CELL_SIZE / 2 + 10,
    'PLACE YOUR DEFENSES',
    { fontFamily: '"Press Start 2P"', fontSize: '7px', color: '#8888aa', stroke: '#000000', strokeThickness: 2 }
  ).setOrigin(0.5).setDepth(50);

  scene.tweens.add({
    targets: hintText,
    alpha: { from: 0.4, to: 1 },
    duration: 800,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });

  let remaining = totalSeconds;
  const tick = () => {
    if (remaining <= 0) {
      countdownText.destroy();
      hintText.destroy();
      onDone();
      return;
    }
    countdownText.setText(`Wave starts in ${remaining}...`);
    // Pulse effect on each tick
    scene.tweens.add({
      targets: countdownText,
      scale: { from: 1.15, to: 1 },
      duration: 300,
      ease: 'Back.easeOut'
    });
    if (remaining <= 3) {
      countdownText.setColor('#ff6644');
      scene.sound.play('sfx_interact', { volume: 0.2 });
    }
    remaining--;
    scene.time.delayedCall(1000, tick);
  };

  tick();
}
