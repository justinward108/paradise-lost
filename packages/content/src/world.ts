import {RESOURCE_CROPS,RESOURCE_ITEMS,RESOURCE_FOODS,RESOURCE_SEED_TRADES} from './resourceExpansion.ts';
import {EXPANDED_ITEMS,EXPANDED_FOODS} from './catalogExpansion.ts';
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

import { workshop } from './workshop.ts';

const W = 34;
const H = 34;
const LOT = { x: 3, y: 3, w: 14, h: 14 };
const SPAWN = { x: 9, y: 15 };
const HOUR = 3_600_000;

/**
 * The Ministry relief kiosk: a Greater America buy-back and ration machine still running
 * on the stream bank by the footbridge, the regime present only as a vending machine.
 * It trades in Rapture Credits through the player's poor.camp account.
 */
const KIOSK = { x: 17, y: 7, name: 'Ministry relief kiosk' };

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
  const keepClear = new Set([...SITES, KIOSK].map((s) => `${s.x},${s.y}`));
  for (let y = 2; y < H - 2; y++) {
    for (let x = 2; x < W - 2; x++) {
      if (g[y]![x] !== '.') continue;
      const nearSite = [...SITES, KIOSK].some((s) => Math.abs(s.x - x) <= 1 && Math.abs(s.y - y) <= 1);
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
  ...RESOURCE_CROPS,
  greens: { id: 'greens', name: 'Leafy greens', seed: 'seed_greens', days: 2, yields: { greens: 3 } },
  sweet_potato: { id: 'sweet_potato', name: 'Sweet potato', seed: 'slip_sweet_potato', days: 5, yields: { sweet_potato: 4 } },
  papaya: { id: 'papaya', name: 'Papaya', seed: 'seed_papaya', days: 8, regrowDays: 3, yields: { papaya: 2 } },
  // Only from the relief kiosk.
  long_beans: { id: 'long_beans', name: 'Long beans', seed: 'seed_long_beans', days: 3, regrowDays: 2, yields: { long_beans: 4 } },
  banana: { id: 'banana', name: 'Banana', seed: 'keiki_banana', days: 10, regrowDays: 5, yields: { banana: 3 } },
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
        { fromHour: 6, x: 28, y: 11, patrol: [{x:28,y:11},{x:27,y:11},{x:27,y:12},{x:28,y:12}] }, // her garden
        { fromHour: 11, x: 25, y: 8 }, // porch
        { fromHour: 14, x: 9, y: 20, whileProject: PATH_PROJECT_ID }, // helping at the path
        { fromHour: 18, x: 25, y: 8 }, // porch
        { fromHour: 22, x: 25, y: 6, inside: true }, // home for the night
      ],
      likes: ['papaya', 'sweet_potato', 'banana'],
      firstGift: { seed_greens: 6, slip_sweet_potato: 3, seed_papaya: 2 },
      // Initial playtest prices: barter spends local goods, never account credits.
      trades: [
        { id: 'buy_pet_food', cost: { greens: 3 }, gives: { pet_food: 2 } },
        { id: 'sell_eggs', cost: { eggs: 2 }, gives: { boards: 2 } },
        { id: 'sell_milk', cost: { milk: 2 }, gives: { boards: 3 } },
        { id: 'sell_chicken_meat', cost: { chicken_meat: 1 }, gives: { boards: 2 } },
        { id: 'sell_beef', cost: { beef: 1 }, gives: { boards: 3 } },
        { id: 'drinking_water', cost: { boards: 1 }, gives: { water: 2 } },
        { id: 'learning_voucher', cost: { boards: 2 }, gives: { learning_credit: 1 } },
        { id: 'learning_voucher_food', cost: { greens: 3 }, gives: { learning_credit: 1 } },
        { id: 'greens_seed', cost: { boards: 2 }, gives: { seed_greens: 1 } },
        { id: 'potato_slip', cost: { stone: 3 }, gives: { slip_sweet_potato: 1 } },
        { id: 'papaya_seed', cost: { boards: 4 }, gives: { seed_papaya: 1 } },
        { id: 'food_for_boards', cost: { greens: 3 }, gives: { boards: 2 } },
        { id: 'fruit_for_stone', cost: { papaya: 2 }, gives: { stone: 2 } },
      ],
      lessonAt: 20,
      lessonGift: { lumber: 24, block: 8 },
      lessonTier: 2,
    },
    { id:'visitor_carpenter', name:'Visiting carpenter', greeting:'I can trade furniture kits for some of your harvest. ',
      schedule:[{fromHour:7,x:15,y:18,patrol:[{x:15,y:18},{x:16,y:18},{x:16,y:17},{x:15,y:17}]},{fromHour:20,x:15,y:18,inside:true}],
      likes:['papaya'], firstGift:{}, lessonAt:101,lessonGift:{},lessonTier:1,
      trades:[{id:'chair_for_food',cost:{greens:5},gives:{kit_chair:1}},{id:'table_for_food',cost:{papaya:5},gives:{kit_table:1}}]},
    { id:'visitor_seed_trader', name:'Visiting seed trader', greeting:'Bring surplus food or boards and I can supply planting material.',
      schedule:[{fromHour:7,x:10,y:18,patrol:[{x:10,y:18},{x:11,y:18},{x:11,y:17},{x:10,y:17}]},{fromHour:20,x:10,y:18,inside:true}],
      likes:['sweet_potato'],firstGift:{},lessonAt:101,lessonGift:{},lessonTier:1,
      trades:[{id:'bean_seed_stock',cost:{boards:4},gives:{seed_long_beans:2}},{id:'banana_keiki_stock',cost:{boards:6},gives:{keiki_banana:1}},...RESOURCE_SEED_TRADES,{id:'seeds_for_greens',cost:{greens:2},gives:{seed_greens:2}},{id:'slips_for_food',cost:{sweet_potato:2},gives:{slip_sweet_potato:2}},{id:'seeds_for_boards',cost:{boards:2},gives:{seed_papaya:1}}]},
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
  kiosk: KIOSK,
  workshop,
  animalDefs: {
    dog: {name:'Dog',pet:true,cost:{boards:12,cloth:3},sale:{boards:6},feed:'pet_food',toy:'dog_toy'},
    cat: {name:'Cat',pet:true,cost:{boards:10,cloth:3},sale:{boards:5},feed:'pet_food',toy:'cat_toy'},
    chicken: {name:'Chicken',pet:false,cost:{boards:8,stone:4},sale:{boards:4},feed:'farm_feed',produce:{eggs:2},meat:{chicken_meat:2}},
    cow: {name:'Cow',pet:false,cost:{boards:30,stone:12},sale:{boards:15},feed:'farm_feed',produce:{milk:2},meat:{beef:6}},
  },
  wellbeing: { foods: {
    ...EXPANDED_FOODS,
    ...RESOURCE_FOODS,
    milk: { food: 12, water: 18, happiness: 3 },
    meal_eggs: { food: 45, water: 5, happiness: 7, focusMs: 300_000 },
    meal_chicken: { food: 55, water: 8, happiness: 9, focusMs: 420_000 },
    meal_beef: { food: 60, water: 5, happiness: 9, focusMs: 420_000 },
    meal_stew: { food: 42, water: 22, happiness: 6, focusMs: 360_000 },
    meal_beans: { food: 38, water: 10, happiness: 6, focusMs: 300_000 },
    meal_breakfast: { food: 65, water: 12, happiness: 10, focusMs: 480_000 },
    drink_smoothie: { food: 25, water: 35, happiness: 10, focusMs: 360_000 },
    water: { food: 0, water: 35, happiness: 0 },
    greens: { food: 12, water: 3, happiness: 1 },
    sweet_potato: { food: 22, water: 0, happiness: 1 },
    papaya: { food: 15, water: 10, happiness: 2 },
    long_beans: { food: 15, water: 2, happiness: 1 },
    banana: { food: 20, water: 3, happiness: 2 },
    meal_salad: { food: 40, water: 12, happiness: 7, focusMs: 300_000 },
    drink_fruit: { food: 10, water: 40, happiness: 8, focusMs: 300_000 },
  } },
  chop: {
    // Living trees are invasive albizia (GDD 9.2: native forest is never harvestable).
    T: { name: 'albizia tree', yields: { boards: 3 }, regrowMs: 24 * HOUR },
    D: { name: 'burnt tree', yields: { boards: 2 } },
  },
  regrow: {
    brushEveryMs: 4 * HOUR,
    brushPerTime: 2,
    brushCap: 16,
    brushYields: { boards: 1, plant_fiber: 2 },
    rubbleYields: { stone: 1, boards: 1 },
  },
};

/** Display names for everything that can be in an inventory. */
export const ITEMS: Readonly<Record<string, { name: string; kind: 'material' | 'seed' | 'food' }>> = {
  ...EXPANDED_ITEMS,
  ...RESOURCE_ITEMS,
  compost: {name:'Garden compost',kind:'material'},
  fertilizer: {name:'Mineral fertilizer',kind:'material'},
  tool_pick: { name: 'Mining pick', kind: 'material' },
  tool_smelter: { name: 'Smelter', kind: 'material' },
  metal_ore: { name: 'Metal ore', kind: 'material' },
  silica: { name: 'Silica', kind: 'material' },
  metal: { name: 'Refined metal', kind: 'material' },
  glass: { name: 'Construction glass', kind: 'material' },
  part_masonry: { name: 'Masonry wall parts', kind: 'material' },
  part_shopfront: { name: 'Shopfront parts', kind: 'material' },
  part_civic: { name: 'Civic building parts', kind: 'material' },
  kit_sofa: { name: 'Sofa kit', kind: 'material' },
  kit_cabinet: { name: 'Cabinet kit', kind: 'material' },
  kit_yard_bench: { name: 'Yard bench kit', kind: 'material' },
  kit_planter: { name: 'Decorative planter kit', kind: 'material' },
  clothing_shirt: { name: 'Shirt', kind: 'material' },
  clothing_trousers: { name: 'Trousers', kind: 'material' },
  clothing_shoes: { name: 'Shoes', kind: 'material' },
  clothing_hat: { name: 'Hat', kind: 'material' },
  clothing_bag: { name: 'Bag', kind: 'material' },
  clothing_outfit: { name: 'Complete outfit', kind: 'material' },
  farm_feed: { name: 'Farm animal feed', kind: 'material' },
  pet_food: { name: 'Pet food', kind: 'material' },
  dog_toy: { name: 'Dog toy', kind: 'material' },
  cat_toy: { name: 'Cat toy', kind: 'material' },
  care_medicine: { name: 'Fictional care medicine', kind: 'material' },
  pet_medicine: { name: 'Fictional veterinary medicine', kind: 'material' },
  eggs: { name: 'Eggs', kind: 'food' },
  milk: { name: 'Milk', kind: 'food' },
  chicken_meat: { name: 'Chicken meat', kind: 'food' },
  beef: { name: 'Beef', kind: 'food' },
  meal_stew: { name: 'Vegetable stew', kind: 'food' },
  meal_beans: { name: 'Garden bean plate', kind: 'food' },
  meal_breakfast: { name: 'Milk-and-egg breakfast', kind: 'food' },
  drink_smoothie: { name: 'Fruit smoothie', kind: 'food' },
  meal_eggs: { name: 'Egg meal', kind: 'food' },
  meal_chicken: { name: 'Chicken meal', kind: 'food' },
  meal_beef: { name: 'Beef meal', kind: 'food' },
  game_console: { name: 'Video game system', kind: 'material' },
  video_game: { name: 'Video game cartridge', kind: 'material' },
  water: { name: 'Water', kind: 'material' },
  learning_credit: { name: 'Learning voucher', kind: 'material' },
  plant_fiber: { name: 'Plant fiber', kind: 'material' },
  tool_saw: { name: 'Saw', kind: 'material' },
  tool_loom: { name: 'Loom', kind: 'material' },
  tool_electronics: { name: 'Electronics toolkit', kind: 'material' },
  phone_parts: { name: 'Phone parts', kind: 'material' },
  computer_parts: { name: 'Computer parts', kind: 'material' },
  boat_parts: { name: 'Boat parts', kind: 'material' },
  phone: { name: 'Phone', kind: 'material' },
  computer: { name: 'Computer', kind: 'material' },
  boat: { name: 'Boat', kind: 'material' },
  meal_salad: { name: 'Garden salad', kind: 'food' },
  drink_fruit: { name: 'Fruit drink', kind: 'food' },
  boards: { name: 'Boards', kind: 'material' },
  roofing: { name: 'Roofing', kind: 'material' },
  cloth: { name: 'Cloth', kind: 'material' },
  stone: { name: 'Stone', kind: 'material' },
  lumber: { name: 'Lumber', kind: 'material' },
  block: { name: 'Block', kind: 'material' },
  seed_greens: { name: 'Greens seeds', kind: 'seed' },
  slip_sweet_potato: { name: 'Sweet potato slips', kind: 'seed' },
  seed_papaya: { name: 'Papaya seeds', kind: 'seed' },
  seed_long_beans: { name: 'Long bean seeds', kind: 'seed' },
  keiki_banana: { name: 'Banana keiki', kind: 'seed' },
  kit_table: { name: 'Table kit', kind: 'material' },
  kit_chair: { name: 'Chair kit', kind: 'material' },
  kit_lantern: { name: 'Solar lantern', kind: 'material' },
  kit_rug: { name: 'Woven rug', kind: 'material' },
  greens: { name: 'Greens', kind: 'food' },
  sweet_potato: { name: 'Sweet potato', kind: 'food' },
  papaya: { name: 'Papaya', kind: 'food' },
  long_beans: { name: 'Long beans', kind: 'food' },
  banana: { name: 'Banana', kind: 'food' },
};
