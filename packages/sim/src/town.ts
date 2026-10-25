/**
 * Creating towns and reading their state.
 */
import { computeRooms, type Room } from './rooms.ts';
import { SCHEMA_VERSION, type Catalog, type Town } from './types.ts';

export interface NewTownOptions {
  townId: string;
  seed: string;
  width: number;
  height: number;
  nowMs: number;
  inventory: Record<string, number>;
  tier?: number;
  plots?: { id: string; x: number; y: number }[];
}

export function createTown(o: NewTownOptions): Town {
  return {
    schemaVersion: SCHEMA_VERSION,
    townId: o.townId,
    seed: o.seed,
    width: o.width,
    height: o.height,
    pieces: {},
    inventory: { ...o.inventory },
    progress: { tier: o.tier ?? 1 },
    clock: { epochMs: o.nowMs },
    plots: Object.fromEntries((o.plots ?? []).map((p) => [p.id, { ...p, lastTendedMs: o.nowMs }])),
    history: { undo: [], redo: [] },
    appliedIds: [],
  };
}

export function rooms(town: Town, catalog: Catalog, level = 0): Room[] {
  return computeRooms(town.pieces, catalog, town.width, town.height, level);
}

export function hasShelter(town: Town, catalog: Catalog): boolean {
  return rooms(town, catalog).some((r) => r.shelter);
}
