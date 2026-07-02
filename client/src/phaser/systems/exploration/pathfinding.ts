import type { Room, Position } from '@shared/schema';

// ── Pathfinding (BFS on tile grid) ─────────────────────────────
export function findPath(room: Room, start: Position, goal: Position): Position[] {
  const queue: { pos: Position; path: Position[] }[] = [{ pos: start, path: [start] }];
  const visited = new Set<string>();
  visited.add(`${start.x},${start.y}`);

  let closestPath: Position[] = [];
  let closestDist = Infinity;

  while (queue.length > 0) {
    const { pos, path } = queue.shift()!;
    const dist = Math.abs(goal.x - pos.x) + Math.abs(goal.y - pos.y);

    if (dist < closestDist) {
      closestDist = dist;
      closestPath = path;
    }

    if (pos.x === goal.x && pos.y === goal.y) return path.slice(1);

    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nx = pos.x + dx;
      const ny = pos.y + dy;
      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;
      if (nx < 0 || ny < 0 || nx >= room.width || ny >= room.height) continue;
      if (tileBlocked(room, nx, ny)) continue;
      visited.add(key);
      queue.push({ pos: { x: nx, y: ny }, path: [...path, { x: nx, y: ny }] });
    }
  }

  return closestPath.slice(1);
}

export function tileBlocked(room: Room, tx: number, ty: number): boolean {
  const doors: Array<{ x: number; y: number }> = (room as any).doors || [];
  for (const obs of room.obstacles) {
    if (tx >= obs.x && tx < obs.x + obs.width && ty >= obs.y && ty < obs.y + obs.height) {
      // Wall tiles occupied by doors (or adjacent) are passable
      if ((obs as any).type === 'wall' && doors.some((d: any) =>
        (d.x === tx && d.y === ty) ||
        (d.x === tx && Math.abs(d.y - ty) <= 1) ||
        (d.y === ty && Math.abs(d.x - tx) <= 1)
      )) {
        continue;
      }
      return true;
    }
  }
  return false;
}
