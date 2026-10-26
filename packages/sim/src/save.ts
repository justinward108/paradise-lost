/**
 * Save snapshots: versioning, migration and integrity.
 *
 * Storage (IndexedDB now, cloud later) lives in the client; this module only turns a
 * town into a checked string and back, so every store shares the same format.
 */
import { LAYER_OF, slotKey } from './grid.ts';
import { hashString } from './rng.ts';
import { newNpcState, newProjectState } from './town.ts';
import { SCHEMA_VERSION, type Catalog, type PlacedPiece, type Slot, type Town } from './types.ts';
import type { World } from './world.ts';

export interface Snapshot {
  schemaVersion: number;
  savedAt: number;
  checksum: string;
  /** JSON of the town. */
  body: string;
}

/** What migrations may need to know about the current content. */
export interface MigrationContext {
  world?: World;
  catalog?: Catalog;
}

type Data = Record<string, unknown>;

/**
 * v1 (Sprint 1): the town was just the 14 × 14 lot.
 * v2 (Sprint 2): the lot sits inside a larger map with terrain, a neighbour and projects.
 * Pieces move to the lot's position on the map; the old prototype garden plot becomes a bed.
 */
function v1to2(old: Data, ctx: MigrationContext = {}): Data {
  const world = ctx.world;
  const lot = world?.map.lot ?? { x: 0, y: 0, w: Number(old['width']), h: Number(old['height']) };
  const dx = world ? lot.x : 0;
  const dy = world ? lot.y : 0;

  const pieces: Record<string, PlacedPiece> = {};
  const occupied = new Set<string>();
  for (const p of Object.values((old['pieces'] ?? {}) as Record<string, PlacedPiece>)) {
    const def = ctx.catalog?.[p.pieceId];
    if (!def) continue;
    const slot = { ...p.slot, x: p.slot.x + dx, y: p.slot.y + dy } as Slot;
    pieces[slotKey(slot, LAYER_OF[def.kind])] = { ...p, slot };
    if (slot.kind === 'tile') occupied.add(`${slot.x},${slot.y}`);
  }
  for (const p of world?.fixedPieces ?? []) {
    const def = ctx.catalog?.[p.pieceId];
    if (def) pieces[slotKey(p.slot, LAYER_OF[def.kind])] = p;
  }

  const soil: Record<string, { tilledMs: number; lastWeededMs: number }> = {};
  for (const plot of Object.values((old['plots'] ?? {}) as Record<string, { x: number; y: number; lastTendedMs: number }>)) {
    soil[`${plot.x + dx},${plot.y + dy}`] = { tilledMs: plot.lastTendedMs, lastWeededMs: plot.lastTendedMs };
  }

  const next: Data = { ...old };
  delete next['plots'];
  return {
    ...next,
    width: world?.map.width ?? old['width'],
    height: world?.map.height ?? old['height'],
    lot: { ...lot },
    mapId: world?.map.id ?? 'empty',
    pieces,
    player: world ? { ...world.map.spawn } : { x: 0, y: 0 },
    // Brush under anything already built counts as cleared, so old houses stay valid.
    cleared: (world?.map.brush ?? []).filter((b) => occupied.has(b) || b in soil),
    sites: {},
    soil,
    crops: {},
    npcs: Object.fromEntries((world?.npcs ?? []).map((n) => [n.id, newNpcState()])),
    projects: Object.fromEntries((world?.projects ?? []).map((p) => [p.id, newProjectState(p)])),
    // Piece keys moved, so old undo steps no longer line up.
    history: { undo: [], redo: [] },
    appliedIds: [],
  };
}

/**
 * v3 (Sprint 2.5): the land recovers. Trees can be chopped, brush grows back, some sites
 * refill. Nothing existing changes; regrowth starts counting from the first action after
 * the update, so an old save doesn't get a burst of brush all at once.
 */
function v2to3(old: Data): Data {
  return { ...old, sprouts: [], felled: {}, growMs: null };
}

/** One function per schema bump: migrations[n] turns a version-n town into version n+1. */
export const migrations: Record<number, (old: Data, ctx?: MigrationContext) => Data> = {
  1: v1to2,
  2: v2to3,
};

export function encodeSnapshot(town: Town, savedAt: number): Snapshot {
  const body = JSON.stringify(town);
  return { schemaVersion: town.schemaVersion, savedAt, checksum: hashString(body).toString(16), body };
}

export class SnapshotError extends Error {}

export function decodeSnapshot(snap: Snapshot, ctx?: MigrationContext): Town {
  if (hashString(snap.body).toString(16) !== snap.checksum) throw new SnapshotError('Save is corrupted (checksum mismatch)');
  let data = JSON.parse(snap.body) as Data;
  let version = Number(data['schemaVersion'] ?? 0);
  if (version > SCHEMA_VERSION) throw new SnapshotError(`Save is from a newer version of the game (v${version})`);
  while (version < SCHEMA_VERSION) {
    const step = migrations[version];
    if (!step) throw new SnapshotError(`No migration from save version ${version}`);
    data = step(data, ctx);
    version += 1;
    data['schemaVersion'] = version;
  }
  return data as unknown as Town;
}
