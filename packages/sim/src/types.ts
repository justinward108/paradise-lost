/**
 * Core data types for the Paradise Lost simulation.
 *
 * The sim knows the RULES for each kind of piece (foundations hold floors, floors hold
 * walls, enclosed rooms hold roofs). The content package supplies the actual pieces
 * (names, costs, tiers, art). Nothing in this package knows about rendering.
 */

/** Which layer of a slot a piece occupies. One piece per slot per layer. */
export type Layer = 'foundation' | 'floor' | 'wall' | 'object' | 'roof';

/** The rule family a piece belongs to. Decides its layer, slot type and support rule. */
export type PieceKind = 'foundation' | 'floor' | 'wall' | 'door' | 'window' | 'roof' | 'furniture';

/**
 * Walls live on tile edges. Every edge is stored on the tile to its south or east:
 * 'n' = the north edge of tile (x, y); 'w' = the west edge of tile (x, y).
 */
export type EdgeDir = 'n' | 'w';

export interface TileSlot {
  kind: 'tile';
  x: number;
  y: number;
  level: number;
}

export interface EdgeSlot {
  kind: 'edge';
  x: number;
  y: number;
  level: number;
  dir: EdgeDir;
}

export type Slot = TileSlot | EdgeSlot;

/** A piece type, as defined in the content package. */
export interface PieceDef {
  id: string;
  name: string;
  kind: PieceKind;
  /** Material tier (1 = salvage). The player can only place tiers they have unlocked. */
  tier: number;
  /** Materials consumed when placed and refunded when removed. */
  cost: Record<string, number>;
  /** Number of rotations the piece supports (1, 2 or 4). Walls take their direction from the edge. */
  rotations: number;
  /** Catalogue grouping for the UI. */
  category: string;
}

export type Catalog = Readonly<Record<string, PieceDef>>;

export interface PlacedPiece {
  pieceId: string;
  slot: Slot;
  rotation: number;
}

/** A garden plot used by the time-system prototype. */
export interface Plot {
  id: string;
  x: number;
  y: number;
  /** Real time (ms since epoch) the plot was last weeded. */
  lastTendedMs: number;
}

/** One reversible change to the piece map. */
export type Op =
  | { kind: 'add'; key: string; piece: PlacedPiece }
  | { kind: 'del'; key: string; piece: PlacedPiece };

export interface HistoryEntry {
  commandId: string;
  ops: Op[];
  /** Change to inventory caused by the command (negative = spent). */
  inventoryDelta: Record<string, number>;
}

export const SCHEMA_VERSION = 1 as const;

/** Everything needed to restore a town. This is exactly what gets saved. */
export interface Town {
  schemaVersion: typeof SCHEMA_VERSION;
  townId: string;
  /** Seed for deterministic randomness. */
  seed: string;
  width: number;
  height: number;
  pieces: Record<string, PlacedPiece>;
  inventory: Record<string, number>;
  progress: { tier: number };
  clock: { epochMs: number };
  plots: Record<string, Plot>;
  history: { undo: HistoryEntry[]; redo: HistoryEntry[] };
  /** Recently applied command ids, so a resent command is not applied twice. */
  appliedIds: string[];
}
