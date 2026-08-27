/**
 * doorArt.ts — Run 11 (art-substrate, item 1). Which LimeZu door each wall side gets and how the
 * frames sit on the room's wall geometry. Shared by DoorSystem (the sprites) and artRenderer (the
 * dark recess behind a back-wall door). Frames come from scripts/art/atlas-manifest.json
 * (`door.*`, sliced from 3_Animated_objects/…/animated_door_vertical_{left,right}_1 and
 * animated_door_big_1[_locked]) — the orange set: the taupe "_2" doors looked better against cream but
 * their closed edge-on line all but vanished in the wall line; orange reads as a door in every room.
 *
 *   side walls   thin top-view lines (14 px wide: trim.*.left is opaque at x 18..31 of its column,
 *                trim.*.right at x 0..13). A door there is LimeZu's "vertical" door: closed it is an
 *                8 px edge-on line standing in the wall, 82 px tall (its height plus the bit of depth
 *                you see from the 3/4 view); open it swings 90° into the room and shows its face.
 *                The 64×96 frame's bottom edge is the bottom of the door tile, so the line fills the
 *                gap in the wall and the lintel rises over the wall line above it.
 *   back wall    the front-facing big door: 32 wide, 56 tall body at y 38..93 of a 32×96 frame; the
 *                spare row above is swing room (the leaf lifts toward the viewer). Its foot sits on
 *                the floor line (wall.rows × 32), so the body fills the two-row face below the cap.
 *   bottom wall  the same big door standing in the gap of the bottom wall line, facing the camera —
 *                LimeZu has no "seen from behind" door, and a door you can read beats one you can't.
 */
import type { AtlasFrame } from './atlasFrames.generated';

export type DoorKind = 'side-left' | 'side-right' | 'face';

const seq = (prefix: string): AtlasFrame[] => [0, 1, 2, 3, 4].map(i => `${prefix}.${i}` as AtlasFrame);

export const DOOR_ART = {
  /** frame sequences, closed → open (5 steps) */
  frames: {
    /** door in the LEFT wall: hinge at the wall, leaf swings right, into the room */
    'side-left': seq('door.side.r'),
    /** door in the RIGHT wall: hinge at the wall, leaf swings left, into the room */
    'side-right': seq('door.side.l'),
    face: seq('door.face'),
  } as Record<DoorKind, AtlasFrame[]>,
  /** the big door's locked "thud" (5 frames, 32×64, body at y 6..61 — same foot line as the open sheet) */
  faceLocked: seq('door.face.locked'),
  /** big-door body height; the recess behind it is this tall, ending on the floor line */
  faceBodyH: 56,
  /** side doors: x offset of the 64-wide frame so the 8 px closed line centres on the 14 px wall line */
  sideLeftDx: 3,
  sideRightDx: -35,
  /** closed-line bottom is the frame bottom; the open leaf's foot sits 26 px above it (hinge depth) */
  sideHingeDepth: 26,
} as const;

/** Closed-door frame index → openness (1 closed … 0 open) mapping helpers, shared with QA. */
export const DOOR_OPEN_STEPS = 4;
export function opennessToStep(openness: number): number {
  return Math.max(0, Math.min(DOOR_OPEN_STEPS, Math.round((1 - openness) * DOOR_OPEN_STEPS)));
}
