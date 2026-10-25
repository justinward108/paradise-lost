import { describe, expect, it } from 'vitest';
import { AMBIENT_DAY_MS, apply, ambientTime, summariseAbsence, WEED_CAP, weedCoverage } from '../src/index.ts';
import { catalog, newTown } from './fixtures.ts';

const H = 3_600_000;

describe('ambient clock', () => {
  it('advances one day per AMBIENT_DAY_MS', () => {
    const t = newTown();
    expect(ambientTime(t, t.clock.epochMs).day).toBe(0);
    expect(ambientTime(t, t.clock.epochMs + AMBIENT_DAY_MS * 3 + AMBIENT_DAY_MS / 2)).toMatchObject({ day: 3, hour: 12 });
  });

  it('weather is deterministic per town and day', () => {
    const a = newTown();
    const b = newTown();
    const days = Array.from({ length: 50 }, (_, d) => ambientTime(a, a.clock.epochMs + d * AMBIENT_DAY_MS).rain);
    expect(days).toEqual(Array.from({ length: 50 }, (_, d) => ambientTime(b, b.clock.epochMs + d * AMBIENT_DAY_MS).rain));
    expect(days.some(Boolean)).toBe(true);
    expect(days.every(Boolean)).toBe(false);
  });
});

describe('weeds (a real-hour consequence)', () => {
  it('nothing for the first day, then saturates at the cap', () => {
    const t = newTown();
    const plot = t.plots.plot1!;
    expect(weedCoverage(plot, plot.lastTendedMs + 23 * H)).toBe(0);
    expect(weedCoverage(plot, plot.lastTendedMs + 72 * H)).toBeGreaterThan(0.3);
    expect(weedCoverage(plot, plot.lastTendedMs + 10_000 * H)).toBeCloseTo(WEED_CAP, 5);
    expect(weedCoverage(plot, plot.lastTendedMs + 10_000 * H)).toBeLessThanOrEqual(WEED_CAP);
  });

  it('tending resets the plot', () => {
    const t = newTown();
    const later = t.plots.plot1!.lastTendedMs + 100 * H;
    apply(t, catalog, { type: 'tendPlot', id: 'tend', plotId: 'plot1', nowMs: later });
    expect(weedCoverage(t.plots.plot1!, later)).toBe(0);
  });
});

describe('catch-up after a 3-day absence', () => {
  it('gives the same summary every time it runs (deterministic, idempotent)', () => {
    const t = newTown();
    const last = t.clock.epochMs;
    const now = last + 72 * H;
    const first = summariseAbsence(t, last, now);
    const second = summariseAbsence(t, last, now);
    expect(second).toEqual(first);
    expect(first.awayHours).toBe(72);
    expect(first.lines.length).toBe(2);
    expect(first.lines[0]).toMatch(/^90 days passed in town; it rained on \d+ of them\.$/);
    expect(first.lines[1]).toMatch(/Weeds now cover \d+% of your garden plot\./);
  });

  it('says nothing for a short break', () => {
    const t = newTown();
    expect(summariseAbsence(t, t.clock.epochMs, t.clock.epochMs + 10 * 60_000).lines).toEqual([]);
  });
});
