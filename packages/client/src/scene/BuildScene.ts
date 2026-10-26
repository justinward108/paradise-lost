/**
 * The isometric world view. Draws the town from sim state and turns pointer input into
 * controller intents. Holds no game rules.
 */
import Phaser from 'phaser';
import { art, objectArt, STYLES, TERRAIN_ART_FOR, terrainArt, type ArtEntry, type Style } from '@paradise-lost/content';
import {
  bedWeeds,
  cropStatus,
  hashString,
  hasBrush,
  hasRubble,
  LAYER_OF,
  stumpAt,
  treeAt,
  npcPosition,
  siteRemaining,
  slotKey,
  type PlacedPiece,
  type Point,
  type Slot,
} from '@paradise-lost/sim';
import { drawFrame } from '../art/generate.ts';
import { FOUND_H, slotAnchor, slotDepth, toScreen, TW, TH, WALL_H } from '../iso.ts';
import type { Controller } from '../game/controller.ts';

const BAND = { terrain: -1, ground: 0, standing: 10_000, roof: 20_000, ghost: 30_000 } as const;

interface TexInfo {
  originX: number;
  originY: number;
  displayScale: number;
}

interface Overlay {
  key: string;
  tex: string;
  x: number;
  y: number;
  depth: number;
  alpha?: number;
}

export class BuildScene extends Phaser.Scene {
  private ctrl!: Controller;
  private tex = new Map<string, TexInfo>();
  private sprites = new Map<string, Phaser.GameObjects.Image>();
  private overlays = new Map<string, Phaser.GameObjects.Image>();
  private statics: Phaser.GameObjects.Image[] = [];
  private ghost!: Phaser.GameObjects.Image;
  private hover!: Phaser.GameObjects.Graphics;
  private avatar!: Phaser.GameObjects.Image;
  private npcs = new Map<string, Phaser.GameObjects.Image>();
  private highlighted: Phaser.GameObjects.Image | null = null;
  private dragPan: { x: number; y: number; scrollX: number; scrollY: number; active: boolean } | null = null;
  private touchDown: { x: number; y: number; moved: boolean } | null = null;
  private painting = false;
  private lastPainted = '';
  private walkFrom: Point | null = null;
  private walkT = 0;
  showRoofs = true;
  private hoverDepth = -1;
  private hoverAt: Point | null = null;

  constructor() {
    super('build');
  }

  init(data: { ctrl: Controller }) {
    this.ctrl = data.ctrl;
  }

  create() {
    this.generateTextures();
    this.applyBackground();
    this.drawStatics();
    this.hover = this.add.graphics().setDepth(BAND.ground + 0.9);
    this.ghost = this.add.image(0, 0, '__DEFAULT').setVisible(false).setDepth(BAND.ghost);
    this.avatar = this.add.image(0, 0, '__DEFAULT');
    this.setTex(this.avatar, this.key('obj.player', 'r0'));
    for (const n of this.ctrl.world.npcs) {
      const img = this.add.image(0, 0, '__DEFAULT');
      img.setData('art', `obj.${n.id}`);
      this.setTex(img, this.key(`obj.${n.id}`, 'r0'));
      this.npcs.set(n.id, img);
    }
    this.syncAll();
    this.placeAvatar(this.ctrl.town.player);

    const cam = this.cameras.main;
    const lotPx = ((this.ctrl.town.lot.w + this.ctrl.town.lot.h) * TW) / 2;
    cam.setZoom(Phaser.Math.Clamp((this.scale.width * 1.1) / lotPx, 0.5, 1.4));
    cam.startFollow(this.avatar, true, 0.15, 0.15);

    this.ctrl.on((what) => {
      if (what === 'town' || what === 'clock') this.syncAll();
      if (what === 'style') this.applyStyle();
      if (what === 'walk') cam.startFollow(this.avatar, true, 0.15, 0.15);
      if (what === 'preview' || what === 'tool' || what === 'town' || what === 'mode') this.drawPreview();
    });

    this.input.mouse?.disableContextMenu();
    this.input.on('pointermove', this.onMove, this);
    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointerup', this.onUp, this);
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => this.zoomBy(dy > 0 ? 0.9 : 1.1));
  }

  // ---------- textures ----------

  private key(id: string, frame: string, style: Style = this.ctrl.style): string {
    return `${style}:${id}:${frame}`;
  }

  private addTexture(key: string, entry: ArtEntry, style: Style, frame: string) {
    const d = drawFrame(entry, style, frame, key);
    const t = this.textures.addCanvas(key, d.canvas);
    t?.setFilter(style === 'pixel' ? Phaser.Textures.FilterMode.NEAREST : Phaser.Textures.FilterMode.LINEAR);
    this.tex.set(key, { originX: d.originX, originY: d.originY, displayScale: d.displayScale });
  }

  private generateTextures() {
    for (const style of STYLES) {
      for (const [id, e] of Object.entries(art)) for (const f of e[style].frames) this.addTexture(this.key(id, f, style), e[style], style, f);
      for (const [id, e] of Object.entries(terrainArt)) this.addTexture(this.key(`terrain.${id}`, 'r0', style), e[style], style, 'r0');
      for (const [id, e] of Object.entries(objectArt)) for (const f of e[style].frames) this.addTexture(this.key(`obj.${id}`, f, style), e[style], style, f);
    }
  }

  private setTex(img: Phaser.GameObjects.Image, key: string) {
    const info = this.tex.get(key);
    img.setTexture(key);
    img.setData('tex', key.slice(key.indexOf(':') + 1));
    if (info) img.setOrigin(info.originX, info.originY).setScale(info.displayScale);
  }

  /** Re-point an image at the same art in the current style. */
  private restyle(img: Phaser.GameObjects.Image) {
    const rest = img.getData('tex') as string | undefined;
    if (rest) this.setTex(img, `${this.ctrl.style}:${rest}`);
  }

  private frameFor(p: PlacedPiece): string {
    return p.slot.kind === 'edge' ? p.slot.dir : `r${p.rotation}`;
  }

  // ---------- drawing ----------

  private applyBackground() {
    this.cameras.main.setBackgroundColor(this.ctrl.style === 'pixel' ? '#2f5a22' : '#93b273');
  }

  /** Terrain: drawn once (restyled on style change). Trees are overlays, since they can be chopped. */
  private drawStatics() {
    const { map } = this.ctrl.world;
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const c = map.rows[y]?.[x] ?? '.';
        const p = toScreen(x + 0.5, y + 0.5);
        const img = this.add.image(p.x, p.y, '__DEFAULT');
        this.setTex(img, this.key(`terrain.${TERRAIN_ART_FOR[c] ?? 'grass'}`, 'r0'));
        img.setDepth(BAND.terrain);
        this.statics.push(img);
      }
    }
  }

  private placeSprite(img: Phaser.GameObjects.Image, p: PlacedPiece) {
    const layer = LAYER_OF[this.ctrl.catalog[p.pieceId]!.kind];
    const a = slotAnchor(p.slot);
    const z = layer === 'foundation' ? 0 : layer === 'roof' ? FOUND_H + WALL_H : FOUND_H;
    img.setPosition(a.x, a.y - z);
    const d = slotDepth(p.slot);
    if (layer === 'foundation') img.setDepth(BAND.ground + d);
    else if (layer === 'floor') img.setDepth(BAND.ground + d + 0.5);
    else if (layer === 'roof') img.setDepth(BAND.roof + d);
    else img.setDepth(BAND.standing + d * 10 + (layer === 'object' ? 1 : 0));
  }

  private syncAll() {
    this.syncPieces();
    this.syncOverlays();
    this.syncNpcs();
    this.applyVisibility();
  }

  syncPieces() {
    const pieces = this.ctrl.town.pieces;
    for (const [k, img] of this.sprites) {
      if (!(k in pieces)) {
        img.destroy();
        this.sprites.delete(k);
      }
    }
    for (const [k, p] of Object.entries(pieces)) {
      let img = this.sprites.get(k);
      if (!img) {
        img = this.add.image(0, 0, '__DEFAULT');
        this.sprites.set(k, img);
      }
      img.setData('piece', p);
      this.setTex(img, this.key(p.pieceId, this.frameFor(p)));
      this.placeSprite(img, p);
    }
  }

  /** Brush, sites, path damage, garden beds, crops and weeds. */
  private overlayList(): Overlay[] {
    const { town, world } = this.ctrl;
    const now = this.ctrl.now();
    const out: Overlay[] = [];
    const at = (x: number, y: number) => toScreen(x + 0.5, y + 0.5);
    const stand = (x: number, y: number, bias: number) => BAND.standing + (x + y + 1) * 10 + bias;

    const { map } = world;
    for (let y = 0; y < map.height; y++) {
      const row = map.rows[y] ?? '';
      for (let x = 0; x < map.width; x++) {
        const c = row[x];
        if (c !== 'T' && c !== 'D') continue;
        const p = at(x, y);
        const v = hashString(`${x},${y}`) % 2 ? 'r1' : 'r0';
        const stump = stumpAt(town, world, x, y);
        if (stump) out.push({ key: `stump:${x},${y}`, tex: `obj.stump:${stump === 'T' ? 'r0' : 'r1'}`, x: p.x, y: p.y, depth: stand(x, y, 1) });
        else if (c === 'T' || treeAt(town, world, x, y)) out.push({ key: `tree:${x},${y}`, tex: `obj.${c === 'T' ? 'tree' : 'deadtree'}:${v}`, x: p.x, y: p.y, depth: stand(x, y, 3) });
      }
    }
    for (const id of new Set([...map.brush, ...town.sprouts])) {
      const [x, y] = id.split(',').map(Number) as [number, number];
      if (!hasBrush(town, world, x, y)) continue;
      const p = at(x, y);
      out.push({ key: `brush:${id}`, tex: 'obj.bush:r0', x: p.x, y: p.y, depth: stand(x, y, 2) });
    }
    for (const id of map.rubble ?? []) {
      const [x, y] = id.split(',').map(Number) as [number, number];
      if (!hasRubble(town, world, x, y)) continue;
      const p = at(x, y);
      out.push({ key: `rubble:${id}`, tex: 'obj.smallrubble:r0', x: p.x, y: p.y, depth: stand(x, y, 2) });
    }
    for (const s of world.sites) {
      const left = siteRemaining(town, s);
      if (left <= 0) continue;
      const p = at(s.x, s.y);
      out.push({ key: `site:${s.id}`, tex: `obj.${s.art}:${left > s.uses / 2 ? 'r0' : 'r1'}`, x: p.x, y: p.y, depth: stand(s.x, s.y, 2) });
    }
    for (const pr of world.projects) {
      const st = town.projects[pr.id];
      if (!st || st.completedMs != null) continue;
      const mid = Math.floor(pr.tiles.length / 2);
      pr.tiles.forEach((t, i) => {
        const frame = st.stage === 0 ? (i === mid ? 'r0' : 'r1') : st.stage === 1 ? 'r1' : 'r2';
        const p = at(t.x, t.y);
        out.push({ key: `debris:${pr.id}:${i}`, tex: `obj.debris:${frame}`, x: p.x, y: p.y, depth: stand(t.x, t.y, 1) });
      });
    }
    for (const [key, soil] of Object.entries(town.soil)) {
      void soil;
      const [x, y] = key.split(',').map(Number) as [number, number];
      const p = at(x, y);
      out.push({ key: `soil:${key}`, tex: 'terrain.soil:r0', x: p.x, y: p.y, depth: BAND.ground + x + y + 0.6 });
      const weeds = bedWeeds(town, key, now);
      if (weeds >= 0.05) {
        const f = weeds >= 0.4 ? 'r2' : weeds >= 0.2 ? 'r1' : 'r0';
        out.push({ key: `weeds:${key}`, tex: `obj.weeds:${f}`, x: p.x, y: p.y - 1, depth: stand(x, y, 0) });
      }
      const crop = town.crops[key];
      const def = crop ? world.crops[crop.cropId] : undefined;
      if (crop && def) {
        const st = cropStatus(town, def, crop, now);
        const stage = st.ready ? 3 : st.fraction >= 0.5 ? 2 : st.growth > 0 ? 1 : 0;
        out.push({ key: `crop:${key}`, tex: `obj.crop_${def.id}:s${stage}`, x: p.x, y: p.y - 2, depth: stand(x, y, 1) });
        const mark = st.ready ? 'ready' : !st.wateredToday ? 'water' : null;
        if (mark) out.push({ key: `mark:${key}`, tex: `obj.marker:${mark}`, x: p.x, y: p.y, depth: BAND.roof - 1 });
      }
    }
    return out;
  }

  private syncOverlays() {
    const want = this.overlayList();
    const keys = new Set(want.map((o) => o.key));
    for (const [k, img] of this.overlays) {
      if (!keys.has(k)) {
        img.destroy();
        this.overlays.delete(k);
      }
    }
    for (const o of want) {
      let img = this.overlays.get(o.key);
      if (!img) {
        img = this.add.image(0, 0, '__DEFAULT');
        this.overlays.set(o.key, img);
      }
      this.setTex(img, `${this.ctrl.style}:${o.tex}`);
      img.setPosition(o.x, o.y).setDepth(o.depth).setAlpha(o.alpha ?? 1);
    }
  }

  private syncNpcs() {
    const now = this.ctrl.now();
    for (const def of this.ctrl.world.npcs) {
      const img = this.npcs.get(def.id);
      if (!img) continue;
      const pos = npcPosition(this.ctrl.town, this.ctrl.world, def, now);
      img.setVisible(!pos.inside);
      const p = toScreen(pos.x + 0.5, pos.y + 0.5);
      const moved = img.getData('at') !== `${pos.x},${pos.y}`;
      img.setData('at', `${pos.x},${pos.y}`);
      if (moved && img.getData('placed')) this.tweens.add({ targets: img, x: p.x, y: p.y - 2, duration: 1200, ease: 'Sine.easeInOut' });
      else img.setPosition(p.x, p.y - 2);
      img.setData('placed', true);
      img.setDepth(BAND.standing + (pos.x + pos.y + 1) * 10 + 4);
    }
  }

  private placeAvatar(p: { x: number; y: number }) {
    const s = toScreen(p.x + 0.5, p.y + 0.5);
    this.avatar.setPosition(s.x, s.y - 2);
    this.avatar.setDepth(BAND.standing + (p.x + p.y + 1) * 10 + 5);
  }

  override update(_time: number, delta: number) {
    const route = this.ctrl.route;
    if (route.length === 0) {
      this.walkFrom = null;
      return;
    }
    const next = route[0]!;
    this.walkFrom ??= { ...this.ctrl.town.player };
    this.walkT += delta / this.ctrl.stepMs();
    const t = Math.min(1, this.walkT);
    const fx = this.walkFrom.x + (next.x - this.walkFrom.x) * t;
    const fy = this.walkFrom.y + (next.y - this.walkFrom.y) * t;
    const s = toScreen(fx + 0.5, fy + 0.5);
    this.avatar.setPosition(s.x, s.y - 2 - Math.abs(Math.sin(t * Math.PI)) * 3);
    this.avatar.setFlipX(next.x - this.walkFrom.x < 0 || next.y - this.walkFrom.y > 0);
    this.avatar.setDepth(BAND.standing + (Math.max(next.x + next.y, this.walkFrom.x + this.walkFrom.y) + 1) * 10 + 5);
    if (t >= 1) {
      this.walkT = 0;
      this.walkFrom = { ...next };
      this.ctrl.arrived(next);
      if (this.ctrl.route.length === 0) this.placeAvatar(this.ctrl.town.player);
    }
  }

  private applyStyle() {
    this.applyBackground();
    for (const img of this.statics) this.restyle(img);
    this.restyle(this.avatar);
    for (const img of this.npcs.values()) this.restyle(img);
    for (const img of this.sprites.values()) {
      const p = img.getData('piece') as PlacedPiece;
      this.setTex(img, this.key(p.pieceId, this.frameFor(p)));
    }
    this.syncOverlays();
    this.drawPreview();
  }

  /** Roof visibility and wall cutaway near the pointer. */
  private applyVisibility() {
    const tool = this.ctrl.tool;
    const building = this.ctrl.mode === 'build';
    const interior = tool.mode === 'build' && LAYER_OF[this.ctrl.catalog[tool.pieceId]?.kind ?? 'roof'] !== 'roof';
    const lot = this.ctrl.town.lot;
    const inside = (p: PlacedPiece) => p.slot.x >= lot.x && p.slot.y >= lot.y && p.slot.x <= lot.x + lot.w && p.slot.y <= lot.y + lot.h;
    // The roof over the player's head fades while they're inside.
    const pl = this.ctrl.town.player;
    const playerRoof = this.ctrl.town.pieces[slotKey({ kind: 'tile', x: pl.x, y: pl.y, level: 0 }, 'roof')];
    // Cutaway: walls and roofs standing in front of what the pointer is on, or in front of the
    // player, fade so you can see and click behind them. "In front" = drawn later (deeper),
    // close enough to cover it on screen.
    const covers = (slot: Slot, at: Point | null) => {
      if (!at) return false;
      const d = slotDepth(slot);
      const td = at.x + at.y + 1;
      if (d <= td || d - td > 5) return false;
      const sx = slot.kind === 'tile' ? slot.x - slot.y : slot.dir === 'n' ? slot.x + 0.5 - slot.y : slot.x - slot.y - 0.5;
      return Math.abs(sx - (at.x - at.y)) <= 1.6;
    };
    const target = this.hoverAt;
    const me = building ? null : pl;
    for (const img of this.sprites.values()) {
      const p = img.getData('piece') as PlacedPiece;
      const layer = LAYER_OF[this.ctrl.catalog[p.pieceId]!.kind];
      const cut = covers(p.slot, target) || covers(p.slot, me);
      if (layer === 'roof') {
        let a = this.showRoofs ? 1 : 0;
        if (this.showRoofs && building && inside(p) && (interior || tool.mode === 'demolish')) a = 0.25;
        if (this.showRoofs && !building && playerRoof && Math.abs(p.slot.x - pl.x) + Math.abs(p.slot.y - pl.y) <= 3) a = 0.25;
        if (this.showRoofs && cut) a = Math.min(a, 0.25);
        img.setAlpha(a);
      } else if (layer === 'wall') {
        img.setAlpha(cut ? 0.3 : 1);
      }
    }
  }

  private drawPreview() {
    if (this.highlighted) {
      this.highlighted.clearTint();
      this.highlighted = null;
    }
    this.hover.clear();
    const p = this.ctrl.preview;
    this.ghost.setVisible(false);
    if (p.kind === 'place') {
      const placed: PlacedPiece = { pieceId: p.pieceId, slot: p.slot, rotation: p.rotation };
      this.setTex(this.ghost, this.key(p.pieceId, this.frameFor(placed)));
      this.placeSprite(this.ghost, placed);
      this.ghost.setDepth(BAND.ghost + slotDepth(p.slot));
      this.ghost.setTint(!p.ok ? 0xff5a5a : p.warning ? 0xffc34d : 0x8cff8c);
      this.ghost.setAlpha(0.75).setVisible(true);
      this.hoverDepth = slotDepth(p.slot);
      this.hoverAt = { x: p.slot.x, y: p.slot.y };
    } else if (p.kind === 'remove') {
      const img = this.sprites.get(slotKey(p.slot, p.layer));
      if (img) {
        img.setTint(p.ok ? 0xff7a7a : 0xffc34d);
        this.highlighted = img;
      }
      this.hoverDepth = slotDepth(p.slot);
      this.hoverAt = { x: p.slot.x, y: p.slot.y };
    } else if (p.kind === 'action') {
      const { x, y } = p.action.target;
      const c = (dx: number, dy: number) => toScreen(x + dx, y + dy);
      const pts = [c(0, 0), c(1, 0), c(1, 1), c(0, 1)].map((q) => new Phaser.Math.Vector2(q.x, q.y));
      this.hover.lineStyle(2, p.action.ok ? 0xfff2c0 : 0xff6a5a, 0.95);
      this.hover.strokePoints(pts, true);
      this.hoverDepth = slotDepth({ kind: 'tile', x, y, level: 0 });
      this.hoverAt = { x, y };
    } else {
      this.hoverDepth = -1;
      this.hoverAt = null;
    }
    this.applyVisibility();
  }

  // ---------- input ----------

  private isTouch(p: Phaser.Input.Pointer): boolean {
    return (p.event as PointerEvent | undefined)?.pointerType === 'touch' || p.wasTouch;
  }

  private onMove(p: Phaser.Input.Pointer) {
    const cam = this.cameras.main;
    if (this.dragPan) {
      if (!this.dragPan.active && Math.hypot(p.x - this.dragPan.x, p.y - this.dragPan.y) > 8) {
        this.dragPan.active = true;
        cam.stopFollow();
        if (this.touchDown) this.touchDown.moved = true;
      }
      if (this.dragPan.active) {
        cam.scrollX = this.dragPan.scrollX - (p.x - this.dragPan.x) / cam.zoom;
        cam.scrollY = this.dragPan.scrollY - (p.y - this.dragPan.y) / cam.zoom;
      }
      return;
    }
    if (this.isTouch(p)) return; // touch aims on tap, not hover
    const slot = this.ctrl.targetAt(p.worldX, p.worldY);
    this.ctrl.updatePreview(slot);
    if (this.painting && slot && this.ctrl.tool.mode === 'build') {
      const k = JSON.stringify(slot);
      if (k !== this.lastPainted && this.ctrl.preview.kind === 'place' && this.ctrl.preview.ok) {
        this.lastPainted = k;
        this.ctrl.commit();
      }
    }
  }

  private onDown(p: Phaser.Input.Pointer) {
    const cam = this.cameras.main;
    if (this.isTouch(p)) {
      this.touchDown = { x: p.x, y: p.y, moved: false };
      this.dragPan = { x: p.x, y: p.y, scrollX: cam.scrollX, scrollY: cam.scrollY, active: false };
      return;
    }
    if (p.rightButtonDown() || p.middleButtonDown()) {
      this.dragPan = { x: p.x, y: p.y, scrollX: cam.scrollX, scrollY: cam.scrollY, active: false };
      return;
    }
    const slot: Slot | null = this.ctrl.targetAt(p.worldX, p.worldY);
    this.ctrl.updatePreview(slot);
    this.ctrl.commit();
    if (this.ctrl.tool.mode === 'build' && slot) {
      this.painting = true;
      this.lastPainted = JSON.stringify(slot);
    }
  }

  private onUp(p: Phaser.Input.Pointer) {
    this.painting = false;
    this.dragPan = null;
    if (this.touchDown && !this.touchDown.moved) {
      const slot = this.ctrl.targetAt(p.worldX, p.worldY);
      this.ctrl.updatePreview(slot);
      // Play mode acts on tap. Build mode is two-step: a tap aims; Confirm places.
      if (this.ctrl.mode === 'play') this.ctrl.commit();
      else {
        this.ctrl.pendingTouch = this.ctrl.preview.kind !== 'none';
        this.ctrl.setStatus(this.ctrl.status.text, this.ctrl.status.tone);
      }
    }
    this.touchDown = null;
  }

  zoomBy(f: number) {
    const cam = this.cameras.main;
    cam.setZoom(Phaser.Math.Clamp(cam.zoom * f, 0.4, 2.5));
  }

  setRoofs(show: boolean) {
    this.showRoofs = show;
    this.applyVisibility();
  }

  /** Re-centre on the player (UI button). */
  follow() {
    this.cameras.main.startFollow(this.avatar, true, 0.15, 0.15);
  }
}

export const SCREEN = { TW, TH };
