/**
 * Time-system prototype (GDD section 18, decision D2 — hybrid, not yet locked).
 *
 * Two clocks:
 *  - an accelerated AMBIENT clock for day/night, weather and (later) NPC routines;
 *  - CONSEQUENCES (weeds, decay, drift) measured in real hours on saturating curves,
 *    so time away matters in proportion to real absence and never runs away.
 *
 * Everything is computed from absolute timestamps, so catching up is idempotent:
 * running it twice, or at a different moment for the same timestamps, gives the same answer.
 */
import { rngFor } from './rng.ts';
import type { Plot, Town } from './types.ts';

/** One ambient in-game day, in real milliseconds. Starting value from the GDD; tune in playtests. */
export const AMBIENT_DAY_MS = 48 * 60 * 1000;

const HOUR_MS = 3_600_000;
/** Weeds start one real day after tending… */
export const WEED_ONSET_H = 24;
/** …approach this coverage at most… */
export const WEED_CAP = 0.6;
/** …with this time constant (hours). */
export const WEED_TAU_H = 48;

export interface AmbientTime {
  day: number;
  /** 0–24, fractional. */
  hour: number;
  rain: boolean;
}

export function ambientTime(town: Town, nowMs: number): AmbientTime {
  const elapsed = Math.max(0, nowMs - town.clock.epochMs);
  const day = Math.floor(elapsed / AMBIENT_DAY_MS);
  const hour = ((elapsed % AMBIENT_DAY_MS) / AMBIENT_DAY_MS) * 24;
  return { day, hour, rain: rainOnDay(town, day) };
}

/** Windward Hawaiʻi Island: rain most days. Deterministic per (town, day). */
export function rainOnDay(town: Town, day: number): boolean {
  return rngFor(town.seed, `rain:${day}`)() < 0.7;
}

/** Fraction of the plot covered by weeds at `nowMs` (0 to WEED_CAP). */
export function weedCoverage(plot: Plot, nowMs: number): number {
  const hours = Math.max(0, (nowMs - plot.lastTendedMs) / HOUR_MS - WEED_ONSET_H);
  return WEED_CAP * (1 - Math.exp(-hours / WEED_TAU_H));
}

export interface AwaySummary {
  awayHours: number;
  lines: string[];
}

/**
 * The "While you were away" card. Pure: depends only on the town and the two timestamps.
 */
export function summariseAbsence(town: Town, lastSeenMs: number, nowMs: number): AwaySummary {
  const awayHours = Math.max(0, (nowMs - lastSeenMs) / HOUR_MS);
  const lines: string[] = [];
  if (awayHours < 1) return { awayHours, lines };

  const fromDay = ambientTime(town, lastSeenMs).day;
  const toDay = ambientTime(town, nowMs).day;
  let rainyDays = 0;
  for (let d = fromDay + 1; d <= toDay && d - fromDay <= 10_000; d++) if (rainOnDay(town, d)) rainyDays++;
  if (toDay > fromDay) lines.push(`${toDay - fromDay} days passed in town; it rained on ${rainyDays} of them.`);

  for (const plot of Object.values(town.plots)) {
    const before = weedCoverage(plot, lastSeenMs);
    const now = weedCoverage(plot, nowMs);
    if (now - before >= 0.05) lines.push(`Weeds now cover ${Math.round(now * 100)}% of your garden plot.`);
  }
  return { awayHours, lines };
}
