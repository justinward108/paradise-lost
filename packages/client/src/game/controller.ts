/**
 * Client-side game controller: holds the town, turns player intents into sim commands,
 * saves after every change and tells the renderer and UI what changed.
 *
 * It decides WHERE the player is pointing; the sim decides WHETHER that is allowed.
 */
import {
  apply,
  checkPlace,
  checkRemove,
  isEdgeKind,
  LAYER_OF,
  newCommandId,
  rooms,
  slotKey,
  topLayerAt,
  weedCoverage,
  type ApplyResult,
  type Catalog,
  type Command,
  type Layer,
  type Slot,
  type Town,
} from '@paradise-lost/sim';
import type { Style } from '@paradise-lost/content';
import type { TownStore } from '../store/townStore.ts';
import { edgeAt, FOUND_H, tileAt, toWorld } from '../iso.ts';

export type Tool =
  | { mode: 'select' }
  | { mode: 'build'; pieceId: string; rotation: number }
  | { mode: 'demolish' };

export type Preview =
  | { kind: 'none' }
  | { kind: 'place'; pieceId: string; slot: Slot; rotation: number; ok: boolean; message: string; warning: boolean }
  | { kind: 'remove'; slot: Slot; layer: Layer; ok: boolean; message: string; dependents: string[] }
  | { kind: 'plot'; plotId: string; slot: Slot; message: string };

type Listener = (what: 'town' | 'tool' | 'preview' | 'style' | 'status') => void;

export class Controller {
  tool: Tool = { mode: 'select' };
  preview: Preview = { kind: 'none' };
  /** Touch: the ghost waits here until the player taps Confirm. */
  pendingTouch = false;
  status: { text: string; tone: 'info' | 'ok' | 'warn' | 'error' } = { text: 'Pick a piece below to start building.', tone: 'info' };
  private listeners = new Set<Listener>();

  constructor(
    public town: Town,
    public readonly catalog: Catalog,
    private store: TownStore,
    public style: Style,
  ) {
    this.hadShelter = this.shelterReady();
  }

  on(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(what: Parameters<Listener>[0]) {
    for (const fn of this.listeners) fn(what);
  }

  setStatus(text: string, tone: Controller['status']['tone'] = 'info') {
    this.status = { text, tone };
    this.emit('status');
  }

  dispatch(cmd: Command): ApplyResult {
    const result = apply(this.town, this.catalog, cmd);
    if (result.changed) {
      void this.store.save(this.town);
      this.emit('town');
    }
    return result;
  }

  setTool(tool: Tool) {
    this.tool = tool;
    this.pendingTouch = false;
    this.preview = { kind: 'none' };
    this.emit('tool');
    this.emit('preview');
    if (tool.mode === 'build') this.setStatus(`${this.catalog[tool.pieceId]?.name ?? ''}: click to place, drag to paint, R to rotate.`);
    else if (tool.mode === 'demolish') this.setStatus('Demolish: click a piece to remove it. Materials come back.');
    else this.setStatus('Pick a piece below to start building.');
  }

  rotate() {
    if (this.tool.mode !== 'build') return;
    const def = this.catalog[this.tool.pieceId];
    const n = Math.max(1, def?.rotations ?? 1);
    this.tool = { ...this.tool, rotation: (this.tool.rotation + 1) % n };
    if (this.preview.kind === 'place') this.updatePreview(this.preview.slot);
    this.emit('tool');
  }

  setStyle(style: Style) {
    this.style = style;
    this.emit('style');
  }

  /** The slot the current tool would act on at a world-space screen point. */
  targetAt(sx: number, sy: number): Slot | null {
    if (this.tool.mode === 'build') {
      const def = this.catalog[this.tool.pieceId];
      if (!def) return null;
      const z = def.kind === 'foundation' ? 0 : FOUND_H;
      return isEdgeKind(def.kind) ? edgeAt(sx, sy, z) : tileAt(sx, sy, z);
    }
    if (this.tool.mode === 'demolish') {
      // Prefer a wall when the pointer is close to one.
      const e = edgeAt(sx, sy, FOUND_H);
      const w = toWorld(sx, sy, FOUND_H);
      const d = e.dir === 'n' ? Math.abs(w.y - e.y) : Math.abs(w.x - e.x);
      if (d < 0.22 && slotKey(e, 'wall') in this.town.pieces) return e;
      return tileAt(sx, sy, FOUND_H);
    }
    return tileAt(sx, sy, FOUND_H);
  }

  /** The slot just built on; the ghost stays hidden there until the pointer moves on. */
  private justPlaced: string | null = null;

  updatePreview(slot: Slot | null) {
    const id = slot ? JSON.stringify(slot) : null;
    if (this.justPlaced !== null && id !== this.justPlaced) this.justPlaced = null;
    this.preview = this.justPlaced !== null ? { kind: 'none' } : this.computePreview(slot);
    this.emit('preview');
  }

  private computePreview(slot: Slot | null): Preview {
    if (!slot) return { kind: 'none' };
    const t = this.tool;
    if (t.mode === 'build') {
      const v = checkPlace(this.town, this.catalog, t.pieceId, slot, t.rotation);
      const name = this.catalog[t.pieceId]?.name ?? t.pieceId;
      if (!v.ok) return { kind: 'place', pieceId: t.pieceId, slot, rotation: t.rotation, ok: false, message: v.reason, warning: false };
      return {
        kind: 'place',
        pieceId: t.pieceId,
        slot,
        rotation: t.rotation,
        ok: true,
        warning: Boolean(v.warning),
        message: v.warning ?? `Place ${name}`,
      };
    }
    if (t.mode === 'demolish') {
      let layer: Layer | null;
      if (slot.kind === 'edge') layer = 'wall';
      else layer = topLayerAt(this.town, slot.x, slot.y, slot.level);
      if (!layer) return { kind: 'none' };
      const v = checkRemove(this.town, this.catalog, slot, layer);
      const piece = this.town.pieces[slotKey(slot, layer)];
      const name = this.catalog[piece?.pieceId ?? '']?.name ?? 'piece';
      if (!v.ok) return { kind: 'remove', slot, layer, ok: false, message: v.reason, dependents: v.dependents ?? [] };
      return { kind: 'remove', slot, layer, ok: true, message: `Remove ${name}`, dependents: [] };
    }
    if (slot.kind === 'tile') {
      const plot = Object.values(this.town.plots).find((p) => p.x === slot.x && p.y === slot.y);
      if (plot) {
        const pct = Math.round(weedCoverage(plot, Date.now()) * 100);
        return { kind: 'plot', plotId: plot.id, slot, message: `Garden plot: weeds ${pct}%. Click to weed it.` };
      }
    }
    return { kind: 'none' };
  }

  /** Act on the current preview. `cascade` confirms removing the pieces a wall or floor holds up. */
  commit(cascade = false): ApplyResult | null {
    const p = this.preview;
    let result: ApplyResult | null = null;
    if (p.kind === 'place') {
      result = this.dispatch({ type: 'place', id: newCommandId(), pieceId: p.pieceId, slot: p.slot, rotation: p.rotation });
    } else if (p.kind === 'remove') {
      result = this.dispatch({ type: 'remove', id: newCommandId(), slot: p.slot, layer: p.layer, cascade });
    } else if (p.kind === 'plot') {
      result = this.dispatch({ type: 'tendPlot', id: newCommandId(), plotId: p.plotId, nowMs: Date.now() });
      if (result.ok) this.setStatus('Weeded. The plot is clear.', 'ok');
    }
    if (result) {
      if (!result.ok && result.reason) this.setStatus(result.reason, 'error');
      else if (result.warning) this.setStatus(result.warning, 'warn');
      else if (p.kind === 'place') this.setStatus(`Placed ${this.catalog[p.pieceId]?.name ?? 'piece'}.`, 'ok');
      else if (p.kind === 'remove') this.setStatus('Removed. Materials returned.', 'ok');
      if (result.ok && p.kind === 'place') this.justPlaced = JSON.stringify(p.slot);
      this.pendingTouch = false;
      if (p.kind !== 'none') this.updatePreview(p.slot);
      this.announceShelter();
    }
    return result;
  }

  undo() {
    const r = this.dispatch({ type: 'undo', id: newCommandId() });
    this.setStatus(r.ok ? 'Undone.' : (r.reason ?? ''), r.ok ? 'info' : 'error');
    this.refreshPreview();
  }

  redo() {
    const r = this.dispatch({ type: 'redo', id: newCommandId() });
    this.setStatus(r.ok ? 'Redone.' : (r.reason ?? ''), r.ok ? 'info' : 'error');
    this.refreshPreview();
  }

  private refreshPreview() {
    const p = this.preview;
    if (p.kind === 'place' || p.kind === 'remove') this.updatePreview(p.slot);
  }

  private hadShelter = false;
  private announceShelter() {
    const now = this.shelterReady();
    if (now && !this.hadShelter) this.setStatus('Your shelter is weatherproof. You could sleep here tonight.', 'ok');
    this.hadShelter = now;
  }

  shelterReady(): boolean {
    return rooms(this.town, this.catalog).some((r) => r.shelter);
  }

  /** Pieces of a layer kind, for the renderer. */
  static layerOf(catalog: Catalog, pieceId: string): Layer | undefined {
    const def = catalog[pieceId];
    return def ? LAYER_OF[def.kind] : undefined;
  }
}
