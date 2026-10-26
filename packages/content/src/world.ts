/**
 * The starter map (Sprint 2): the player's lot, a stream with a footbridge, the
 * neighbour's yard and house, salvage sites, a lava-rock field, and a washed-out path
 * to the road.
 *
 * Sprint 2.5: the town was bombed and abandoned. Craters, scorched ground, burnt trees,
 * bombed-out houses and wrecked cars; rubble on the lot. Living trees can be chopped and
 * grow back, so there is always a way to get boards.
 *
 * Placeholder content for playtesting. Place names, the neighbour's name and background,
 * crops and anything culturally specific need the review in GDD §4.4 before release.
 */
import { edge, mulberry32, hashString, tile, type CropDef, type PlacedPiece, type World } from '@paradise-lost/sim';

const W = 34;
const H = 34;
const LOT = { x: 3, y: 3, w: 14, h: 14 };
const SPAWN = { x: 9, y: 15 };
const HOUR = 3_600_000;

/** Bomb craters (centre tiles). Scorched ground rings each one. */
const CRATERS = [
  { x: 28, y: 15 },
  { x: 22, y: 14 },
  { x: 15, y: 26 },
  { x: 8, y: 31 },
  { x: 30, y: 31 },
  { x: 13, y: 25 },
  { x: 5, y: 25 },
  { x: 11, y: 28 },
  { x: 23, y: 31 },
];

const SITES: World['sites'] = [
  { id: 'shed', name: 'Collapsed shed', x: 6, y: 19, uses: 15, yields: { boards: 4 }, art: 'shed' },
  { id: 'carport', name: 'Fallen carport', x: 13, y: 19, uses: 9, yields: { roofing: 2, boards: 1 }, art: 'carport' },
  // Loose rock keeps turning up as the ground settles: one use back every two hours.
  { id: 'rocks', name: 'Loose lava rock', x: 25, y: 19, uses: 10, yields: { stone: 3 }, art: 'rocks', refillMs: 2 * HOUR },
  { id: 'ruin_east', name: 'Bombed-out house', x: 25, y: 15, uses: 14, yields: { boards: 2, roofing: 1 }, art: 'ruin' },
  { id: 'car_east', name: 'Burnt-out car', x: 21, y: 21, uses: 6, yields: { roofing: 1, stone: 1 }, art: 'carwreck' },
  {
    id: 'ruin_south',
    name: 'Collapsed house',
    x: 25,
    y: 31,
    uses: 16,
    yields: { boards: 3, roofing: 1 },
    art: 'ruin',
    requiresProject: 'path_repair',
  },
  { id: 'car_road', name: 'Wrecked truck', x: 5, y: 29, uses: 6, yields: { roofing: 2 }, art: 'carwreck', requiresProject: 'path_repair' },
  {
    id: 'store',
    name: 'Abandoned general store',
    x: 12,
    y: 31,
    uses: 15,
    yields: { boards: 3, roofing: 1, cloth: 1 },
    art: 'store',
    requiresProject: 'path_repair',
  },
];

const PATH_DAMAGE = [
  { x: 9, y: 21 },
  { x: 9, y: 22 },
  { x: 9, y: 23 },
];

function buildRows(): string[] {
  const g: string[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => '.'));
  const set = (x: number, y: number, c: string) => {
    if (x >= 0 && y >= 0 && x < W && y < H) g[y]![x] = c;
  };
  const rect = (x0: number, y0: number, w: number, h: number, c: string) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) set(x, y, c);
  };

  rect(LOT.x, LOT.y, LOT.w, LOT.h, 'L');
  rect(21, 3, 10, 11, 'y'); // neighbour's yard
  rect(22, 17, 8, 6, 'o'); // lava rock field
  rect(2, 21, 16, 3, '~'); // the gully the path crosses
  rect(20, 24, 12, 3, 'T'); // thick forest east of the stream
  rect(18, 0, 2, H, '~'); // the stream
  rect(18, 9, 2, 1, '='); // footbridge to the neighbour
  set(17, 9, 'p');
  set(20, 9, 'p');
  for (let y = LOT.y + LOT.h; y < 28; y++) set(9, y, 'p'); // path south to the road
  for (const d of PATH_DAMAGE) set(d.x, d.y, 'X');
  rect(2, 28, W - 4, 2, 'r'); // the road
  rect(18, 28, 2, 2, '='); // road bridge

  // Bomb damage: craters with scorched rings, cracked road.
  const crackRand = mulberry32(hashString('starter-road-cracks'));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g[y]![x] === 'r' && crackRand() < 0.35) set(x, y, 'R');
  for (const c of CRATERS) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const t = g[c.y + dy]?.[c.x + dx];
        if (t === '.' || t === 'r' || t === 'R') set(c.x + dx, c.y + dy, 's');
      }
    }
    set(c.x, c.y, 'c');
  }

  // Tree border, then scattered trees on open grass.
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) set(x, y, 'T');
  const rand = mulberry32(hashString('starter-map-trees'));
  const keepClear = new Set(SITES.map((s) => `${s.x},${s.y}`));
  for (let y = 2; y < H - 2; y++) {
    for (let x = 2; x < W - 2; x++) {
      if (g[y]![x] !== '.') continue;
      const nearSite = SITES.some((s) => Math.abs(s.x - x) <= 1 && Math.abs(s.y - y) <= 1);
      const nearPath = Math.abs(x - 9) <= 1 && y > LOT.y + LOT.h;
      if (nearSite || nearPath || keepClear.has(`${x},${y}`)) continue;
      if (rand() < 0.1) g[y]![x] = 'T';
    }
  }
  // Fire took a lot of the trees away from the forest edge: burnt and dead.
  const burn = mulberry32(hashString('starter-burnt-trees'));
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (g[y]![x] !== 'T') continue;
      const edgeRing = x === 1 || y === 1 || x === W - 2 || y === H - 2;
      const inForest = x >= 20 && x < 32 && y >= 24 && y < 27;
      const chance = edgeRing ? 0.3 : inForest ? 0.2 : 0.7;
      if (burn() < chance) g[y]![x] = 'D';
    }
  }
  return g.map((r) => r.join(''));
}

/** Rubble from the house that stood on the lot before. */
function buildRubble(brush: string[]): string[] {
  const rand = mulberry32(hashString('starter-lot-rubble'));
  const out: string[] = [];
  for (let y = LOT.y; y < LOT.y + LOT.h; y++) {
    for (let x = LOT.x; x < LOT.x + LOT.w; x++) {
      if (Math.abs(x - SPAWN.x) <= 2 && Math.abs(y - SPAWN.y) <= 2) continue;
      if (brush.includes(`${x},${y}`)) continue;
      // Concentrated where the old house was (the north-east of the lot).
      const near = x >= 10 && y <= 9 ? 0.35 : 0.04;
      if (rand() < near) out.push(`${x},${y}`);
    }
  }
  return out;
}

function buildBrush(): string[] {
  const rand = mulberry32(hashString('starter-lot-brush'));
  const out: string[] = [];
  for (let y = LOT.y; y < LOT.y + LOT.h; y++) {
    for (let x = LOT.x; x < LOT.x + LOT.w; x++) {
      if (Math.abs(x - SPAWN.x) <= 2 && Math.abs(y - SPAWN.y) <= 2) continue; // room to arrive
      if (rand() < 0.14) out.push(`${x},${y}`);
    }
  }
  return out;
}

/** The neighbour's house: a 3 × 3 room built from the same pieces the player uses. */
function neighbourHouse(): PlacedPiece[] {
  const out: PlacedPiece[] = [];
  const x0 = 24;
  const y0 = 5;
  const add = (pieceId: string, slot: PlacedPiece['slot']) => out.push({ pieceId, slot, rotation: 0 });
  for (let y = y0; y < y0 + 3; y++) {
    for (let x = x0; x < x0 + 3; x++) {
      add('block_foundation', tile(x, y));
      add('board_floor', tile(x, y));
    }
  }
  for (let i = 0; i < 3; i++) {
    add('board_wall', edge(x0 + i, y0, 'n'));
    add(i === 1 ? 'plank_door' : 'board_window', edge(x0 + i, y0 + 3, 'n'));
    add(i === 1 ? 'board_window' : 'board_wall', edge(x0, y0 + i, 'w'));
    add('board_wall', edge(x0 + 3, y0 + i, 'w'));
  }
  for (let y = y0; y < y0 + 3; y++) for (let x = x0; x < x0 + 3; x++) add('tin_roof', tile(x, y));
  return out;
}

export const crops: Record<string, CropDef> = {
  greens: { id: 'greens', name: 'Leafy greens', seed: 'seed_greens', days: 2, yields: { greens: 3 } },
  sweet_potato: { id: 'sweet_potato', name: 'Sweet potato', seed: 'slip_sweet_potato', days: 5, yields: { sweet_potato: 4 } },
  papaya: { id: 'papaya', name: 'Papaya', seed: 'seed_papaya', days: 8, regrowDays: 3, yields: { papaya: 2 } },
};

export const NEIGHBOUR_ID = 'rosa';
export const PATH_PROJECT_ID = 'path_repair';

const BRUSH = buildBrush();

export const world: World = {
  map: { id: 'starter', width: W, height: H, rows: buildRows(), lot: LOT, spawn: SPAWN, brush: BRUSH, rubble: buildRubble(BRUSH) },
  sites: SITES,
  crops,
  npcs: [
    {
      id: NEIGHBOUR_ID,
      name: 'Auntie Rosa',
      schedule: [
        { fromHour: 6, x: 28, y: 11 }, // her garden
        { fromHour: 11, x: 25, y: 8 }, // porch
        { fromHour: 14, x: 9, y: 20, whileProject: PATH_PROJECT_ID }, // helping at the path
        { fromHour: 18, x: 25, y: 8 }, // porch
        { fromHour: 22, x: 25, y: 6, inside: true }, // home for the night
      ],
      likes: ['papaya', 'sweet_potato'],
      firstGift: { seed_greens: 6, slip_sweet_potato: 3, seed_papaya: 2 },
      lessonAt: 20,
      lessonGift: { lumber: 24, block: 8 },
      lessonTier: 2,
    },
  ],
  projects: [
    {
      id: PATH_PROJECT_ID,
      name: 'Path to the road',
      tiles: PATH_DAMAGE,
      stages: [
        { name: 'Clear the fallen tree', labour: 8, materials: {} },
        { name: 'Shore up the washout', labour: 5, materials: { boards: 10 } },
        { name: 'Lay stepping stones', labour: 5, materials: { stone: 12 } },
      ],
      helper: NEIGHBOUR_ID,
      helperLabourMs: 10 * 60 * 1000,
    },
  ],
  fixedPieces: neighbourHouse(),
  chop: {
    // Living trees are invasive albizia (GDD 9.2: native forest is never harvestable).
    T: { name: 'albizia tree', yields: { boards: 3 }, regrowMs: 24 * HOUR },
    D: { name: 'burnt tree', yields: { boards: 2 } },
  },
  regrow: {
    brushEveryMs: 4 * HOUR,
    brushPerTime: 2,
    brushCap: 16,
    brushYields: { boards: 1 },
    rubbleYields: { stone: 1, boards: 1 },
  },
};

/** Display names for everything that can be in an inventory. */
export const ITEMS: Readonly<Record<string, { name: string; kind: 'material' | 'seed' | 'food' }>> = {
  boards: { name: 'Boards', kind: 'material' },
  roofing: { name: 'Roofing', kind: 'material' },
  cloth: { name: 'Cloth', kind: 'material' },
  stone: { name: 'Stone', kind: 'material' },
  lumber: { name: 'Lumber', kind: 'material' },
  block: { name: 'Block', kind: 'material' },
  seed_greens: { name: 'Greens seeds', kind: 'seed' },
  slip_sweet_potato: { name: 'Sweet potato slips', kind: 'seed' },
  seed_papaya: { name: 'Papaya seeds', kind: 'seed' },
  greens: { name: 'Greens', kind: 'food' },
  sweet_potato: { name: 'Sweet potato', kind: 'food' },
  papaya: { name: 'Papaya', kind: 'food' },
};
