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
      for (let i = 0; i < 14; i++) {
        const dx = (rand() - 0.5) * 0.85;
        const dy = (rand() - 0.5) * 0.85;
        pen.dot(P(dx, dy), 0.9, i % 3 ? (pal.speck ?? '#000') : (pal.light ?? '#fff'));
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
    up: 40,
    paint(pen, pal, frame) {
      const stage = Number(frame.slice(1));
      const leaf = pal.leaf ?? '#5fa23a';
      const dark = pal.dark ?? '#3f7426';
      if (stage === 0) {
        pen.dot(P(0, 0, 1), 1.5, dark);
        return;
      }
      if (pal.trunk) {
        // Papaya: a trunk with a crown of leaves.
        const h = [0, 10, 22, 32][stage]!;
        pen.line(P(0, 0), P(0, 0, h), pal.trunk, 3);
        blob(pen, 0, -h, 6 + stage * 3, 3 + stage, leaf);
        if (stage === 3) for (const dx of [-3, 3]) pen.dot({ x: dx, y: -h + 5 }, 2.6, pal.fruit ?? '#e08a2a');
        return;
      }
      const size = [0, 4, 7, 10][stage]!;
      blob(pen, 0, -size * 0.6, size, size * 0.6, dark);
      blob(pen, -2, -size * 0.8, size * 0.7, size * 0.45, leaf);
      if (stage === 3) pen.dot(P(0.12, 0.1, 3), 2.4, pal.fruit ?? '#86c45a');
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
