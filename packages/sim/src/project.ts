/**
 * Community projects (GDD §13): staged public works that need materials and labour.
 *
 * A helper NPC adds one unit of labour every `helperLabourMs` of real time once the player
 * has started the project and the current stage has its materials. That makes every
 * project finishable solo, just more slowly. All of it is computed from stored timestamps,
 * so settling at any later moment gives the same result.
 */
import type { ProjectStageState, ProjectState, Town } from './types.ts';
import type { ProjectDef, World } from './world.ts';

export function materialsMet(stage: ProjectStageState, need: Record<string, number>): boolean {
  return Object.entries(need).every(([m, n]) => (stage.given[m] ?? 0) >= n);
}

function helperActive(town: Town, def: ProjectDef): boolean {
  return def.helper !== undefined && town.npcs[def.helper]?.met === true;
}

/** Labour the helper has put into the current stage by `nowMs`. */
export function helperLabour(town: Town, def: ProjectDef, nowMs: number): number {
  const st = town.projects[def.id];
  if (!st || st.completedMs != null || !helperActive(town, def)) return 0;
  const stage = st.stages[st.stage];
  const sdef = def.stages[st.stage];
  if (!stage || !sdef || stage.startedMs == null || stage.materialsMetMs == null) return 0;
  const t0 = Math.max(stage.startedMs, stage.materialsMetMs);
  const need = Math.max(0, sdef.labour - stage.playerLabour);
  return Math.min(need, Math.max(0, Math.floor((nowMs - t0) / def.helperLabourMs)));
}

/**
 * Advance every project through any stages finished by `nowMs`. Returns events such as
 * "project:stage:path_repair:0" and "project:done:path_repair".
 */
export function settleProjects(town: Town, world: World, nowMs: number): string[] {
  const events: string[] = [];
  for (const def of world.projects) {
    const st: ProjectState | undefined = town.projects[def.id];
    if (!st || st.completedMs != null || st.startedMs == null) continue;

    for (;;) {
      const stage = st.stages[st.stage];
      const sdef = def.stages[st.stage];
      if (!stage || !sdef) break;
      stage.startedMs ??= st.stage === 0 ? st.startedMs : (st.stages[st.stage - 1]?.completedMs ?? nowMs);
      if (!materialsMet(stage, sdef.materials)) break;
      stage.materialsMetMs ??= stage.startedMs;

      const remaining = sdef.labour - stage.playerLabour;
      let doneAt: number | null = null;
      // Player labour or materials only change inside a command, which settles at once,
      // so a stage with nothing left to do finished at this moment.
      if (remaining <= 0) doneAt = nowMs;
      else if (helperActive(town, def)) {
        const t = Math.max(stage.startedMs, stage.materialsMetMs) + remaining * def.helperLabourMs;
        if (t <= nowMs) doneAt = t;
      }
      if (doneAt === null) break;

      stage.completedMs = doneAt;
      events.push(`project:stage:${def.id}:${st.stage}`);
      st.stage += 1;
      if (st.stage >= def.stages.length) {
        st.completedMs = doneAt;
        events.push(`project:done:${def.id}`);
        break;
      }
    }
  }
  return events;
}
