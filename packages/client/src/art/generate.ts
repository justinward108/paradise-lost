/**
 * Procedural placeholder art for both visual styles (Sprint 1).
 *
 * Each generator draws one frame of one object into a canvas. Pixel style draws at half
 * resolution with hard edges and is shown scaled up with nearest-neighbour filtering;
 * storybook style draws at double resolution with soft, wobbly, washed shapes and is shown
 * scaled down with linear filtering. Geometry is shared, so anchors match exactly.
 *
 * Real art replaces this file; nothing else in the game draws pieces.
 */
import type { ArtEntry, Style } from '@paradise-lost/content';
import { hashString, mulberry32 } from '@paradise-lost/sim';
import { FOUND_H, TH, TW, WALL_H, type Pt } from '../iso.ts';

export interface Drawn {
  canvas: HTMLCanvasElement;
  originX: number;
  originY: number;
  /** Scale to display the texture at, so it appears at its intended size. */
  displayScale: number;
}

/** Resolution of the drawing relative to display size. */
export const RESOLUTION: Record<Style, number> = { pixel: 0.5, storybook: 2 };

interface Pen {
  poly(pts: Pt[], fill: string, stroke?: string): void;
  line(a: Pt, b: Pt, color: string, width?: number): void;
  dot(p: Pt, r: number, color: string): void;
}

function makePen(ctx: CanvasRenderingContext2D, style: Style, seed: string): Pen {
  const s = RESOLUTION[style];
  if (style === 'pixel') {
    return {
      poly(pts, fill, stroke) {
        ctx.beginPath();
        pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        if (stroke) {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = 1 / s;
          ctx.stroke();
        }
      },
      line(a, b, color, width = 1) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = width / s;
        ctx.stroke();
      },
      dot(p, r, color) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(p.x - r), Math.round(p.y - r), Math.max(1 / s, r * 2), Math.max(1 / s, r * 2));
      },
    };
  }
  // Storybook: hand-drawn wobble, a soft wash offset, light from the top.
  const rand = mulberry32(hashString(seed));
  const wob = (p: Pt, amt = 0.7): Pt => ({ x: p.x + (rand() - 0.5) * amt, y: p.y + (rand() - 0.5) * amt });
  const trace = (pts: Pt[]) => {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
  };
  return {
    poly(pts, fill, stroke) {
      const w = pts.map((p) => wob(p));
      ctx.save();
      ctx.globalAlpha = 0.35;
      trace(w.map((p) => ({ x: p.x + 0.8, y: p.y + 0.9 })));
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.restore();
      trace(w);
      const ys = w.map((p) => p.y);
      const g = ctx.createLinearGradient(0, Math.min(...ys), 0, Math.max(...ys));
      g.addColorStop(0, fill);
      g.addColorStop(1, shade(fill, -0.12));
      ctx.fillStyle = g;
      ctx.fill();
      if (stroke) {
        ctx.save();
        ctx.globalAlpha = 0.65;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 0.9;
        ctx.lineJoin = 'round';
        trace(w.map((p) => wob(p, 0.5)));
        ctx.stroke();
        ctx.restore();
      }
    },
    line(a, b, color, width = 1) {
      const m = wob({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, 0.8);
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(m.x, m.y, b.x, b.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = width * 0.8;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();
    },
    dot(p, r, color) {
      ctx.save();
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    },
  };
}

/** Lighten (amt > 0) or darken (amt < 0) a #rrggbb colour. */
function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.round(Math.min(255, Math.max(0, amt >= 0 ? v + (255 - v) * amt : v * (1 + amt))));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/** Iso offset from the anchor: dx, dy in tiles, z in display pixels. */
const P = (dx: number, dy: number, z = 0): Pt => ({ x: ((dx - dy) * TW) / 2, y: ((dx + dy) * TH) / 2 - z });

const DIAMOND = [P(-0.5, -0.5), P(0.5, -0.5), P(0.5, 0.5), P(-0.5, 0.5)];

/** A rounded blob in screen space (canopies, leaves, heads). */
function blob(pen: Pen, cx: number, cy: number, rx: number, ry: number, fill: string, stroke?: string): void {
  const pts: Pt[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    pts.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry });
  }
  pen.poly(pts, fill, stroke);
}

interface BoxColours {
  top: string;
  left: string;
  right: string;
  line: string;
}

function box(pen: Pen, cx: number, cy: number, hx: number, hy: number, z0: number, z1: number, c: BoxColours): void {
  const p = (dx: number, dy: number, z: number) => P(cx + dx, cy + dy, z);
  pen.poly([p(-hx, hy, z0), p(hx, hy, z0), p(hx, hy, z1), p(-hx, hy, z1)], c.left, c.line);
  pen.poly([p(hx, -hy, z0), p(hx, hy, z0), p(hx, hy, z1), p(hx, -hy, z1)], c.right, c.line);
  pen.poly([p(-hx, -hy, z1), p(hx, -hy, z1), p(hx, hy, z1), p(-hx, hy, z1)], c.top, c.line);
}

const fromPalette = (pal: Record<string, string>): BoxColours => ({
  top: pal.light ?? '#ccc',
  right: pal.mid ?? '#999',
  left: pal.dark ?? '#666',
  line: pal.line ?? '#333',
});

type Painter = (pen: Pen, pal: Record<string, string>, frame: string, rand: () => number) => void;

const painters: Record<ArtEntry['generator'], { up: number; paint: Painter } | 'wall'> = {
  terrain: {
    up: 0,
    paint(pen, pal, _f, rand) {
      pen.poly([P(-0.5, -0.5), P(0.5, -0.5), P(0.5, 0.5), P(-0.5, 0.5)], pal.base ?? '#5d8a3a');
      if (pal.scorch) {
        // Ash: small dark flecks (one texture serves every scorched tile, so no big shapes
        // that would repeat into a pattern).
        for (let i = 0; i < 10; i++) pen.dot(P((rand() - 0.5) * 0.9, (rand() - 0.5) * 0.9), 1.4, pal.scorch);
      }
      for (let i = 0; i < 14; i++) {
        const dx = (rand() - 0.5) * 0.85;
        const dy = (rand() - 0.5) * 0.85;
        pen.dot(P(dx, dy), 0.9, i % 3 ? (pal.speck ?? '#000') : (pal.light ?? '#fff'));
      }
      if (pal.crack) {
        let a = P((rand() - 0.5) * 0.8, -0.4);
        for (let i = 0; i < 4; i++) {
          const b = P((rand() - 0.5) * 0.8, -0.4 + (i + 1) * 0.2);
          pen.line(a, b, pal.crack, 1.2);
          a = b;
        }
      }
    },
  },
  crater: {
    up: 0,
    paint(pen, pal) {
      pen.poly(DIAMOND, pal.base ?? '#4a4a32');
      blob(pen, 0, 0, 26, 13, pal.rim ?? '#5e5640');
      blob(pen, 0, 1, 20, 9.5, pal.mid ?? '#3a3326');
      blob(pen, 1, 2, 13, 6, pal.hole ?? '#231f18');
    },
  },
  deadtree: {
    up: 66,
    paint(pen, pal, frame) {
      const h = frame === 'r1' ? 52 : 40;
      const trunk = pal.trunk ?? '#3a2e24';
      pen.poly([P(-0.07, 0.07), P(0.07, 0.07), P(0.05, 0.05, h), P(-0.05, 0.05, h)], trunk, pal.char);
      const top = P(0, 0, h);
      pen.line(P(0, 0, h * 0.55), { x: top.x - 14, y: top.y - 4 }, trunk, 3);
      pen.line(P(0, 0, h * 0.7), { x: top.x + 12, y: top.y - 2 }, trunk, 2.5);
      pen.line(P(0, 0, h * 0.85), { x: top.x + 4, y: top.y - 12 }, trunk, 2);
      pen.line({ x: top.x - 14, y: top.y - 4 }, { x: top.x - 19, y: top.y - 10 }, trunk, 1.5);
      pen.dot(P(0, 0.06, h * 0.3), 2, pal.char ?? '#1e1814');
      pen.dot(P(0.04, 0.06, h * 0.6), 1.5, pal.light ?? '#5a4a3a');
    },
  },
  stump: {
    up: 14,
    paint(pen, pal, frame) {
      box(pen, 0, 0, 0.12, 0.12, 0, 7, { top: pal.ring ?? '#c8a878', left: pal.bark ?? '#4a3420', right: pal.wood ?? '#8a6a3f', line: pal.bark ?? '#4a3420' });
      pen.dot(P(0, 0, 7), 1.2, pal.wood ?? '#8a6a3f');
      if (frame === 'r0') {
        // A living stump puts up shoots; it will be a tree again in a day.
        blob(pen, 6, -10, 4, 3, pal.sprout ?? '#4c8a3c');
        blob(pen, -5, -9, 3, 2.5, pal.sprout ?? '#4c8a3c');
      }
    },
  },
  ruin: {
    up: 50,
    paint(pen, pal, frame) {
      const c = fromPalette(pal);
      const tall = frame === 'r0';
      const char = pal.char ?? '#2a221a';
      // Floor slab and the stubs of two walls, charred at the top.
      box(pen, 0, 0, 0.46, 0.44, 0, 4, { top: c.left, left: char, right: c.left, line: c.line });
      pen.poly([P(-0.46, -0.44, 4), P(0.46, -0.44, 4), P(0.46, -0.44, tall ? 40 : 22), P(0.1, -0.44, tall ? 28 : 14), P(-0.2, -0.44, tall ? 36 : 18), P(-0.46, -0.44, tall ? 24 : 12)], c.right, c.line);
      pen.poly([P(-0.46, -0.44, 4), P(-0.46, 0.44, 4), P(-0.46, 0.44, tall ? 14 : 8), P(-0.46, 0, tall ? 30 : 16), P(-0.46, -0.44, tall ? 24 : 12)], c.left, c.line);
      pen.line(P(-0.2, -0.44, tall ? 34 : 17), P(0.46, -0.44, tall ? 38 : 20), char, 3);
      // A sheet of roofing fallen in, and loose boards.
      pen.poly([P(-0.3, -0.2, 6), P(0.35, -0.3, tall ? 22 : 10), P(0.4, 0.1, tall ? 16 : 8), P(-0.2, 0.25, 5)], pal.tin ?? '#738891', c.line);
      pen.line(P(0.1, 0.35, 5), P(0.42, 0.05, 5), c.top, 3);
      pen.line(P(-0.35, 0.3, 5), P(0.05, 0.4, 5), c.right, 3);
    },
  },
  carwreck: {
    up: 26,
    paint(pen, pal, frame) {
      const body = frame === 'r0' ? (pal.body ?? '#6a3a2a') : (pal.rust ?? '#8a4a26');
      const char = pal.char ?? '#2a221a';
      for (const [x, y] of [[-0.3, 0.22], [0.3, 0.22]] as const) pen.dot(P(x, y, 2), 3, pal.tyre ?? '#1a1814');
      box(pen, 0, 0, 0.42, 0.22, 2, 11, { top: body, left: shade(body, -0.3), right: shade(body, -0.15), line: char });
      if (frame === 'r0') box(pen, -0.05, 0, 0.2, 0.18, 11, 18, { top: char, left: pal.glass ?? '#3a4a4e', right: pal.glass ?? '#3a4a4e', line: char });
      pen.dot(P(0.25, 0, 11), 2.5, pal.rust ?? '#8a4a26');
      pen.dot(P(-0.3, -0.1, 11), 2, char);
    },
  },
  smallrubble: {
    up: 16,
    paint(pen, pal) {
      const c = fromPalette(pal);
      box(pen, -0.12, 0.08, 0.14, 0.1, 0, 6, c);
      box(pen, 0.14, -0.06, 0.1, 0.12, 0, 9, c);
      box(pen, 0.02, 0.18, 0.08, 0.07, 0, 4, c);
      pen.line(P(-0.3, -0.15, 2), P(0.2, -0.3, 6), pal.wood ?? '#5a4128', 3);
      pen.dot(P(-0.2, 0.25, 1), 2, pal.char ?? '#2a221a');
    },
  },
  marker: {
    up: 56,
    paint(pen, pal, frame) {
      const y = -44;
      if (frame === 'water') {
        // A water drop.
        pen.poly([{ x: 0, y: y - 9 }, { x: 5, y: y - 1 }, { x: 4, y: y + 3 }, { x: 0, y: y + 5 }, { x: -4, y: y + 3 }, { x: -5, y: y - 1 }], pal.water ?? '#2f8fd8', pal.line);
        pen.dot({ x: -1.5, y: y }, 1.2, pal.light ?? '#fff');
      } else {
        // A star: ready to harvest.
        const pts: Pt[] = [];
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI / 2 + (i * Math.PI) / 5;
          const r = i % 2 ? 3 : 7.5;
          pts.push({ x: Math.cos(a) * r, y: y + Math.sin(a) * r });
        }
        pen.poly(pts, pal.ready ?? '#f2c230', pal.line);
      }
    },
  },
  foundation: {
    up: FOUND_H,
    paint(pen, pal) {
      const c = fromPalette(pal);
      box(pen, 0, 0, 0.5, 0.5, 0, FOUND_H, c);
      for (const k of [-0.25, 0, 0.25]) {
        pen.line(P(k, 0.5, 1), P(k, 0.5, FOUND_H - 1), c.line);
        pen.line(P(0.5, k, 1), P(0.5, k, FOUND_H - 1), c.line);
      }
    },
  },
  floor: {
    up: 0,
    paint(pen, pal) {
      const c = fromPalette(pal);
      pen.poly([P(-0.5, -0.5), P(0.5, -0.5), P(0.5, 0.5), P(-0.5, 0.5)], c.top, c.line);
      for (const k of [0.2, 0.4, 0.6, 0.8]) pen.line(P(-0.5, -0.5 + k), P(0.5, -0.5 + k), c.right);
    },
  },
  roof: {
    up: 4,
    paint(pen, pal, _f, rand) {
      const o = 0.56;
      box(pen, 0, 0, o, o, -3, 0, { top: pal.mid ?? '#888', left: pal.dark ?? '#555', right: pal.dark ?? '#555', line: pal.line ?? '#222' });
      for (let k = 1; k < 8; k++) {
        const t = -o + (k * 2 * o) / 8;
        pen.line(P(t, -o), P(t, o), pal.light ?? '#aaa');
      }
      for (let i = 0; i < 3; i++) pen.dot(P((rand() - 0.5) * 0.8, (rand() - 0.5) * 0.8), 1.2, pal.rust ?? '#a0522d');
    },
  },
  bedroll: {
    up: 8,
    paint(pen, pal, frame) {
      const along = frame === 'r1';
      const hx = along ? 0.2 : 0.38;
      const hy = along ? 0.38 : 0.2;
      const cloth = pal.cloth ?? '#7a8f4e';
      box(pen, 0, 0, hx, hy, 0, 4, { top: cloth, right: shade(cloth, -0.2), left: shade(cloth, -0.35), line: pal.line ?? '#222' });
      const pillow = pal.pillow ?? '#eee';
      const px = along ? 0 : -0.26;
      const py = along ? -0.26 : 0;
      box(pen, px, py, along ? 0.16 : 0.09, along ? 0.09 : 0.16, 4, 7, { top: pillow, right: shade(pillow, -0.12), left: shade(pillow, -0.22), line: pal.line ?? '#222' });
    },
  },
  crate: {
    up: 28,
    paint(pen, pal) {
      const c = fromPalette(pal);
      box(pen, 0, 0, 0.3, 0.3, 0, 24, c);
      pen.line(P(-0.3, 0.3, 2), P(0.3, 0.3, 22), c.line);
      pen.line(P(0.3, -0.3, 2), P(0.3, 0.3, 22), c.line);
      pen.line(P(-0.3, 0.3, 12), P(0.3, 0.3, 12), c.line);
    },
  },
  water: {
    up: 0,
    paint(pen, pal, _f, rand) {
      pen.poly(DIAMOND, pal.base ?? '#2f6f8f');
      for (let i = 0; i < 3; i++) {
        const dx = (rand() - 0.5) * 0.5;
        const dy = (rand() - 0.5) * 0.5;
        pen.line(P(dx - 0.12, dy), P(dx + 0.12, dy), pal.light ?? '#5fa3c2');
      }
    },
  },
  bridge: {
    up: 4,
    paint(pen, pal) {
      pen.poly(DIAMOND, pal.base ?? '#2f6f8f');
      const c = fromPalette(pal);
      box(pen, 0, 0, 0.5, 0.42, 0, 4, c);
      for (const k of [-0.25, 0, 0.25]) pen.line(P(k, -0.42, 4), P(k, 0.42, 4), c.line);
    },
  },
  soil: {
    up: 2,
    paint(pen, pal) {
      pen.poly([P(-0.45, -0.45), P(0.45, -0.45), P(0.45, 0.45), P(-0.45, 0.45)], pal.base ?? '#4a3420', pal.furrow);
      for (const k of [-0.25, 0, 0.25]) pen.line(P(-0.4, k, 1), P(0.4, k, 1), pal.furrow ?? '#2f2014', 1.5);
    },
  },
  tree: {
    up: 78,
    paint(pen, pal, frame) {
      const tall = frame === 'r1';
      const h = tall ? 70 : 56;
      pen.poly([P(-0.06, 0.06), P(0.06, 0.06), P(0.06, 0.06, h * 0.55), P(-0.06, 0.06, h * 0.55)], pal.trunk ?? '#5a4128', pal.dark);
      blob(pen, 0, -h * 0.62, 20, 14, pal.dark ?? '#1f4a1c');
      blob(pen, -6, -h * 0.72, 15, 12, pal.leaf ?? '#2f6b2a');
      blob(pen, 7, -h * 0.68, 14, 11, pal.leaf ?? '#2f6b2a');
      blob(pen, 0, -h * 0.84, 12, 9, pal.light ?? '#4c8a3c');
    },
  },
  bush: {
    up: 18,
    paint(pen, pal) {
      blob(pen, 0, -6, 14, 8, pal.dark ?? '#355620');
      blob(pen, -4, -9, 9, 6, pal.leaf ?? '#4f7d2f');
      blob(pen, 5, -10, 8, 6, pal.light ?? '#6f9e45');
    },
  },
  rubble: {
    up: 30,
    paint(pen, pal, frame) {
      const c = fromPalette(pal);
      const full = frame === 'r0';
      box(pen, -0.1, 0.05, 0.3, 0.25, 0, full ? 10 : 4, c);
      pen.poly([P(-0.35, -0.3, 2), P(0.3, -0.25, full ? 26 : 10), P(0.38, -0.15, full ? 22 : 8), P(-0.3, -0.2, 0)], c.top, c.line);
      if (full) pen.poly([P(0.05, 0.3, 0), P(0.4, 0.1, 18), P(0.44, 0.18, 16), P(0.1, 0.38, 0)], c.right, c.line);
      pen.line(P(-0.4, 0.3), P(0.2, 0.4), c.line, 2);
    },
  },
  carport: {
    up: 30,
    paint(pen, pal, frame) {
      const full = frame === 'r0';
      const wood = pal.wood ?? '#8a6a3f';
      pen.line(P(-0.35, -0.35), P(-0.35, -0.35, full ? 26 : 14), wood, 3);
      pen.line(P(0.35, 0.35), P(0.35, 0.35, 8), wood, 3);
      pen.poly([P(-0.45, -0.4, full ? 26 : 14), P(0.4, -0.45, 20), P(0.45, 0.4, 4), P(-0.4, 0.45, 8)], pal.mid ?? '#738891', pal.line);
      for (const k of [-0.2, 0, 0.2]) pen.line(P(k - 0.2, -0.4, 22), P(k + 0.2, 0.4, 6), pal.light ?? '#9fb1b8');
      pen.dot(P(0.1, 0.1, 12), 1.5, pal.rust ?? '#a0522d');
    },
  },
  rockpile: {
    up: 24,
    paint(pen, pal, frame) {
      const c = fromPalette(pal);
      const n = frame === 'r0' ? 5 : 2;
      const spots: [number, number, number][] = [[-0.15, 0.1, 10], [0.15, 0.05, 12], [0, -0.15, 14], [-0.25, -0.15, 8], [0.25, -0.2, 9]];
      for (const [x, y, h] of spots.slice(0, n)) box(pen, x, y, 0.13, 0.12, 0, h, c);
    },
  },
  store: {
    up: 60,
    paint(pen, pal, frame) {
      const c = fromPalette(pal);
      const intact = frame === 'r0';
      box(pen, 0, 0, 0.45, 0.4, 0, intact ? 46 : 30, c);
      const f = (u: number, v: number, z: number) => P(-0.45 + u * 0.9, 0.4, z * (intact ? 46 : 30));
      pen.poly([f(0.1, 0, 0.55), f(0.9, 0, 0.55), f(0.9, 0, 0.85), f(0.1, 0, 0.85)], pal.sign ?? '#a33a2a', c.line);
      pen.poly([f(0.15, 0, 0.1), f(0.45, 0, 0.1), f(0.45, 0, 0.45), f(0.15, 0, 0.45)], pal.glass ?? '#4a6e78', c.line);
      pen.poly([f(0.6, 0, 0), f(0.85, 0, 0), f(0.85, 0, 0.45), f(0.6, 0, 0.45)], c.left, c.line);
    },
  },
  debris: {
    up: 16,
    paint(pen, pal, frame) {
      pen.poly([P(-0.42, -0.3), P(0.4, -0.25), P(0.42, 0.3), P(-0.4, 0.28)], frame === 'r2' ? (pal.mud ?? '#6b5434') : (pal.hole ?? '#2a1d12'), pal.bark);
      if (frame === 'r2') for (const k of [-0.2, 0, 0.2]) pen.line(P(-0.35, k, 1), P(0.35, k, 1), pal.board ?? '#b08d5b', 2.5);
      if (frame === 'r0') {
        box(pen, 0, 0, 0.55, 0.09, 0, 10, { top: pal.log ?? '#5a4128', left: pal.bark ?? '#3a2a18', right: pal.bark ?? '#3a2a18', line: pal.bark ?? '#3a2a18' });
        blob(pen, 22, -10, 10, 8, '#3f6a2a');
      }
    },
  },
  crop: {
    up: 48,
    paint(pen, pal, frame) {
      const stage = Number(frame.slice(1));
      const leaf = pal.leaf ?? '#5fa23a';
      const dark = pal.dark ?? '#3f7426';
      const shape = pal.shape ?? 'rosette';
      // A stake with the crop's colour tag, at the back of the bed, until it's well grown.
      if (stage < 3) {
        const base = P(-0.28, -0.28);
        pen.line(base, { x: base.x, y: base.y - 16 }, pal.stake ?? '#c8a878', 2);
        pen.poly([{ x: base.x - 4, y: base.y - 18 }, { x: base.x + 4, y: base.y - 18 }, { x: base.x + 4, y: base.y - 12 }, { x: base.x - 4, y: base.y - 12 }], pal.tag ?? '#ffffff', '#00000055');
      }
      if (shape === 'palm') {
        // Papaya: a single stem that becomes a small tree with a crown and fruit.
        const h = [5, 12, 24, 34][stage]!;
        pen.line(P(0, 0), P(0, 0, h), pal.trunk ?? '#7a6a4a', stage === 0 ? 1.5 : 3);
        const crown = 3 + stage * 3;
        for (const dx of [-1, 1]) pen.poly([{ x: 0, y: -h }, { x: dx * crown * 1.6, y: -h + crown * 0.5 }, { x: dx * crown, y: -h - crown * 0.3 }], leaf, dark);
        blob(pen, 0, -h - 1, crown * 0.6, crown * 0.35, dark);
        if (stage === 3) for (const dx of [-3, 0, 3]) pen.dot({ x: dx, y: -h + 5 }, 2.6, pal.fruit ?? '#e08a2a');
        return;
      }
      if (shape === 'trellis') {
        // Long beans: two poles with a vine climbing them and hanging pods.
        const h = [6, 14, 24, 30][stage]!;
        for (const dx of [-0.15, 0.15]) pen.line(P(dx, 0.1), P(dx, 0.1, 30), pal.stake ?? '#c8a878', 1.5);
        for (let i = 0; i < 2 + stage * 2; i++) {
          const z = (i / (2 + stage * 2)) * h;
          blob(pen, P(i % 2 ? 0.15 : -0.15, 0.1, z).x, P(0, 0.1, z).y, 3.5, 2.5, i % 2 ? leaf : dark);
        }
        if (stage === 3) for (const dx of [-0.15, 0.15]) pen.line(P(dx, 0.12, 20), P(dx, 0.12, 10), pal.fruit ?? '#9cc84a', 1.5);
        return;
      }
      if (shape === 'banana') {
        // Banana: a thick pseudostem and big drooping paddle leaves.
        const h = [6, 14, 26, 36][stage]!;
        pen.line(P(0, 0), P(0, 0, h), pal.trunk ?? '#6a7a3a', stage === 0 ? 2 : 4);
        const span = 4 + stage * 4;
        for (const [dx, dy] of [[-1, 0.2], [1, 0.1], [-0.4, -0.6], [0.5, -0.5]] as const) {
          pen.poly([{ x: 0, y: -h }, { x: dx * span, y: -h + dy * span - 2 }, { x: dx * span * 1.1, y: -h + dy * span + 3 }], leaf, dark);
        }
        if (stage === 3) for (const dy of [4, 7]) blob(pen, 3, -h + dy, 3, 1.5, pal.fruit ?? '#e8d24a');
        return;
      }
      if (shape === 'vine') {
        // Sweet potato: purple stems sprawling flat, heart-shaped leaves.
        const reach = [0.12, 0.22, 0.34, 0.42][stage]!;
        const stem = pal.stem ?? '#7a2e6a';
        const tips = [P(reach, 0.05), P(-reach, 0.08), P(0.05, reach), P(-0.05, -reach * 0.8)];
        for (const t of tips) {
          pen.line(P(0, 0), t, stem, 1.5);
          blob(pen, t.x, t.y - 2, 3 + stage, 2 + stage * 0.7, leaf, dark);
        }
        blob(pen, 0, -3, 3 + stage, 2 + stage * 0.6, dark);
        if (stage === 3) for (const t of [P(0.15, 0.2), P(-0.2, 0.15)]) blob(pen, t.x, t.y, 4, 2.5, pal.fruit ?? '#9a3a8a', '#00000055');
        return;
      }
      // Greens: a round rosette of upright leaves.
      const r = [3, 6, 9, 12][stage]!;
      const n = [3, 5, 7, 8][stage]!;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        pen.poly([{ x: 0, y: -2 }, { x: Math.cos(a) * r - 2, y: -2 + Math.sin(a) * r * 0.5 - r * 0.6 }, { x: Math.cos(a) * r + 2, y: -2 + Math.sin(a) * r * 0.5 - r * 0.4 }], i % 2 ? leaf : dark, dark);
      }
      blob(pen, 0, -3 - r * 0.2, r * 0.35, r * 0.25, pal.fruit ?? '#86c45a');
    },
  },
  weeds: {
    up: 10,
    paint(pen, pal, frame, rand) {
      const n = [3, 6, 10][Number(frame.slice(1))] ?? 3;
      for (let i = 0; i < n; i++) {
        const p = P((rand() - 0.5) * 0.7, (rand() - 0.5) * 0.7);
        pen.poly([{ x: p.x - 2.5, y: p.y }, { x: p.x, y: p.y - 7 }, { x: p.x + 2.5, y: p.y }], i % 2 ? (pal.leaf ?? '#6fae3a') : (pal.dark ?? '#4a7a26'));
      }
    },
  },
  person: {
    up: 46,
    paint(pen, pal) {
      const line = pal.line ?? '#1a1410';
      pen.poly([{ x: -8, y: -2 }, { x: 8, y: -2 }, { x: 8, y: 2 }, { x: -8, y: 2 }], 'rgba(0,0,0,0.25)');
      pen.poly([{ x: -5, y: 0 }, { x: -1, y: 0 }, { x: -1, y: -14 }, { x: -5, y: -14 }], pal.pants ?? '#3a3a3a', line);
      pen.poly([{ x: 1, y: 0 }, { x: 5, y: 0 }, { x: 5, y: -14 }, { x: 1, y: -14 }], pal.pants ?? '#3a3a3a', line);
      pen.poly([{ x: -7, y: -13 }, { x: 7, y: -13 }, { x: 6, y: -29 }, { x: -6, y: -29 }], pal.shirt ?? '#3f6a9a', line);
      blob(pen, 0, -35, 6, 6.5, pal.skin ?? '#b07a52', line);
      blob(pen, -1, -39, 6.5, 3.5, pal.hair ?? '#2a1d14');
    },
  },
  table: {
    up: 26,
    paint(pen, pal, frame) {
      const c = fromPalette(pal);
      const along = frame === 'r1';
      const hx = along ? 0.22 : 0.36;
      const hy = along ? 0.36 : 0.22;
      for (const [x, y] of [[-hx + 0.04, hy - 0.04], [hx - 0.04, hy - 0.04], [hx - 0.04, -hy + 0.04]] as const) pen.line(P(x, y, 0), P(x, y, 14), c.left, 2.5);
      box(pen, 0, 0, hx, hy, 14, 17, c);
    },
  },
  chair: {
    up: 30,
    paint(pen, pal, frame) {
      const c = fromPalette(pal);
      const r = Number(frame.slice(1));
      for (const [x, y] of [[-0.12, 0.12], [0.12, 0.12], [0.12, -0.12]] as const) pen.line(P(x, y, 0), P(x, y, 9), c.left, 2);
      box(pen, 0, 0, 0.14, 0.14, 9, 11, c);
      // Back rest on the side the chair faces away from.
      const [bx, by, hx, hy] = [[0, -0.13, 0.14, 0.02], [0.13, 0, 0.02, 0.14], [0, 0.13, 0.14, 0.02], [-0.13, 0, 0.02, 0.14]][r] as [number, number, number, number];
      box(pen, bx, by, hx, hy, 11, 24, c);
    },
  },
  lantern: {
    up: 26,
    paint(pen, pal) {
      const line = pal.line ?? '#1a1814';
      box(pen, 0, 0, 0.07, 0.07, 0, 12, { top: pal.glass ?? '#f2d36b', left: shade(pal.glass ?? '#f2d36b', -0.15), right: pal.glass ?? '#f2d36b', line });
      pen.poly([P(-0.1, -0.1, 13), P(0.1, -0.1, 13), P(0.1, 0.1, 13), P(-0.1, 0.1, 13)], pal.panel ?? '#2f4f6f', line);
      pen.line(P(0, 0, 13), P(0, 0, 18), pal.body ?? '#3a3a36', 1.5);
      blob(pen, 0, -6, 9, 5, 'rgba(255,220,120,0.25)');
    },
  },
  rug: {
    up: 2,
    paint(pen, pal, frame) {
      const along = frame === 'r1';
      const hx = along ? 0.3 : 0.42;
      const hy = along ? 0.42 : 0.3;
      pen.poly([P(-hx, -hy, 1), P(hx, -hy, 1), P(hx, hy, 1), P(-hx, hy, 1)], pal.base ?? '#a8543a', pal.edge);
      for (const k of [-0.5, 0, 0.5]) {
        if (along) pen.line(P(-hx, k * hy, 1.2), P(hx, k * hy, 1.2), pal.stripe ?? '#e8c87a', 2);
        else pen.line(P(k * hx, -hy, 1.2), P(k * hx, hy, 1.2), pal.stripe ?? '#e8c87a', 2);
      }
    },
  },
  kiosk: {
    up: 64,
    paint(pen, pal) {
      const line = pal.line ?? '#1a0e0e';
      const body = pal.body ?? '#8a1f1f';
      box(pen, 0, 0, 0.3, 0.24, 0, 54, { top: pal.trim ?? '#c9a23a', left: pal.dark ?? '#5a1414', right: body, line });
      // Screen and slot on the front (south-west) face.
      const f = (u: number, z: number) => P(-0.3 + u * 0.6, 0.24, z);
      pen.poly([f(0.15, 26), f(0.85, 26), f(0.85, 46), f(0.15, 46)], pal.screen ?? '#2a3a3a', line);
      pen.poly([f(0.22, 30), f(0.78, 30), f(0.78, 42), f(0.22, 42)], pal.glow ?? '#7fd0c0');
      pen.poly([f(0.3, 14), f(0.7, 14), f(0.7, 18), f(0.3, 18)], line);
      pen.poly([f(0.35, 4), f(0.65, 4), f(0.65, 12), f(0.35, 12)], pal.paper ?? '#eae2cc', line);
      // Cross-and-star seal on the side.
      const side = (v: number, z: number) => P(0.3, -0.24 + v * 0.48, z);
      const c = side(0.5, 38);
      pen.line({ x: c.x, y: c.y - 7 }, { x: c.x, y: c.y + 7 }, pal.trim ?? '#c9a23a', 2);
      pen.line({ x: c.x - 5, y: c.y - 2 }, { x: c.x + 5, y: c.y - 2 }, pal.trim ?? '#c9a23a', 2);
      pen.dot({ x: c.x, y: c.y - 10 }, 1.6, pal.trim ?? '#c9a23a');
    },
  },
  wall: 'wall',
  window: 'wall',
  door: 'wall',
};

/** A point on a wall face: u along the wall (0–1), v up the wall (0–1). */
function facePoint(dir: string, u: number, v: number): Pt {
  const sx = dir === 'n' ? 1 : -1;
  return { x: (sx * u * TW) / 2, y: (u * TH) / 2 - v * WALL_H };
}

function paintWall(pen: Pen, kind: 'wall' | 'window' | 'door', pal: Record<string, string>, dir: string): void {
  const f = (u: number, v: number) => facePoint(dir, u, v);
  const quad = (u0: number, u1: number, v0: number, v1: number) => [f(u0, v0), f(u1, v0), f(u1, v1), f(u0, v1)];
  const faceColour = dir === 'n' ? (pal.light ?? '#ccc') : (pal.mid ?? '#999');
  pen.poly(quad(0, 1, 0, 1), faceColour, pal.line);
  for (let k = 1; k < 7; k++) pen.line(f(0.02, k / 7), f(0.98, k / 7), pal.dark ?? '#666');
  if (kind === 'window') {
    pen.poly(quad(0.26, 0.74, 0.4, 0.76), pal.glass ?? '#7fc4d8', pal.line);
    pen.line(f(0.5, 0.4), f(0.5, 0.76), pal.line ?? '#333');
  }
  if (kind === 'door') {
    pen.poly(quad(0.28, 0.72, 0, 0.8), pal.panel ?? '#6b3f22', pal.line);
    pen.dot(f(0.64, 0.4), 1.2, '#e2c070');
  }
  pen.line(f(0, 1), f(1, 1), pal.line ?? '#333', 2);
}

/** Draw one frame of one art entry. `seed` makes storybook wobble stable per texture. */
export function drawFrame(entry: ArtEntry, style: Style, frame: string, seed: string): Drawn {
  const s = RESOLUTION[style];
  const isWall = painters[entry.generator] === 'wall';
  const pad = 6;
  let w: number;
  let h: number;
  let ax: number;
  let ay: number;
  if (isWall) {
    w = TW / 2 + pad * 2;
    h = WALL_H + TH / 2 + pad * 2;
    ax = frame === 'n' ? pad : w - pad;
    ay = WALL_H + pad;
  } else {
    const p = painters[entry.generator] as { up: number };
    w = TW + pad * 2 + 8;
    h = TH + p.up + pad * 2;
    ax = w / 2;
    ay = h - TH / 2 - pad;
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(w * s);
  canvas.height = Math.ceil(h * s);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = style !== 'pixel';
  ctx.scale(s, s);
  ctx.translate(ax, ay);
  const pen = makePen(ctx, style, seed);

  if (isWall) paintWall(pen, entry.generator as 'wall' | 'window' | 'door', entry.palette, frame);
  else (painters[entry.generator] as { paint: Painter }).paint(pen, entry.palette, frame, mulberry32(hashString(seed + ':paint')));

  if (style === 'pixel') hardenEdges(ctx, canvas);
  return { canvas, originX: (ax * s) / canvas.width, originY: (ay * s) / canvas.height, displayScale: 1 / s };
}

/** Pixel style: no half-transparent edges. */
function hardenEdges(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let i = 3; i < d.length; i += 4) d[i] = d[i]! >= 110 ? 255 : 0;
  ctx.putImageData(img, 0, 0);
}
