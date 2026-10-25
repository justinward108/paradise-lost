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
    ...overrides,
  });
}

import { edge, tile, type World } from '../src/index.ts';

/**
 * A small world for action tests (12 × 12):
 *   lot at (0,0)–(5,5), a stream on column 7 with a bridge at row 2, the neighbour's
 *   yard east of it, a shed at (2,8), and a damaged path at (3,9) leading to a store.
 */
export function testWorld(): World {
  const rows = [
    'LLLLLL.~yyyy',
    'LLLLLL.~yyyy',
    'LLLLLLp=yyyy',
    'LLLLLL.~yyyy',
    'LLLLLL.~yyyy',
    'LLLLLL.~yyyy',
    '.......~....',
    '.......~....',
    '.......~....',
    '~~~X~~~~~~~~',
    '............',
    '............',
  ];
  return {
    map: { id: 'test', width: 12, height: 12, rows, lot: { x: 0, y: 0, w: 6, h: 6 }, spawn: { x: 2, y: 2 }, brush: ['4,4', '5,5'] },
    sites: [
      { id: 'shed', name: 'Shed', x: 2, y: 8, uses: 2, yields: { boards: 4 }, art: 'shed' },
      { id: 'rocks', name: 'Rocks', x: 5, y: 8, uses: 10, yields: { stone: 6 }, art: 'rocks' },
      { id: 'store', name: 'Store', x: 3, y: 11, uses: 5, yields: { cloth: 1 }, art: 'store', requiresProject: 'path' },
    ],
    crops: {
      greens: { id: 'greens', name: 'Greens', seed: 'seed_greens', days: 2, yields: { greens: 3 } },
      papaya: { id: 'papaya', name: 'Papaya', seed: 'seed_papaya', days: 3, regrowDays: 2, yields: { papaya: 2 } },
    },
    npcs: [
      {
        id: 'rosa',
        name: 'Rosa',
        schedule: [
          { fromHour: 6, x: 9, y: 2 },
          { fromHour: 14, x: 3, y: 8, whileProject: 'path' },
          { fromHour: 18, x: 9, y: 2 },
          { fromHour: 22, x: 10, y: 1, inside: true },
        ],
        likes: ['papaya'],
        firstGift: { seed_greens: 4, seed_papaya: 1 },
        lessonAt: 20,
        lessonGift: { lumber: 10 },
        lessonTier: 2,
      },
    ],
    projects: [
      {
        id: 'path',
        name: 'Path',
        tiles: [{ x: 3, y: 9 }],
        stages: [
          { name: 'Clear', labour: 3, materials: {} },
          { name: 'Stone', labour: 2, materials: { stone: 6 } },
        ],
        helper: 'rosa',
        helperLabourMs: 10 * 60 * 1000,
      },
    ],
    fixedPieces: [
      { pieceId: 'pier', slot: tile(9, 1), rotation: 0 },
      { pieceId: 'floor', slot: tile(9, 1), rotation: 0 },
      { pieceId: 'wall', slot: edge(9, 1, 'n'), rotation: 0 },
    ],
  };
}
