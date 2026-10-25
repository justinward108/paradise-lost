/**
 * The isometric build view. Draws the town from sim state and turns pointer input into
 * controller intents. Holds no game rules.
 */
import Phaser from 'phaser';
import { art, STYLES, terrainArt, type ArtEntry, type Style } from '@paradise-lost/content';
import { LAYER_OF, slotKey, weedCoverage, rngFor, type PlacedPiece, type Slot } from '@paradise-lost/sim';
import { drawFrame } from '../art/generate.ts';
import { FOUND_H, slotAnchor, slotDepth, TH, toScreen, TW, WALL_H } from '../iso.ts';
import type { Controller } from '../game/controller.ts';

const MARGIN = 5; // grass tiles drawn around the lot
const BAND = { ground: 0, standing: 10_000, roof: 20_000, ghost: 30_000 } as const;

interface TexInfo {
  originX: number;
  originY: number;
  displayScale: number;
}

export class BuildScene extends Phaser.Scene {
  private ctrl!: Controller;
  private tex = new Map<string, TexInfo>();
  private sprites = new Map<string, Phaser.GameObjects.Image>();
  private terrain: Phaser.GameObjects.Image[] = [];
  private ghost!: Phaser.GameObjects.Image;
  private plotGfx!: Phaser.GameObjects.Graphics;
  private highlighted: Phaser.GameObjects.Image | null = null;
  private dragPan: { x: number; y: number; scrollX: number; scrollY: number } | null = null;
  private touchDown: { x: number; y: number; moved: boolean } | null = null;
  private painting = false;
  private lastPainted = '';
  showRoofs = true;
  private hoverDepth = -1;

  constructor() {
    super('build');
  }

  init(data: { ctrl: Controller }) {
    this.ctrl = data.ctrl;
  }

  create() {
    this.generateTextures();
    this.cameras.main.setBackgroundColor(this.ctrl.style === 'pixel' ? '#3e6b2c' : '#a9c48b');
    const mid = toScreen(this.ctrl.town.width / 2, this.ctrl.town.height / 2, 0);
    this.cameras.main.centerOn(mid.x, mid.y);
    const lotPx = ((this.ctrl.town.width + this.ctrl.town.height) * TW) / 2;
    this.cameras.main.setZoom(Phaser.Math.Clamp((this.scale.width * 0.95) / lotPx, 0.45, 1.3));

    this.drawTerrain();
    this.plotGfx = this.add.graphics().setDepth(BAND.ground + 0.5);
    this.ghost = this.add.image(0, 0, this.key('pier_foundation', 'r0')).setVisible(false).setDepth(BAND.ghost);
    this.syncPieces();
    this.drawPlots();

    this.ctrl.on((what) => {
      if (what === 'town') {
        this.syncPieces();
        this.drawPlots();
      }
      if (what === 'style') this.applyStyle();
      if (what === 'preview' || what === 'tool' || what === 'town') this.drawPreview();
    });

    this.input.mouse?.disableContextMenu();
    this.input.on('pointermove', this.onMove, this);
    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointerup', this.onUp, this);
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      const cam = this.cameras.main;
      cam.setZoom(Phaser.Math.Clamp(cam.zoom * (dy > 0 ? 0.9 : 1.1), 0.5, 2.5));
    });
    this.time.addEvent({ delay: 30_000, loop: true, callback: () => this.drawPlots() });
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
      for (const [id, entry] of Object.entries(art)) for (const f of entry[style].frames) this.addTexture(this.key(id, f, style), entry[style], style, f);
      for (const [id, entry] of Object.entries(terrainArt)) this.addTexture(this.key(`terrain.${id}`, 'r0', style), entry[style], style, 'r0');
    }
  }

  /** Point an image at a texture and apply that texture's anchor and scale. */
  private setTex(img: Phaser.GameObjects.Image, key: string) {
    const info = this.tex.get(key);
    img.setTexture(key);
    if (info) img.setOrigin(info.originX, info.originY).setScale(info.displayScale);
  }

  private frameFor(p: PlacedPiece): string {
    return p.slot.kind === 'edge' ? p.slot.dir : `r${p.rotation}`;
  }

  // ---------- drawing ----------

  private drawTerrain() {
    for (const img of this.terrain) img.destroy();
    this.terrain = [];
    const { width, height } = this.ctrl.town;
    for (let y = -MARGIN; y < height + MARGIN; y++) {
      for (let x = -MARGIN; x < width + MARGIN; x++) {
        const inLot = x >= 0 && y >= 0 && x < width && y < height;
        const p = toScreen(x + 0.5, y + 0.5);
        const img = this.add.image(p.x, p.y, '__DEFAULT');
        img.setData('terrain', inLot ? 'lot' : 'grass');
        this.setTex(img, this.key(`terrain.${inLot ? 'lot' : 'grass'}`, 'r0'));
        img.setDepth(BAND.ground - 1);
        this.terrain.push(img);
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
    this.applyVisibility();
  }

  private applyStyle() {
    this.cameras.main.setBackgroundColor(this.ctrl.style === 'pixel' ? '#3e6b2c' : '#a9c48b');
    for (const img of this.terrain) this.setTex(img, this.key(`terrain.${img.getData('terrain') as string}`, 'r0'));
    for (const img of this.sprites.values()) {
      const p = img.getData('piece') as PlacedPiece;
      this.setTex(img, this.key(p.pieceId, this.frameFor(p)));
    }
    this.drawPreview();
    this.drawPlots();
  }

  /** Roof visibility and wall cutaway near the pointer. */
  private applyVisibility() {
    const tool = this.ctrl.tool;
    const interior = tool.mode === 'build' && LAYER_OF[this.ctrl.catalog[tool.pieceId]?.kind ?? 'roof'] !== 'roof';
    const roofAlpha = !this.showRoofs ? 0 : interior || tool.mode === 'demolish' ? 0.25 : 1;
    for (const img of this.sprites.values()) {
      const p = img.getData('piece') as PlacedPiece;
      const layer = LAYER_OF[this.ctrl.catalog[p.pieceId]!.kind];
      if (layer === 'roof') img.setAlpha(roofAlpha);
      else if (layer === 'wall') {
        const d = slotDepth(p.slot);
        const cut = tool.mode !== 'select' && this.hoverDepth >= 0 && d > this.hoverDepth && d - this.hoverDepth < 4;
        img.setAlpha(cut ? 0.3 : 1);
      }
    }
  }

  private drawPreview() {
    if (this.highlighted) {
      this.highlighted.clearTint();
      this.highlighted = null;
    }
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
    } else if (p.kind === 'remove') {
      const img = this.sprites.get(slotKey(p.slot, p.layer));
      if (img) {
        img.setTint(p.ok ? 0xff7a7a : 0xffc34d);
        this.highlighted = img;
      }
      this.hoverDepth = slotDepth(p.slot);
    } else {
      this.hoverDepth = -1;
    }
    this.applyVisibility();
  }

  /** Garden plot for the time-system prototype: soil plus weeds that grow in real hours. */
  drawPlots() {
    const g = this.plotGfx;
    g.clear();
    const pixel = this.ctrl.style === 'pixel';
    for (const plot of Object.values(this.ctrl.town.plots)) {
      const c = (dx: number, dy: number) => toScreen(plot.x + dx, plot.y + dy);
      g.fillStyle(pixel ? 0x4a3420 : 0x7a5a3c, 1);
      g.fillPoints([c(0.08, 0.08), c(0.92, 0.08), c(0.92, 0.92), c(0.08, 0.92)].map((q) => new Phaser.Math.Vector2(q.x, q.y)), true);
      g.lineStyle(1, pixel ? 0x2b1d11 : 0x5a4129, 0.8);
      for (const k of [0.3, 0.5, 0.7]) g.lineBetween(c(0.15, k).x, c(0.15, k).y, c(0.85, k).x, c(0.85, k).y);
      const tufts = Math.round(weedCoverage(plot, Date.now()) * 30);
      const rand = rngFor(this.ctrl.town.seed, `weeds:${plot.id}`);
      for (let i = 0; i < tufts; i++) {
        const p = c(0.15 + rand() * 0.7, 0.15 + rand() * 0.7);
        g.fillStyle(pixel ? 0x6fae3a : 0x86b45a, 1);
        g.fillTriangle(p.x - 3, p.y, p.x, p.y - 7, p.x + 3, p.y);
      }
    }
  }

  // ---------- input ----------

  private isTouch(p: Phaser.Input.Pointer): boolean {
    return (p.event as PointerEvent | undefined)?.pointerType === 'touch' || p.wasTouch;
  }

  private onMove(p: Phaser.Input.Pointer) {
    const cam = this.cameras.main;
    if (this.dragPan) {
      cam.scrollX = this.dragPan.scrollX - (p.x - this.dragPan.x) / cam.zoom;
      cam.scrollY = this.dragPan.scrollY - (p.y - this.dragPan.y) / cam.zoom;
      if (this.touchDown && Math.hypot(p.x - this.touchDown.x, p.y - this.touchDown.y) > 8) this.touchDown.moved = true;
      return;
    }
    if (this.isTouch(p)) return; // touch aims on tap, not hover
    const slot = this.ctrl.targetAt(p.worldX, p.worldY);
    this.ctrl.updatePreview(slot);
    if (this.painting && slot && this.ctrl.tool.mode === 'build') {
      const k = slotKey(slot, 'floor') + (slot.kind === 'edge' ? slot.dir : '');
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
      this.dragPan = { x: p.x, y: p.y, scrollX: cam.scrollX, scrollY: cam.scrollY };
      return;
    }
    if (p.rightButtonDown() || p.middleButtonDown()) {
      this.dragPan = { x: p.x, y: p.y, scrollX: cam.scrollX, scrollY: cam.scrollY };
      return;
    }
    const slot: Slot | null = this.ctrl.targetAt(p.worldX, p.worldY);
    this.ctrl.updatePreview(slot);
    this.ctrl.commit();
    if (this.ctrl.tool.mode === 'build' && slot) {
      this.painting = true;
      this.lastPainted = slotKey(slot, 'floor') + (slot.kind === 'edge' ? slot.dir : '');
    }
  }

  private onUp(p: Phaser.Input.Pointer) {
    this.painting = false;
    this.dragPan = null;
    if (this.touchDown && !this.touchDown.moved) {
      // Touch is two-step: a tap aims the ghost; the Confirm button places it.
      const slot = this.ctrl.targetAt(p.worldX, p.worldY);
      this.ctrl.updatePreview(slot);
      if (this.ctrl.tool.mode === 'select') this.ctrl.commit();
      else this.ctrl.pendingTouch = this.ctrl.preview.kind !== 'none';
      this.ctrl.setStatus(this.ctrl.status.text, this.ctrl.status.tone);
    }
    this.touchDown = null;
  }

  /** Called by the UI's zoom buttons. */
  zoomBy(f: number) {
    const cam = this.cameras.main;
    cam.setZoom(Phaser.Math.Clamp(cam.zoom * f, 0.5, 2.5));
  }

  setRoofs(show: boolean) {
    this.showRoofs = show;
    this.applyVisibility();
  }
}

export const SCREEN = { TW, TH };
