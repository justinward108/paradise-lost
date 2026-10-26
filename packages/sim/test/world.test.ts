import { describe, expect, it } from 'vitest';
import {
  AMBIENT_DAY_MS,
  apply,
  checkPlace,
  createTown,
  cropStatus,
  decodeSnapshot,
  edge,
  encodeSnapshot,
  findPath,
  goals,
  helperLabour,
  npcPosition,
  rainOnDay,
  settleProjects,
  slotKey,
  summariseAbsence,
  tile,
  walkable,
  type Command,
  type Town,
} from '../src/index.ts';
import { catalog, testWorld } from './fixtures.ts';

const world = testWorld();
const EPOCH = 1_000_000;
/** Real time at a given ambient day and hour. */
const at = (day: number, hour = 9) => EPOCH + day * AMBIENT_DAY_MS + (hour / 24) * AMBIENT_DAY_MS;

let n = 0;
type NoId<T> = T extends unknown ? Omit<T, 'id'> : never;
const go = (town: Town, cmd: NoId<Command>) => apply(town, catalog, { id: `w${++n}`, ...cmd } as Command, world);

function town(inventory: Record<string, number> = {}): Town {
  return createTown({ townId: 't', seed: 'seed-1', nowMs: EPOCH, inventory, world, catalog });
}

/** Teleport for tests: walk the player to (x, y) along a real path. */
function walkTo(t: Town, x: number, y: number) {
  const r = go(t, { type: 'move', to: { x, y } });
  expect(r.ok, r.reason).toBe(true);
}

describe('world setup', () => {
  it('creates the map, spawn, NPC and fixed pieces', () => {
    const t = town();
    expect(t.width).toBe(12);
    expect(t.lot).toEqual({ x: 0, y: 0, w: 6, h: 6 });
    expect(t.player).toEqual({ x: 2, y: 2 });
    expect(t.npcs.rosa?.met).toBe(false);
    expect(slotKey(edge(9, 1, 'n'), 'wall') in t.pieces).toBe(true);
  });
});

describe('walking', () => {
  it('crosses the bridge but not the stream, trees or damaged path', () => {
    const t = town();
    expect(walkable(t, world, catalog, 7, 2)).toBe(true); // bridge
    expect(walkable(t, world, catalog, 7, 3)).toBe(false); // stream
    expect(walkable(t, world, catalog, 3, 9)).toBe(false); // damaged path
    expect(walkable(t, world, catalog, 2, 8)).toBe(false); // the shed is in the way
    walkTo(t, 10, 4);
    expect(go(t, { type: 'move', to: { x: 3, y: 10 } })).toMatchObject({ ok: false, reason: "You can't get there from here" });
  });

  it('walls block walking and doors let you through', () => {
    const t = town({ boards: 100 });
    for (const [x, y] of [[1, 1], [1, 2]] as const) {
      go(t, { type: 'place', pieceId: 'pier', slot: tile(x, y) });
      go(t, { type: 'place', pieceId: 'floor', slot: tile(x, y) });
    }
    // A wall between (1,1) and (1,2).
    go(t, { type: 'place', pieceId: 'wall', slot: edge(1, 2, 'n') });
    t.player = { x: 1, y: 2 };
    expect(findPath(t, world, catalog, t.player, (p) => p.x === 1 && p.y === 1)?.length).toBe(3); // around it
    go(t, { type: 'remove', slot: edge(1, 2, 'n'), layer: 'wall' });
    go(t, { type: 'place', pieceId: 'door', slot: edge(1, 2, 'n') });
    expect(findPath(t, world, catalog, t.player, (p) => p.x === 1 && p.y === 1)?.length).toBe(1);
  });
});

describe('building on the map', () => {
  it('only on your lot, never on brush or garden beds, and the neighbour house is not yours', () => {
    const t = town({ boards: 100 });
    expect(checkPlace(t, catalog, 'pier', tile(6, 0), 0, world)).toEqual({ ok: false, reason: 'Outside your lot' });
    expect(checkPlace(t, catalog, 'pier', tile(4, 4), 0, world)).toEqual({ ok: false, reason: 'Clear the brush first' });
    expect(go(t, { type: 'remove', slot: edge(9, 1, 'n'), layer: 'wall' })).toMatchObject({ ok: false, reason: "That isn't your land" });
  });

  it('a wall on the lot boundary is allowed', () => {
    const t = town({ boards: 100 });
    go(t, { type: 'place', pieceId: 'pier', slot: tile(5, 0) });
    go(t, { type: 'place', pieceId: 'floor', slot: tile(5, 0) });
    expect(go(t, { type: 'place', pieceId: 'wall', slot: edge(6, 0, 'w') }).ok).toBe(true);
  });
});

describe('brush and salvage', () => {
  it('clearing brush gives a board and frees the tile', () => {
    const t = town();
    expect(go(t, { type: 'clearBrush', x: 4, y: 4 })).toMatchObject({ ok: false, reason: 'Walk closer first' });
    walkTo(t, 3, 3);
    expect(go(t, { type: 'clearBrush', x: 4, y: 4 }).ok).toBe(true);
    expect(t.inventory.boards).toBe(1);
    expect(go(t, { type: 'clearBrush', x: 4, y: 4 })).toMatchObject({ ok: false, reason: 'No brush here' });
  });

  it('sites run out and then stop blocking the way', () => {
    const t = town();
    walkTo(t, 2, 7);
    expect(go(t, { type: 'salvage', siteId: 'shed' }).events).toEqual(['salvage:shed', 'gain:boards:4']);
    expect(go(t, { type: 'salvage', siteId: 'shed' }).events).toContain('salvage:empty:shed');
    expect(go(t, { type: 'salvage', siteId: 'shed' })).toMatchObject({ ok: false, reason: 'Nothing useful left here' });
    expect(t.inventory.boards).toBe(8);
    expect(walkable(t, world, catalog, 2, 8)).toBe(true);
  });

  it('a site behind an unfinished project is out of reach', () => {
    const t = town();
    expect(go(t, { type: 'salvage', siteId: 'store' })).toMatchObject({ ok: false, reason: 'The way there is still blocked' });
  });
});

describe('garden', () => {
  function planted(cropId = 'greens') {
    const t = town({ seed_greens: 2, seed_papaya: 1 });
    walkTo(t, 1, 1);
    expect(go(t, { type: 'till', x: 1, y: 0, nowMs: at(0) }).ok).toBe(true);
    expect(go(t, { type: 'plant', x: 1, y: 0, cropId, nowMs: at(0) }).ok).toBe(true);
    return t;
  }

  it('dig, plant, and grow one step per watered day', () => {
    const t = planted();
    const crop = t.crops['1,0']!;
    const def = world.crops.greens!;
    expect(cropStatus(t, def, crop, at(0)).ready).toBe(false);
    // Water by hand on every dry day so growth is predictable.
    for (let d = 0; d < 3; d++) {
      if (!rainOnDay(t, d)) expect(go(t, { type: 'water', x: 1, y: 0, nowMs: at(d) }).ok).toBe(true);
    }
    expect(cropStatus(t, def, crop, at(2))).toMatchObject({ growth: 2, ready: true });
    const r = go(t, { type: 'harvest', x: 1, y: 0, nowMs: at(2) });
    expect(r.events).toEqual(['garden:harvested:greens', 'gain:greens:3']);
    expect(t.crops['1,0']).toBeUndefined();
    expect('1,0' in t.soil).toBe(true);
  });

  it('dry days without watering do not count', () => {
    const t = planted();
    const dry = Array.from({ length: 40 }, (_, d) => d).filter((d) => !rainOnDay(t, d));
    expect(dry.length).toBeGreaterThan(0);
    const crop = t.crops['1,0']!;
    crop.sinceDay = dry[0]!;
    expect(cropStatus(t, world.crops.greens!, crop, at(dry[0]! + 1)).growth).toBe(0);
  });

  it('rejects the obvious mistakes', () => {
    const t = planted();
    expect(go(t, { type: 'plant', x: 1, y: 0, cropId: 'greens', nowMs: at(0) })).toMatchObject({ reason: 'Something is already growing here' });
    expect(go(t, { type: 'till', x: 1, y: 0, nowMs: at(0) })).toMatchObject({ reason: 'Already a garden bed' });
    expect(go(t, { type: 'harvest', x: 1, y: 0, nowMs: at(0) })).toMatchObject({ ok: false });
    expect(go(t, { type: 'till', x: 6, y: 1, nowMs: at(0) })).toMatchObject({ reason: 'You can only dig on your own lot' });
    expect(checkPlace(t, catalog, 'pier', tile(1, 0), 0, world)).toMatchObject({ ok: false, reason: expect.stringContaining("There's a garden bed here") });
  });

  it('perennials regrow after harvest', () => {
    const t = planted('papaya');
    const crop = t.crops['1,0']!;
    crop.wateredDays = Array.from({ length: 10 }, (_, d) => d);
    expect(go(t, { type: 'harvest', x: 1, y: 0, nowMs: at(3) }).ok).toBe(true);
    expect(t.crops['1,0']).toMatchObject({ harvests: 1, sinceDay: 3 });
    expect(cropStatus(t, world.crops.papaya!, t.crops['1,0']!, at(3)).need).toBe(2);
  });

  it('weeds cut the harvest until pulled', () => {
    const t = planted();
    t.crops['1,0']!.wateredDays = [0, 1, 2, 3, 4, 5];
    const late = EPOCH + 200 * 3_600_000; // 200 real hours later: weeds near their cap
    const r = go(t, { type: 'harvest', x: 1, y: 0, nowMs: late });
    expect(r.events).toContain('gain:greens:1');
  });
});

describe('the neighbour', () => {
  it('follows her schedule and stays in at night', () => {
    const t = town();
    const def = world.npcs[0]!;
    expect(npcPosition(t, world, def, at(0, 9))).toMatchObject({ x: 9, y: 2, inside: false });
    expect(npcPosition(t, world, def, at(0, 15))).toMatchObject({ x: 9, y: 2 }); // project not started
    expect(npcPosition(t, world, def, at(0, 23))).toMatchObject({ inside: true });
    expect(npcPosition(t, world, def, at(1, 2))).toMatchObject({ inside: true }); // small hours
  });

  it('first meeting gives seeds; friendship grows by daily chats and gifts; a lesson unlocks tier 2', () => {
    const t = town({ papaya: 3 });
    walkTo(t, 8, 2);
    expect(go(t, { type: 'talk', npcId: 'rosa', nowMs: at(0, 23) })).toMatchObject({ ok: false, reason: 'Rosa has gone in for the night' });
    const first = go(t, { type: 'talk', npcId: 'rosa', nowMs: at(0) });
    expect(first.events).toEqual(['npc:first_meet:rosa', 'gain:seed_greens:4', 'gain:seed_papaya:1']);
    expect(go(t, { type: 'talk', npcId: 'rosa', nowMs: at(0) }).events).toEqual(['npc:chat_again:rosa']);
    expect(go(t, { type: 'gift', npcId: 'rosa', item: 'papaya', nowMs: at(0) }).events).toEqual(['npc:gift_liked:rosa:papaya']);
    expect(go(t, { type: 'gift', npcId: 'rosa', item: 'papaya', nowMs: at(0) })).toMatchObject({ reason: "You've already given Rosa something today" });
    expect(t.npcs.rosa?.friendship).toBe(13);
    go(t, { type: 'talk', npcId: 'rosa', nowMs: at(1) }); // 15
    const lesson = go(t, { type: 'gift', npcId: 'rosa', item: 'papaya', nowMs: at(1) }); // 23
    expect(lesson.events).toEqual(['npc:gift_liked:rosa:papaya', 'npc:lesson:rosa', 'gain:lumber:10']);
    expect(t.progress.tier).toBe(2);
  });
});

describe('community project', () => {
  function started() {
    const t = town({ stone: 6 });
    walkTo(t, 8, 2);
    go(t, { type: 'talk', npcId: 'rosa', nowMs: at(0) });
    walkTo(t, 3, 8);
    expect(go(t, { type: 'work', projectId: 'path', nowMs: at(0) }).ok).toBe(true);
    return t;
  }

  it('the player can finish it alone', () => {
    const t = started();
    go(t, { type: 'work', projectId: 'path', nowMs: at(0) });
    const third = go(t, { type: 'work', projectId: 'path', nowMs: at(0) });
    expect(third.events).toContain('project:stage:path:0');
    // Stage 2: labour can come before its stone arrives.
    expect(go(t, { type: 'work', projectId: 'path', nowMs: at(0) }).events).toEqual(['project:worked:path']);
    expect(go(t, { type: 'contribute', projectId: 'path', item: 'stone', amount: 99, nowMs: at(0) }).ok).toBe(true);
    expect(t.inventory.stone).toBe(0);
    expect(go(t, { type: 'contribute', projectId: 'path', item: 'stone', amount: 1, nowMs: at(0) })).toMatchObject({
      ok: false,
      reason: "This stage doesn't need stone",
    });
    const done = go(t, { type: 'work', projectId: 'path', nowMs: at(0) });
    expect(done.events).toContain('project:done:path');
    expect(walkable(t, world, catalog, 3, 9)).toBe(true);
    walkTo(t, 3, 10);
    expect(go(t, { type: 'salvage', siteId: 'store' }).ok).toBe(true);
  });

  it('the neighbour keeps working while the player is away', () => {
    const t = started();
    const start = at(0);
    const def = world.projects[0]!;
    expect(helperLabour(t, def, start + 10 * 60_000)).toBe(1);
    // Two labour left in stage 1 → done after 20 minutes of her time.
    const events = settleProjects(t, world, start + 20 * 60_000);
    expect(events).toEqual(['project:stage:path:0']);
    expect(t.projects.path!.stage).toBe(1);
    // Stage 2 waits for stone; she can't work without it.
    expect(settleProjects(t, world, start + 1000 * 60_000)).toEqual([]);
    expect(helperLabour(t, def, start + 1000 * 60_000)).toBe(0);
  });

  it('settling is idempotent', () => {
    const t = started();
    const later = at(0) + 60 * 60_000;
    const a = structuredClone(t);
    settleProjects(a, world, later);
    const b = structuredClone(a);
    settleProjects(b, world, later);
    expect(b).toEqual(a);
  });

  it('a tick reports what finished while you were away', () => {
    const t = started();
    const r = go(t, { type: 'tick', nowMs: at(0) + 30 * 60_000 });
    expect(r.events).toContain('project:stage:path:0');
    expect(r.changed).toBe(true);
  });
});

describe('absence summary', () => {
  it('reports days, crops, weeds and the neighbour’s work, the same every time', () => {
    const t = town({ seed_greens: 1 });
    walkTo(t, 1, 1);
    go(t, { type: 'till', x: 1, y: 0, nowMs: at(0) });
    go(t, { type: 'plant', x: 1, y: 0, cropId: 'greens', nowMs: at(0) });
    t.crops['1,0']!.wateredDays = [0, 1, 2, 3, 4];
    walkTo(t, 8, 2);
    go(t, { type: 'talk', npcId: 'rosa', nowMs: at(0) });
    walkTo(t, 3, 8);
    go(t, { type: 'work', projectId: 'path', nowMs: at(0) });

    const away = at(0) + 72 * 3_600_000;
    const s1 = summariseAbsence(t, world, at(0), away);
    expect(summariseAbsence(t, world, at(0), away)).toEqual(s1);
    expect(s1.lines[0]).toMatch(/^90 days passed in town; it rained on \d+ of them\.$/);
    expect(s1.lines).toContain('1 crop is ready to harvest.');
    expect(s1.lines).toContain('Weeds have come up in 1 garden bed.');
    expect(s1.lines.some((l) => l.startsWith('Rosa kept working on the path'))).toBe(true);
  });
});

describe('goals', () => {
  it('tick off as the player does things', () => {
    const t = town();
    expect(goals(t, catalog, world).filter((g) => g.done)).toEqual([]);
    walkTo(t, 2, 7);
    go(t, { type: 'salvage', siteId: 'shed' });
    expect(goals(t, catalog, world).find((g) => g.id === 'salvage')?.done).toBe(true);
  });
});

describe('save migration v1 → v2', () => {
  it('moves a Sprint 1 house onto the map and turns the old plot into a bed', () => {
    const v1 = {
      schemaVersion: 1,
      townId: 'home',
      seed: 's',
      width: 6,
      height: 6,
      pieces: { '0|t|4,4|foundation': { pieceId: 'pier', slot: { kind: 'tile', x: 4, y: 4, level: 0 }, rotation: 0 } },
      inventory: { boards: 40 },
      progress: { tier: 1 },
      clock: { epochMs: 5 },
      plots: { plot1: { id: 'plot1', x: 1, y: 3, lastTendedMs: 7 } },
      history: { undo: [{ commandId: 'x', ops: [], inventoryDelta: {} }], redo: [] },
      appliedIds: ['x'],
    };
    const shifted = { ...world, map: { ...world.map, lot: { x: 2, y: 1, w: 6, h: 6 }, brush: ['6,5'] } };
    const body = JSON.stringify(v1);
    const snap = { ...encodeSnapshot(v1 as unknown as Town, 1), schemaVersion: 1, body };
    snap.checksum = encodeSnapshot(JSON.parse(body), 1).checksum;
    const t = decodeSnapshot(snap, { world: shifted, catalog });
    expect(t.schemaVersion).toBe(3);
    expect(t).toMatchObject({ sprouts: [], felled: {}, growMs: null });
    expect(Object.keys(t.pieces)).toContain('0|t|6,5|foundation'); // 4+2, 4+1
    expect(t.cleared).toEqual(['6,5']); // brush under the old foundation is cleared
    expect(t.soil).toEqual({ '3,4': { tilledMs: 7, lastWeededMs: 7 } });
    expect(t.history).toEqual({ undo: [], redo: [] });
    expect(t.inventory.boards).toBe(40);
    expect(t.npcs.rosa?.met).toBe(false);
    expect(slotKey(edge(9, 1, 'n'), 'wall') in t.pieces).toBe(true); // the neighbour's house appears
  });
});
