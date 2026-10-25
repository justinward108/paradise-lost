import { createTown, type Catalog, type Town } from '../src/index.ts';

/** A small test catalogue, independent of the real content package. */
export const catalog: Catalog = {
  pier: { id: 'pier', name: 'Pier foundation', kind: 'foundation', tier: 1, cost: { boards: 2 }, rotations: 1, category: 'structure' },
  floor: { id: 'floor', name: 'Plank floor', kind: 'floor', tier: 1, cost: { boards: 2 }, rotations: 1, category: 'structure' },
  wall: { id: 'wall', name: 'Plank wall', kind: 'wall', tier: 1, cost: { boards: 3 }, rotations: 1, category: 'structure' },
  window: { id: 'window', name: 'Window', kind: 'window', tier: 1, cost: { boards: 3 }, rotations: 1, category: 'structure' },
  door: { id: 'door', name: 'Door', kind: 'door', tier: 1, cost: { boards: 4 }, rotations: 1, category: 'structure' },
  roof: { id: 'roof', name: 'Tin roof', kind: 'roof', tier: 1, cost: { roofing: 2 }, rotations: 1, category: 'roof' },
  bedroll: { id: 'bedroll', name: 'Bedroll', kind: 'furniture', tier: 1, cost: { cloth: 3 }, rotations: 2, category: 'furniture' },
  boardwall: { id: 'boardwall', name: 'Board wall', kind: 'wall', tier: 2, cost: { lumber: 3 }, rotations: 1, category: 'structure' },
};

export function newTown(overrides: Partial<Parameters<typeof createTown>[0]> = {}): Town {
  return createTown({
    townId: 'test',
    seed: 'seed-1',
    width: 10,
    height: 10,
    nowMs: 1_000_000,
    inventory: { boards: 500, roofing: 100, cloth: 20 },
    plots: [{ id: 'plot1', x: 8, y: 8 }],
    ...overrides,
  });
}
