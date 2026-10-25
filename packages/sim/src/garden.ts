/**
 * Garden beds and crops.
 *
 * Crops grow one step for each ambient day that was watered, by rain or by hand.
 * Windward Hawaiʻi Island is wet, so most days water themselves. Weeds grow on beds in
 * real hours (see time.ts) and cut the harvest until pulled.
 */
import { ambientTime, rainOnDay, weedCoverage } from './time.ts';
import type { Crop, Town } from './types.ts';
import type { CropDef } from './world.ts';

/** Hand-watering records older than this many days are dropped to keep saves small. */
const KEEP_WATERED_DAYS = 60;

export function today(town: Town, nowMs: number): number {
  return ambientTime(town, nowMs).day;
}

export interface CropStatus {
  /** Watered days counted so far. */
  growth: number;
  /** Watered days needed. */
  need: number;
  ready: boolean;
  /** 0–1, for choosing the growth-stage sprite. */
  fraction: number;
  /** True if today has had water (rain or by hand). */
  wateredToday: boolean;
}

export function cropStatus(town: Town, def: CropDef, crop: Crop, nowMs: number): CropStatus {
  const now = today(town, nowMs);
  let growth = 0;
  // Each completed day since planting counts if it was watered.
  for (let d = crop.sinceDay; d < now; d++) if (rainOnDay(town, d) || crop.wateredDays.includes(d)) growth++;
  const need = crop.harvests > 0 && def.regrowDays ? def.regrowDays : def.days;
  return {
    growth,
    need,
    ready: growth >= need,
    fraction: Math.min(1, growth / need),
    wateredToday: rainOnDay(town, now) || crop.wateredDays.includes(now),
  };
}

export function recordWatering(crop: Crop, day: number): void {
  crop.wateredDays.push(day);
  crop.wateredDays = crop.wateredDays.filter((d) => d > day - KEEP_WATERED_DAYS);
}

export function bedWeeds(town: Town, key: string, nowMs: number): number {
  const soil = town.soil[key];
  return soil ? weedCoverage(soil.lastWeededMs, nowMs) : 0;
}

/** Harvest size after weeds take their share (never below 1). */
export function harvestAmount(base: number, weeds: number): number {
  return Math.max(1, Math.round(base * (1 - weeds)));
}
