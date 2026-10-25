/**
 * The "While you were away" card (GDD §18). Pure: depends only on the town, the world and
 * two timestamps, so it reads the same however many times it is computed.
 */
import { bedWeeds, cropStatus } from './garden.ts';
import { settleProjects, helperLabour } from './project.ts';
import { ambientTime, rainOnDay } from './time.ts';
import type { Town } from './types.ts';
import type { World } from './world.ts';

const HOUR_MS = 3_600_000;

export interface AwaySummary {
  awayHours: number;
  lines: string[];
}

export function summariseAbsence(town: Town, world: World, lastSeenMs: number, nowMs: number): AwaySummary {
  const awayHours = Math.max(0, (nowMs - lastSeenMs) / HOUR_MS);
  const lines: string[] = [];
  if (awayHours < 1) return { awayHours, lines };

  const fromDay = ambientTime(town, lastSeenMs).day;
  const toDay = ambientTime(town, nowMs).day;
  let rainy = 0;
  for (let d = fromDay + 1; d <= toDay && d - fromDay <= 10_000; d++) if (rainOnDay(town, d)) rainy++;
  if (toDay > fromDay) lines.push(`${toDay - fromDay} days passed in town; it rained on ${rainy} of them.`);

  let ready = 0;
  for (const crop of Object.values(town.crops)) {
    const def = world.crops[crop.cropId];
    if (def && cropStatus(town, def, crop, nowMs).ready && !cropStatus(town, def, crop, lastSeenMs).ready) ready++;
  }
  if (ready > 0) lines.push(`${ready} crop${ready === 1 ? ' is' : 's are'} ready to harvest.`);

  const weedy = Object.keys(town.soil).filter((k) => bedWeeds(town, k, nowMs) - bedWeeds(town, k, lastSeenMs) >= 0.05).length;
  if (weedy > 0) lines.push(`Weeds have come up in ${weedy} garden bed${weedy === 1 ? '' : 's'}.`);

  // Project progress made by helpers while away, worked out on a copy.
  const before = structuredClone(town);
  settleProjects(before, world, lastSeenMs);
  const after = structuredClone(before);
  const events = settleProjects(after, world, nowMs);
  for (const def of world.projects) {
    const b = before.projects[def.id];
    if (!b || b.startedMs == null || b.completedMs != null || !def.helper) continue;
    const helper = world.npcs.find((n) => n.id === def.helper)?.name ?? 'Your neighbour';
    if (events.includes(`project:done:${def.id}`)) {
      lines.push(`${helper} finished the last of the work: the ${def.name.toLowerCase()} is done!`);
      continue;
    }
    const stagesDone = after.projects[def.id]!.stage - b.stage;
    const hoursBefore = helperLabour(before, def, lastSeenMs);
    const hoursAfter = helperLabour(after, def, nowMs);
    if (stagesDone > 0) lines.push(`${helper} kept working on the ${def.name.toLowerCase()} and finished a stage.`);
    else if (hoursAfter > hoursBefore) lines.push(`${helper} put in ${hoursAfter - hoursBefore} more hours on the ${def.name.toLowerCase()}.`);
  }
  return { awayHours, lines };
}
