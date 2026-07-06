import Phaser from 'phaser';
import { furnitureTextureKey } from '../../sprites/furniture';
import { npcTextureKey } from '../../sprites/npcTextures';
import { objectTextureKey } from '../../sprites/objectTextures';
import type { Room } from '@shared/schema';
import type { InteractableData } from './interactableFactory';

const TILE = 32;

export interface RoomAmbienceCtx {
  getCurrentAct: () => 1 | 2 | 3;
}

/**
 * Per-room "life pass" ambience blocks — decorative props, patrol NPCs,
 * flicker/steam/dust effects and ambient SFX timers. Moved verbatim from
 * ExplorationScene.create() (Round 4). The first-NPC pulse block stays in the
 * scene (it writes npcPulseTween/npcPulseTarget fields). All tweens/timers go
 * through scene.tweens / scene.time so shutdown()'s killAll still cleans up.
 */
export function addRoomAmbience(
  scene: Phaser.Scene,
  room: Room,
  interactables: InteractableData[],
  ctx: RoomAmbienceCtx,
): void {
  // ── ER urgency cues (DESIGN-001) ────────────────────────────
  if (room.id === 'er') {
    // Flashing EMERGENCY status panel — wall-mounted near the top center
    const panelX = 10 * TILE + TILE / 2;
    const panelY = 1 * TILE + TILE / 2 + 4;
    const panelBack = scene.add.rectangle(panelX, panelY, 64, 18, 0x1a0000).setStrokeStyle(1, 0x4a0000).setDepth(4);
    const panelGlow = scene.add.rectangle(panelX, panelY, 64, 18, 0xff2222, 0.55).setDepth(4);
    const panelLabel = scene.add.text(panelX, panelY, 'EMERGENCY', {
      fontFamily: '"Press Start 2P"', fontSize: '7px', color: '#ffe6e6', stroke: '#660000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(5);
    scene.tweens.add({ targets: [panelGlow, panelLabel], alpha: { from: 1, to: 0.35 }, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    void panelBack;

    // Walking nurse — patrols horizontally between tile x=8 and x=11 at y=4
    const nurseY = 4 * TILE + TILE / 2;
    const nurseStartX = 8 * TILE + TILE / 2;
    const nurseEndX = 11 * TILE + TILE / 2;
    scene.add.ellipse(nurseStartX, nurseY + TILE / 2 - 2, 18, 7, 0x000000, 0.25).setDepth(4);
    const nurseSprite = scene.add.sprite(nurseStartX, nurseY, npcTextureKey('nurse_chen')).setDepth(5 + 4);
    scene.tweens.add({ targets: nurseSprite, x: nurseEndX, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', onYoyo: () => nurseSprite.setFlipX(true), onRepeat: () => nurseSprite.setFlipX(false) });
    scene.tweens.add({ targets: nurseSprite, scaleY: { from: 1.0, to: 1.03 }, duration: 360, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Idle fidget for officer + frantic family — subtle angle wobble
    for (const fidgetId of ['officer', 'frantic_family']) {
      const ia = interactables.find(i => i.type === 'npc' && i.id === fidgetId);
      if (ia) scene.tweens.add({ targets: ia.sprite, angle: { from: -1.5, to: 1.5 }, duration: 1100 + Math.random() * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    // Ambient monitor beep — heartbeat-like cadence (DESIGN-LIFT-001)
    scene.time.addEvent({ delay: 9000, loop: true, callback: () => {
      try { scene.sound.play('sfx_interact', { volume: 0.06, rate: 0.6 }); } catch (_) {}
    } });
  }

  // ── Reception life pass (DESIGN-005) ────────────────────────
  if (room.id === 'reception') {
    // Busy desk props — clipboard, coffee mug, papers stack riding on the desk surface
    const deskSurfaceY = 2 * TILE + TILE / 2 - 6;
    const clipboard = scene.add.sprite(8 * TILE + TILE / 2, deskSurfaceY, objectTextureKey('manual')).setScale(0.55).setDepth(5).setAngle(-8);
    const mug = scene.add.sprite(9 * TILE + TILE / 2 + 6, deskSurfaceY + 2, furnitureTextureKey('coffee_mug')).setScale(0.6).setDepth(5);
    const papers = scene.add.sprite(11 * TILE + TILE / 2, deskSurfaceY, furnitureTextureKey('inbox_tray')).setScale(0.55).setDepth(5);
    scene.tweens.add({ targets: mug, y: mug.y - 1, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    void clipboard; void papers;

    // Vary chair groupings — add a conversation pair facing each other (decorative, no collision)
    const pairY = 11 * TILE + TILE / 2;
    const chairA = scene.add.sprite(10 * TILE + TILE / 2, pairY, furnitureTextureKey('chair')).setDepth(3).setAngle(15);
    const chairB = scene.add.sprite(11 * TILE + TILE / 2 + 4, pairY, furnitureTextureKey('chair')).setDepth(3).setAngle(-15).setFlipX(true);
    // Angled corner chair near the right cluster, suggesting someone sat askew
    const chairC = scene.add.sprite(14 * TILE + TILE / 2, 8 * TILE + TILE / 2, furnitureTextureKey('chair')).setDepth(3).setAngle(-25);
    void chairA; void chairB; void chairC;

    // Interactable pulse — subtle scale yoyo on items + zones to signpost interactivity
    for (const ia of interactables) {
      if (ia.type !== 'zone' && ia.type !== 'item') continue;
      scene.tweens.add({ targets: ia.sprite, scaleX: { from: 1.0, to: 1.04 }, scaleY: { from: 1.0, to: 1.04 }, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    // Ambient distant footsteps — visitor passing in the corridor (DESIGN-LIFT-001)
    scene.time.addEvent({ delay: 13000, loop: true, callback: () => {
      try { scene.sound.play('sfx_footstep', { volume: 0.04, rate: 0.9 + Math.random() * 0.2 }); } catch (_) {}
    } });
  }

  // ── Hospital Lobby first-frame polish (DESIGN-004) ────────────
  if (room.id === 'hospital_entrance') {
    // (1) Coffee cart prop — non-interactable, rendered directly in scene
    const cartTileX = 5, cartTileY = 5;
    const cartCx = cartTileX * TILE + TILE / 2, cartCy = cartTileY * TILE + TILE / 2;
    scene.add.ellipse(cartCx, cartCy + 12, TILE - 4, 8, 0x000000, 0.18).setDepth(2);
    scene.add.sprite(cartCx, cartCy, furnitureTextureKey('coffee_station')).setDepth(3);
    // Tiny steam puff every ~2.6s above the cart
    scene.time.addEvent({ delay: 2600, loop: true, callback: () => {
      const puff = scene.add.ellipse(cartCx + (Math.random() * 4 - 2), cartCy - 14, 5, 4, 0xffffff, 0.55).setDepth(20);
      scene.tweens.add({ targets: puff, y: puff.y - 12, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 1400, ease: 'Sine.easeOut', onComplete: () => puff.destroy() });
    } });
    // (2) Riley idle micro-animation — subtle angle sway on top of breathing tween
    const riley = interactables.find(ia => ia.type === 'npc' && ia.id === 'riley_entrance');
    if (riley) {
      scene.tweens.add({ targets: riley.sprite, angle: { from: -1.2, to: 1.2 }, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    // Plant leaf-sway is now handled generically by addFurnitureIdleAnimations() — no entrance-only block needed
    // (3) Ambient lobby chatter — single subtle blip every 9-12s, max volume 0.08
    scene.time.addEvent({ delay: 10500, loop: true, callback: () => {
      try { scene.sound.play('sfx_interact', { volume: 0.06, rate: 0.55 + Math.random() * 0.2 }); } catch (_) {}
    } });
    // Ambient sliding-door whoosh — distant entry sound every ~20s (DESIGN-LIFT-001)
    scene.time.addEvent({ delay: 19500, loop: true, callback: () => {
      try { scene.sound.play('sfx_interact', { volume: 0.06, rate: 0.8 }); } catch (_) {}
    } });
  }

  // ── Break Room comedic life (DESIGN-003) ─────────────────────
  if (room.id === 'break_room') {
    const ledColors = [0xff4444, 0xffdd44, 0x44ff66, 0x44ccff];
    for (const obs of room.obstacles) {
      if ((obs as any).type !== 'vending_machine') continue;
      const led = scene.add.rectangle(obs.x * TILE + obs.width * TILE - 6, obs.y * TILE + 6, 2, 2, ledColors[0]).setDepth(20);
      let li = 0;
      scene.time.addEvent({ delay: 700, loop: true, callback: () => { li = (li + 1) % ledColors.length; led.setFillStyle(ledColors[li]); } });
    }
    const mw = room.obstacles.find((o: any) => o.type === 'microwave');
    if (mw) {
      const mx = mw.x * TILE + TILE / 2, my = mw.y * TILE + TILE / 2;
      scene.time.addEvent({ delay: 9000, loop: true, callback: () => {
        try { scene.sound.play('sfx_interact', { volume: 0.12, rate: 1.6 }); } catch (_) {}
        const f = scene.add.rectangle(mx, my, TILE - 8, TILE - 8, 0xffeeaa, 0.5).setDepth(20);
        scene.tweens.add({ targets: f, alpha: 0, duration: 350, onComplete: () => f.destroy() });
      } });
    }
    const gossip = interactables.find(ia => ia.type === 'npc' && ia.id === 'gossiping_coworker');
    if (gossip) {
      const glyphs = ['...', '!', '?'];
      scene.time.addEvent({ delay: 4500, loop: true, callback: () => {
        const b = scene.add.text(gossip.sprite.x + 10, gossip.sprite.y - 24, glyphs[Math.floor(Math.random() * glyphs.length)], {
          fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#ffffff', backgroundColor: '#222222cc', padding: { x: 3, y: 2 },
        }).setOrigin(0.5).setDepth(gossip.sprite.depth + 3).setAlpha(0);
        scene.tweens.add({ targets: b, alpha: 1, y: b.y - 4, duration: 250, yoyo: true, hold: 900, onComplete: () => b.destroy() });
      } });
    }
    // Ambient vending dispense — soft thunk every ~16s (DESIGN-LIFT-001)
    scene.time.addEvent({ delay: 16000, loop: true, callback: () => {
      try { scene.sound.play('sfx_interact', { volume: 0.05, rate: 0.5 }); } catch (_) {}
    } });
  }

  // ── Records Room final-demo polish (DESIGN-006) ──────────────
  if (room.id === 'records_room') {
    // (1) Flickering fluorescent tube + dust motes in the upper filing aisle
    const tubeCx = 10 * TILE + TILE / 2, tubeCy = 1 * TILE + TILE - 4;
    const tube = scene.add.rectangle(tubeCx, tubeCy, TILE * 3, 3, 0xfff7d8, 0.85).setDepth(4);
    const tubeHalo = scene.add.rectangle(tubeCx, tubeCy + 10, TILE * 4, 22, 0xfff2b8, 0.10).setDepth(3);
    scene.time.addEvent({ delay: 3200, loop: true, callback: () => {
      // Brief flicker — dim then snap back
      scene.tweens.add({ targets: [tube, tubeHalo], alpha: { from: tube.alpha, to: 0.25 }, duration: 80, yoyo: true, repeat: 1, ease: 'Linear' });
    } });
    // Dust motes drifting in the light beam below the tube
    scene.time.addEvent({ delay: 1400, loop: true, callback: () => {
      const mote = scene.add.circle(tubeCx + (Math.random() * 80 - 40), tubeCy + 6, 1, 0xfff5c8, 0.7).setDepth(20);
      scene.tweens.add({ targets: mote, y: mote.y + 18, alpha: 0, duration: 4200, ease: 'Sine.easeOut', onComplete: () => mote.destroy() });
    } });
    // (2) Idle fidget on the two strongest NPCs — CCO and Attorney
    for (const fidgetId of ['compliance_officer', 'attorney']) {
      const ia = interactables.find(i => i.type === 'npc' && i.id === fidgetId);
      if (ia) scene.tweens.add({ targets: ia.sprite, angle: { from: -1.2, to: 1.2 }, duration: 1300 + Math.random() * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    // (3) Subpoena envelope prop next to Attorney — small obj_manual sprite, signals "official document"
    const attorney = interactables.find(i => i.type === 'npc' && i.id === 'attorney');
    if (attorney) {
      const env = scene.add.sprite(attorney.sprite.x + 14, attorney.sprite.y + 4, objectTextureKey('manual')).setScale(0.5).setDepth(attorney.sprite.depth - 1).setAngle(12);
      scene.tweens.add({ targets: env, y: env.y - 1, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    // (4) Decorative document cart drifting slowly down the central aisle (separate from the static cart at (6,5))
    const cartY = 9 * TILE + TILE / 2;
    const cartStartX = 13 * TILE + TILE / 2, cartEndX = 16 * TILE + TILE / 2;
    scene.add.ellipse(cartStartX, cartY + 10, TILE - 6, 6, 0x000000, 0.18).setDepth(2);
    const cart = scene.add.sprite(cartStartX, cartY, furnitureTextureKey('document_cart')).setDepth(3).setScale(0.85);
    scene.tweens.add({ targets: cart, x: cartEndX, duration: 5200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // Ambient paper rustle / drawer slide — every ~12s (DESIGN-LIFT-001)
    scene.time.addEvent({ delay: 12500, loop: true, callback: () => {
      try { scene.sound.play('sfx_interact', { volume: 0.04, rate: 0.7 }); } catch (_) {}
    } });
  }

  // ── Laboratory life pass (DESIGN-002) ────────────────────────
  if (room.id === 'lab') {
    // (1) Microscope eyepiece glow — pulsing color-cycling circle on the microscope station (2,2)
    const scopeCx = 2 * TILE + (3 * TILE) / 2, scopeCy = 2 * TILE + 6;
    const eyepiece = scene.add.circle(scopeCx, scopeCy, 4, 0x88ddff, 0.85).setDepth(5);
    const scopeColors = [0x88ddff, 0xffe888, 0xff88dd, 0x88ffaa];
    let sci = 0;
    scene.time.addEvent({ delay: 1200, loop: true, callback: () => { sci = (sci + 1) % scopeColors.length; eyepiece.setFillStyle(scopeColors[sci]); } });
    scene.tweens.add({ targets: eyepiece, scaleX: { from: 0.8, to: 1.3 }, scaleY: { from: 0.8, to: 1.3 }, alpha: { from: 0.5, to: 1 }, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // (2) Idle fidget on lab_tech + courier — angle wobble matching ER pattern
    for (const fidgetId of ['lab_tech', 'courier']) {
      const ia = interactables.find(i => i.type === 'npc' && i.id === fidgetId);
      if (ia) scene.tweens.add({ targets: ia.sprite, angle: { from: -1.4, to: 1.4 }, duration: 1200 + Math.random() * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    // (3) Beaker bubble particles — periodic rising bubbles from chemical_shelf positions
    for (const obs of room.obstacles) {
      if ((obs as any).type !== 'chemical_shelf') continue;
      const bx = obs.x * TILE + (obs.width * TILE) / 2, by = obs.y * TILE + 4;
      scene.time.addEvent({ delay: 6500 + Math.random() * 1500, loop: true, callback: () => {
        for (let i = 0; i < 4; i++) {
          const bubble = scene.add.circle(bx + (Math.random() * 14 - 7), by, 1 + Math.random(), 0x88eeff, 0.8).setDepth(20);
          scene.tweens.add({ targets: bubble, y: bubble.y - 14, alpha: 0, duration: 1100 + i * 120, ease: 'Sine.easeOut', onComplete: () => bubble.destroy() });
        }
      } });
    }
    // Ambient bubble pop — chemistry-station blip every ~10s (DESIGN-LIFT-001)
    scene.time.addEvent({ delay: 10500, loop: true, callback: () => {
      try { scene.sound.play('sfx_interact', { volume: 0.05, rate: 1.4 }); } catch (_) {}
    } });
  }

  // ── IT Office tech-life polish (DESIGN-007) ─────────────────
  if (room.id === 'it_office') {
    // (1) Server-rack blinking LEDs — green/amber yoyo, slightly out of phase per rack
    let rackIdx = 0;
    for (const obs of room.obstacles) {
      if ((obs as any).type !== 'server_rack') continue;
      const lx = obs.x * TILE + obs.width * TILE - 5, lyTop = obs.y * TILE + 4;
      const ledA = scene.add.rectangle(lx, lyTop, 2, 2, 0x44ff66).setDepth(20);
      const ledB = scene.add.rectangle(lx, lyTop + 4, 2, 2, 0xffaa33).setDepth(20);
      const phase = (rackIdx % 4) * 180;
      scene.tweens.add({ targets: ledA, alpha: { from: 1, to: 0.25 }, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: phase });
      scene.tweens.add({ targets: ledB, alpha: { from: 0.25, to: 1 }, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: phase + 90 });
      rackIdx++;
    }
    // (2) Monitor flicker — single-frame cyan flash on each monitor_bank every 8-10s
    for (const obs of room.obstacles) {
      if ((obs as any).type !== 'monitor_bank') continue;
      const mx = obs.x * TILE + (obs.width * TILE) / 2, my = obs.y * TILE + TILE / 2;
      const flash = scene.add.rectangle(mx, my, obs.width * TILE - 4, TILE - 4, 0x66ddff, 0).setDepth(6);
      scene.time.addEvent({ delay: 8500 + Math.random() * 1500, loop: true, callback: () => {
        flash.setAlpha(0.55);
        scene.time.delayedCall(60, () => flash.setAlpha(0));
      } });
    }
    // (3) Encounter signpost ring removed (HIPAA-is-the-game pass) — the
    // Threat Console interactable (ExplorationScene.spawnDefenseConsole) is
    // the visible invitation now; a ring at the old (9,6) trigger tile would
    // point at nothing.
  }

  // ── Hallway life pass (DESIGN-HALLWAY-001 + 002) ─────────────
  // All 5 hallways: act-tinted bulletin ribbon + drifting dust motes in two light columns.
  // Worst 2 only (break_lab + it_er): flickering sconces + walking employee NPC.
  if (room.id.startsWith('hallway_')) {
    const isHeavyHallway = room.id === 'hallway_break_lab' || room.id === 'hallway_it_er';
    // (A) Shared — Act-aware poster accent on the existing bulletin board
    const act = ctx.getCurrentAct();
    const actTint = act === 1 ? 0x4a90e2 : act === 2 ? 0xe2a04a : 0xc83a3a;
    const ribbon = scene.add.rectangle(scene.cameras.main.width / 2 + 18, 64 - 16, 10, 4, actTint, 1).setDepth(8).setAngle(-12);
    scene.tweens.add({ targets: ribbon, alpha: { from: 1, to: 0.65 }, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // (B) Shared — Drifting dust motes in two light columns (atmospheric texture)
    const moteColumns = [5 * TILE + TILE / 2, 14 * TILE + TILE / 2];
    for (const cx of moteColumns) {
      scene.time.addEvent({ delay: 1700 + Math.random() * 900, loop: true, callback: () => {
        const mote = scene.add.circle(cx + (Math.random() * 28 - 14), TILE + 4, 1, 0xfff5c8, 0.7).setDepth(20);
        scene.tweens.add({ targets: mote, y: mote.y + 5 * TILE, alpha: 0, duration: 5200 + Math.random() * 800, ease: 'Sine.easeOut', onComplete: () => mote.destroy() });
      } });
    }
    // (C) Heavy-only — Flickering ceiling sconces
    if (isHeavyHallway) {
      for (const obs of room.obstacles) {
        if ((obs as any).type !== 'wall_sconce') continue;
        const sx = obs.x * TILE + (obs.width * TILE) / 2;
        const sy = obs.y * TILE + TILE - 2;
        const halo = scene.add.ellipse(sx, sy + 4, 22, 10, 0xffe6a8, 0.55).setDepth(4);
        const cone = scene.add.ellipse(sx, sy + 14, 30, 18, 0xfff2c8, 0.18).setDepth(3);
        const flickerDelay = 2400 + Math.random() * 1800;
        scene.time.addEvent({ delay: flickerDelay, loop: true, callback: () => {
          scene.tweens.add({ targets: [halo, cone], alpha: { from: 1, to: 0.35 }, duration: 70, yoyo: true, repeat: 1, ease: 'Linear' });
        } });
      }
      // (D) Heavy-only — Walking employee NPC, non-interactable, patrols the corridor
      const empY = 4 * TILE + TILE / 2;
      const empStartX = 7 * TILE + TILE / 2;
      const empEndX = 13 * TILE + TILE / 2;
      scene.add.ellipse(empStartX, empY + TILE / 2 - 2, 18, 7, 0x000000, 0.25).setDepth(4);
      const empSprite = scene.add.sprite(empStartX, empY, 'npc_doctor').setDepth(5 + 4);
      scene.tweens.add({ targets: empSprite, x: empEndX, duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', onYoyo: () => empSprite.setFlipX(true), onRepeat: () => empSprite.setFlipX(false) });
      scene.tweens.add({ targets: empSprite, scaleY: { from: 1.0, to: 1.03 }, duration: 380, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }
}

// ── Type-driven furniture idle animations (Phase 26-02) ─────────────────────
// Called once from create() after the obstacles render loop.
// Positions computed from obstacle tile coords so no sprite references needed.
// All tweens/timers use scene.tweens.add / scene.time.addEvent — Phaser cleans them on scene shutdown.
export function addFurnitureIdleAnimations(scene: Phaser.Scene, room: any): void {
  for (const obs of room.obstacles) {
    const obsType = (obs as any).type as string | undefined;
    if (!obsType) continue;

    // ── plant — leaf sway (14 instances across 9 rooms) ─────────────────
    if (obsType === 'plant') {
      const px = obs.x * TILE + (obs.width * TILE) / 2;
      const py = obs.y * TILE + 4;
      const leaf = scene.add.ellipse(px, py, 14, 6, 0x4a8a3a, 0.45).setDepth(4);
      scene.tweens.add({
        targets: leaf,
        angle: { from: -6, to: 6 },
        duration: 1900 + Math.random() * 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      continue;
    }

    // ── server_rack / monitor_bank / vital_monitor — screen flicker + LED blink ─
    if (obsType === 'server_rack' || obsType === 'monitor_bank' || obsType === 'vital_monitor') {
      const mx = obs.x * TILE + (obs.width * TILE) / 2;
      const my = obs.y * TILE + (obs.height * TILE) / 2;

      // Screen glow rect — sits over the upper half of the sprite
      const glowColor = obsType === 'server_rack' ? 0x44ff66 : 0x66ccff;
      const screenGlow = scene.add.rectangle(mx, my - 4, 10, 6, glowColor, 0.30).setDepth(20);

      // CRT flicker — brief dim then restore every 2-3.5s
      const flickerDelay = 2400 + Math.random() * 1800;
      scene.time.addEvent({ delay: flickerDelay, loop: true, callback: () => {
        scene.tweens.add({
          targets: screenGlow,
          alpha: 0.08,
          duration: 60,
          yoyo: true,
          repeat: 1,
          ease: 'Linear',
          onComplete: () => { screenGlow.setAlpha(0.30); },
        });
      } });

      // LED dot — toggles between bright green and dim green every ~900ms
      const ledX = obs.x * TILE + obs.width * TILE - 4;
      const ledY = obs.y * TILE + 5;
      const led = scene.add.rectangle(ledX, ledY, 2, 2, 0x44ff44).setDepth(20);
      let ledOn = true;
      scene.time.addEvent({ delay: 880 + Math.random() * 200, loop: true, callback: () => {
        ledOn = !ledOn;
        led.setFillStyle(ledOn ? 0x44ff44 : 0x227722);
      } });
      continue;
    }

    // ── coffee_station — steam puffs (break_room's obstacle; entrance cart handled separately) ─
    if (obsType === 'coffee_station') {
      const cx = obs.x * TILE + (obs.width * TILE) / 2;
      const cy = obs.y * TILE + 4;
      scene.time.addEvent({ delay: 2600 + Math.random() * 400, loop: true, callback: () => {
        const puff = scene.add.ellipse(cx + (Math.random() * 4 - 2), cy - 14, 5, 4, 0xffffff, 0.55).setDepth(20);
        scene.tweens.add({
          targets: puff,
          y: puff.y - 12,
          alpha: 0,
          scaleX: 1.5,
          scaleY: 1.5,
          duration: 1400,
          ease: 'Sine.easeOut',
          onComplete: () => puff.destroy(),
        });
      } });
      continue;
    }
  }
}
