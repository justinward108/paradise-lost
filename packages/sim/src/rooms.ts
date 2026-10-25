/**
 * Room detection.
 *
 * A room is a connected group of floored tiles. It is ENCLOSED when every way out of it
 * crosses a wall, door or window. It is a SHELTER when it is enclosed, has at least one
 * door, and every tile is roofed.
 */
import { edgesAroundTile, slotKey, tile } from './grid.ts';
import type { Catalog, PlacedPiece } from './types.ts';

export interface Room {
  /** Tile keys as "x,y", sorted. */
  tiles: string[];
  enclosed: boolean;
  doors: number;
  windows: number;
  roofed: boolean;
  shelter: boolean;
}

export function computeRooms(
  pieces: Readonly<Record<string, PlacedPiece>>,
  catalog: Catalog,
  width: number,
  height: number,
  level = 0,
): Room[] {
  const has = (key: string) => key in pieces;
  const floored = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < width && y < height && has(slotKey(tile(x, y, level), 'floor'));

  const seen = new Set<string>();
  const rooms: Room[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const startId = `${x},${y}`;
      if (!floored(x, y) || seen.has(startId)) continue;

      const tiles: string[] = [];
      const doorKeys = new Set<string>();
      const windowKeys = new Set<string>();
      let enclosed = true;
      const queue: [number, number][] = [[x, y]];
      seen.add(startId);

      while (queue.length > 0) {
        const [cx, cy] = queue.shift()!;
        tiles.push(`${cx},${cy}`);
        for (const { edge, across } of edgesAroundTile(tile(cx, cy, level))) {
          const wallKey = slotKey(edge, 'wall');
          const wall = pieces[wallKey];
          if (wall) {
            const kind = catalog[wall.pieceId]?.kind;
            if (kind === 'door') doorKeys.add(wallKey);
            if (kind === 'window') windowKeys.add(wallKey);
            continue;
          }
          if (!floored(across.x, across.y)) {
            enclosed = false;
            continue;
          }
          const id = `${across.x},${across.y}`;
          if (!seen.has(id)) {
            seen.add(id);
            queue.push([across.x, across.y]);
          }
        }
      }

      tiles.sort();
      const roofed = tiles.every((id) => {
        const [tx, ty] = id.split(',').map(Number) as [number, number];
        return has(slotKey(tile(tx, ty, level), 'roof'));
      });
      const doors = doorKeys.size;
      rooms.push({
        tiles,
        enclosed,
        doors,
        windows: windowKeys.size,
        roofed,
        shelter: enclosed && doors > 0 && roofed,
      });
    }
  }
  return rooms;
}

/** Set of "x,y" tile ids that belong to an enclosed room. */
export function enclosedTiles(rooms: Room[]): Set<string> {
  const out = new Set<string>();
  for (const r of rooms) if (r.enclosed) for (const t of r.tiles) out.add(t);
  return out;
}
