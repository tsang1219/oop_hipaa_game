import { useState, useEffect, useRef } from 'react';
import { Room } from '@shared/schema';

/**
 * RoomProgressHUD — the room checklist, as a thing a hospital employee would
 * actually carry (Run 14, UI-03): a clipboard with a metal clip and a paper
 * rounds sheet. Checkboxes get inked as you finish people/areas/items; a
 * crooked CLEARED stamp lands when the room is done.
 *
 * Same data contract and testids as the old debug-style panel
 * (room-progress-hud / progress-npcs / progress-zones / progress-items);
 * only the presentation changed.
 */
interface RoomProgressHUDProps {
  room: Room;
  completedNpcs: Set<string>;
  completedZones: Set<string>;
  collectedItems: Set<string>;
}

/** Pixel checkbox — inked when done, with a green check. */
function InkBox({ done }: { done: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="1" y="1" width="12" height="12" fill="#fffdf5" stroke="#3a3122" strokeWidth="2" />
      {done && (
        <path d="M 3 7 L 6 10 L 11 4" fill="none" stroke="#1d7a3a" strokeWidth="2.5" strokeLinecap="square" />
      )}
    </svg>
  );
}

export function RoomProgressHUD({
  room,
  completedNpcs,
  completedZones,
  collectedItems
}: RoomProgressHUDProps) {
  // Fade in after room entry so the clipboard doesn't block the initial view
  const [visible, setVisible] = useState(false);
  const roomIdRef = useRef(room.id);
  useEffect(() => {
    if (room.id !== roomIdRef.current) {
      setVisible(false);
      roomIdRef.current = room.id;
    }
    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, [room.id]);

  // Track recently completed categories for the ink-glow pulse
  const [recentlyCompleted, setRecentlyCompleted] = useState<Set<string>>(new Set());
  const prevCompletedRef = useRef<string[]>([]);

  // Count ALL interactables in the room (not just completionRequirements)
  // so the sheet reflects the full checklist of things to discover.
  const npcIds = (room.npcs || []).map(n => n.id);
  const zoneIds = (room.interactionZones || []).map(z => z.id);
  const itemIds = (room.educationalItems || []).map(i => i.id);

  const npcsDone = npcIds.filter(id => completedNpcs.has(id)).length;
  const npcsTotal = npcIds.length;
  const zonesDone = zoneIds.filter(id => completedZones.has(id)).length;
  const zonesTotal = zoneIds.length;
  const itemsDone = itemIds.filter(id => collectedItems.has(id)).length;
  const itemsTotal = itemIds.length;

  const totalDone = npcsDone + zonesDone + itemsDone;
  const totalRequired = npcsTotal + zonesTotal + itemsTotal;
  const isComplete = totalRequired > 0 && totalDone >= totalRequired;

  // Build a list of currently completed category keys
  const completedCategories: string[] = [];
  if (npcsDone >= npcsTotal && npcsTotal > 0) completedCategories.push('npcs');
  if (zonesDone >= zonesTotal && zonesTotal > 0) completedCategories.push('zones');
  if (itemsDone >= itemsTotal && itemsTotal > 0) completedCategories.push('items');
  if (isComplete) completedCategories.push('room');

  useEffect(() => {
    const newItems = completedCategories.filter(r => !prevCompletedRef.current.includes(r));
    if (newItems.length > 0) {
      setRecentlyCompleted(prev => {
        const next = new Set(prev);
        newItems.forEach(r => next.add(r));
        return next;
      });
      // Clear the glow after 2 seconds
      setTimeout(() => {
        setRecentlyCompleted(prev => {
          const next = new Set(prev);
          newItems.forEach(r => next.delete(r));
          return next;
        });
      }, 2000);
    }
    prevCompletedRef.current = [...completedCategories];
  }, [npcsDone, zonesDone, itemsDone, isComplete]);

  if (totalRequired === 0) {
    return null;
  }

  const rows: Array<{ key: string; testid: string; label: string; done: number; total: number }> = [];
  if (npcsTotal > 0) rows.push({ key: 'npcs', testid: 'progress-npcs', label: 'Staff', done: npcsDone, total: npcsTotal });
  if (zonesTotal > 0) rows.push({ key: 'zones', testid: 'progress-zones', label: 'Look into', done: zonesDone, total: zonesTotal });
  if (itemsTotal > 0) rows.push({ key: 'items', testid: 'progress-items', label: 'Study', done: itemsDone, total: itemsTotal });

  return (
    <div
      className="absolute top-2 right-2"
      data-testid="room-progress-hud"
      style={{
        // Slide in from the right as it fades, so the clipboard eases into
        // view rather than blocking the room on entry (FIX-02, kept).
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0) rotate(1.2deg)' : 'translateX(20px) rotate(1.2deg)',
        transition: 'opacity 600ms ease-out, transform 600ms ease-out',
        pointerEvents: 'none',
        filter: recentlyCompleted.has('room') ? 'drop-shadow(0 0 10px rgba(100,255,100,0.8))' : 'drop-shadow(3px 3px 0 rgba(0,0,0,0.55))',
        width: 148,
        imageRendering: 'pixelated',
      }}
    >
      {/* Board */}
      <div
        className="relative border-[3px] border-black"
        style={{ background: 'linear-gradient(160deg, #a4713a 0%, #8a5a2b 55%, #7c4f24 100%)', padding: '14px 7px 7px 7px' }}
      >
        {/* Metal clip */}
        <svg
          width="44" height="18" viewBox="0 0 44 18" shapeRendering="crispEdges" aria-hidden="true"
          className="absolute left-1/2 -translate-x-1/2" style={{ top: -7 }}
        >
          <rect x="4" y="6" width="36" height="10" fill="#9aa3ad" stroke="#000" strokeWidth="2" />
          <rect x="6" y="8" width="32" height="3" fill="#c7ced6" />
          <rect x="18" y="0" width="8" height="8" fill="none" stroke="#000" strokeWidth="2" />
          <rect x="20" y="2" width="4" height="4" fill="#c7ced6" />
        </svg>

        {/* Paper */}
        <div
          className="relative border-2 border-[#c9b98f]"
          style={{ background: '#f7efd9', padding: '7px 7px 6px 7px' }}
        >
          {/* Sheet header */}
          <div
            className="text-[7px] text-[#6b5b3e] tracking-wider pb-1 mb-1.5"
            style={{ fontFamily: '"Press Start 2P"', borderBottom: '2px dashed #d8c9a3' }}
          >
            ROUNDS
          </div>

          <div className="space-y-1.5">
            {rows.map(row => {
              const done = row.done >= row.total;
              return (
                <div
                  key={row.key}
                  className="flex items-center gap-1.5"
                  data-testid={row.testid}
                  style={{
                    filter: recentlyCompleted.has(row.key) ? 'drop-shadow(0 0 5px rgba(60,200,90,0.9))' : 'none',
                    transition: 'filter 300ms ease-out',
                  }}
                >
                  <InkBox done={done} />
                  <span
                    className="text-[13px] leading-none"
                    style={{
                      fontFamily: 'var(--font-body)',
                      color: done ? '#8a7a58' : '#3a3122',
                      textDecoration: done ? 'line-through' : 'none',
                      textDecorationColor: '#8a7a58',
                    }}
                  >
                    {row.label}
                  </span>
                  <span
                    className="ml-auto text-[8px] leading-none"
                    style={{ fontFamily: '"Press Start 2P"', color: done ? '#1d7a3a' : '#6b5b3e' }}
                  >
                    {row.done}/{row.total}
                  </span>
                </div>
              );
            })}
          </div>

          {/* CLEARED stamp — crooked, inked, very much a hospital form */}
          {isComplete && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              aria-hidden="true"
            >
              <div
                className="px-1.5 py-1 border-[3px]"
                style={{
                  fontFamily: '"Press Start 2P"',
                  fontSize: 10,
                  color: '#1d7a3a',
                  borderColor: '#1d7a3a',
                  background: 'rgba(247,239,217,0.72)',
                  transform: 'rotate(-9deg)',
                  animation: 'overlay-pop-in 200ms cubic-bezier(0.22, 1, 0.36, 1) both',
                }}
              >
                CLEARED
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
