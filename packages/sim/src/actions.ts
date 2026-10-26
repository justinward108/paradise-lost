/**
 * World actions: walking, clearing, salvaging, gardening, talking, community work.
 *
 * Unlike building, these are not undoable (you can't un-give a gift or un-harvest a crop).
 * Actions that depend on time carry the moment they happened (`nowMs`), so replaying a
 * command log gives the same town.
 */
import { bedWeeds, cropStatus, harvestAmount, recordWatering, today } from './garden.ts';
import { slotKey, tile } from './grid.ts';
import { inReach, findPath, walkable } from './nav.ts';
import { addFriendship, FRIENDSHIP, npcPosition } from './npc.ts';
import { materialsMet, settleProjects, helperLabour } from './project.ts';
import { rainOnDay } from './time.ts';
import type { Catalog, Town } from './types.ts';
import { growBack } from './regrow.ts';
import { DEFAULT_REGROW, hasBrush, hasRubble, inLot, projectComplete, siteRemaining, terrainAt, treeAt, type Point, type World } from './world.ts';

export type WorldCommand =
  | { type: 'move'; id: string; to: Point }
  | { type: 'clearBrush'; id: string; x: number; y: number }
  | { type: 'clearRubble'; id: string; x: number; y: number }
  | { type: 'chop'; id: string; x: number; y: number; nowMs: number }
  | { type: 'salvage'; id: string; siteId: string; nowMs?: number }
  | { type: 'fill'; id: string; x: number; y: number }
  | { type: 'till'; id: string; x: number; y: number; nowMs: number }
  | { type: 'plant'; id: string; x: number; y: number; cropId: string; nowMs: number }
  | { type: 'water'; id: string; x: number; y: number; nowMs: number }
  | { type: 'weed'; id: string; x: number; y: number; nowMs: number }
  | { type: 'harvest'; id: string; x: number; y: number; nowMs: number }
  | { type: 'talk'; id: string; npcId: string; nowMs: number }
  | { type: 'gift'; id: string; npcId: string; item: string; nowMs: number }
  | { type: 'contribute'; id: string; projectId: string; item: string; amount: number; nowMs: number }
  | { type: 'work'; id: string; projectId: string; nowMs: number }
  | { type: 'tick'; id: string; nowMs: number }
  | { type: 'kioskSell'; id: string; requestKey: string; item: string; qty: number }
  | { type: 'kioskSettle'; id: string; requestKey: string; acceptedQty: number }
  | { type: 'kioskOrder'; id: string; requestKey: string; offer: string }
  | { type: 'kioskDeliver'; id: string; requestKey: string; item: string; qty: number }
  | { type: 'kioskCancel'; id: string; requestKey: string };

export interface ActionResult {
  ok: boolean;
  reason?: string;
  changed: boolean;
  /** Things that happened, for the UI to describe ("npc:first_meet", "gain:boards:4", …). */
  events?: string[];
}

const no = (reason: string): ActionResult => ({ ok: false, reason, changed: false });
const yes = (events: string[] = []): ActionResult => ({ ok: true, changed: true, events });

function gain(town: Town, items: Record<string, number>, events: string[]): void {
  for (const [m, n] of Object.entries(items)) {
    if (n <= 0) continue;
    town.inventory[m] = (town.inventory[m] ?? 0) + n;
    events.push(`gain:${m}:${n}`);
  }
}

function tooFar(town: Town, p: Point): boolean {
  return !inReach(town.player, p);
}

const FAR = 'Walk closer first';

function bedKey(x: number, y: number) {
  return `${x},${y}`;
}

export function applyWorld(town: Town, catalog: Catalog, world: World, cmd: WorldCommand): ActionResult {
  const nowMs = 'nowMs' in cmd ? cmd.nowMs : undefined;
  const pre = nowMs !== undefined ? [...growBack(town, world, nowMs), ...settleProjects(town, world, nowMs)] : [];
  const result = run(town, catalog, world, cmd);
  if (pre.length > 0) {
    // Time passing finished something before this action; report it either way.
    return { ...result, changed: true, ok: result.ok, events: [...pre, ...(result.events ?? [])] };
  }
  return result;
}

function run(town: Town, catalog: Catalog, world: World, cmd: WorldCommand): ActionResult {
  switch (cmd.type) {
    case 'tick':
      return { ok: true, changed: false, events: [] };

    case 'kioskSell':
    case 'kioskSettle':
    case 'kioskOrder':
    case 'kioskDeliver':
    case 'kioskCancel':
      return runKiosk(town, world, cmd);

    case 'move': {
      const { x, y } = cmd.to;
      if (x === town.player.x && y === town.player.y) return { ok: true, changed: false };
      if (!walkable(town, world, catalog, x, y)) return no("You can't stand there");
      const path = findPath(town, world, catalog, town.player, (p) => p.x === x && p.y === y);
      if (!path) return no("You can't get there from here");
      town.player = { x, y };
      return yes();
    }

    case 'clearBrush': {
      if (!hasBrush(town, world, cmd.x, cmd.y)) return no('No brush here');
      if (tooFar(town, cmd)) return no(FAR);
      const key = bedKey(cmd.x, cmd.y);
      const sprout = town.sprouts.indexOf(key);
      if (sprout >= 0) town.sprouts.splice(sprout, 1);
      else town.cleared.push(key);
      const events = ['brush:cleared'];
      gain(town, (world.regrow ?? DEFAULT_REGROW).brushYields, events);
      return yes(events);
    }

    case 'clearRubble': {
      if (!hasRubble(town, world, cmd.x, cmd.y)) return no('No rubble here');
      if (tooFar(town, cmd)) return no(FAR);
      town.cleared.push(bedKey(cmd.x, cmd.y));
      const events = ['rubble:cleared'];
      gain(town, (world.regrow ?? DEFAULT_REGROW).rubbleYields, events);
      return yes(events);
    }

    case 'chop': {
      const tree = treeAt(town, world, cmd.x, cmd.y);
      if (!tree) return no('No tree to chop here');
      if (tooFar(town, cmd)) return no(FAR);
      town.felled[bedKey(cmd.x, cmd.y)] = cmd.nowMs;
      const events = [`chop:${tree.name}`];
      gain(town, tree.yields, events);
      return yes(events);
    }

    case 'fill': {
      const key = bedKey(cmd.x, cmd.y);
      if (!(key in town.soil)) return no('No garden bed here');
      if (tooFar(town, cmd)) return no(FAR);
      const crop = town.crops[key];
      delete town.soil[key];
      delete town.crops[key];
      return yes([crop ? `garden:filled:${crop.cropId}` : 'garden:filled']);
    }

    case 'salvage': {
      const site = world.sites.find((s) => s.id === cmd.siteId);
      if (!site) return no('Nothing to salvage');
      if (site.requiresProject && !projectComplete(town, site.requiresProject)) return no('The way there is still blocked');
      if (siteRemaining(town, site) <= 0) return no('Nothing useful left here');
      if (tooFar(town, site)) return no(FAR);
      const prev = town.sites[site.id];
      town.sites[site.id] = { ...prev, used: (prev?.used ?? 0) + 1 };
      if (site.refillMs && cmd.nowMs !== undefined) town.sites[site.id]!.refillMs ??= cmd.nowMs;
      const events = [`salvage:${site.id}`];
      gain(town, site.yields, events);
      if (siteRemaining(town, site) === 0) events.push(`salvage:empty:${site.id}`);
      return yes(events);
    }

    case 'till': {
      const { x, y } = cmd;
      if (!inLot(town, x, y)) return no('You can only dig on your own lot');
      if (terrainAt(town, world, x, y) !== 'L') return no("The ground here can't be dug");
      if (hasBrush(town, world, x, y)) return no('Clear the brush first');
      if (hasRubble(town, world, x, y)) return no('Clear the rubble first');
      if (bedKey(x, y) in town.soil) return no('Already a garden bed');
      for (const layer of ['foundation', 'floor', 'object'] as const) {
        if (slotKey(tile(x, y), layer) in town.pieces) return no('Something is built here');
      }
      if (tooFar(town, cmd)) return no(FAR);
      town.soil[bedKey(x, y)] = { tilledMs: cmd.nowMs, lastWeededMs: cmd.nowMs };
      return yes(['garden:tilled']);
    }

    case 'plant': {
      const key = bedKey(cmd.x, cmd.y);
      const def = world.crops[cmd.cropId];
      if (!def) return no('Unknown crop');
      if (!(key in town.soil)) return no('Dig a garden bed first');
      if (key in town.crops) return no('Something is already growing here');
      if ((town.inventory[def.seed] ?? 0) < 1) return no(`You have no ${def.name} to plant`);
      if (tooFar(town, cmd)) return no(FAR);
      town.inventory[def.seed]! -= 1;
      town.crops[key] = { cropId: def.id, sinceDay: today(town, cmd.nowMs), wateredDays: [], harvests: 0 };
      return yes([`garden:planted:${def.id}`]);
    }

    case 'water': {
      const crop = town.crops[bedKey(cmd.x, cmd.y)];
      if (!crop) return no('Nothing planted here');
      const d = today(town, cmd.nowMs);
      if (rainOnDay(town, d)) return no('The rain has watered it today');
      if (crop.wateredDays.includes(d)) return no('Already watered today');
      if (tooFar(town, cmd)) return no(FAR);
      recordWatering(crop, d);
      return yes(['garden:watered']);
    }

    case 'weed': {
      const key = bedKey(cmd.x, cmd.y);
      const soil = town.soil[key];
      if (!soil) return no('No garden bed here');
      if (bedWeeds(town, key, cmd.nowMs) < 0.01) return no('No weeds yet');
      if (tooFar(town, cmd)) return no(FAR);
      soil.lastWeededMs = cmd.nowMs;
      return yes(['garden:weeded']);
    }

    case 'harvest': {
      const key = bedKey(cmd.x, cmd.y);
      const crop = town.crops[key];
      if (!crop) return no('Nothing planted here');
      const def = world.crops[crop.cropId];
      if (!def) return no('Unknown crop');
      const status = cropStatus(town, def, crop, cmd.nowMs);
      if (!status.ready) return no(`Not ready yet (${status.growth} of ${status.need} watered days)`);
      if (tooFar(town, cmd)) return no(FAR);
      const weeds = bedWeeds(town, key, cmd.nowMs);
      const events = [`garden:harvested:${def.id}`];
      town.progress.harvests = (town.progress.harvests ?? 0) + 1;
      gain(town, Object.fromEntries(Object.entries(def.yields).map(([m, n]) => [m, harvestAmount(n, weeds)])), events);
      if (def.regrowDays) {
        crop.sinceDay = today(town, cmd.nowMs);
        crop.harvests += 1;
        crop.wateredDays = [];
      } else delete town.crops[key];
      return yes(events);
    }

    case 'talk': {
      const def = world.npcs.find((n) => n.id === cmd.npcId);
      const st = town.npcs[cmd.npcId];
      if (!def || !st) return no('Nobody here');
      const pos = npcPosition(town, world, def, cmd.nowMs);
      if (pos.inside) return no(`${def.name} has gone in for the night`);
      if (tooFar(town, pos)) return no(FAR);
      const d = today(town, cmd.nowMs);
      const events: string[] = [];
      if (!st.met) {
        st.met = true;
        st.lastTalkDay = d;
        addFriendship(town, def.id, FRIENDSHIP.firstMeet);
        events.push(`npc:first_meet:${def.id}`);
        gain(town, def.firstGift, events);
      } else if (st.lastTalkDay !== d) {
        st.lastTalkDay = d;
        addFriendship(town, def.id, FRIENDSHIP.dailyChat);
        events.push(`npc:chat:${def.id}`);
      } else {
        events.push(`npc:chat_again:${def.id}`);
      }
      teachIfReady(town, world, def.id, events);
      return { ok: true, changed: true, events };
    }

    case 'gift': {
      const def = world.npcs.find((n) => n.id === cmd.npcId);
      const st = town.npcs[cmd.npcId];
      if (!def || !st) return no('Nobody here');
      if (!st.met) return no('Say hello first');
      const pos = npcPosition(town, world, def, cmd.nowMs);
      if (pos.inside) return no(`${def.name} has gone in for the night`);
      if ((town.inventory[cmd.item] ?? 0) < 1) return no("You don't have that");
      const d = today(town, cmd.nowMs);
      if (st.lastGiftDay === d) return no(`You've already given ${def.name} something today`);
      if (tooFar(town, pos)) return no(FAR);
      town.inventory[cmd.item]! -= 1;
      st.lastGiftDay = d;
      const liked = def.likes.includes(cmd.item);
      addFriendship(town, def.id, liked ? FRIENDSHIP.likedGift : FRIENDSHIP.gift);
      const events = [liked ? `npc:gift_liked:${def.id}:${cmd.item}` : `npc:gift:${def.id}:${cmd.item}`];
      teachIfReady(town, world, def.id, events);
      return yes(events);
    }

    case 'contribute': {
      const def = world.projects.find((p) => p.id === cmd.projectId);
      const st = town.projects[cmd.projectId];
      if (!def || !st) return no('No such project');
      if (st.completedMs != null) return no('This is already finished');
      if (!def.tiles.some((t) => inReach(town.player, t))) return no(FAR);
      const stage = st.stages[st.stage]!;
      const need = (def.stages[st.stage]!.materials[cmd.item] ?? 0) - (stage.given[cmd.item] ?? 0);
      if (need <= 0) return no(`This stage doesn't need ${cmd.item}`);
      const have = town.inventory[cmd.item] ?? 0;
      if (have <= 0) return no(`You have no ${cmd.item}`);
      const n = Math.min(need, have, Math.max(1, Math.floor(cmd.amount)));
      town.inventory[cmd.item] = have - n;
      st.startedMs ??= cmd.nowMs;
      stage.startedMs ??= cmd.nowMs;
      stage.given[cmd.item] = (stage.given[cmd.item] ?? 0) + n;
      if (materialsMet(stage, def.stages[st.stage]!.materials)) stage.materialsMetMs = cmd.nowMs;
      st.ledger.push({ what: cmd.item, amount: n, ms: cmd.nowMs });
      const events = [`project:gave:${def.id}:${cmd.item}:${n}`, ...settleProjects(town, world, cmd.nowMs)];
      return yes(events);
    }

    case 'work': {
      const def = world.projects.find((p) => p.id === cmd.projectId);
      const st = town.projects[cmd.projectId];
      if (!def || !st) return no('No such project');
      if (st.completedMs != null) return no('This is already finished');
      if (!def.tiles.some((t) => inReach(town.player, t))) return no(FAR);
      const stage = st.stages[st.stage]!;
      const sdef = def.stages[st.stage]!;
      const left = sdef.labour - stage.playerLabour - helperLabour(town, def, cmd.nowMs);
      if (left <= 0) return no('The work for this stage is done; it needs materials');
      st.startedMs ??= cmd.nowMs;
      stage.startedMs ??= cmd.nowMs;
      stage.playerLabour += 1;
      st.ledger.push({ what: 'labour', amount: 1, ms: cmd.nowMs });
      const events = [`project:worked:${def.id}`];
      // Working alongside the neighbour brings you closer, once a day.
      const helper = def.helper ? town.npcs[def.helper] : undefined;
      const d = today(town, cmd.nowMs);
      if (def.helper && helper?.met && helper.lastWorkDay !== d) {
        helper.lastWorkDay = d;
        addFriendship(town, def.helper, FRIENDSHIP.workedTogether);
        events.push(`npc:worked_together:${def.helper}`);
        teachIfReady(town, world, def.helper, events);
      }
      events.push(...settleProjects(town, world, cmd.nowMs));
      return yes(events);
    }
  }
}

/** Most goods the kiosk takes in one sale (poor.camp enforces the same limit). */
export const KIOSK_MAX_SALE = 50;

function runKiosk(town: Town, world: World, cmd: Extract<WorldCommand, { type: `kiosk${string}` }>): ActionResult {
  const k = (town.kiosk ??= { pendingSales: [], pendingOrders: [] });
  const atKiosk = () => world.kiosk !== undefined && inReach(town.player, world.kiosk);
  switch (cmd.type) {
    case 'kioskSell': {
      if (!world.kiosk) return no('There is no kiosk here');
      if (!atKiosk()) return no(FAR);
      if (!Number.isSafeInteger(cmd.qty) || cmd.qty < 1 || cmd.qty > KIOSK_MAX_SALE) return no(`Sell between 1 and ${KIOSK_MAX_SALE} at a time`);
      if ((town.inventory[cmd.item] ?? 0) < cmd.qty) return no("You don't have that many");
      if (k.pendingSales.some((s) => s.key === cmd.requestKey)) return no('Already sent');
      town.inventory[cmd.item]! -= cmd.qty;
      k.pendingSales.push({ key: cmd.requestKey, item: cmd.item, qty: cmd.qty });
      return yes([`kiosk:selling:${cmd.item}:${cmd.qty}`]);
    }
    case 'kioskSettle': {
      const i = k.pendingSales.findIndex((s) => s.key === cmd.requestKey);
      if (i < 0) return no('No such sale');
      const sale = k.pendingSales[i]!;
      const accepted = Math.max(0, Math.min(sale.qty, Math.floor(cmd.acceptedQty)));
      k.pendingSales.splice(i, 1);
      if (sale.qty > accepted) town.inventory[sale.item] = (town.inventory[sale.item] ?? 0) + sale.qty - accepted;
      return yes([`kiosk:sold:${sale.item}:${accepted}`, ...(sale.qty > accepted ? [`kiosk:returned:${sale.item}:${sale.qty - accepted}`] : [])]);
    }
    case 'kioskOrder': {
      if (!world.kiosk) return no('There is no kiosk here');
      if (!atKiosk()) return no(FAR);
      if (k.pendingOrders.some((o) => o.key === cmd.requestKey)) return no('Already ordered');
      k.pendingOrders.push({ key: cmd.requestKey, offer: cmd.offer });
      return yes([`kiosk:ordered:${cmd.offer}`]);
    }
    case 'kioskDeliver': {
      const i = k.pendingOrders.findIndex((o) => o.key === cmd.requestKey);
      if (i < 0) return no('Already delivered');
      if (!Number.isSafeInteger(cmd.qty) || cmd.qty < 1) return no('Nothing to deliver');
      k.pendingOrders.splice(i, 1);
      const events = ['kiosk:delivered'];
      gain(town, { [cmd.item]: cmd.qty }, events);
      return yes(events);
    }
    case 'kioskCancel': {
      const i = k.pendingOrders.findIndex((o) => o.key === cmd.requestKey);
      if (i < 0) return no('No such order');
      k.pendingOrders.splice(i, 1);
      return yes(['kiosk:cancelled']);
    }
  }
}

function teachIfReady(town: Town, world: World, npcId: string, events: string[]): void {
  const def = world.npcs.find((n) => n.id === npcId);
  const st = town.npcs[npcId];
  if (!def || !st || st.taught || st.friendship < def.lessonAt) return;
  st.taught = true;
  town.progress.tier = Math.max(town.progress.tier, def.lessonTier);
  events.push(`npc:lesson:${def.id}`);
  gain(town, def.lessonGift, events);
}
