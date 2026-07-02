import Phaser from 'phaser';
import { GRID_COLS, GRID_ROWS, CELL_SIZE, PATHS } from '../../../game/breach-defense/constants';

/**
 * Handles created by renderBattlefield() that BreachDefenseScene keeps as
 * fields — they are mutated later by update()/event handlers.
 * `pathSet` is returned too: the scene's pointermove handler reads it to
 * validate tower placement cells.
 */
export interface BattlefieldHandles {
  headerText: Phaser.GameObjects.Text;
  statusText: Phaser.GameObjects.Text;
  statusCursor: Phaser.GameObjects.Text;
  waveCounterText: Phaser.GameObjects.Text;
  scanLine: Phaser.GameObjects.Rectangle;
  pathSet: Set<string>;
}

/**
 * Draw-only battlefield chrome for BreachDefenseScene: grid + circuit traces,
 * path glow/edges/portals, header bar + labels, bottom terminal panel,
 * vignette, scanline, corner brackets, startup text.
 * Moved verbatim from BreachDefenseScene.create() (refactor round 5).
 */
export function renderBattlefield(scene: Phaser.Scene, wave: number, totalWaves: number): BattlefieldHandles {
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

  const gridGfx = scene.add.graphics().setDepth(0);

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

      // Cell fill: tech-themed colors — path cells distinctly purple, non-path blue-gray
      let shade: number;
      if (isPath) {
        shade = (x + y) % 2 === 0 ? 0x503d78 : 0x483870;
      } else {
        shade = (x + y) % 2 === 0 ? 0x1e2240 : 0x1a1e3a;
      }

      gridGfx.fillStyle(shade, 1);
      gridGfx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

      // 1px grid lines between cells
      gridGfx.lineStyle(1, 0x4a4d8e, 0.7);
      gridGfx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

      // Path cells get extra visual treatment
      if (isPath) {
        // Subtle inner border to highlight the path lane
        gridGfx.lineStyle(1, 0x7b6ba5, 0.4);
        gridGfx.strokeRect(x * CELL_SIZE + 3, y * CELL_SIZE + 3, CELL_SIZE - 6, CELL_SIZE - 6);

        // Path channel glow — lighter center strip
        gridGfx.fillStyle(0x6b5b8e, 0.2);
        gridGfx.fillRect(cx - 20, cy - 20, 40, 40);

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
        // Non-path cells: PCB pad corners for a circuit board feel
        gridGfx.fillStyle(0x4a5d7e, 0.2);
        gridGfx.fillRect(x * CELL_SIZE, y * CELL_SIZE, 3, 3);
        gridGfx.fillRect(x * CELL_SIZE + CELL_SIZE - 3, y * CELL_SIZE, 3, 3);
        gridGfx.fillRect(x * CELL_SIZE, y * CELL_SIZE + CELL_SIZE - 3, 3, 3);
        gridGfx.fillRect(x * CELL_SIZE + CELL_SIZE - 3, y * CELL_SIZE + CELL_SIZE - 3, 3, 3);

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

        // Data center rack indicator on ~15% of non-path cells
        if (rVal >= 0.3 && rVal < 0.45) {
          gridGfx.fillStyle(0x2a3d5e, 0.2);
          gridGfx.fillRect(x * CELL_SIZE + 16, y * CELL_SIZE + 8, 32, 48);
          gridGfx.fillStyle(0x3a5d8e, 0.15);
          // Server LEDs
          for (let led = 0; led < 3; led++) {
            gridGfx.fillRect(x * CELL_SIZE + 20, y * CELL_SIZE + 14 + led * 12, 4, 2);
          }
        }
      }
    }
  }

  // Grid intersection nodes (circuit board feel)
  for (let y = 0; y <= GRID_ROWS; y++) {
    for (let x = 0; x <= GRID_COLS; x++) {
      gridGfx.fillStyle(0x4a5d7e, 0.3);
      gridGfx.fillCircle(x * CELL_SIZE, y * CELL_SIZE, 2);
    }
  }

  // Path glow strip — a bright line along the path centerline
  const pathGlow = scene.add.graphics().setDepth(1);
  pathGlow.lineStyle(2, 0x7b5baf, 0.15);
  pathGlow.beginPath();
  for (let i = 0; i < PATHS[0].length; i++) {
    const p = PATHS[0][i];
    const pcx = p.x * CELL_SIZE + CELL_SIZE / 2;
    const pcy = p.y * CELL_SIZE + CELL_SIZE / 2;
    if (i === 0) {
      pathGlow.moveTo(pcx, pcy);
    } else {
      pathGlow.lineTo(pcx, pcy);
    }
  }
  pathGlow.strokePath();

  // Path edge highlights — thin brighter lines along path borders
  const pathEdge = scene.add.graphics().setDepth(1);
  pathEdge.lineStyle(1, 0x9b7bdf, 0.1);
  for (const p of PATHS[0]) {
    const cx = p.x * CELL_SIZE;
    const cy = p.y * CELL_SIZE;
    // Check which sides are NOT adjacent to path
    const hasLeft = pathSet.has(`${p.x - 1},${p.y}`);
    const hasRight = pathSet.has(`${p.x + 1},${p.y}`);
    const hasUp = pathSet.has(`${p.x},${p.y - 1}`);
    const hasDown = pathSet.has(`${p.x},${p.y + 1}`);

    if (!hasLeft) {
      pathEdge.beginPath();
      pathEdge.moveTo(cx, cy);
      pathEdge.lineTo(cx, cy + CELL_SIZE);
      pathEdge.strokePath();
    }
    if (!hasRight) {
      pathEdge.beginPath();
      pathEdge.moveTo(cx + CELL_SIZE, cy);
      pathEdge.lineTo(cx + CELL_SIZE, cy + CELL_SIZE);
      pathEdge.strokePath();
    }
    if (!hasUp) {
      pathEdge.beginPath();
      pathEdge.moveTo(cx, cy);
      pathEdge.lineTo(cx + CELL_SIZE, cy);
      pathEdge.strokePath();
    }
    if (!hasDown) {
      pathEdge.beginPath();
      pathEdge.moveTo(cx, cy + CELL_SIZE);
      pathEdge.lineTo(cx + CELL_SIZE, cy + CELL_SIZE);
      pathEdge.strokePath();
    }
  }

  // Path entry portal glow (where enemies spawn)
  const pathStart = PATHS[0][0];
  const startX = (pathStart.x - 1) * CELL_SIZE + CELL_SIZE / 2;
  const startY = pathStart.y * CELL_SIZE + CELL_SIZE / 2;
  const entryGlow = scene.add.circle(startX, startY, 20, 0x9b59b6, 0)
    .setStrokeStyle(2, 0x9b59b6, 0.4)
    .setDepth(2);
  scene.tweens.add({
    targets: entryGlow,
    scale: { from: 0.6, to: 1.4 },
    strokeAlpha: { from: 0.5, to: 0 },
    duration: 1500,
    repeat: -1,
    ease: 'Sine.easeOut'
  });

  // Path exit portal glow (breach point — red/danger)
  const pathEnd = PATHS[0][PATHS[0].length - 1];
  const endX = pathEnd.x * CELL_SIZE + CELL_SIZE / 2;
  const endY = pathEnd.y * CELL_SIZE + CELL_SIZE / 2;
  const exitGlow = scene.add.circle(endX, endY, 20, 0xff4444, 0)
    .setStrokeStyle(2, 0xff4444, 0.4)
    .setDepth(2);
  scene.tweens.add({
    targets: exitGlow,
    scale: { from: 0.6, to: 1.4 },
    strokeAlpha: { from: 0.5, to: 0 },
    duration: 1500,
    repeat: -1,
    ease: 'Sine.easeOut'
  });

  // ── Header bar: network defense grid label ───────────────
  const headerGfx = scene.add.graphics().setDepth(8);
  headerGfx.fillStyle(0x0e1020, 0.85);
  headerGfx.fillRect(0, 0, GRID_COLS * CELL_SIZE, 20);
  // Thin bottom border on the header
  headerGfx.lineStyle(1, 0x3a5d8e, 0.6);
  headerGfx.beginPath();
  headerGfx.moveTo(0, 20);
  headerGfx.lineTo(GRID_COLS * CELL_SIZE, 20);
  headerGfx.strokePath();

  const headerText = scene.add.text(GRID_COLS * CELL_SIZE / 2, 10, 'NETWORK DEFENSE GRID', {
    fontFamily: '"Press Start 2P"',
    fontSize: '7px',
    color: '#00d4aa',
    align: 'center'
  }).setOrigin(0.5, 0.5).setDepth(9);

  // Status LED indicators in header
  const ledG = scene.add.graphics().setDepth(9);
  // Green status LED (left of header)
  ledG.fillStyle(0x00ff00, 0.6);
  ledG.fillCircle(20, 10, 3);
  ledG.fillStyle(0x00ff00, 0.2);
  ledG.fillCircle(20, 10, 5);
  // Red status LED (right of header)
  ledG.fillStyle(0xff4444, 0.4);
  ledG.fillCircle(GRID_COLS * CELL_SIZE - 20, 10, 3);

  // Pulse tween on header — subtle alpha oscillation like an active monitor
  scene.tweens.add({
    targets: headerText,
    alpha: 0.7,
    duration: 2000,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });

  // Column labels (A-J) just below the header bar
  const colLabels = 'ABCDEFGHIJ';
  for (let c = 0; c < GRID_COLS; c++) {
    scene.add.text(c * CELL_SIZE + CELL_SIZE / 2, 26, colLabels[c], {
      fontFamily: '"Press Start 2P"',
      fontSize: '5px',
      color: '#3a5d8e',
      align: 'center'
    }).setOrigin(0.5, 0.5).setDepth(9).setAlpha(0.8);
  }

  // Row labels (1-6) along the left edge
  for (let r = 0; r < GRID_ROWS; r++) {
    scene.add.text(4, r * CELL_SIZE + CELL_SIZE / 2, `${r + 1}`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '5px',
      color: '#3a5d8e',
      align: 'left'
    }).setOrigin(0, 0.5).setDepth(1).setAlpha(0.8);
  }

  // ── Bottom area: terminal status panel ───────────────────
  const bottomY = GRID_ROWS * CELL_SIZE;
  const bottomH = 96;
  const bottomGfx = scene.add.graphics().setDepth(0);
  // Dark background fill
  bottomGfx.fillStyle(0x141628, 1);
  bottomGfx.fillRect(0, bottomY, GRID_COLS * CELL_SIZE, bottomH);
  // Thin bright separator line at the top
  bottomGfx.lineStyle(1, 0x3a5d8e, 0.8);
  bottomGfx.beginPath();
  bottomGfx.moveTo(0, bottomY);
  bottomGfx.lineTo(GRID_COLS * CELL_SIZE, bottomY);
  bottomGfx.strokePath();
  // Double-line border effect
  bottomGfx.lineStyle(1, 0x2a3d5e, 0.4);
  bottomGfx.beginPath();
  bottomGfx.moveTo(0, bottomY + 3);
  bottomGfx.lineTo(GRID_COLS * CELL_SIZE, bottomY + 3);
  bottomGfx.strokePath();
  // Faint scan lines for terminal aesthetic
  for (let sy = bottomY + 2; sy < bottomY + bottomH; sy += 4) {
    bottomGfx.fillStyle(0xffffff, 0.012);
    bottomGfx.fillRect(0, sy, GRID_COLS * CELL_SIZE, 1);
  }

  // Terminal area is now covered by React HUD overlay — keep minimal decorations only
  // Status text (hidden behind overlay but updated for state tracking)
  const statusFont = { fontFamily: '"Press Start 2P"', fontSize: '6px', color: '#2a8a5a' };
  const statusText = scene.add.text(10, bottomY + 14, 'AWAITING AUTHORIZATION...', statusFont)
    .setDepth(1).setAlpha(0.2);
  const statusCursor = scene.add.text(10, bottomY + 26, '_', statusFont)
    .setDepth(1).setAlpha(0.2);

  // Wave counter — top-right of bottom panel (peeks through semi-transparent overlay)
  const waveCounterText = scene.add.text(
    GRID_COLS * CELL_SIZE - 10, bottomY + 10,
    `WAVE ${wave}/${totalWaves}`,
    { fontFamily: '"Press Start 2P"', fontSize: '7px', color: '#00d4aa' }
  ).setOrigin(1, 0).setDepth(9).setAlpha(0.3);

  // ── Vignette overlay — subtle edge darkening for cinematic framing ──
  const camW = scene.cameras.main.width;
  const camH = scene.cameras.main.height;
  const vignette = scene.add.graphics();
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
  const scanLine = scene.add.rectangle(gridWidth / 2, scanTop, gridWidth, 2, 0x00d4aa, 0.08)
    .setDepth(3);
  scene.tweens.add({
    targets: scanLine,
    y: scanBottom,
    duration: 4000,
    repeat: -1,
    ease: 'Linear',
    onRepeat: () => {
      if (scanLine) scanLine.y = scanTop;
    }
  });

  // ── Corner bracket decorations on the grid frame ──
  const gridRight = GRID_COLS * CELL_SIZE;
  const gridBottom = GRID_ROWS * CELL_SIZE;
  const bracketGfx = scene.add.graphics().setDepth(8);
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

  // "System Online" startup text
  const startupText = scene.add.text(
    GRID_COLS * CELL_SIZE / 2, GRID_ROWS * CELL_SIZE / 2,
    'SYSTEM ONLINE',
    { fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#00d4aa', stroke: '#000000', strokeThickness: 2 }
  ).setOrigin(0.5).setDepth(50).setAlpha(0);

  scene.tweens.add({
    targets: startupText,
    alpha: { from: 0, to: 0.8 },
    duration: 400,
    delay: 200,
    onComplete: () => {
      scene.tweens.add({
        targets: startupText,
        alpha: 0,
        duration: 600,
        delay: 800,
        onComplete: () => startupText.destroy()
      });
    }
  });

  return { headerText, statusText, statusCursor, waveCounterText, scanLine, pathSet };
}
