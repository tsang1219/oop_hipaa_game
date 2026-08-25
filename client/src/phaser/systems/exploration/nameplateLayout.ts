/**
 * Run 14 (UI-02) — collision-aware NPC nameplate placement.
 *
 * The old greedy pass in interactableFactory only pushed plates down to avoid
 * each other; plates still read straight through props (Reception's
 * "Front Desk Coordinator" through the stanchion, both bench NPCs through
 * their benches). This system owns nameplate positions for the life of a room:
 *
 * - Every plate has a home spot (top-centered 2px under the NPC's tile).
 * - A solver scores candidate offsets against the room's prop sprites
 *   (artRenderer colliders — floor props weigh more than wall dressing),
 *   zone/item pickups, speech-bubble cues, boss tags and other plates,
 *   picking the closest spot with no meaningful overlap.
 * - Walking NPCs (Run 12) carry their plate rigidly; the solve re-runs on
 *   tile arrival and the *offset* eases toward the new solution so a
 *   displaced plate glides rather than teleports.
 * - A plate pushed off its home spot gets a 1px leader line back to the
 *   NPC's feet so the association never breaks (depth 94, alpha-slaved to
 *   the plate's proximity fade).
 *
 * Publishes `window.__QA__.nameplates` after every solve for the Run 14
 * stress test.
 */
import Phaser from 'phaser';
import type { InteractableData } from './interactableFactory';
import { getArtHandle } from './art/artRenderer';

const TILE = 32;

/** Plate top edge sits this far under the sprite center at home. */
const HOME_DY = TILE / 2 + 2;
/** Displacement (px, from home) beyond which the leader line appears —
    a one-tile side-nudge reads fine on its own; real displacement gets a line. */
const LEADER_AT = 24;
/** Ease factor per frame for offset changes. */
const EASE = 0.3;

/** Proof hook: `?qa-nameplates=naive` pins every plate to its pre-Run-14 home
    spot (no avoidance) so before/after screenshots come from the same build. */
function naiveMode(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('qa-nameplates') === 'naive';
  } catch {
    return false;
  }
}

export interface NameplateQA {
  id: string;
  rect: { x: number; y: number; w: number; h: number };
  home: boolean;
  displacement: number;
  leader: boolean;
  /** residual weighted overlap area (px²) — 0 for a clean solve */
  overlap: number;
  /** residual overlap with SMALL props (the garble risk: stanchions,
      clipboards, poles, pickups). The stress test gates on this — a plate
      lying on a large flat face (bench/counter/rack) reads like a name tag
      and is allowed as a last resort. */
  overlapSmall: number;
}

interface Entry {
  ia: InteractableData;
  label: Phaser.GameObjects.Text;
  sprite: Phaser.GameObjects.Sprite;
  /** current offset from the sprite center to the plate's origin (top-center) */
  dx: number;
  dy: number;
  /** solver target offset */
  targetDx: number;
  targetDy: number;
  line: Phaser.GameObjects.Graphics;
  /** sprite position at the last movement check (walk detection) */
  lastSpriteX: number;
  lastSpriteY: number;
  lastOverlap: number;
  lastOverlapSmall: number;
}

interface Rect { x: number; y: number; w: number; h: number; weight: number; small: boolean }

/** Props under ~1.8 tiles² of pixels are "small" — text over them garbles. */
const SMALL_AREA = 1800;

function boundsOf(obj: Phaser.GameObjects.Components.GetBounds, weight: number, inflate = 0, small?: boolean): Rect {
  const b = obj.getBounds();
  return {
    x: b.x - inflate, y: b.y - inflate, w: b.width + inflate * 2, h: b.height + inflate * 2,
    weight,
    small: small ?? b.width * b.height < SMALL_AREA,
  };
}

function overlapArea(ax: number, ay: number, aw: number, ah: number, r: Rect): number {
  const ix = Math.min(ax + aw, r.x + r.w) - Math.max(ax, r.x);
  if (ix <= 0) return 0;
  const iy = Math.min(ay + ah, r.y + r.h) - Math.max(ay, r.y);
  if (iy <= 0) return 0;
  return ix * iy;
}

export class NameplateLayout {
  private scene: Phaser.Scene;
  private entries: Entry[] = [];
  private staticRects: Rect[] = [];
  private pickupSprites: Phaser.GameObjects.Sprite[] = [];
  private bossTags: Phaser.GameObjects.Text[] = [];
  private bubbles: Map<string, Phaser.GameObjects.Image>;
  private roomW: number;
  private roomH: number;
  private wallBottom: number;
  private lastSolveAt = 0;
  private destroyed = false;

  constructor(
    scene: Phaser.Scene,
    room: { width: number; height: number },
    interactables: InteractableData[],
    npcBubbles: Map<string, Phaser.GameObjects.Image>,
    bossTags: Phaser.GameObjects.Text[] = [],
  ) {
    this.scene = scene;
    this.bubbles = npcBubbles;
    this.bossTags = bossTags;
    this.roomW = room.width * TILE;
    this.roomH = room.height * TILE;
    this.wallBottom = 2 * TILE; // two-row back wall (Run 11)

    // Prop sprites from the art substrate. Small props (stanchion, clipboard,
    // IV pole, papers…) are hard avoids — text over them garbles. Large flat
    // faces (benches, counters, racks, beds) are a soft avoid: a plate lying
    // on one reads like a desk name tag, and in dense rooms it beats exiling
    // the plate. Wall dressing (depth 2) is softest.
    const art = getArtHandle(scene);
    if (art) {
      for (const c of art.colliders) {
        if (!c.active) continue;
        const r = boundsOf(c, 1.0);
        r.weight = r.small ? 1.0 : c.depth < 5 ? 0.35 : 0.45;
        this.staticRects.push(r);
      }
    }

    // Zone/item pickups bob ±3-4px — inflate so plates clear the whole path.
    for (const ia of interactables) {
      if ((ia.type === 'zone' || ia.type === 'item' || ia.type === 'console' || ia.type === 'whimsy') && ia.sprite?.active) {
        this.pickupSprites.push(ia.sprite);
      }
    }

    for (const ia of interactables) {
      if (ia.type !== 'npc' || !ia.label || !ia.sprite) continue;
      const line = scene.add.graphics().setDepth(94).setAlpha(0);
      this.entries.push({
        ia,
        label: ia.label,
        sprite: ia.sprite,
        dx: 0, dy: HOME_DY,
        targetDx: 0, targetDy: HOME_DY,
        line,
        lastSpriteX: ia.sprite.x, lastSpriteY: ia.sprite.y,
        lastOverlap: 0,
        lastOverlapSmall: 0,
      });
    }

    this.solveAll();
    // Snap to the first solution — no glide on room entry.
    for (const e of this.entries) {
      e.dx = e.targetDx; e.dy = e.targetDy;
      this.apply(e);
    }
    this.publish();

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.destroyed = true; });
  }

  /** Per-frame: follow sprites rigidly, ease offsets, keep leader lines glued. */
  update(): void {
    if (this.destroyed) return;
    let moved = false;
    for (const e of this.entries) {
      if (!e.label.active || !e.sprite.active) continue;
      // Re-solve while the owner is actually moving (Run 12 walkers), not
      // just on tile boundaries — otherwise the plate sweeps through
      // whatever lies along the leg between two solutions.
      if (Math.abs(e.sprite.x - e.lastSpriteX) > 0.4 || Math.abs(e.sprite.y - e.lastSpriteY) > 0.4) {
        moved = true;
        e.lastSpriteX = e.sprite.x;
        e.lastSpriteY = e.sprite.y;
      }
      e.dx += (e.targetDx - e.dx) * EASE;
      e.dy += (e.targetDy - e.dy) * EASE;
      this.apply(e);
    }
    this.separatePlates();
    const now = this.scene.time.now;
    if (moved && now - this.lastSolveAt > 60) {
      this.lastSolveAt = now;
      this.solveAll();
      this.publish();
    }
  }

  /** Hard rule, enforced every frame: plates never overlap each other — not
   *  even transiently while a walker drags its plate or an offset glides.
   *  The lower plate steps below the upper one; the ease pulls it back to
   *  its solved spot once the moment passes. */
  private separatePlates(): void {
    // Entry order is the priority order (stable per room) — the later entry
    // always yields, so a converging pair can't oscillate between frames.
    const active = this.entries.filter((e) => e.label.active && e.sprite.active && e.label.alpha > 0.01);
    for (let i = 1; i < active.length; i++) {
      const cur = active[i];
      for (let j = 0; j < i; j++) {
        const up = active[j];
        const ix = Math.min(cur.label.x + cur.label.width / 2, up.label.x + up.label.width / 2)
          - Math.max(cur.label.x - cur.label.width / 2, up.label.x - up.label.width / 2);
        if (ix <= 0) continue;
        const upTop = up.label.y;
        const upBot = up.label.y + up.label.height;
        const curTop = cur.label.y;
        const curBot = cur.label.y + cur.label.height;
        if (curTop >= upBot || curBot <= upTop) continue;
        // Move the yielding plate the short way out (down if it sits lower).
        if (curTop + cur.label.height / 2 >= upTop + up.label.height / 2) {
          cur.dy += upBot + 1 - curTop;
        } else {
          cur.dy -= curBot + 1 - upTop;
        }
        this.apply(cur);
        // A clamp can eat the move (room edge); then the senior plate steps.
        if (cur.label.y < upBot && cur.label.y + cur.label.height > upTop) {
          up.dy -= up.label.y + up.label.height + 1 - cur.label.y;
          this.apply(up);
        }
      }
    }
  }

  /** Re-run after live completion changes (labels dim, bubbles clear). */
  refresh(): void {
    if (this.destroyed) return;
    this.solveAll();
    this.publish();
  }

  private apply(e: Entry): void {
    const x = Phaser.Math.Clamp(
      e.sprite.x + e.dx,
      e.label.width / 2 + 2,
      this.roomW - e.label.width / 2 - 2,
    );
    const y = Phaser.Math.Clamp(e.sprite.y + e.dy, this.wallBottom - 26, this.roomH - e.label.height - 2);
    e.label.setPosition(x, y);
    this.drawLeader(e, x, y);
  }

  private drawLeader(e: Entry, x: number, y: number): void {
    const displacement = Math.hypot(e.dx - 0, e.dy - HOME_DY);
    const g = e.line;
    g.clear();
    if (displacement < LEADER_AT || e.label.alpha < 0.05) {
      g.setAlpha(0);
      return;
    }
    // From the plate edge nearest the NPC to just above the feet.
    const feetX = e.sprite.x;
    const feetY = e.sprite.y + TILE / 2 - 4;
    const plateCy = y + e.label.height / 2;
    const fromX = Phaser.Math.Clamp(feetX, x - e.label.width / 2 + 4, x + e.label.width / 2 - 4);
    const fromY = plateCy > feetY ? y : y + e.label.height;
    g.setAlpha(Math.min(0.85, e.label.alpha));
    g.lineStyle(1, 0x0b0b16, 0.9);
    g.lineBetween(fromX + 1, fromY + 1, feetX + 1, feetY + 1);
    g.lineStyle(1, 0xd8d8e8, 0.9);
    g.lineBetween(fromX, fromY, feetX, feetY);
    g.fillStyle(0xd8d8e8, 0.9);
    g.fillRect(feetX - 1, feetY - 1, 2, 2);
  }

  private solveAll(): void {
    // Obstacles that all plates share this pass.
    const rects: Rect[] = [...this.staticRects];
    for (const s of this.pickupSprites) if (s.active) rects.push(boundsOf(s, 1.0, 4, true));
    for (const t of this.bossTags) if (t.active) rects.push(boundsOf(t, 1.0, 0, true));
    for (const e of this.entries) {
      const b = this.bubbles.get(e.ia.id);
      if (b && b.active) rects.push(boundsOf(b, 0.8, 3, true));
    }
    // Other NPC sprites (do not cover faces) — the plate's own NPC excluded per entry.
    const npcRects = new Map<Entry, Rect>();
    for (const e of this.entries) {
      if (e.sprite.active) npcRects.set(e, boundsOf(e.sprite, 0.9, 0, true));
    }

    // Deterministic order: top-most NPC first; earlier plates become obstacles.
    const solvedRects: Rect[] = [];
    const order = [...this.entries].sort((a, b) => (a.sprite.y - b.sprite.y) || (a.sprite.x - b.sprite.x));
    for (const e of order) {
      if (!e.label.active || !e.sprite.active) { continue; }
      const w = e.label.width;
      const h = e.label.height;
      const obstacles = rects.slice();
      npcRects.forEach((r, other) => { if (other !== e) obstacles.push(r); });
      for (const r of solvedRects) obstacles.push(r);

      const best = this.solveOne(e, w, h, obstacles);
      e.targetDx = best.dx;
      e.targetDy = best.dy;
      e.lastOverlap = best.overlap;
      e.lastOverlapSmall = best.overlapSmall;
      // Where this plate will land (for the plates after it).
      const px = Phaser.Math.Clamp(e.sprite.x + best.dx, w / 2 + 2, this.roomW - w / 2 - 2);
      const py = Phaser.Math.Clamp(e.sprite.y + best.dy, this.wallBottom - 26, this.roomH - h - 2);
      solvedRects.push({ x: px - w / 2, y: py, w, h, weight: 1.0, small: true });
    }
  }

  private measure(
    px: number, py: number, w: number, h: number, obstacles: Rect[], cutoff: number,
  ): { weighted: number; small: number } {
    let weighted = 0;
    let small = 0;
    for (const r of obstacles) {
      const a = overlapArea(px, py, w, h, r);
      if (a === 0) continue;
      weighted += a * r.weight;
      if (r.small) small += a;
      if (weighted >= cutoff) break; // can't beat the best already
    }
    return { weighted, small };
  }

  private solveOne(
    e: Entry,
    w: number,
    h: number,
    obstacles: Rect[],
  ): { dx: number; dy: number; overlap: number; overlapSmall: number } {
    if (naiveMode()) {
      const m = this.measure(e.sprite.x - w / 2, e.sprite.y + HOME_DY, w, h, obstacles, Number.POSITIVE_INFINITY);
      return { dx: 0, dy: HOME_DY, overlap: m.weighted, overlapSmall: m.small };
    }
    const aboveDy = -(TILE / 2 + 18 + h); // clears the head and the "!" bubble (with its bob + inflation)
    const candidates: Array<[number, number]> = [[0, HOME_DY]];
    // Below the NPC: slide sideways in 8px steps, then deeper rows.
    for (const dx of [8, -8, 16, -16, 24, -24, 32, -32, 40, -40, 48, -48, 64, -64, 80, -80]) candidates.push([dx, HOME_DY]);
    for (const dy of [HOME_DY + 8, HOME_DY + 16, HOME_DY + 24, HOME_DY + 32]) {
      for (const dx of [0, 16, -16, 32, -32, 48, -48]) candidates.push([dx, dy]);
    }
    // Above the head (clears the "!" bubble), same sliding.
    for (const dy of [aboveDy, aboveDy - 8, aboveDy - 16, aboveDy - 24]) {
      for (const dx of [0, 16, -16, 32, -32, 48, -48]) candidates.push([dx, dy]);
    }
    let best = { dx: 0, dy: HOME_DY, overlap: Number.POSITIVE_INFINITY, overlapSmall: Number.POSITIVE_INFINITY };
    let bestScore = Number.POSITIVE_INFINITY;
    for (const [dx, dy] of candidates) {
      const px = Phaser.Math.Clamp(e.sprite.x + dx, w / 2 + 2, this.roomW - w / 2 - 2) - w / 2;
      const py = Phaser.Math.Clamp(e.sprite.y + dy, this.wallBottom - 26, this.roomH - h - 2);
      const m = this.measure(px, py, w, h, obstacles, bestScore);
      // Small-prop overlap is the garble risk — count it triple on top of its
      // weighted share so the solver treats "over the stanchion" as far worse
      // than "over the bench face" even at equal areas.
      const distPenalty = Math.abs(dx) * 3 + Math.abs(dy - HOME_DY) * 2;
      // Continuity: prefer targets near the current offset, so a walking
      // NPC's plate takes short glides instead of swinging across the room
      // (long glides are where transient prop overlaps happen).
      const continuity = (Math.abs(dx - e.targetDx) + Math.abs(dy - e.targetDy)) * 0.8;
      const score = m.weighted + m.small * 4 + distPenalty + continuity;
      if (score < bestScore) {
        bestScore = score;
        best = { dx, dy, overlap: m.weighted, overlapSmall: m.small };
        if (m.weighted === 0 && dx === 0 && dy === HOME_DY) break; // home is clean
      }
    }
    return best;
  }

  private publish(): void {
    const qa = (window as unknown as { __QA__?: { nameplates?: NameplateQA[] } }).__QA__;
    if (!qa) return;
    qa.nameplates = this.entries
      .filter((e) => e.label.active)
      .map((e) => {
        const displacement = Math.hypot(e.targetDx, e.targetDy - HOME_DY);
        return {
          id: e.ia.id,
          rect: {
            x: Math.round(e.label.x - e.label.width / 2),
            y: Math.round(e.label.y),
            w: Math.round(e.label.width),
            h: Math.round(e.label.height),
          },
          home: displacement < 1,
          displacement: Math.round(displacement),
          leader: displacement >= LEADER_AT,
          overlap: Math.round(e.lastOverlap),
          overlapSmall: Math.round(e.lastOverlapSmall),
        };
      });
  }
}
