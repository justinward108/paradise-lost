import {privatePlotWorld, expandPrivatePlot, NEIGHBORHOOD} from './privatePlot.ts';
import type { Catalog, Town } from './types.ts';
import { createTown } from './town.ts';
import { walkable } from './nav.ts';
import type { World } from './world.ts';

export const LOCAL_RESIDENT = 'local-player';
export const FOUND_COST = { boards: 20, stone: 10 };
export const MOVE_COST = { boards: 5 };
export const FERRY_COST = { boards: 3 };
const PLACE_KEYS = ['mining', 'animals', 'waterSource', 'pieces', 'soil', 'crops', 'player', 'cleared', 'sprouts', 'felled', 'growMs', 'sites', 'npcs', 'projects', 'history', 'clock', 'width', 'height', 'lot', 'mapId', 'seed'] as const;
export type PlaceState = Pick<Town, typeof PLACE_KEYS[number]>;
export interface Settlement {
  kind?: 'neighborhood';
  id: string; name: string; mayorId: string | null;
  residents: { id: string; name: string }[];
  place: PlaceState;
}
export interface TravelState {
  homeTownId: string | null;
  location: { kind: 'plot' } | { kind: 'town'; townId: string };
  home: PlaceState | null;
  towns: Record<string, Settlement>;
}
export type TravelCommand =
  | {type:'expandPrivatePlot';id:string;nowMs:number}
  | { type: 'foundTown'; id: string; name: string; nowMs: number }
  | { type: 'visitTown'; id: string; townId: string; nowMs: number }
  | { type: 'returnToPlot'; id: string; nowMs: number }
  | { type: 'moveResidence'; id: string; townId: string; nowMs: number }
  | { type: 'appointMayor'; id: string; townId: string; residentId: string; nowMs: number };

const no = (reason: string) => ({ ok: false, changed: false, reason });
const freshTravel = (): TravelState => ({ homeTownId: null, location: { kind: 'plot' }, home: null, towns: {} });
const canPay = (town: Town, cost: Record<string, number>) => Object.entries(cost).every(([id, qty]) => (town.inventory[id] ?? 0) >= qty);
const pay = (town: Town, cost: Record<string, number>) => { for (const [id, qty] of Object.entries(cost)) town.inventory[id]! -= qty; };
function capture(town: Town): PlaceState {
  return structuredClone(Object.fromEntries(PLACE_KEYS.map((key) => [key, town[key]]))) as unknown as PlaceState;
}
function restore(town: Town, place: PlaceState) { town.mining = undefined; town.animals = undefined; town.waterSource = undefined; Object.assign(town, structuredClone(place)); }
function storePlace(town: Town, travel: TravelState) {
  if (travel.location.kind === 'plot') travel.home = capture(town);
  else travel.towns[travel.location.townId]!.place = capture(town);
}

/** Blank town center, using the established terrain and scale; no duplicated named NPCs. */
export function townCenterWorld(base: World, id: string): World {
  const width = 34, height = 34;
  const rows = Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x) =>
    x < 2 || y < 2 || x >= width - 2 || y >= height - 2 ? '~' :
    x >= 10 && x < 24 && y >= 8 && y < 22 ? 'L' :
    x === 17 && y >= 22 ? 'p' : '.').join(''));
  return { ...base, travelBase: base, map: { ...base.map, id: `town-center:${id}`, width, height, rows, lot: { x: 10, y: 8, w: 14, h: 14 }, spawn: { x: 17, y: 23 }, brush: [], rubble: [] }, sites: [], crops: base.crops, npcs: [], projects: [], fixedPieces: [], kiosk: undefined };
}
export function travelWorld(base: World, town: Town): World {
  const location = town.travel?.location;
  return location?.kind === 'town' ? location.townId === NEIGHBORHOOD ? base : townCenterWorld(base, location.townId) : town.privatePlot ? privatePlotWorld(base) : base;
}
export function isTownVisitor(town: Town): boolean {
  const loc = town.travel?.location;
  return loc?.kind === 'town' && town.travel!.towns[loc.townId]?.mayorId !== LOCAL_RESIDENT;
}
function departureProblem(state: TravelState): string | null {
  const old = state.homeTownId ? state.towns[state.homeTownId] : undefined;
  return old?.mayorId === LOCAL_RESIDENT && old.residents.some(r => r.id !== LOCAL_RESIDENT) ? 'Appoint another resident mayor before leaving your town' : null;
}
function moveMember(state: TravelState, id: string) {
  if (state.homeTownId) {
    const old = state.towns[state.homeTownId]!;
    old.residents = old.residents.filter(r => r.id !== LOCAL_RESIDENT);
    if (old.mayorId === LOCAL_RESIDENT) old.mayorId = null;
  }
  state.homeTownId = id;
  if (state.towns[id]!.residents.length === 0 && state.towns[id]!.mayorId === null) state.towns[id]!.mayorId = LOCAL_RESIDENT;
  if (!state.towns[id]!.residents.some(r => r.id === LOCAL_RESIDENT)) state.towns[id]!.residents.push({ id: LOCAL_RESIDENT, name: 'You' });
}

export function runTravel(town: Town, catalog: Catalog, currentWorld: World, cmd: TravelCommand) {
  const base = currentWorld.travelBase ?? currentWorld;
  if (!Number.isSafeInteger(cmd.nowMs) || cmd.nowMs < 0) return no('Invalid travel time');
  const state = structuredClone(town.travel ?? freshTravel());
  let changedLocation = false;
  switch (cmd.type) {
    case 'expandPrivatePlot': return expandPrivatePlot(town, base, state, capture);
    case 'foundTown': {
      if (typeof cmd.name !== 'string') return no('Enter a town name');
      const name = cmd.name.trim().replace(/\s+/g, ' ');
      if (name.length < 2 || name.length > 48 || /[\x00-\x1f\x7f]/.test(cmd.name)) return no('Use a town name with 2–48 characters and no control characters');
      if (Object.values(state.towns).some(t => t.name.toLocaleLowerCase() === name.toLocaleLowerCase())) return no('A local town already has that name');
      const departure = departureProblem(state);
      if (departure) return no(departure);
      const cost = { ...FOUND_COST, boards: FOUND_COST.boards + (state.homeTownId ? MOVE_COST.boards : 0) };
      if (!canPay(town, cost)) return no('Founding costs 20 boards and 10 stone, plus 5 boards if moving from an existing town');
      const id = `town:${cmd.id}`;
      if (Object.hasOwn(state.towns, id)) return no('Town already exists');
      const center = townCenterWorld(base, id);
      const place = capture(createTown({ townId: id, seed: id, nowMs: town.clock.epochMs, inventory: {}, world: center, catalog }));
      state.towns[id] = { id, name, mayorId: LOCAL_RESIDENT, residents: [], place };
      moveMember(state, id);
      pay(town, cost);
      break;
    }
    case 'visitTown': {
      if (!Object.hasOwn(state.towns, cmd.townId)) return no('That destination is not available');
      if (state.location.kind === 'town' && state.location.townId === cmd.townId) return no('You are already in this town center');
      const fare = cmd.townId === NEIGHBORHOOD || (town.inventory.boat ?? 0) > 0 ? {} : FERRY_COST;
      if (!canPay(town, fare)) return no('The ferry costs 3 boards; owners of a boat travel free');
      storePlace(town, state);
      restore(town, state.towns[cmd.townId]!.place);
      state.location = { kind: 'town', townId: cmd.townId };
      pay(town, fare);
      changedLocation = true;
      break;
    }
    case 'returnToPlot': {
      // Always available from a town: no boat, fare, agency, or residency change.
      if (state.location.kind === 'town') {
        if (!state.home) return no('Your saved home plot is unavailable');
        storePlace(town, state);
        restore(town, state.home);
      }
      // Pick a walkable point on the actual plot, even when already at home.
      const candidates: { x: number; y: number }[] = [];
      for (let y = town.lot.y; y < town.lot.y + town.lot.h; y++) for (let x = town.lot.x; x < town.lot.x + town.lot.w; x++) candidates.push({ x, y });
      const centerX = town.lot.x + town.lot.w / 2, centerY = town.lot.y + town.lot.h / 2;
      candidates.sort((a,b) => Math.hypot(a.x-centerX,a.y-centerY)-Math.hypot(b.x-centerX,b.y-centerY));
      const homeWorld = town.privatePlot ? privatePlotWorld(base) : base;
      const landing = candidates.find(p => walkable(town, homeWorld, catalog, p.x, p.y));
      // A fully enclosed/occupied plot must still permit escape to the home arrival point.
      town.player = landing ?? { ...base.map.spawn };
      state.location = { kind: 'plot' };
      changedLocation = true;
      break;
    }
    case 'moveResidence': {
      if (cmd.townId === NEIGHBORHOOD) return no('This is your public neighborhood, not a residential town');
      if (!Object.hasOwn(state.towns, cmd.townId)) return no('That destination is not available');
      if (state.homeTownId === cmd.townId) return no('Your plot already belongs to this town');
      const departure = departureProblem(state);
      if (departure) return no(departure);
      if (state.homeTownId && !canPay(town, MOVE_COST)) return no('Moving towns costs 5 boards');
      if (state.homeTownId) pay(town, MOVE_COST);
      moveMember(state, cmd.townId);
      break;
    }
    case 'appointMayor': {
      const target = Object.hasOwn(state.towns, cmd.townId) ? state.towns[cmd.townId] : undefined;
      if (!target || target.mayorId !== LOCAL_RESIDENT) return no('Only the current mayor can appoint a successor');
      if (!target.residents.some(r => r.id === cmd.residentId)) return no('The next mayor must be a resident');
      target.mayorId = cmd.residentId;
      break;
    }
  }
  town.travel = state;
  return { ok: true, changed: true, events: [changedLocation ? 'travel:location' : 'travel:towns'] };
}
