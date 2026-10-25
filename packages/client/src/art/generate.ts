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
