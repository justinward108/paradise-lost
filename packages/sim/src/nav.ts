/**
 * Walking: which tiles can be stood on, which steps walls block, and pathfinding.
 * Movement is 4-directional on the tile grid; the renderer smooths it.
 */
import { edge, slotKey, tile } from './grid.ts';
import { siteAt, siteRemaining, terrainAt, type Point, type World } from './world.ts';
import type { Catalog, Town } from './types.ts';

const BLOCKING_TERRAIN = new Set(['~', 'T', 'X', 'D']);

export function walkable(town: Town, world: World, catalog: Catalog, x: number, y: number): boolean {
  const t = terrainAt(town, world, x, y);
  if (t === null || BLOCKING_TERRAIN.has(t)) return false;
  if (world.kiosk && world.kiosk.x === x && world.kiosk.y === y) return false;
  const site = siteAt(world, x, y);
  if (site && siteRemaining(town, site) > 0) return false;
  const obj = town.pieces[slotKey(tile(x, y), 'object')];
  if (obj && catalog[obj.pieceId]?.solid) return false;
  return true;
}

/** The wall-layer piece on the edge between two 4-neighbour tiles, if any. */
function edgeBetween(a: Point, b: Point) {
  if (a.x === b.x) return edge(a.x, Math.max(a.y, b.y), 'n');
  return edge(Math.max(a.x, b.x), a.y, 'w');
}

export function canStep(town: Town, world: World, catalog: Catalog, a: Point, b: Point): boolean {
  if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) !== 1) return false;
  if (!walkable(town, world, catalog, b.x, b.y)) return false;
  const wall = town.pieces[slotKey(edgeBetween(a, b), 'wall')];
  return !wall || catalog[wall.pieceId]?.kind === 'door';
}

const DIRS: Point[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

/**
 * Shortest path from `start` to any tile for which `isGoal` is true.
 * Returns the tiles after `start`, ending at the goal; [] if already there; null if unreachable.
 */
export function findPath(
  town: Town,
  world: World,
  catalog: Catalog,
  start: Point,
  isGoal: (p: Point) => boolean,
  maxNodes = 4000,
): Point[] | null {
  if (isGoal(start)) return [];
  const key = (p: Point) => `${p.x},${p.y}`;
  const came = new Map<string, Point | null>([[key(start), null]]);
  const queue: Point[] = [start];
  while (queue.length > 0 && came.size <= maxNodes) {
    const cur = queue.shift()!;
    for (const d of DIRS) {
      const next = { x: cur.x + d.x, y: cur.y + d.y };
      const k = key(next);
      if (came.has(k) || !canStep(town, world, catalog, cur, next)) continue;
      came.set(k, cur);
      if (isGoal(next)) {
        const path: Point[] = [next];
        let p: Point | null | undefined = cur;
        while (p && key(p) !== key(start)) {
          path.unshift(p);
          p = came.get(key(p));
        }
        return path;
      }
      queue.push(next);
    }
  }
  return null;
}

/** Within arm's reach: the same or a neighbouring tile, diagonals included. */
export function inReach(a: Point, b: Point): boolean {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) <= 1;
}

/** Path to a tile from which `target` is in reach. */
export function pathToReach(town: Town, world: World, catalog: Catalog, target: Point): Point[] | null {
  return findPath(town, world, catalog, town.player, (p) => inReach(p, target));
}
