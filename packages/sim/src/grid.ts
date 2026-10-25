/**
 * Build grid: slot keys, layer rules, bounds and neighbours.
 */
import type { EdgeSlot, Layer, PieceKind, Slot, TileSlot } from './types.ts';

export const LAYER_OF: Readonly<Record<PieceKind, Layer>> = {
  foundation: 'foundation',
  floor: 'floor',
  wall: 'wall',
  door: 'wall',
  window: 'wall',
  roof: 'roof',
  furniture: 'object',
};

/** Pieces of these kinds go on edges; everything else goes on tiles. */
export function isEdgeKind(kind: PieceKind): boolean {
  return LAYER_OF[kind] === 'wall';
}

export function tile(x: number, y: number, level = 0): TileSlot {
  return { kind: 'tile', x, y, level };
}

export function edge(x: number, y: number, dir: 'n' | 'w', level = 0): EdgeSlot {
  return { kind: 'edge', x, y, level, dir };
}

export function slotKey(slot: Slot, layer: Layer): string {
  return slot.kind === 'tile'
    ? `${slot.level}|t|${slot.x},${slot.y}|${layer}`
    : `${slot.level}|e|${slot.x},${slot.y},${slot.dir}|${layer}`;
}

export function inBounds(slot: Slot, width: number, height: number): boolean {
  const { x, y } = slot;
  if (slot.kind === 'tile') return x >= 0 && x < width && y >= 0 && y < height;
  // A north edge of row `height` is the map's south boundary; a west edge of
  // column `width` is its east boundary. Both are legal places for a wall.
  if (slot.dir === 'n') return x >= 0 && x < width && y >= 0 && y <= height;
  return x >= 0 && x <= width && y >= 0 && y < height;
}

/** The (up to two) tiles an edge separates. */
export function tilesBesideEdge(e: EdgeSlot): [TileSlot, TileSlot] {
  return e.dir === 'n'
    ? [tile(e.x, e.y - 1, e.level), tile(e.x, e.y, e.level)]
    : [tile(e.x - 1, e.y, e.level), tile(e.x, e.y, e.level)];
}

/** The four edges around a tile, with the neighbouring tile across each. */
export function edgesAroundTile(t: TileSlot): { edge: EdgeSlot; across: TileSlot }[] {
  const { x, y, level } = t;
  return [
    { edge: edge(x, y, 'n', level), across: tile(x, y - 1, level) },
    { edge: edge(x, y + 1, 'n', level), across: tile(x, y + 1, level) },
    { edge: edge(x, y, 'w', level), across: tile(x - 1, y, level) },
    { edge: edge(x + 1, y, 'w', level), across: tile(x + 1, y, level) },
  ];
}

export function sameSlot(a: Slot, b: Slot): boolean {
  if (a.kind !== b.kind || a.x !== b.x || a.y !== b.y || a.level !== b.level) return false;
  return a.kind === 'tile' || (b.kind === 'edge' && a.dir === b.dir);
}
