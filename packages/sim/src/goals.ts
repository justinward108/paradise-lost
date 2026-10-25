/**
 * The opening goals (GDD §6): suggestions, not requirements. Computed from the town, so
 * there are no flags to fall out of step.
 */
import { hasShelter } from './town.ts';
import type { Catalog, Town } from './types.ts';
import type { World } from './world.ts';

export interface Goal {
  id: string;
  text: string;
  hint: string;
  done: boolean;
}

export function goals(town: Town, catalog: Catalog, world: World): Goal[] {
  const food = Object.values(world.crops).some((c) => Object.keys(c.yields).some((y) => (town.inventory[y] ?? 0) > 0));
  const neighbour = world.npcs[0];
  const project = world.projects[0];
  return [
    { id: 'brush', text: 'Clear brush from your lot', hint: 'Walk up to the scrub on your lot and click it.', done: town.cleared.length >= 3 },
    {
      id: 'salvage',
      text: 'Salvage building materials',
      hint: 'The collapsed shed south of your lot still has good boards.',
      done: Object.values(town.sites).some((s) => s.used > 0),
    },
    {
      id: 'shelter',
      text: 'Build a weatherproof shelter',
      hint: 'Foundation, floor, four walls with a door, then a roof.',
      done: hasShelter(town, catalog),
    },
    {
      id: 'neighbour',
      text: neighbour ? `Meet ${neighbour.name}` : 'Meet your neighbour',
      hint: 'Cross the footbridge over the stream to the east.',
      done: Object.values(town.npcs).some((n) => n.met),
    },
    {
      id: 'garden',
      text: 'Plant a garden',
      hint: 'Dig a bed on cleared ground, then plant seeds.',
      done: Object.keys(town.crops).length > 0 || food,
    },
    {
      id: 'path',
      text: project ? `Help repair the ${project.name.toLowerCase()}` : 'Help with a community project',
      hint: 'The washed-out path south of your lot leads to the road.',
      done: project ? town.projects[project.id]?.completedMs != null : false,
    },
  ];
}
