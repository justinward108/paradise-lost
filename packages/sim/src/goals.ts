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
  if (town.travel?.location.kind === 'town' && town.travel.location.townId !== 'local-neighborhood') {
    const center = town.travel.towns[town.travel.location.townId];
    return [
      ...(center?.mayorId === 'local-player' ? [{ id: 'townbuild', text: 'Start building the town center', hint: 'Use Build on the central cleared land. Your home plot is stored separately.', done: Object.keys(town.pieces).length > 0 }] : []),
      { id: 'returnplot', text: 'Return to your own plot when ready', hint: 'The Return to my plot button is always free, even without a boat.', done: false },
    ];
  }
  const food = Object.values(world.crops).some((c) => Object.keys(c.yields).some((y) => (town.inventory[y] ?? 0) > 0));
  const neighborhood = town.travel?.location.kind === 'town' && town.travel.location.townId === 'local-neighborhood' ? town : town.travel?.towns['local-neighborhood']?.place;
  const authored = town.privatePlot ? (world.travelBase ?? world) : world;
  const neighbour = authored.npcs[0];
  const project = authored.projects[0];
  return [
    { id: 'brush', text: 'Clear brush from your lot', hint: 'Walk up to the scrub on your lot and click it.', done: town.cleared.length >= 3 },
    {
      id: 'salvage',
      text: 'Salvage building materials',
      hint: 'The collapsed shed south of your lot still has good boards.',
      done: Object.values(neighborhood?.sites ?? town.sites).some((s) => s.used > 0),
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
      hint: town.privatePlot ? 'Open Towns & travel and visit Neighborhood for free.' : 'Cross the footbridge over the stream to the east.',
      done: Object.values(neighborhood?.npcs ?? town.npcs).some((n) => n.met),
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
      done: project ? (neighborhood?.projects ?? town.projects)[project.id]?.completedMs != null : false,
    },
    ...(world.workshop ? [
      { id: 'training', text: 'Complete a book lesson', hint: 'Trade boards or greens with Rosa for learning vouchers, then open Skills & workshop.', done: Object.values(town.career?.skills ?? {}).some((xp) => xp > 0) },
      { id: 'recipe', text: 'Learn a production recipe', hint: 'Skills & workshop lists recipe costs, ingredients and required tools.', done: (town.career?.recipes.length ?? 0) > 0 },
      { id: 'profession', text: 'Qualify for your first profession', hint: 'Reach 6 experience in a subject through study and crafting, then choose its qualification.', done: (town.career?.professions.length ?? 0) > 0 },
      { id: 'multitrade', text: 'Learn a second profession', hint: 'You can qualify in several subjects; choosing one never locks the others.', done: (town.career?.professions.length ?? 0) > 1 },
      { id: 'device', text: 'Build a phone or computer', hint: 'Learn electronics, make the toolkit and components, then assemble a device for online learning.', done: (town.inventory.phone ?? 0) > 0 || (town.inventory.computer ?? 0) > 0 },
    ] : []),
  ];
}
