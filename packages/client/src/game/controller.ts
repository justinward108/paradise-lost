/**
 * Client-side game controller: holds the town, turns player intents into sim commands,
 * walks the avatar to where an action needs it, saves, and tells the renderer and UI
 * what changed.
 *
 * It decides WHERE the player is pointing and HOW to get there; the sim decides WHETHER
 * anything is allowed. World actions are checked by running them on a copy of the town
 * first, so the reasons shown under the cursor are exactly the sim's.
 */
import {
  ambientTime,
  apply,
  checkPlace,
  checkRemove,
  cropStatus,
  bedWeeds,
  hasBrush,
  hasRubble,
  hasShelter,
  treeAt,
  isEdgeKind,
  newCommandId,
  npcPosition,
  pathToReach,
  findPath,
  projectComplete,
  siteAt,
  siteRemaining,
  slotKey,
  tile,
  topLayerAt,
  walkable,
  type ApplyResult,
  type Catalog,
  type Command,
  type Layer,
  type Point,
  type Slot,
  type Town,
  type World,
} from '@paradise-lost/sim';
import { crops as cropDefs, describeGain, ITEMS, PROJECT_TEXT, ROSA, type Style } from '@paradise-lost/content';
import type { TownStore } from '../store/townStore.ts';
import type { KioskSession } from './kiosk.ts';
import { edgeAt, FOUND_H, tileAt, toWorld } from '../iso.ts';

export type Mode = 'play' | 'build';

export type Tool =
  | { mode: 'walk' }
  | { mode: 'dig' }
  | { mode: 'plant'; cropId: string }
  | { mode: 'water' }
  | { mode: 'build'; pieceId: string; rotation: number }
  | { mode: 'demolish' };

/** A world action the player can take at a spot, already checked against the sim. */
export interface Action {
  label: string;
  target: Point;
  ok: boolean;
  /** The reason it can't be done, or a description of what will happen. */
  message: string;
  /** Tiles to walk first (empty if already in reach). */
  path: Point[];
  /** The command to send on arrival, or a UI action. */
  command?: Command;
  open?: { kind: 'npc'; npcId: string } | { kind: 'project'; projectId: string } | { kind: 'kiosk' };
  /** Show as information rather than an error when it can't be done (crop progress). */
  tone?: 'info';
  /** A first click that only arms a destructive second click on this tile ("x,y"). */
  arm?: string;
}

export type Preview =
  | { kind: 'none' }
  | { kind: 'place'; pieceId: string; slot: Slot; rotation: number; ok: boolean; message: string; warning: boolean }
  | { kind: 'remove'; slot: Slot; layer: Layer; ok: boolean; message: string; dependents: string[] }
  | { kind: 'action'; action: Action };

export type Panel = null | { kind: 'npc'; npcId: string; lines: string[] } | { kind: 'project'; projectId: string; note?: string } | { kind: 'kiosk' };

export type Change = 'town' | 'tool' | 'preview' | 'style' | 'status' | 'panel' | 'walk' | 'clock' | 'mode' | 'credits';
type Listener = (what: Change, data?: unknown) => void;

const STEP_MS = 230;

export class Controller {
  mode: Mode = 'play';
  tool: Tool = { mode: 'walk' };
  preview: Preview = { kind: 'none' };
  panel: Panel = null;
  /** Touch in build mode: the ghost waits here until the player taps Confirm. */
  pendingTouch = false;
  status: { text: string; tone: 'info' | 'ok' | 'warn' | 'error' } = { text: 'Click the ground to walk. Click things to use them.', tone: 'info' };
  /** Tiles the avatar is walking through; the renderer animates them. */
  route: Point[] = [];
  private onArrive: (() => void) | null = null;
  private listeners = new Set<Listener>();
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private justPlaced: string | null = null;
  /** Rapture Credits at the relief kiosk (set up in main.ts). */
  kiosk: KioskSession | null = null;
  /** A bed whose crop the next Dig click will dig up. */
  private armedFill: string | null = null;
  private hadShelter: boolean;
  facing: Point = { x: 1, y: 0 };

  constructor(
    public town: Town,
    public readonly catalog: Catalog,
    public readonly world: World,
    private store: TownStore,
    public style: Style,
    private clock: () => number = Date.now,
  ) {
    this.hadShelter = hasShelter(town, catalog);
  }

  now(): number {
    return this.clock();
  }

  on(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(what: Change, data?: unknown) {
    for (const fn of this.listeners) fn(what, data);
  }

  setStatus(text: string, tone: Controller['status']['tone'] = 'info') {
    this.status = { text, tone };
    this.emit('status');
  }

  toast(text: string) {
    this.emit('status', { toast: text });
  }

  // ---------- commands ----------

  dispatch(cmd: Command): ApplyResult {
    const result = apply(this.town, this.catalog, cmd, this.world);
    if (result.changed) {
      if (cmd.type === 'move') this.saveSoon();
      else void this.store.save(this.town);
      this.emit('town');
    }
    if (result.events?.length) this.describeEvents(result.events);
    return result;
  }

  private saveSoon() {
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      void this.store.save(this.town);
    }, 800);
  }

  tick(): void {
    const r = this.dispatch({ type: 'tick', id: newCommandId(), nowMs: this.now() });
    if (r.changed) void this.store.save(this.town);
    this.emit('clock');
  }

  private describeEvents(events: string[]) {
    const gains = events.map(describeGain).filter((g): g is string => g !== null);
    if (gains.length) this.toast(gains.join('  '));
    for (const e of events) {
      const [kind, a, b, c] = e.split(':');
      if (kind === 'project' && a === 'stage' && b && c !== undefined) {
        const text = PROJECT_TEXT[b]?.stageDone[Number(c)];
        if (text) this.setStatus(text, 'ok');
      }
      if (kind === 'project' && a === 'done' && b) this.setStatus(PROJECT_TEXT[b]?.done ?? 'Project complete!', 'ok');
      if (kind === 'salvage' && a === 'empty') this.setStatus('Nothing useful left there.', 'info');
      if (kind === 'garden' && a === 'harvested') this.setStatus(`Harvested ${cropDefs[b ?? '']?.name.toLowerCase() ?? 'the crop'}.`, 'ok');
      if (kind === 'garden' && a === 'planted') this.setStatus(`Planted ${cropDefs[b ?? '']?.name.toLowerCase() ?? 'seeds'}. Rain will water it most days.`, 'ok');
      if (kind === 'garden' && a === 'tilled') this.setStatus('Dug a garden bed.', 'ok');
      if (kind === 'garden' && a === 'watered') this.setStatus('Watered.', 'ok');
      if (kind === 'garden' && a === 'weeded') this.setStatus('Weeds pulled.', 'ok');
      if (kind === 'brush') this.setStatus('Cleared the scrub. Albizia wood makes rough boards. It grows back in time.', 'ok');
      if (kind === 'rubble') this.setStatus('Cleared the rubble. Some of it was still usable.', 'ok');
      if (kind === 'chop') this.setStatus(a === 'albizia tree' ? 'Chopped the albizia. It is invasive and fast: the stump will sprout and grow back in about a day.' : `Chopped the ${a ?? 'tree'} for boards.`, 'ok');
      if (kind === 'garden' && a === 'filled') this.setStatus(b ? `Dug up the ${cropDefs[b]?.name.toLowerCase() ?? 'crop'} and filled in the bed.` : 'Filled in the bed. You can build here now.', 'ok');
      if (kind === 'npc' && a === 'worked_together') this.toast(`${this.world.npcs.find((n) => n.id === b)?.name ?? 'Your neighbour'} liked working together  ♥`);
    }
  }

  // ---------- modes and tools ----------

  setMode(mode: Mode) {
    if (mode === this.mode) return;
    this.mode = mode;
    this.panel = null;
    this.emit('mode');
    this.emit('panel');
    this.setTool(mode === 'play' ? { mode: 'walk' } : { mode: 'demolish' });
    if (mode === 'build') this.setStatus('Build mode: pick a piece below. Building works anywhere on your lot.');
  }

  setTool(tool: Tool) {
    this.tool = tool;
    this.armedFill = null;
    this.pendingTouch = false;
    this.preview = { kind: 'none' };
    this.emit('tool');
    this.emit('preview');
    const name = tool.mode === 'build' ? this.catalog[tool.pieceId]?.name : undefined;
    if (tool.mode === 'build') this.setStatus(`${name ?? ''}: click to place, drag to paint, R to rotate.`);
    else if (tool.mode === 'demolish') this.setStatus('Demolish: click a piece to remove it. Materials come back.');
    else if (tool.mode === 'dig') this.setStatus('Dig: click cleared ground on your lot to make a garden bed.');
    else if (tool.mode === 'plant') this.setStatus(`Plant ${cropDefs[tool.cropId]?.name.toLowerCase() ?? ''}: click an empty bed.`);
    else if (tool.mode === 'water') this.setStatus("Water: click a crop. On rainy days there's no need.");
  }

  rotate() {
    if (this.tool.mode !== 'build') return;
    const n = Math.max(1, this.catalog[this.tool.pieceId]?.rotations ?? 1);
    this.tool = { ...this.tool, rotation: (this.tool.rotation + 1) % n };
    if (this.preview.kind === 'place') this.updatePreview(this.preview.slot);
    this.emit('tool');
  }

  setStyle(style: Style) {
    this.style = style;
    this.emit('style');
  }

  openPanel(panel: Panel) {
    this.panel = panel;
    this.emit('panel');
  }

  /** The Rapture Credits view changed (balance, account, kiosk catalogue). */
  creditsChanged() {
    this.emit('credits');
    if (this.panel?.kind === 'kiosk') this.emit('panel');
  }

  /** Save immediately and synchronously (before leaving the page to sign in). */
  flushSave() {
    void this.store.save(this.town);
    this.store.flushSync();
  }

  /** Is the player close enough to the kiosk to trade? */
  atKiosk(): boolean {
    const k = this.world.kiosk;
    return k !== undefined && Math.max(Math.abs(this.town.player.x - k.x), Math.abs(this.town.player.y - k.y)) <= 1;
  }

  // ---------- pointing ----------

  /** The slot or tile the current tool acts on at a world-space screen point. */
  targetAt(sx: number, sy: number): Slot | null {
    if (this.tool.mode === 'build') {
      const def = this.catalog[this.tool.pieceId];
      if (!def) return null;
      const z = def.kind === 'foundation' ? 0 : FOUND_H;
      return isEdgeKind(def.kind) ? edgeAt(sx, sy, z) : tileAt(sx, sy, z);
    }
    if (this.tool.mode === 'demolish') {
      const e = edgeAt(sx, sy, FOUND_H);
      const w = toWorld(sx, sy, FOUND_H);
      const d = e.dir === 'n' ? Math.abs(w.y - e.y) : Math.abs(w.x - e.x);
      if (d < 0.22 && slotKey(e, 'wall') in this.town.pieces) return e;
      return tileAt(sx, sy, FOUND_H);
    }
    // Play: people and tall things are clicked above the ground they stand on.
    const ground = tileAt(sx, sy, 0);
    for (const z of [36, 18]) {
      const up = tileAt(sx, sy, z);
      if (this.npcAt(up.x, up.y) || this.siteAtLive(up.x, up.y)) return up;
      if (this.world.kiosk && up.x === this.world.kiosk.x && up.y === this.world.kiosk.y) return up;
    }
    // Trees are clicked on their trunk or canopy, unless the ground under the pointer
    // has something of its own to do.
    if (this.tool.mode === 'walk' && !this.groundHasUse(ground.x, ground.y)) {
      for (const z of [12, 24, 36, 48]) {
        const up = tileAt(sx, sy, z);
        if (treeAt(this.town, this.world, up.x, up.y)) return up;
      }
    }
    return ground;
  }

  private groundHasUse(x: number, y: number): boolean {
    const k = `${x},${y}`;
    return (
      treeAt(this.town, this.world, x, y) !== undefined ||
      hasBrush(this.town, this.world, x, y) ||
      hasRubble(this.town, this.world, x, y) ||
      k in this.town.soil ||
      this.world.projects.some((p) => p.tiles.some((t) => t.x === x && t.y === y))
    );
  }

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
      const v = checkPlace(this.town, this.catalog, t.pieceId, slot, t.rotation, this.world);
      const name = this.catalog[t.pieceId]?.name ?? t.pieceId;
      if (!v.ok) return { kind: 'place', pieceId: t.pieceId, slot, rotation: t.rotation, ok: false, message: v.reason, warning: false };
      return { kind: 'place', pieceId: t.pieceId, slot, rotation: t.rotation, ok: true, warning: Boolean(v.warning), message: v.warning ?? `Place ${name}` };
    }
    if (t.mode === 'demolish') {
      const layer: Layer | null = slot.kind === 'edge' ? 'wall' : topLayerAt(this.town, slot.x, slot.y, slot.level);
      if (!layer) return { kind: 'none' };
      const v = checkRemove(this.town, this.catalog, slot, layer);
      const name = this.catalog[this.town.pieces[slotKey(slot, layer)]?.pieceId ?? '']?.name ?? 'piece';
      if (!v.ok) return { kind: 'remove', slot, layer, ok: false, message: v.reason, dependents: v.dependents ?? [] };
      return { kind: 'remove', slot, layer, ok: true, message: `Remove ${name}`, dependents: [] };
    }
    if (slot.kind !== 'tile') return { kind: 'none' };
    const action = this.actionAt(slot.x, slot.y);
    return action ? { kind: 'action', action } : { kind: 'none' };
  }

  private npcAt(x: number, y: number) {
    const now = this.now();
    return this.world.npcs.find((n) => {
      const p = npcPosition(this.town, this.world, n, now);
      return !p.inside && p.x === x && p.y === y;
    });
  }

  private siteAtLive(x: number, y: number) {
    const s = siteAt(this.world, x, y);
    return s && siteRemaining(this.town, s) > 0 ? s : undefined;
  }

  /** Run a command on a copy of the town with the player standing where they'd end up. */
  private preflight(label: string, target: Point, command: Command, describe?: string): Action {
    const path = pathToReach(this.town, this.world, this.catalog, target);
    if (path === null) return { label, target, ok: false, message: "You can't reach that from here", path: [] };
    const copy = structuredClone(this.town);
    const end = path.at(-1);
    if (end) copy.player = { ...end };
    const r = apply(copy, this.catalog, command, this.world);
    return { label, target, ok: r.ok, message: r.ok ? (describe ?? label) : (r.reason ?? "Can't do that"), path, command };
  }

  /** What clicking this tile would do with the current tool. */
  actionAt(x: number, y: number): Action | null {
    const now = this.now();
    const target = { x, y };
    const key = `${x},${y}`;
    const t = this.tool;
    const id = newCommandId();

    if (t.mode === 'dig') {
      if (key in this.town.soil) {
        const crop = this.town.crops[key];
        const name = crop ? (this.world.crops[crop.cropId]?.name.toLowerCase() ?? 'crop') : null;
        const fill = this.preflight('Fill in the bed', target, { type: 'fill', id, x, y });
        if (!fill.ok || !name) return fill;
        // Digging up a crop throws it away: ask with a second click.
        if (this.armedFill === key) return { ...fill, message: `Click again to dig up the ${name} (it will be lost)` };
        return { ...fill, label: 'Dig up', message: `The ${name} would be lost. Click to confirm, then click again.`, command: undefined, arm: key };
      }
      return this.preflight('Dig a bed', target, { type: 'till', id, x, y, nowMs: now });
    }
    if (t.mode === 'plant') {
      const name = cropDefs[t.cropId]?.name ?? t.cropId;
      return this.preflight(`Plant ${name.toLowerCase()}`, target, { type: 'plant', id, x, y, cropId: t.cropId, nowMs: now });
    }
    if (t.mode === 'water') {
      if (key in this.town.soil && !this.town.crops[key]) return { label: 'Water', target, ok: false, message: 'This bed is empty. Beds with a crop have a coloured tag on a stake.', path: [] };
      return this.preflight('Water', target, { type: 'water', id, x, y, nowMs: now });
    }

    const npc = this.npcAt(x, y);
    if (npc) {
      const path = pathToReach(this.town, this.world, this.catalog, target);
      return path
        ? { label: `Talk to ${npc.name}`, target, ok: true, message: `Talk to ${npc.name}`, path, command: { type: 'talk', id, npcId: npc.id, nowMs: now }, open: { kind: 'npc', npcId: npc.id } }
        : { label: `Talk to ${npc.name}`, target, ok: false, message: "You can't reach her from here", path: [] };
    }

    const kiosk = this.world.kiosk;
    if (kiosk && kiosk.x === x && kiosk.y === y) {
      const path = pathToReach(this.town, this.world, this.catalog, target);
      return path
        ? { label: kiosk.name, target, ok: true, message: `${kiosk.name}: trade for Rapture Credits`, path, open: { kind: 'kiosk' } }
        : { label: kiosk.name, target, ok: false, message: "You can't reach that from here", path: [] };
    }

    const project = this.world.projects.find((p) => p.tiles.some((tt) => tt.x === x && tt.y === y));
    if (project && !projectComplete(this.town, project.id)) {
      const path = pathToReach(this.town, this.world, this.catalog, target);
      return path
        ? { label: project.name, target, ok: true, message: `${project.name}: see what it needs`, path, open: { kind: 'project', projectId: project.id } }
        : { label: project.name, target, ok: false, message: "You can't reach that from here", path: [] };
    }

    const site = this.siteAtLive(x, y);
    if (site) {
      const left = siteRemaining(this.town, site);
      const yields = Object.entries(site.yields).map(([m, n]) => `${n} ${ITEMS[m]?.name.toLowerCase() ?? m}`).join(', ');
      const renew = site.refillMs ? ', more turns up over time' : '';
      return this.preflight(`Salvage the ${site.name.toLowerCase()}`, target, { type: 'salvage', id, siteId: site.id, nowMs: now }, `Salvage the ${site.name.toLowerCase()}: +${yields} (${left} left${renew})`);
    }
    if (hasBrush(this.town, this.world, x, y)) return this.preflight('Clear brush', target, { type: 'clearBrush', id, x, y }, 'Clear the brush: +1 board (it grows back)');
    if (hasRubble(this.town, this.world, x, y)) return this.preflight('Clear rubble', target, { type: 'clearRubble', id, x, y }, 'Clear the rubble: +1 stone, +1 board');
    const tree = treeAt(this.town, this.world, x, y);
    if (tree) {
      const yields = Object.entries(tree.yields).map(([m, n]) => `${n} ${ITEMS[m]?.name.toLowerCase() ?? m}`).join(', ');
      const back = tree.regrowMs ? ' (it grows back in a day)' : '';
      return this.preflight(`Chop the ${tree.name}`, target, { type: 'chop', id, x, y, nowMs: now }, `Chop the ${tree.name}: +${yields}${back}`);
    }

    const crop = this.town.crops[key];
    if (crop) {
      const def = this.world.crops[crop.cropId];
      if (def) {
        const st = cropStatus(this.town, def, crop, now);
        const days = st.need - st.growth;
        const info = `${def.name}: ${st.growth} of ${st.need} days grown`;
        if (st.ready) return this.preflight(`Harvest ${def.name.toLowerCase()}`, target, { type: 'harvest', id, x, y, nowMs: now }, `Harvest the ${def.name.toLowerCase()}`);
        if (bedWeeds(this.town, key, now) >= 0.05) return this.preflight('Pull weeds', target, { type: 'weed', id, x, y, nowMs: now }, `${info}. Pull the weeds (they cut the harvest)`);
        if (!st.wateredToday) return this.preflight(`Water ${def.name.toLowerCase()}`, target, { type: 'water', id, x, y, nowMs: now }, `${info}. Water it: it only grows on days it gets water`);
        return {
          label: def.name,
          target,
          ok: false,
          tone: 'info',
          message: `${info}. Watered today${days === 1 ? '; ready tomorrow' : `; ${days} more days`} (a day is 48 minutes).`,
          path: [],
        };
      }
    }
    if (key in this.town.soil) {
      if (bedWeeds(this.town, key, now) >= 0.05) return this.preflight('Pull weeds', target, { type: 'weed', id, x, y, nowMs: now });
      return { label: 'Garden bed', target, ok: false, tone: 'info', message: 'Empty bed. Pick seeds in the bar below to plant. (Dig bed on it fills it in.)', path: [] };
    }

    if (x === this.town.player.x && y === this.town.player.y) return null;
    if (!walkable(this.town, this.world, this.catalog, x, y)) return { label: 'Walk', target, ok: false, message: "You can't walk there", path: [] };
    const path = findPath(this.town, this.world, this.catalog, this.town.player, (p) => p.x === x && p.y === y);
    if (!path) return { label: 'Walk', target, ok: false, message: "You can't get there from here", path: [] };
    return { label: 'Walk here', target, ok: true, message: 'Walk here', path };
  }

  // ---------- acting ----------

  /** Act on the current preview. `cascade` confirms removing what a wall or floor holds up. */
  commit(cascade = false): ApplyResult | null {
    const p = this.preview;
    if (p.kind === 'action') {
      this.perform(p.action);
      return null;
    }
    let result: ApplyResult | null = null;
    if (p.kind === 'place') result = this.dispatch({ type: 'place', id: newCommandId(), pieceId: p.pieceId, slot: p.slot, rotation: p.rotation });
    else if (p.kind === 'remove') result = this.dispatch({ type: 'remove', id: newCommandId(), slot: p.slot, layer: p.layer, cascade });
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

  /** Walk if needed, then do the action. */
  perform(action: Action) {
    if (!action.ok) {
      this.setStatus(action.message, action.tone ?? 'error');
      return;
    }
    if (action.arm) {
      this.armedFill = action.arm;
      this.setStatus(`Click the bed again to dig up its crop.`, 'warn');
      this.updatePreview(tile(action.target.x, action.target.y));
      return;
    }
    this.armedFill = null;
    const finish = () => {
      if (action.command) {
        // Re-stamp time and id: the walk took a moment.
        const cmd = { ...action.command, id: newCommandId() } as Command;
        if ('nowMs' in cmd) (cmd as { nowMs: number }).nowMs = this.now();
        const r = this.dispatch(cmd);
        if (!r.ok && r.reason) {
          this.setStatus(r.reason, 'error');
          return;
        }
        if (cmd.type === 'talk') this.openNpcPanel(cmd.npcId, r.events ?? []);
        this.announceShelter();
      }
      if (action.open?.kind === 'project') this.openPanel({ kind: 'project', projectId: action.open.projectId });
      if (action.open?.kind === 'kiosk') this.openPanel({ kind: 'kiosk' });
      this.updatePreview(tile(action.target.x, action.target.y));
    };
    this.walk(action.path, finish);
  }

  walk(path: Point[], then?: () => void) {
    this.route = [...path];
    this.onArrive = then ?? null;
    if (this.route.length === 0) {
      this.onArrive = null;
      then?.();
      return;
    }
    this.emit('walk');
  }

  /** The renderer calls this as the avatar reaches each tile. */
  arrived(p: Point) {
    this.facing = { x: Math.sign(p.x - this.town.player.x), y: Math.sign(p.y - this.town.player.y) };
    const r = this.dispatch({ type: 'move', id: newCommandId(), to: p });
    if (!r.ok) {
      // Something changed under our feet (a wall went up): stop.
      this.route = [];
      this.onArrive = null;
      this.setStatus(r.reason ?? "Can't go that way", 'error');
      return;
    }
    this.route.shift();
    if (this.route.length === 0) {
      const then = this.onArrive;
      this.onArrive = null;
      then?.();
    }
  }

  stepMs(): number {
    return STEP_MS;
  }

  /** Keyboard: one step in a direction, or face it if blocked. */
  stepDir(dx: number, dy: number) {
    if (this.route.length > 0) return;
    const to = { x: this.town.player.x + dx, y: this.town.player.y + dy };
    this.facing = { x: dx, y: dy };
    const path = findPath(this.town, this.world, this.catalog, this.town.player, (p) => p.x === to.x && p.y === to.y, 8);
    if (path && path.length === 1) this.walk(path);
    else this.emit('walk');
  }

  /** Keyboard: use whatever is in front of the player. */
  interactFacing() {
    const t = { x: this.town.player.x + this.facing.x, y: this.town.player.y + this.facing.y };
    const a = this.actionAt(t.x, t.y);
    if (a && a.label !== 'Walk here') this.perform(a);
  }

  // ---------- NPCs and projects ----------

  openNpcPanel(npcId: string, events: string[]) {
    const def = this.world.npcs.find((n) => n.id === npcId);
    if (!def) return;
    const lines: string[] = [];
    for (const e of events) {
      if (e.startsWith('npc:first_meet')) lines.push(...ROSA.firstMeet);
      else if (e.startsWith('npc:chat_again')) lines.push(ROSA.chatAgain[0]!);
      else if (e.startsWith('npc:chat')) lines.push(ROSA.greet(this.lineContext(npcId)));
      else if (e.startsWith('npc:lesson')) lines.push(...ROSA.lesson, 'Tier 2 building pieces are unlocked.');
      else if (e.startsWith('npc:gift_liked')) lines.push(ROSA.giftLiked(e.split(':')[3] ?? ''));
      else if (e.startsWith('npc:gift')) lines.push(ROSA.gift(e.split(':')[3] ?? ''));
    }
    this.openPanel({ kind: 'npc', npcId, lines });
  }

  private lineContext(npcId: string) {
    const now = this.now();
    const a = ambientTime(this.town, now);
    const project = this.world.projects.find((p) => p.helper === npcId);
    const st = project ? this.town.projects[project.id] : undefined;
    return {
      day: a.day,
      hour: a.hour,
      rain: a.rain,
      friendship: this.town.npcs[npcId]?.friendship ?? 0,
      projectState: !st || st.startedMs == null ? ('not_started' as const) : st.completedMs != null ? ('done' as const) : ('active' as const),
      projectStage: project && st ? project.stages[st.stage]?.name : undefined,
    };
  }

  give(npcId: string, item: string) {
    const r = this.dispatch({ type: 'gift', id: newCommandId(), npcId, item, nowMs: this.now() });
    if (!r.ok) {
      if (this.panel?.kind === 'npc') this.openPanel({ ...this.panel, lines: [r.reason ?? "Can't give that"] });
      return;
    }
    this.openNpcPanel(npcId, r.events ?? []);
  }

  contribute(projectId: string, item: string) {
    const r = this.dispatch({ type: 'contribute', id: newCommandId(), projectId, item, amount: 999, nowMs: this.now() });
    this.openPanel({ kind: 'project', projectId, note: r.ok ? undefined : r.reason });
  }

  work(projectId: string) {
    const r = this.dispatch({ type: 'work', id: newCommandId(), projectId, nowMs: this.now() });
    this.openPanel({ kind: 'project', projectId, note: r.ok ? 'You put in an hour of work.' : r.reason });
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

  private announceShelter() {
    const now = hasShelter(this.town, this.catalog);
    if (now && !this.hadShelter) this.setStatus('Your shelter is weatherproof. You could sleep here tonight.', 'ok');
    this.hadShelter = now;
  }

  shelterReady(): boolean {
    return hasShelter(this.town, this.catalog);
  }

  /** Items in the inventory grouped for display. */
  inventoryList(): { id: string; name: string; kind: string; n: number }[] {
    return Object.entries(this.town.inventory)
      .filter(([, n]) => n > 0)
      .map(([id, n]) => ({ id, name: ITEMS[id]?.name ?? id, kind: ITEMS[id]?.kind ?? 'material', n }))
      .sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));
  }
}
