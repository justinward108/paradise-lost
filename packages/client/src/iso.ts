/**
 * Isometric (2:1) projection. Rendering math only — no game rules live here.
 *
 * World axes: +x runs down-right on screen, +y runs down-left.
 */
import { edge, type EdgeSlot, type Slot, type TileSlot, tile } from '@paradise-lost/sim';

/** Tile width and height on screen at zoom 1 (display pixels). */
export const TW = 64;
export const TH = 32;
/** Height of one storey of wall. */
export const WALL_H = 56;
/** Height of a foundation; floors and everything on them sit this high. */
export const FOUND_H = 10;

export interface Pt {
  x: number;
  y: number;
}

/** Screen position of world point (wx, wy) at elevation z. */
export function toScreen(wx: number, wy: number, z = 0): Pt {
  return { x: ((wx - wy) * TW) / 2, y: ((wx + wy) * TH) / 2 - z };
}

/** World (fractional tile) coordinates under a screen point, on the plane at elevation z. */
export function toWorld(sx: number, sy: number, z = 0): Pt {
  const a = sx / (TW / 2);
  const b = (sy + z) / (TH / 2);
  return { x: (a + b) / 2, y: (b - a) / 2 };
}

export function tileAt(sx: number, sy: number, z = 0): TileSlot {
  const w = toWorld(sx, sy, z);
  return tile(Math.floor(w.x), Math.floor(w.y));
}

/** The tile edge nearest a screen point. */
export function edgeAt(sx: number, sy: number, z = 0): EdgeSlot {
  const w = toWorld(sx, sy, z);
  const tx = Math.floor(w.x);
  const ty = Math.floor(w.y);
  const u = w.x - tx;
  const v = w.y - ty;
  const best = Math.min(v, 1 - v, u, 1 - u);
  if (best === v) return edge(tx, ty, 'n');
  if (best === 1 - v) return edge(tx, ty + 1, 'n');
  if (best === u) return edge(tx, ty, 'w');
  return edge(tx + 1, ty, 'w');
}

/** Where a slot's sprite anchor goes on screen (before elevation). */
export function slotAnchor(slot: Slot): Pt {
  if (slot.kind === 'tile') return toScreen(slot.x + 0.5, slot.y + 0.5);
  return toScreen(slot.x, slot.y); // walls anchor at their start corner
}

/** Sum of world coordinates of the slot's centre: larger = nearer the viewer. */
export function slotDepth(slot: Slot): number {
  if (slot.kind === 'tile') return slot.x + slot.y + 1;
  return slot.x + slot.y + 0.5;
}
