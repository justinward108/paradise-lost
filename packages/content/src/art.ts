/**
 * Art manifest: how each object looks in each visual style (GDD §20.2).
 *
 * The sim, save files and network messages refer only to piece ids. Art is attached here,
 * per style. Sprint 1 uses procedural placeholder generators; real art will replace
 * `generator` with atlas frames without changing anything outside this file and the
 * client's texture loader.
 *
 * Anchors are NOT per style: they come from the piece kind (see FRAME_RULES), so the two
 * styles cannot disagree about where an object sits.
 */
import type { PieceDef } from '@paradise-lost/sim';

export const STYLES = ['pixel', 'storybook'] as const;
export type Style = (typeof STYLES)[number];

/** Placeholder generators the client implements. */
export const GENERATORS = [
  'foundation', 'floor', 'wall', 'window', 'door', 'roof', 'bedroll', 'crate',
  'terrain', 'water', 'bridge', 'soil',
  'tree', 'bush', 'rubble', 'carport', 'rockpile', 'store', 'debris', 'crop', 'weeds', 'person',
  'deadtree', 'stump', 'ruin', 'carwreck', 'smallrubble', 'marker', 'crater',
] as const;
export type GeneratorName = (typeof GENERATORS)[number];

export interface ArtEntry {
  generator: GeneratorName;
  /** Named colours the generator uses (CSS colours). */
  palette: Record<string, string>;
  /** Frames this entry must provide. */
  frames: string[];
}

export type ArtManifest = Record<string, Record<Style, ArtEntry>>;

/** Frames every piece of a kind must have, in every style. */
export function requiredFrames(def: Pick<PieceDef, 'kind' | 'rotations'>): string[] {
  if (def.kind === 'wall' || def.kind === 'door' || def.kind === 'window') return ['n', 'w'];
  return Array.from({ length: Math.max(1, def.rotations) }, (_, i) => `r${i}`);
}

// Pixel palettes: few flat colours. Storybook palettes: softer, warmer, painted.
const salvageWoodPx = { light: '#b08d5b', mid: '#8a6a3f', dark: '#5a4128', line: '#2e2216' };
const salvageWoodSb = { light: '#d2b48a', mid: '#b08e63', dark: '#7d6247', line: '#5b4636' };
const lumberPx = { light: '#d9b779', mid: '#b8925a', dark: '#7f6138', line: '#3a2a18' };
const lumberSb = { light: '#ead1a2', mid: '#cfae7c', dark: '#9b7b56', line: '#6e5741' };
const blockPx = { light: '#a3a3a0', mid: '#7d7d7a', dark: '#545452', line: '#2a2a29' };
const blockSb = { light: '#cfcdc6', mid: '#aeaba3', dark: '#86837c', line: '#605e59' };
const tinPx = { light: '#9fb1b8', mid: '#738891', dark: '#4b5c63', line: '#273136', rust: '#a0522d' };
const tinSb = { light: '#c3d1d4', mid: '#9cb0b5', dark: '#728990', line: '#55666b', rust: '#c07a52' };
const glassPx = { glass: '#7fc4d8' };
const glassSb = { glass: '#a9d8e3' };
const doorPx = { panel: '#6b3f22' };
const doorSb = { panel: '#8c5a3a' };

function both(px: ArtEntry, sb: ArtEntry): Record<Style, ArtEntry> {
  return { pixel: px, storybook: sb };
}

const e = (generator: GeneratorName, palette: Record<string, string>, frames: string[]): ArtEntry => ({ generator, palette, frames });
const WALL = ['n', 'w'];
const ONE = ['r0'];

export const art: ArtManifest = {
  pier_foundation: both(e('foundation', salvageWoodPx, ONE), e('foundation', salvageWoodSb, ONE)),
  plank_floor: both(e('floor', salvageWoodPx, ONE), e('floor', salvageWoodSb, ONE)),
  plank_wall: both(e('wall', salvageWoodPx, WALL), e('wall', salvageWoodSb, WALL)),
  plank_window: both(e('window', { ...salvageWoodPx, ...glassPx }, WALL), e('window', { ...salvageWoodSb, ...glassSb }, WALL)),
  plank_door: both(e('door', { ...salvageWoodPx, ...doorPx }, WALL), e('door', { ...salvageWoodSb, ...doorSb }, WALL)),
  tin_roof: both(e('roof', tinPx, ONE), e('roof', tinSb, ONE)),
  bedroll: both(
    e('bedroll', { cloth: '#7a8f4e', pillow: '#e6dcc0', line: '#2f3820' }, ['r0', 'r1']),
    e('bedroll', { cloth: '#9fb07a', pillow: '#f3ead6', line: '#56603f' }, ['r0', 'r1']),
  ),
  crate: both(e('crate', salvageWoodPx, ONE), e('crate', salvageWoodSb, ONE)),
  block_foundation: both(e('foundation', blockPx, ONE), e('foundation', blockSb, ONE)),
  board_floor: both(e('floor', lumberPx, ONE), e('floor', lumberSb, ONE)),
  board_wall: both(e('wall', lumberPx, WALL), e('wall', lumberSb, WALL)),
  board_window: both(e('window', { ...lumberPx, ...glassPx }, WALL), e('window', { ...lumberSb, ...glassSb }, WALL)),
};

/** Terrain art, keyed by terrain id (see TERRAIN_ART_FOR in this file). */
export const terrainArt: ArtManifest = {
  grass: both(
    e('terrain', { base: '#5d8a3a', speck: '#4a7330', light: '#74a248' }, ONE),
    e('terrain', { base: '#8fb06a', speck: '#7a9c58', light: '#a8c486' }, ONE),
  ),
  lot: both(
    e('terrain', { base: '#7d6a45', speck: '#685838', light: '#93805a' }, ONE),
    e('terrain', { base: '#b39d77', speck: '#9f8a65', light: '#c7b490' }, ONE),
  ),
  yard: both(
    e('terrain', { base: '#6b9a45', speck: '#5a843a', light: '#84b25a' }, ONE),
    e('terrain', { base: '#9dbb76', speck: '#88a865', light: '#b5cd93' }, ONE),
  ),
  path: both(
    e('terrain', { base: '#9a8458', speck: '#86714a', light: '#b09a6c' }, ONE),
    e('terrain', { base: '#c9b48c', speck: '#b39f79', light: '#dccaa6' }, ONE),
  ),
  road: both(
    e('terrain', { base: '#55524c', speck: '#45433e', light: '#6c6862' }, ONE),
    e('terrain', { base: '#8f8b84', speck: '#7c7872', light: '#a7a39c' }, ONE),
  ),
  rock: both(
    e('terrain', { base: '#3a3634', speck: '#2a2726', light: '#57514d' }, ONE),
    e('terrain', { base: '#6e6762', speck: '#5d5752', light: '#8a837d' }, ONE),
  ),
  water: both(
    e('water', { base: '#2f6f8f', light: '#5fa3c2', dark: '#1f5068' }, ONE),
    e('water', { base: '#7fb3c9', light: '#b0d4e2', dark: '#5f95ab' }, ONE),
  ),
  bridge: both(
    e('bridge', { base: '#2f6f8f', light: '#b08d5b', mid: '#8a6a3f', dark: '#5a4128', line: '#2e2216' }, ONE),
    e('bridge', { base: '#7fb3c9', light: '#d2b48a', mid: '#b08e63', dark: '#7d6247', line: '#5b4636' }, ONE),
  ),
  soil: both(
    e('soil', { base: '#4a3420', furrow: '#2f2014', light: '#5e4430' }, ONE),
    e('soil', { base: '#7a5a3c', furrow: '#5c4229', light: '#8f6e4f' }, ONE),
  ),
  scorched: both(
    e('terrain', { base: '#4f5034', speck: '#3a3a28', light: '#6a6440', scorch: '#3e3c2a' }, ONE),
    e('terrain', { base: '#8f8e68', speck: '#7a785a', light: '#a39e78', scorch: '#78735c' }, ONE),
  ),
  crater: both(
    e('crater', { base: '#4a4a32', rim: '#5e5640', hole: '#231f18', mid: '#3a3326' }, ONE),
    e('crater', { base: '#8a8763', rim: '#a08e70', hole: '#4a3f33', mid: '#6e604d' }, ONE),
  ),
  road_cracked: both(
    e('terrain', { base: '#55524c', speck: '#45433e', light: '#6c6862', crack: '#2a2826' }, ONE),
    e('terrain', { base: '#8f8b84', speck: '#7c7872', light: '#a7a39c', crack: '#5a5752' }, ONE),
  ),
};

/** Which terrain art each map character uses. */
export const TERRAIN_ART_FOR: Readonly<Record<string, string>> = {
  '.': 'grass',
  T: 'grass',
  L: 'lot',
  y: 'yard',
  p: 'path',
  X: 'path',
  r: 'road',
  o: 'rock',
  '~': 'water',
  '=': 'bridge',
  D: 'grass',
  s: 'scorched',
  c: 'crater',
  R: 'road_cracked',
};

const greensSb = { leaf: '#7fae5a', dark: '#5d8a42', fruit: '#a8cf7a' };
const greensPx = { leaf: '#5fa23a', dark: '#3f7426', fruit: '#86c45a' };
const STAGES = ['s0', 's1', 's2', 's3'];

/** Objects that stand on the map (trees, sites, crops, people). */
export const objectArt: ArtManifest = {
  tree: both(
    e('tree', { trunk: '#5a4128', leaf: '#2f6b2a', light: '#4c8a3c', dark: '#1f4a1c' }, ['r0', 'r1']),
    e('tree', { trunk: '#7d6247', leaf: '#6f9b52', light: '#93b872', dark: '#557c3d' }, ['r0', 'r1']),
  ),
  bush: both(
    e('bush', { leaf: '#4f7d2f', light: '#6f9e45', dark: '#355620' }, ONE),
    e('bush', { leaf: '#86a85f', light: '#a7c27f', dark: '#6a8a4a' }, ONE),
  ),
  shed: both(e('rubble', salvageWoodPx, ['r0', 'r1']), e('rubble', salvageWoodSb, ['r0', 'r1'])),
  carport: both(e('carport', { ...tinPx, wood: '#8a6a3f' }, ['r0', 'r1']), e('carport', { ...tinSb, wood: '#b08e63' }, ['r0', 'r1'])),
  rocks: both(e('rockpile', blockPx, ['r0', 'r1']), e('rockpile', blockSb, ['r0', 'r1'])),
  store: both(
    e('store', { ...salvageWoodPx, sign: '#a33a2a', glass: '#4a6e78' }, ['r0', 'r1']),
    e('store', { ...salvageWoodSb, sign: '#c0614f', glass: '#7e9ea6' }, ['r0', 'r1']),
  ),
  /** The damaged path: fallen log, open washout, washout shored with boards. */
  debris: both(
    e('debris', { log: '#5a4128', bark: '#3a2a18', hole: '#2a1d12', mud: '#6b5434', board: '#b08d5b' }, ['r0', 'r1', 'r2']),
    e('debris', { log: '#7d6247', bark: '#5b4636', hole: '#4d3a2a', mud: '#9a8160', board: '#d2b48a' }, ['r0', 'r1', 'r2']),
  ),
  // Each crop has its own shape and a coloured tag on a stake, so beds can be told apart
  // from the day they are planted: greens = green tag, sweet potato = purple, papaya = orange.
  crop_greens: both(
    e('crop', { ...greensPx, shape: 'rosette', tag: '#4fbf3a', stake: '#c8a878' }, STAGES),
    e('crop', { ...greensSb, shape: 'rosette', tag: '#5fcf4a', stake: '#e0c49a' }, STAGES),
  ),
  crop_sweet_potato: both(
    e('crop', { leaf: '#4e8f3a', dark: '#346626', fruit: '#9a3a8a', stem: '#7a2e6a', shape: 'vine', tag: '#a83ab8', stake: '#c8a878' }, STAGES),
    e('crop', { leaf: '#86b066', dark: '#628c4a', fruit: '#b9639f', stem: '#9a5a8a', shape: 'vine', tag: '#b85ac8', stake: '#e0c49a' }, STAGES),
  ),
  crop_papaya: both(
    e('crop', { leaf: '#3f8a34', dark: '#2a6224', fruit: '#e08a2a', trunk: '#7a6a4a', shape: 'palm', tag: '#f08a1a', stake: '#c8a878' }, STAGES),
    e('crop', { leaf: '#7db068', dark: '#5a8a4a', fruit: '#f0a85a', trunk: '#a8977a', shape: 'palm', tag: '#f8a040', stake: '#e0c49a' }, STAGES),
  ),
  /** Small icons over beds: needs water today / ready to harvest. */
  marker: both(
    e('marker', { water: '#2f8fd8', ready: '#f2c230', line: '#1a1410', light: '#ffffff' }, ['water', 'ready']),
    e('marker', { water: '#4aa3e0', ready: '#f5cc4a', line: '#3a2e26', light: '#ffffff' }, ['water', 'ready']),
  ),
  deadtree: both(
    e('deadtree', { trunk: '#3a2e24', char: '#1e1814', light: '#5a4a3a' }, ['r0', 'r1']),
    e('deadtree', { trunk: '#6a5a4a', char: '#4a3e34', light: '#8a7a68' }, ['r0', 'r1']),
  ),
  /** r0: a living tree's stump (grows back); r1: a dead tree's stump. */
  stump: both(
    e('stump', { wood: '#8a6a3f', ring: '#c8a878', bark: '#4a3420', sprout: '#4c8a3c' }, ['r0', 'r1']),
    e('stump', { wood: '#b08e63', ring: '#e0c49a', bark: '#7d6247', sprout: '#7fae5a' }, ['r0', 'r1']),
  ),
  ruin: both(
    e('ruin', { ...salvageWoodPx, char: '#2a221a', tin: '#738891' }, ['r0', 'r1']),
    e('ruin', { ...salvageWoodSb, char: '#5a4e44', tin: '#9cb0b5' }, ['r0', 'r1']),
  ),
  carwreck: both(
    e('carwreck', { body: '#6a3a2a', rust: '#8a4a26', char: '#2a221a', glass: '#3a4a4e', tyre: '#1a1814' }, ['r0', 'r1']),
    e('carwreck', { body: '#9a6a56', rust: '#b8744e', char: '#5a4e44', glass: '#6e8086', tyre: '#4a443e' }, ['r0', 'r1']),
  ),
  smallrubble: both(
    e('smallrubble', { ...blockPx, wood: '#5a4128', char: '#2a221a' }, ONE),
    e('smallrubble', { ...blockSb, wood: '#7d6247', char: '#5a4e44' }, ONE),
  ),
  weeds: both(
    e('weeds', { leaf: '#6fae3a', dark: '#4a7a26' }, ['r0', 'r1', 'r2']),
    e('weeds', { leaf: '#86b45a', dark: '#628c42' }, ['r0', 'r1', 'r2']),
  ),
  player: both(
    e('person', { skin: '#b07a52', shirt: '#3f6a9a', pants: '#3a3a3a', hair: '#2a1d14', line: '#1a1410' }, ONE),
    e('person', { skin: '#c99671', shirt: '#6f93bd', pants: '#6a6560', hair: '#4a382a', line: '#3a2e26' }, ONE),
  ),
  rosa: both(
    e('person', { skin: '#a8724c', shirt: '#b04a6a', pants: '#4a5a3a', hair: '#d0d0d0', line: '#1a1410' }, ONE),
    e('person', { skin: '#c08e6a', shirt: '#cf7d96', pants: '#7a8a66', hair: '#ececec', line: '#3a2e26' }, ONE),
  ),
};
