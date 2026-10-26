/**
 * Creating towns and reading their state.
 */
import { LAYER_OF, slotKey } from './grid.ts';
import { computeRooms, type Room } from './rooms.ts';
import { SCHEMA_VERSION, type Catalog, type NpcState, type ProjectState, type Town } from './types.ts';
import { emptyWorld, type ProjectDef, type World } from './world.ts';

export interface NewTownOptions {
  townId: string;
  seed: string;
  nowMs: number;
  inventory: Record<string, number>;
  tier?: number;
  /** The authored world. Omit for a bare building lot of `width` × `height` (tests). */
  world?: World;
  width?: number;
  height?: number;
  /** Needed to key the world's fixed pieces. */
  catalog?: Catalog;
}

export function newNpcState(): NpcState {
  return { met: false, friendship: 0, lastTalkDay: -1, lastGiftDay: -1, taught: false };
}

export function newProjectState(def: ProjectDef): ProjectState {
  return {
    startedMs: null,
    stage: 0,
    stages: def.stages.map(() => ({ playerLabour: 0, given: {}, startedMs: null, materialsMetMs: null, completedMs: null })),
    completedMs: null,
    ledger: [],
  };
}

export function createTown(o: NewTownOptions): Town {
  const world = o.world ?? emptyWorld(o.width ?? 14, o.height ?? 14);
  const pieces: Town['pieces'] = {};
  for (const p of world.fixedPieces) {
    const def = o.catalog?.[p.pieceId];
    if (def) pieces[slotKey(p.slot, LAYER_OF[def.kind])] = p;
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    townId: o.townId,
    seed: o.seed,
    width: world.map.width,
    height: world.map.height,
    lot: { ...world.map.lot },
    mapId: world.map.id,
    pieces,
    inventory: { ...o.inventory },
    progress: { tier: o.tier ?? 1 },
    clock: { epochMs: o.nowMs },
    player: { ...world.map.spawn },
    cleared: [],
    sprouts: [],
    felled: {},
    growMs: null,
    sites: {},
    soil: {},
    crops: {},
    npcs: Object.fromEntries(world.npcs.map((n) => [n.id, newNpcState()])),
    projects: Object.fromEntries(world.projects.map((p) => [p.id, newProjectState(p)])),
    history: { undo: [], redo: [] },
    appliedIds: [],
  };
}

export function rooms(town: Town, catalog: Catalog, level = 0): Room[] {
  return computeRooms(town.pieces, catalog, town.width, town.height, level);
}

/** A shelter on the player's own lot (the neighbour's house doesn't count). */
export function hasShelter(town: Town, catalog: Catalog): boolean {
  const l = town.lot;
  return rooms(town, catalog).some(
    (r) =>
      r.shelter &&
      r.tiles.every((id) => {
        const [x, y] = id.split(',').map(Number) as [number, number];
        return x >= l.x && y >= l.y && x < l.x + l.w && y < l.y + l.h;
      }),
  );
}
