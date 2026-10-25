/**
 * Starter building pieces (Sprint 1).
 *
 * Names, costs and tiers are placeholders for playtesting. Real local materials and
 * architectural styles need the cultural and ecological review in GDD §4.4 and §7.6.
 */
import type { Catalog, PieceDef } from '@paradise-lost/sim';

const defs: PieceDef[] = [
  // Tier 1 — salvage
  { id: 'pier_foundation', name: 'Post-and-pier foundation', kind: 'foundation', tier: 1, cost: { boards: 2 }, rotations: 1, category: 'Foundations' },
  { id: 'plank_floor', name: 'Salvaged plank floor', kind: 'floor', tier: 1, cost: { boards: 2 }, rotations: 1, category: 'Floors' },
  { id: 'plank_wall', name: 'Salvaged plank wall', kind: 'wall', tier: 1, cost: { boards: 3 }, rotations: 1, category: 'Walls' },
  { id: 'plank_window', name: 'Plank wall with window', kind: 'window', tier: 1, cost: { boards: 3 }, rotations: 1, category: 'Walls' },
  { id: 'plank_door', name: 'Plank door', kind: 'door', tier: 1, cost: { boards: 4 }, rotations: 1, category: 'Walls' },
  { id: 'tin_roof', name: 'Corrugated roof', kind: 'roof', tier: 1, cost: { roofing: 2 }, rotations: 1, category: 'Roofs' },
  { id: 'bedroll', name: 'Bedroll', kind: 'furniture', tier: 1, cost: { cloth: 3 }, rotations: 2, category: 'Furniture' },
  { id: 'crate', name: 'Crate', kind: 'furniture', tier: 1, cost: { boards: 2 }, rotations: 1, category: 'Furniture', solid: true },
  // Tier 2 — rough-built (locked at the start; shows the progression gate)
  { id: 'block_foundation', name: 'Cinder block foundation', kind: 'foundation', tier: 2, cost: { block: 2 }, rotations: 1, category: 'Foundations' },
  { id: 'board_floor', name: 'Rough lumber floor', kind: 'floor', tier: 2, cost: { lumber: 2 }, rotations: 1, category: 'Floors' },
  { id: 'board_wall', name: 'Rough lumber wall', kind: 'wall', tier: 2, cost: { lumber: 3 }, rotations: 1, category: 'Walls' },
  { id: 'board_window', name: 'Lumber wall with window', kind: 'window', tier: 2, cost: { lumber: 3 }, rotations: 1, category: 'Walls' },
];

export const catalog: Catalog = Object.freeze(Object.fromEntries(defs.map((d) => [d.id, d])));

/** Catalogue order for the build UI. */
export const pieceOrder: readonly string[] = defs.map((d) => d.id);

export const MATERIALS: readonly { id: string; name: string }[] = [
  { id: 'boards', name: 'Boards' },
  { id: 'roofing', name: 'Roofing' },
  { id: 'cloth', name: 'Cloth' },
  { id: 'lumber', name: 'Lumber' },
  { id: 'block', name: 'Block' },
  { id: 'stone', name: 'Stone' },
];

/** What a new player arrives with: a tarp's worth of cloth. Everything else is salvaged. */
export const STARTER_INVENTORY: Readonly<Record<string, number>> = { cloth: 3 };
