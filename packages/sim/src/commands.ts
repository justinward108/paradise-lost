/**
 * Commands: the only way the town changes.
 *
 * Every player action is a serialisable command. Solo play applies commands to the local
 * town; multiplayer (later) sends the same commands to the server, which applies them to
 * its own copy with exactly this code. Undo, redo and save files reuse the same records.
 */
import { LAYER_OF, slotKey } from './grid.ts';
import { checkPlace, checkRemove } from './rules.ts';
import type { Catalog, HistoryEntry, Layer, Op, PlacedPiece, Slot, Town } from './types.ts';

export type Command =
  | { type: 'place'; id: string; pieceId: string; slot: Slot; rotation?: number }
  | { type: 'remove'; id: string; slot: Slot; layer: Layer; cascade?: boolean }
  | { type: 'undo'; id: string }
  | { type: 'redo'; id: string }
  | { type: 'tendPlot'; id: string; plotId: string; nowMs: number };

export interface ApplyResult {
  ok: boolean;
  reason?: string;
  warning?: string;
  /** True when the town changed (false for rejected or duplicate commands). */
  changed: boolean;
  duplicate?: boolean;
}

export const MAX_UNDO = 100;
const MAX_APPLIED_IDS = 500;

function addInventory(town: Town, delta: Record<string, number>, sign: 1 | -1): void {
  for (const [mat, n] of Object.entries(delta)) {
    town.inventory[mat] = (town.inventory[mat] ?? 0) + sign * n;
  }
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

/** Apply a command to the town in place. Rejected commands leave the town untouched. */
export function apply(town: Town, catalog: Catalog, cmd: Command): ApplyResult {
  if (town.appliedIds.includes(cmd.id)) return { ok: true, changed: false, duplicate: true };

  switch (cmd.type) {
    case 'place': {
      const rotation = cmd.rotation ?? 0;
      const verdict = checkPlace(town, catalog, cmd.pieceId, cmd.slot, rotation);
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
      const entry = town.history.undo.pop();
      if (!entry) return { ok: false, reason: 'Nothing to undo', changed: false };
      runOps(town, entry.ops, false);
      addInventory(town, entry.inventoryDelta, -1);
      town.history.redo.push(entry);
      remember(town, cmd.id);
      return { ok: true, changed: true };
    }

    case 'redo': {
      const entry = town.history.redo.pop();
      if (!entry) return { ok: false, reason: 'Nothing to redo', changed: false };
      runOps(town, entry.ops, true);
      addInventory(town, entry.inventoryDelta, 1);
      town.history.undo.push(entry);
      remember(town, cmd.id);
      return { ok: true, changed: true };
    }

    case 'tendPlot': {
      const plot = town.plots[cmd.plotId];
      if (!plot) return { ok: false, reason: 'No such plot', changed: false };
      plot.lastTendedMs = cmd.nowMs;
      remember(town, cmd.id);
      return { ok: true, changed: true };
    }
  }
}

let counter = 0;
/** Command id that is unique within this browser session. */
export function newCommandId(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
