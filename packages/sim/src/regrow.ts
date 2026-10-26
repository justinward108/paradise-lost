/**
 * The land recovers on its own, in real time: chopped trees grow back, brush sprouts on
 * empty ground on the lot, and renewable sites (loose rock) turn up more.
 *
 * Like projects, this is settled from timestamps whenever a timed command runs, so it is
 * deterministic and catches up correctly after time away. It guarantees there is always a
 * way to get more boards and stone, whatever the player has already used up.
 */
import { rngFor } from './rng.ts';
import type { Town } from './types.ts';
import { DEFAULT_REGROW, hasBrush, hasRubble, inLot, terrainAt, tileBuilt, type World } from './world.ts';

/** Catch-up limit, so a save left for months doesn't loop for long. */
const MAX_PERIODS = 30;

export function growBack(town: Town, world: World, nowMs: number): string[] {
  const events: string[] = [];
  town.felled ??= {};
  town.sprouts ??= [];

  // Trees.
  for (const [key, ms] of Object.entries(town.felled)) {
    const [x, y] = key.split(',').map(Number) as [number, number];
    const c = world.map.rows[y]?.[x] ?? '';
    const regrow = world.chop?.[c]?.regrowMs;
    if (regrow === undefined || nowMs - ms < regrow) continue;
    if (town.player.x === x && town.player.y === y) continue; // not on top of the player
    delete town.felled[key];
    events.push(`regrow:tree:${key}`);
  }

  // Renewable sites.
  for (const site of world.sites) {
    if (!site.refillMs) continue;
    const st = town.sites[site.id];
    if (!st || st.used <= 0) continue;
    st.refillMs ??= nowMs;
    let n = 0;
    while (st.used > 0 && nowMs - st.refillMs >= site.refillMs && n < MAX_PERIODS) {
      st.used -= 1;
      st.refillMs += site.refillMs;
      n++;
    }
    if (st.used === 0) delete st.refillMs;
    if (n > 0) events.push(`regrow:site:${site.id}:${n}`);
  }

  // Brush on the lot.
  const rg = world.regrow ?? DEFAULT_REGROW;
  if (town.growMs === null || town.growMs === undefined) {
    town.growMs = nowMs;
    return events;
  }
  const periods = Math.floor((nowMs - town.growMs) / rg.brushEveryMs);
  if (periods <= 0) return events;
  const { x: lx, y: ly, w, h } = town.lot;
  const brushCount = () => {
    let n = 0;
    for (let y = ly; y < ly + h; y++) for (let x = lx; x < lx + w; x++) if (hasBrush(town, world, x, y)) n++;
    return n;
  };
  let count = brushCount();
  let grown = 0;
  for (let p = Math.max(0, periods - MAX_PERIODS); p < periods && count < rg.brushCap; p++) {
    const rand = rngFor(town.seed, `sprout:${town.growMs + (p + 1) * rg.brushEveryMs}`);
    for (let k = 0, tries = 0; k < rg.brushPerTime && tries < 40 && count < rg.brushCap; tries++) {
      const x = lx + Math.floor(rand() * w);
      const y = ly + Math.floor(rand() * h);
      const id = `${x},${y}`;
      if (!inLot(town, x, y) || terrainAt(town, world, x, y) !== 'L') continue;
      if (id in town.soil || tileBuilt(town, x, y) || hasBrush(town, world, x, y) || hasRubble(town, world, x, y)) continue;
      if (town.player.x === x && town.player.y === y) continue;
      if (world.npcs.some((n) => n.schedule.some((s) => s.x === x && s.y === y))) continue;
      town.sprouts.push(id);
      count++;
      grown++;
      k++;
    }
  }
  town.growMs += periods * rg.brushEveryMs;
  if (grown > 0) events.push(`regrow:brush:${grown}`);
  return events;
}
