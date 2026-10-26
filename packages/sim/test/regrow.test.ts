import { describe, expect, it } from 'vitest';
import {
  AMBIENT_DAY_MS,
  apply,
  checkPlace,
  createTown,
  decodeSnapshot,
  hashString,
  hasBrush,
  hasRubble,
  summariseAbsence,
  tile,
  treeAt,
  walkable,
  type Command,
  type Town,
  type World,
} from '../src/index.ts';
import { catalog, testWorld } from './fixtures.ts';

const HOUR = 3_600_000;
const EPOCH = 1_000_000;

/** The test world with a few trees, rubble on the lot, renewable rocks and regrowth rules. */
function world(): World {
  const w = testWorld();
  const rows = [...w.map.rows];
  rows[6] = '.T.D...~....'; // a live tree at (1,6), a dead one at (3,6)
  return {
    ...w,
    map: { ...w.map, rows, rubble: ['1,1'] },
    sites: w.sites.map((s) => (s.id === 'rocks' ? { ...s, uses: 2, refillMs: 2 * HOUR } : s)),
    chop: { T: { name: 'tree', yields: { boards: 3 }, regrowMs: 24 * HOUR }, D: { name: 'dead tree', yields: { boards: 2 } } },
    regrow: { brushEveryMs: 4 * HOUR, brushPerTime: 2, brushCap: 5, brushYields: { boards: 1 }, rubbleYields: { stone: 1, boards: 1 } },
  };
}

const W = world();
let n = 0;
type NoId<T> = T extends unknown ? Omit<T, 'id'> : never;
const go = (t: Town, cmd: NoId<Command>) => apply(t, catalog, { id: `r${++n}`, ...cmd } as Command, W);
const fresh = (inventory: Record<string, number> = {}) => createTown({ townId: 't', seed: 'seed-1', nowMs: EPOCH, inventory, world: W, catalog });
const put = (t: Town, x: number, y: number) => (t.player = { x, y });

describe('chopping trees', () => {
  it('a living tree gives boards, leaves a walkable stump, and grows back in a day', () => {
    const t = fresh();
    put(t, 1, 7);
    expect(walkable(t, W, catalog, 1, 6)).toBe(false);
    expect(go(t, { type: 'chop', x: 1, y: 6, nowMs: EPOCH }).ok).toBe(true);
    expect(t.inventory.boards).toBe(3);
    expect(walkable(t, W, catalog, 1, 6)).toBe(true);
    expect(go(t, { type: 'chop', x: 1, y: 6, nowMs: EPOCH }).reason).toBe('No tree to chop here');

    go(t, { type: 'tick', nowMs: EPOCH + 23 * HOUR });
    expect(treeAt(t, W, 1, 6)).toBeUndefined();
    go(t, { type: 'tick', nowMs: EPOCH + 25 * HOUR });
    expect(treeAt(t, W, 1, 6)).toBeDefined();
    expect(walkable(t, W, catalog, 1, 6)).toBe(false);
  });

  it("doesn't grow back on top of the player", () => {
    const t = fresh();
    put(t, 1, 7);
    go(t, { type: 'chop', x: 1, y: 6, nowMs: EPOCH });
    put(t, 1, 6);
    go(t, { type: 'tick', nowMs: EPOCH + 30 * HOUR });
    expect(treeAt(t, W, 1, 6)).toBeUndefined();
    put(t, 1, 7);
    go(t, { type: 'tick', nowMs: EPOCH + 31 * HOUR });
    expect(treeAt(t, W, 1, 6)).toBeDefined();
  });

  it('a dead tree is cleared for good', () => {
    const t = fresh();
    put(t, 3, 7);
    expect(go(t, { type: 'chop', x: 3, y: 6, nowMs: EPOCH }).ok).toBe(true);
    expect(t.inventory.boards).toBe(2);
    go(t, { type: 'tick', nowMs: EPOCH + 1000 * HOUR });
    expect(treeAt(t, W, 3, 6)).toBeUndefined();
  });

  it('must be in reach', () => {
    const t = fresh();
    expect(go(t, { type: 'chop', x: 1, y: 6, nowMs: EPOCH }).reason).toBe('Walk closer first');
  });
});

describe('brush grows back', () => {
  it('sprouts on empty lot ground every few hours, up to a cap, never on beds or buildings', () => {
    const t = fresh({ boards: 50 });
    go(t, { type: 'till', x: 2, y: 3, nowMs: EPOCH });
    go(t, { type: 'tick', nowMs: EPOCH }); // starts the regrowth clock
    expect(t.sprouts).toEqual([]);
    go(t, { type: 'tick', nowMs: EPOCH + 4 * HOUR + 1 });
    expect(t.sprouts).toHaveLength(2);
    go(t, { type: 'tick', nowMs: EPOCH + 400 * HOUR });
    const all = [...t.sprouts, ...W.map.brush.filter((b) => !t.cleared.includes(b))];
    expect(all.length).toBeLessThanOrEqual(5);
    expect(t.sprouts).not.toContain('2,3');
    expect(t.sprouts).not.toContain('1,1'); // rubble
  });

  it('clearing a sprout gives a board and removes it', () => {
    const t = fresh();
    go(t, { type: 'tick', nowMs: EPOCH });
    go(t, { type: 'tick', nowMs: EPOCH + 5 * HOUR });
    const [x, y] = t.sprouts[0]!.split(',').map(Number) as [number, number];
    put(t, x, y);
    expect(hasBrush(t, W, x, y)).toBe(true);
    expect(go(t, { type: 'clearBrush', x, y }).ok).toBe(true);
    expect(hasBrush(t, W, x, y)).toBe(false);
    expect(t.inventory.boards).toBe(1);
  });

  it('is the same whichever way time is settled (one long tick or many short ones)', () => {
    const a = fresh();
    const b = fresh();
    go(a, { type: 'tick', nowMs: EPOCH });
    go(b, { type: 'tick', nowMs: EPOCH });
    go(a, { type: 'tick', nowMs: EPOCH + 20 * HOUR });
    for (let h = 1; h <= 20; h++) go(b, { type: 'tick', nowMs: EPOCH + h * HOUR });
    expect(b.sprouts).toEqual(a.sprouts);
  });
});

describe('rubble', () => {
  it('clears for stone and a board, and blocks building and digging until then', () => {
    const t = fresh({ boards: 10 });
    put(t, 1, 2);
    expect(checkPlace(t, catalog, 'pier', tile(1, 1), 0, W)).toEqual({ ok: false, reason: 'Clear the rubble first' });
    expect(go(t, { type: 'till', x: 1, y: 1, nowMs: EPOCH }).reason).toBe('Clear the rubble first');
    expect(go(t, { type: 'clearRubble', x: 1, y: 1 }).ok).toBe(true);
    expect(t.inventory).toMatchObject({ stone: 1, boards: 11 });
    expect(hasRubble(t, W, 1, 1)).toBe(false);
  });

  it('under an existing bed or building counts as gone (older saves)', () => {
    const t = fresh();
    t.soil['1,1'] = { tilledMs: 0, lastWeededMs: 0 };
    expect(hasRubble(t, W, 1, 1)).toBe(false);
  });
});

describe('filling in a bed', () => {
  it('removes the bed and its crop so the ground can be built on', () => {
    const t = fresh({ seed_greens: 1, boards: 10 });
    put(t, 2, 2);
    go(t, { type: 'till', x: 2, y: 3, nowMs: EPOCH });
    go(t, { type: 'plant', x: 2, y: 3, cropId: 'greens', nowMs: EPOCH });
    expect(go(t, { type: 'fill', x: 2, y: 3 }).events).toEqual(['garden:filled:greens']);
    expect(t.soil['2,3']).toBeUndefined();
    expect(t.crops['2,3']).toBeUndefined();
    expect(checkPlace(t, catalog, 'pier', tile(2, 3), 0, W).ok).toBe(true);
  });
});

describe('renewable sites', () => {
  it('loose rock gets a use back every two hours', () => {
    const t = fresh();
    put(t, 5, 7);
    expect(go(t, { type: 'salvage', siteId: 'rocks', nowMs: EPOCH }).ok).toBe(true);
    expect(go(t, { type: 'salvage', siteId: 'rocks', nowMs: EPOCH }).ok).toBe(true);
    expect(go(t, { type: 'salvage', siteId: 'rocks', nowMs: EPOCH }).reason).toBe('Nothing useful left here');
    go(t, { type: 'tick', nowMs: EPOCH + 2 * HOUR + 1 });
    expect(t.sites.rocks!.used).toBe(1);
    go(t, { type: 'tick', nowMs: EPOCH + 10 * HOUR });
    expect(t.sites.rocks).toEqual({ used: 0 });
  });

  it('one-off sites stay empty', () => {
    const t = fresh();
    put(t, 2, 7);
    go(t, { type: 'salvage', siteId: 'shed', nowMs: EPOCH });
    go(t, { type: 'salvage', siteId: 'shed', nowMs: EPOCH });
    go(t, { type: 'tick', nowMs: EPOCH + 1000 * HOUR });
    expect(t.sites.shed!.used).toBe(2);
  });
});

describe('no dead ends', () => {
  it('with nothing in hand and every one-off site stripped, boards and stone can still be had', () => {
    const t = fresh();
    t.sites = { shed: { used: 99 }, rocks: { used: 2, refillMs: EPOCH } };
    t.cleared = [...W.map.brush, ...(W.map.rubble ?? [])];
    put(t, 1, 7);
    expect(go(t, { type: 'chop', x: 1, y: 6, nowMs: EPOCH }).ok).toBe(true);
    go(t, { type: 'tick', nowMs: EPOCH + 3 * HOUR });
    put(t, 5, 7);
    expect(go(t, { type: 'salvage', siteId: 'rocks', nowMs: EPOCH + 3 * HOUR }).ok).toBe(true);
    expect(t.inventory.boards).toBeGreaterThan(0);
    expect(t.inventory.stone).toBeGreaterThan(0);
  });
});

describe('working alongside the neighbour', () => {
  it('raises friendship once a day', () => {
    const t = fresh();
    t.npcs.rosa!.met = true;
    put(t, 3, 8);
    const day = (d: number) => EPOCH + d * AMBIENT_DAY_MS + AMBIENT_DAY_MS / 3;
    expect(go(t, { type: 'work', projectId: 'path', nowMs: day(0) }).events).toContain('npc:worked_together:rosa');
    go(t, { type: 'work', projectId: 'path', nowMs: day(0) + 1000 });
    expect(t.npcs.rosa!.friendship).toBe(3);
    go(t, { type: 'work', projectId: 'path', nowMs: day(1) });
    expect(t.npcs.rosa!.friendship).toBe(6);
  });
});

describe('save v2 → v3', () => {
  it('adds the regrowth fields and keeps everything else', () => {
    const t = fresh({ boards: 7 });
    const old = JSON.parse(JSON.stringify(t)) as Record<string, unknown>;
    old.schemaVersion = 2;
    delete old.sprouts;
    delete old.felled;
    delete old.growMs;
    const body = JSON.stringify(old);
    const snap = { schemaVersion: 2, savedAt: 1, body, checksum: hashString(body).toString(16) };
    const back = decodeSnapshot(snap, { world: W, catalog });
    expect(back).toMatchObject({ schemaVersion: 4, sprouts: [], felled: {}, growMs: null, inventory: { boards: 7 }, kiosk: { pendingSales: [], pendingOrders: [] } });
  });
});

describe('the away card', () => {
  it('mentions trees and brush that grew back', () => {
    const t = fresh();
    put(t, 1, 7);
    go(t, { type: 'chop', x: 1, y: 6, nowMs: EPOCH });
    const lines = summariseAbsence(t, W, EPOCH, EPOCH + 30 * HOUR).lines.join(' ');
    expect(lines).toContain('1 tree has grown back');
    expect(lines).toContain('Brush has sprung up again');
  });
});
