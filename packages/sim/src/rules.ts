/**
 * Placement and removal rules.
 *
 * Every check returns a plain-language reason a player can read, because the build UI
 * shows it verbatim under the ghost piece.
 */
import { LAYER_OF, inBounds, isEdgeKind, slotKey, tile, tilesBesideEdge } from './grid.ts';
import { computeRooms, enclosedTiles } from './rooms.ts';
import type { Catalog, Layer, PieceDef, PlacedPiece, Slot, Town } from './types.ts';
import { hasBrush, type World } from './world.ts';

export type Verdict =
  | { ok: true; warning?: string }
  | { ok: false; reason: string };

type Pieces = Readonly<Record<string, PlacedPiece>>;

const MATERIAL_NAMES: Record<string, string> = {
  boards: 'boards',
  roofing: 'roofing sheets',
  cloth: 'cloth',
  lumber: 'milled lumber',
  block: 'cinder blocks',
};

function materialName(id: string): string {
  return MATERIAL_NAMES[id] ?? id;
}

/**
 * Is this placed piece held up by what is around it?
 * `enclosed` is the set of tiles inside enclosed rooms (needed for roofs).
 */
export function isSupported(
  pieces: Pieces,
  piece: PlacedPiece,
  def: PieceDef,
  enclosed: Set<string>,
): string | null {
  const s = piece.slot;
  switch (def.kind) {
    case 'foundation':
      return null;
    case 'floor':
      return s.kind === 'tile' && slotKey(s, 'foundation') in pieces ? null : 'Needs a foundation underneath';
    case 'wall':
    case 'door':
    case 'window': {
      if (s.kind !== 'edge') return 'Walls go on the edge between tiles';
      const sides = tilesBesideEdge(s);
      return sides.some((t) => slotKey(t, 'floor') in pieces) ? null : 'Walls need a floor on at least one side';
    }
    case 'furniture':
      return s.kind === 'tile' && slotKey(s, 'floor') in pieces ? null : 'Needs a floor';
    case 'roof':
      return s.kind === 'tile' && enclosed.has(`${s.x},${s.y}`) ? null : 'Roofs need a room enclosed by walls';
  }
}

/** Is the slot on the player's own land? Edges on the lot's boundary count. */
export function onLot(town: Town, slot: Slot): boolean {
  const l = town.lot;
  return inBounds({ ...slot, x: slot.x - l.x, y: slot.y - l.y }, l.w, l.h);
}

/** Check whether `pieceId` can be placed at `slot` right now. Does not change the town. */
export function checkPlace(town: Town, catalog: Catalog, pieceId: string, slot: Slot, rotation = 0, world?: World): Verdict {
  const def = catalog[pieceId];
  if (!def) return { ok: false, reason: `Unknown piece "${pieceId}"` };
  if (def.tier > town.progress.tier) return { ok: false, reason: `Unlocks at tier ${def.tier}` };

  const wantsEdge = isEdgeKind(def.kind);
  if (wantsEdge && slot.kind !== 'edge') return { ok: false, reason: 'Walls go on the edge between tiles' };
  if (!wantsEdge && slot.kind !== 'tile') return { ok: false, reason: 'This goes on a tile, not an edge' };
  if (!onLot(town, slot)) return { ok: false, reason: 'Outside your lot' };
  if (rotation < 0 || rotation >= Math.max(1, def.rotations)) return { ok: false, reason: 'Invalid rotation' };

  const layer = LAYER_OF[def.kind];
  const key = slotKey(slot, layer);
  if (key in town.pieces) return { ok: false, reason: 'Something is already here' };
  if (slot.kind === 'tile') {
    if (`${slot.x},${slot.y}` in town.soil) return { ok: false, reason: "There's a garden bed here" };
    if (world && hasBrush(town, world, slot.x, slot.y)) return { ok: false, reason: 'Clear the brush first' };
    if (def.solid && town.player.x === slot.x && town.player.y === slot.y) return { ok: false, reason: "You're standing there" };
  }

  for (const [mat, n] of Object.entries(def.cost)) {
    const have = town.inventory[mat] ?? 0;
    if (have < n) return { ok: false, reason: `Needs ${n} ${materialName(mat)} (you have ${have})` };
  }

  const placed: PlacedPiece = { pieceId, slot, rotation };
  const roomsBefore = def.kind === 'roof' || wantsEdge ? computeRooms(town.pieces, catalog, town.width, town.height, slot.level) : [];
  const unsupported = isSupported(town.pieces, placed, def, enclosedTiles(roomsBefore));
  if (unsupported) return { ok: false, reason: unsupported };

  // Warning: a wall that finishes enclosing a room nobody can get into.
  if (wantsEdge && def.kind !== 'door') {
    const after = computeRooms({ ...town.pieces, [key]: placed }, catalog, town.width, town.height, slot.level);
    const newlySealed = after.some(
      (r) => r.enclosed && r.doors === 0 && !roomsBefore.some((b) => b.enclosed && b.tiles.join() === r.tiles.join()),
    );
    if (newlySealed) return { ok: true, warning: 'This closes a room with no door' };
  }
  return { ok: true };
}

/**
 * Keys of every piece that would lose its support if `removedKey` were taken away,
 * following the chain (a floor takes its walls, the walls take the roof).
 */
export function findDependents(town: Town, catalog: Catalog, removedKey: string): string[] {
  const target = town.pieces[removedKey];
  if (!target) return [];
  const remaining: Record<string, PlacedPiece> = { ...town.pieces };
  delete remaining[removedKey];
  const dependents: string[] = [];

  for (;;) {
    const enclosed = enclosedTiles(computeRooms(remaining, catalog, town.width, town.height, target.slot.level));
    const fallen = Object.entries(remaining).filter(([, p]) => {
      const def = catalog[p.pieceId];
      return def !== undefined && isSupported(remaining, p, def, enclosed) !== null;
    });
    if (fallen.length === 0) break;
    for (const [k] of fallen) {
      delete remaining[k];
      dependents.push(k);
    }
  }
  return dependents;
}

export function describeDependents(town: Town, catalog: Catalog, keys: string[]): string {
  const counts = new Map<string, number>();
  for (const k of keys) {
    const name = catalog[town.pieces[k]?.pieceId ?? '']?.name ?? 'piece';
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts].map(([name, n]) => (n === 1 ? name : `${n}× ${name}`)).join(', ');
}

/** Check whether the piece in `slot`/`layer` can be removed. */
export function checkRemove(
  town: Town,
  catalog: Catalog,
  slot: Slot,
  layer: Layer,
  cascade = false,
): Verdict & { dependents?: string[] } {
  const key = slotKey(slot, layer);
  if (!(key in town.pieces)) return { ok: false, reason: 'Nothing to remove here' };
  if (!onLot(town, slot)) return { ok: false, reason: "That isn't your land" };
  const dependents = findDependents(town, catalog, key);
  if (dependents.length > 0 && !cascade) {
    return {
      ok: false,
      reason: `This holds up ${describeDependents(town, catalog, dependents)}`,
      dependents,
    };
  }
  return { ok: true, dependents };
}

/** Topmost removable layer at a tile, for the demolish tool. */
export function topLayerAt(town: Town, x: number, y: number, level = 0) {
  for (const layer of ['roof', 'object', 'floor', 'foundation'] as const) {
    if (slotKey(tile(x, y, level), layer) in town.pieces) return layer;
  }
  return null;
}
