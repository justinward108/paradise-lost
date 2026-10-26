/**
 * Which relief-kiosk milestones this town has reached. poor.camp pays each one once per
 * account (it decides the amounts); the game only says which have happened.
 */
import { hasShelter } from './town.ts';
import type { Catalog, Town } from './types.ts';
import type { World } from './world.ts';

export function kioskMilestones(town: Town, catalog: Catalog, world: World): string[] {
  const out: string[] = [];
  if (Object.values(town.npcs).some((n) => n.met)) out.push('met-neighbour');
  if ((town.progress.harvests ?? 0) > 0) out.push('first-harvest');
  if (hasShelter(town, catalog)) out.push('shelter');
  const path = world.projects[0];
  const st = path ? town.projects[path.id] : undefined;
  if (st) {
    const done = st.completedMs != null;
    if (done || st.stage >= 1) out.push('path-stage-1');
    if (done || st.stage >= 2) out.push('path-stage-2');
    if (done) out.push('path-done');
  }
  if (town.progress.tier >= 2) out.push('building-tier-2');
  return out;
}
