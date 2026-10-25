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
export const GENERATORS = ['foundation', 'floor', 'wall', 'window', 'door', 'roof', 'bedroll', 'crate', 'terrain'] as const;
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

/** Terrain art, keyed by terrain id. */
export const terrainArt: ArtManifest = {
  grass: both(
    e('terrain', { base: '#5d8a3a', speck: '#4a7330', light: '#74a248' }, ONE),
    e('terrain', { base: '#8fb06a', speck: '#7a9c58', light: '#a8c486' }, ONE),
  ),
  lot: both(
    e('terrain', { base: '#7d6a45', speck: '#685838', light: '#93805a' }, ONE),
    e('terrain', { base: '#b39d77', speck: '#9f8a65', light: '#c7b490' }, ONE),
  ),
};
