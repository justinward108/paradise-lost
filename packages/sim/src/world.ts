/**
 * The world around the lot: terrain map, salvage sites, crops, NPCs and community
 * projects. The content package authors these; the sim only knows the rules for them.
 */
import type { PlacedPiece, Town } from './types.ts';

/**
 * Terrain characters used in MapDef.rows.
 *  .  grass        L  lot (buildable)   y  neighbour's yard
 *  p  path         r  road              o  lava rock
 *  =  footbridge   ~  stream (blocks)   T  tree (blocks)
 *  X  damaged path (blocks until its project is finished, then becomes path)
 */
export type TerrainChar = '.' | 'L' | 'y' | 'p' | 'r' | 'o' | '=' | '~' | 'T' | 'X';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface MapDef {
  id: string;
  width: number;
  height: number;
  /** `height` strings of `width` terrain characters. */
  rows: string[];
  /** The player's buildable land. */
  lot: Rect;
  spawn: Point;
  /** Tiles ("x,y") covered by invasive brush at the start. */
  brush: string[];
}

export interface SiteDef {
  id: string;
  name: string;
  x: number;
  y: number;
  uses: number;
  /** Materials gained per salvage action. */
  yields: Record<string, number>;
  /** Placeholder art key. */
  art: string;
  /** The site can't be reached until this project is complete. */
  requiresProject?: string;
}

export interface CropDef {
  id: string;
  name: string;
  /** Inventory item planted. */
  seed: string;
  /** Watered ambient days needed to mature. */
  days: number;
  /** Perennials regrow after harvest in this many watered days. */
  regrowDays?: number;
  yields: Record<string, number>;
}

export interface ScheduleStop {
  fromHour: number;
  x: number;
  y: number;
  inside?: boolean;
  /** Only while this project is active; otherwise the previous stop applies. */
  whileProject?: string;
}

export interface NpcDef {
  id: string;
  name: string;
  schedule: ScheduleStop[];
  likes: string[];
  /** Given on first meeting. */
  firstGift: Record<string, number>;
  /** Friendship needed for the building lesson. */
  lessonAt: number;
  lessonGift: Record<string, number>;
  lessonTier: number;
}

export interface ProjectStageDef {
  name: string;
  labour: number;
  materials: Record<string, number>;
}

export interface ProjectDef {
  id: string;
  name: string;
  /** Tiles the project repairs (damaged terrain 'X' becomes path when done). */
  tiles: Point[];
  stages: ProjectStageDef[];
  /** NPC who helps once the player has started, and how often she adds one unit of labour. */
  helper?: string;
  helperLabourMs: number;
}

export interface World {
  map: MapDef;
  sites: SiteDef[];
  crops: Readonly<Record<string, CropDef>>;
  npcs: NpcDef[];
  projects: ProjectDef[];
  /** Pre-built structures that belong to NPCs (the neighbour's house). */
  fixedPieces: PlacedPiece[];
}

export function terrainAt(town: Town, world: World, x: number, y: number): TerrainChar | null {
  if (x < 0 || y < 0 || x >= world.map.width || y >= world.map.height) return null;
  const c = (world.map.rows[y]?.[x] ?? '.') as TerrainChar;
  if (c === 'X') {
    const repaired = world.projects.some(
      (p) => town.projects[p.id]?.completedMs != null && p.tiles.some((t) => t.x === x && t.y === y),
    );
    return repaired ? 'p' : 'X';
  }
  return c;
}

export function inLot(town: Pick<Town, 'lot'>, x: number, y: number): boolean {
  const l = town.lot;
  return x >= l.x && y >= l.y && x < l.x + l.w && y < l.y + l.h;
}

export function hasBrush(town: Town, world: World, x: number, y: number): boolean {
  const id = `${x},${y}`;
  return world.map.brush.includes(id) && !town.cleared.includes(id);
}

export function siteAt(world: World, x: number, y: number): SiteDef | undefined {
  return world.sites.find((s) => s.x === x && s.y === y);
}

export function siteRemaining(town: Town, site: SiteDef): number {
  return Math.max(0, site.uses - (town.sites[site.id]?.used ?? 0));
}

export function projectComplete(town: Town, projectId: string): boolean {
  return town.projects[projectId]?.completedMs != null;
}

/** An empty world: building-only tests and towns created before Sprint 2. */
export function emptyWorld(width: number, height: number): World {
  return {
    map: {
      id: 'empty',
      width,
      height,
      rows: Array.from({ length: height }, () => 'L'.repeat(width)),
      lot: { x: 0, y: 0, w: width, h: height },
      spawn: { x: 0, y: 0 },
      brush: [],
    },
    sites: [],
    crops: {},
    npcs: [],
    projects: [],
    fixedPieces: [],
  };
}
