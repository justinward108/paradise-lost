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
  /** Furniture that blocks walking (a crate does; a bedroll doesn't). */
  solid?: boolean;
}

export type Catalog = Readonly<Record<string, PieceDef>>;

export interface PlacedPiece {
  pieceId: string;
  slot: Slot;
  rotation: number;
}

/** A tilled garden bed tile. */
export interface Soil {
  tilledMs: number;
  /** Real time the bed was last weeded (weeds grow in real hours). */
  lastWeededMs: number;
}

/** A crop growing in a bed. */
export interface Crop {
  cropId: string;
  /** Ambient day it was planted, or last harvested for perennials. */
  sinceDay: number;
  /** Ambient days the player watered it by hand (rain counts on its own). */
  wateredDays: number[];
  harvests: number;
}

export interface NpcState {
  met: boolean;
  friendship: number;
  lastTalkDay: number;
  lastGiftDay: number;
  taught: boolean;
  /** Last ambient day the player worked alongside this neighbour on a project. */
  lastWorkDay?: number;
}

export interface ProjectStageState {
  playerLabour: number;
  given: Record<string, number>;
  startedMs: number | null;
  materialsMetMs: number | null;
  completedMs: number | null;
}

export interface ProjectState {
  /** Set when the player first contributes; the helper NPC starts working from then. */
  startedMs: number | null;
  stage: number;
  stages: ProjectStageState[];
  completedMs: number | null;
  /** Player contributions, for the community record. */
  ledger: { what: string; amount: number; ms: number }[];
}

export interface KioskState {
  pendingSales: { key: string; item: string; qty: number }[];
  pendingOrders: { key: string; offer: string }[];
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

export const SCHEMA_VERSION = 4 as const;

/** Everything needed to restore a town. This is exactly what gets saved. */
export interface Town {
  schemaVersion: typeof SCHEMA_VERSION;
  townId: string;
  /** Seed for deterministic randomness. */
  seed: string;
  /** Map size in tiles. */
  width: number;
  height: number;
  /** The player's buildable land within the map. */
  lot: { x: number; y: number; w: number; h: number };
  mapId: string;
  pieces: Record<string, PlacedPiece>;
  inventory: Record<string, number>;
  /** Building tier unlocked, and how many crops have been harvested (ever). */
  progress: { tier: number; harvests: number };
  clock: { epochMs: number };
  /** Player position in tile coordinates (the tile's top corner; centre is +0.5). */
  player: { x: number; y: number };
  /** Starting brush and rubble tiles ("x,y") the player has cleared. */
  cleared: string[];
  /** Brush that has grown back on the lot since ("x,y"). */
  sprouts: string[];
  /** Chopped trees ("x,y") and when; live trees grow back, dead ones leave a stump. */
  felled: Record<string, number>;
  /** Real time the land's regrowth was last worked out up to (null until the first action). */
  growMs: number | null;
  /**
   * Trades with the relief kiosk that poor.camp hasn't confirmed yet. Goods for a sale
   * leave the inventory before the request is sent; an order is recorded before it is
   * sent. Both are retried with the same request key until poor.camp answers, so a
   * closed tab never loses goods or a paid purchase.
   */
  kiosk: KioskState;
  /** `refillMs`: when the next use of a renewable site started counting back. */
  sites: Record<string, { used: number; refillMs?: number }>;
  soil: Record<string, Soil>;
  crops: Record<string, Crop>;
  npcs: Record<string, NpcState>;
  projects: Record<string, ProjectState>;
  history: { undo: HistoryEntry[]; redo: HistoryEntry[] };
  /** Recently applied command ids, so a resent command is not applied twice. */
  appliedIds: string[];
}
