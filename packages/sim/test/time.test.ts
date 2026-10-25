import { describe, expect, it } from 'vitest';
import { AMBIENT_DAY_MS, ambientTime, WEED_CAP, weedCoverage } from '../src/index.ts';
import { newTown } from './fixtures.ts';

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
    expect(weedCoverage(0, 23 * H)).toBe(0);
    expect(weedCoverage(0, 72 * H)).toBeGreaterThan(0.3);
    expect(weedCoverage(0, 10_000 * H)).toBeCloseTo(WEED_CAP, 5);
    expect(weedCoverage(0, 10_000 * H)).toBeLessThanOrEqual(WEED_CAP);
  });
});
