/**
 * NPC routines and friendship.
 */
import { ambientTime } from './time.ts';
import type { Town } from './types.ts';
import { projectComplete, type NpcDef, type Point, type ScheduleStop, type World } from './world.ts';

export interface NpcWhereabouts extends Point {
  inside: boolean;
  stop: ScheduleStop;
}

/** Where an NPC is at `nowMs`, from her schedule and the ambient clock. */
export function npcPosition(town: Town, world: World, def: NpcDef, nowMs: number): NpcWhereabouts {
  const hour = ambientTime(town, nowMs).hour;
  const valid = def.schedule.filter((s) => {
    if (!s.whileProject) return true;
    const p = town.projects[s.whileProject];
    return p?.startedMs != null && !projectComplete(town, s.whileProject);
  });
  const sorted = [...valid].sort((a, b) => a.fromHour - b.fromHour);
  let stop = sorted[sorted.length - 1]!; // before the first stop of the day, the last one (night) applies
  for (const s of sorted) if (s.fromHour <= hour) stop = s;
  return { x: stop.x, y: stop.y, inside: Boolean(stop.inside), stop };
}

export const FRIENDSHIP = {
  firstMeet: 5,
  dailyChat: 2,
  gift: 4,
  likedGift: 8,
  max: 100,
} as const;

export function addFriendship(town: Town, npcId: string, n: number): void {
  const s = town.npcs[npcId];
  if (s) s.friendship = Math.min(FRIENDSHIP.max, s.friendship + n);
}

/** Friendship as a word, for the UI. */
export function friendshipLevel(points: number): string {
  if (points >= 60) return 'Close friend';
  if (points >= 30) return 'Friend';
  if (points >= 10) return 'Acquaintance';
  return 'Stranger';
}
