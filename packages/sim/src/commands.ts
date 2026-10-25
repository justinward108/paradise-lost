/**
 * Commands: the only way the town changes.
 *
 * Every player action is a serialisable command. Solo play applies commands to the local
 * town; multiplayer (later) sends the same commands to the server, which applies them to
 * its own copy with exactly this code. Undo, redo and save files reuse the same records.
 */
import { applyWorld, type WorldCommand } from './actions.ts';
import { LAYER_OF, slotKey } from './grid.ts';
import { checkPlace, checkRemove } from './rules.ts';
import type { Catalog, HistoryEntry, Layer, Op, PlacedPiece, Slot, Town } from './types.ts';
import type { World } from './world.ts';

export type BuildCommand =
  | { type: 'place'; id: string; pieceId: string; slot: Slot; rotation?: number }
  | { type: 'remove'; id: string; slot: Slot; layer: Layer; cascade?: boolean }
  | { type: 'undo'; id: string }
  | { type: 'redo'; id: string };

export type Command = BuildCommand | WorldCommand;

export interface ApplyResult {
  ok: boolean;
  reason?: string;
  warning?: string;
  /** True when the town changed (false for rejected or duplicate commands). */
  changed: boolean;
  duplicate?: boolean;
  /** What happened, for the UI to describe (world actions). */
  events?: string[];
}

export const MAX_UNDO = 100;
const MAX_APPLIED_IDS = 500;

function addInventory(town: Town, delta: Record<string, number>, sign: 1 | -1): void {
  for (const [mat, n] of Object.entries(delta)) {
    town.inventory[mat] = (town.inventory[mat] ?? 0) + sign * n;
  }
}

/** Can a history entry be replayed in this direction without conflicts or debt? */
function blocked(town: Town, entry: HistoryEntry, forward: boolean): string | null {
  const sign = forward ? 1 : -1;
  for (const [mat, n] of Object.entries(entry.inventoryDelta)) {
    if ((town.inventory[mat] ?? 0) + sign * n < 0) return 'You no longer have the materials to do that';
  }
  for (const op of entry.ops) {
    const adds = op.kind === 'add' ? forward : !forward;
    if (!adds) continue;
    if (op.key in town.pieces) return 'Something is in the way';
    const s = op.piece.slot;
    if (s.kind === 'tile' && `${s.x},${s.y}` in town.soil) return "There's a garden bed in the way";
  }
  return null;
}

function runOps(town: Town, ops: Op[], forward: boolean): void {
  const list = forward ? ops : [...ops].reverse();
  for (const op of list) {
    const add = op.kind === 'add' ? forward : !forward;
    if (add) town.pieces[op.key] = op.piece;
    else delete town.pieces[op.key];
  }
}

function costOf(catalog: Catalog, pieces: PlacedPiece[]): Record<string, number> {
  const total: Record<string, number> = {};
  for (const p of pieces) {
    for (const [mat, n] of Object.entries(catalog[p.pieceId]?.cost ?? {})) total[mat] = (total[mat] ?? 0) + n;
  }
  return total;
}

function record(town: Town, entry: HistoryEntry): void {
  town.history.undo.push(entry);
  if (town.history.undo.length > MAX_UNDO) town.history.undo.shift();
  town.history.redo = [];
}

function remember(town: Town, id: string): void {
  town.appliedIds.push(id);
  if (town.appliedIds.length > MAX_APPLIED_IDS) town.appliedIds.splice(0, town.appliedIds.length - MAX_APPLIED_IDS);
}

/**
 * Apply a command to the town in place. Rejected commands leave the town untouched.
 * `world` is required for world actions (walking, gardening, …) and adds terrain rules to building.
 */
export function apply(town: Town, catalog: Catalog, cmd: Command, world?: World): ApplyResult {
  if (town.appliedIds.includes(cmd.id)) return { ok: true, changed: false, duplicate: true };

  switch (cmd.type) {
    case 'place': {
      const rotation = cmd.rotation ?? 0;
      const verdict = checkPlace(town, catalog, cmd.pieceId, cmd.slot, rotation, world);
      if (!verdict.ok) return { ok: false, reason: verdict.reason, changed: false };
      const def = catalog[cmd.pieceId]!;
      const piece: PlacedPiece = { pieceId: cmd.pieceId, slot: cmd.slot, rotation };
      const ops: Op[] = [{ kind: 'add', key: slotKey(cmd.slot, LAYER_OF[def.kind]), piece }];
      const delta = Object.fromEntries(Object.entries(def.cost).map(([m, n]) => [m, -n]));
      runOps(town, ops, true);
      addInventory(town, delta, 1);
      record(town, { commandId: cmd.id, ops, inventoryDelta: delta });
      remember(town, cmd.id);
      return verdict.warning ? { ok: true, changed: true, warning: verdict.warning } : { ok: true, changed: true };
    }

    case 'remove': {
      const verdict = checkRemove(town, catalog, cmd.slot, cmd.layer, cmd.cascade ?? false);
      if (!verdict.ok) return { ok: false, reason: verdict.reason, changed: false };
      const keys = [slotKey(cmd.slot, cmd.layer), ...(verdict.dependents ?? [])];
      const ops: Op[] = keys.map((key) => ({ kind: 'del', key, piece: town.pieces[key]! }));
      // Sprint 1: demolition refunds every material. The GDD's 75% salvage rule for
      // removals after the build session comes with the session system.
      const delta = costOf(catalog, ops.map((o) => o.piece));
      runOps(town, ops, true);
      addInventory(town, delta, 1);
      record(town, { commandId: cmd.id, ops, inventoryDelta: delta });
      remember(town, cmd.id);
      return { ok: true, changed: true };
    }

    case 'undo': {
      const entry = town.history.undo.at(-1);
      if (!entry) return { ok: false, reason: 'Nothing to undo', changed: false };
      const why = blocked(town, entry, false);
      if (why) return { ok: false, reason: why, changed: false };
      town.history.undo.pop();
      runOps(town, entry.ops, false);
      addInventory(town, entry.inventoryDelta, -1);
      town.history.redo.push(entry);
      remember(town, cmd.id);
      return { ok: true, changed: true };
    }

    case 'redo': {
      const entry = town.history.redo.at(-1);
      if (!entry) return { ok: false, reason: 'Nothing to redo', changed: false };
      const why = blocked(town, entry, true);
      if (why) return { ok: false, reason: why, changed: false };
      town.history.redo.pop();
      runOps(town, entry.ops, true);
      addInventory(town, entry.inventoryDelta, 1);
      town.history.undo.push(entry);
      remember(town, cmd.id);
      return { ok: true, changed: true };
    }

    default: {
      if (!world) return { ok: false, reason: 'This action needs the world', changed: false };
      const r = applyWorld(town, catalog, world, cmd);
      // Ticks are idempotent by nature and frequent, so they aren't remembered.
      if (r.ok && cmd.type !== 'tick') remember(town, cmd.id);
      return r;
    }
  }
}

let counter = 0;
/** Command id that is unique within this browser session. */
export function newCommandId(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
