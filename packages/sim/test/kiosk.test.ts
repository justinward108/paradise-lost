import { describe, expect, it } from 'vitest';
import { apply, createTown, decodeSnapshot, hashString, kioskMilestones, type Command, type Town, type World } from '../src/index.ts';
import { catalog, testWorld } from './fixtures.ts';

const W: World = { ...testWorld(), kiosk: { x: 6, y: 2, name: 'Kiosk' } };
let n = 0;
type NoId<T> = T extends unknown ? Omit<T, 'id'> : never;
const go = (t: Town, cmd: NoId<Command>) => apply(t, catalog, { id: `k${++n}`, ...cmd } as Command, W);
const fresh = (inventory: Record<string, number> = {}) => {
  const t = createTown({ townId: 't', seed: 's', nowMs: 0, inventory, world: W, catalog });
  t.player = { x: 5, y: 2 };
  return t;
};

describe('relief kiosk trades', () => {
  it('selling takes the goods first and returns what poor.camp did not take', () => {
    const t = fresh({ papaya: 10 });
    expect(go(t, { type: 'kioskSell', requestKey: 'sale-1', item: 'papaya', qty: 8 }).ok).toBe(true);
    expect(t.inventory.papaya).toBe(2);
    expect(t.kiosk.pendingSales).toEqual([{ key: 'sale-1', item: 'papaya', qty: 8 }]);
    expect(go(t, { type: 'kioskSettle', requestKey: 'sale-1', acceptedQty: 5 }).events).toEqual(['kiosk:sold:papaya:5', 'kiosk:returned:papaya:3']);
    expect(t.inventory.papaya).toBe(5);
    expect(t.kiosk.pendingSales).toEqual([]);
    expect(go(t, { type: 'kioskSettle', requestKey: 'sale-1', acceptedQty: 5 }).ok).toBe(false); // settles once
  });

  it('a refused sale gives everything back, and a sale never returns more than it took', () => {
    const t = fresh({ boards: 4 });
    go(t, { type: 'kioskSell', requestKey: 'sale-2', item: 'boards', qty: 4 });
    go(t, { type: 'kioskSettle', requestKey: 'sale-2', acceptedQty: -3 });
    expect(t.inventory.boards).toBe(4);
    go(t, { type: 'kioskSell', requestKey: 'sale-3', item: 'boards', qty: 4 });
    go(t, { type: 'kioskSettle', requestKey: 'sale-3', acceptedQty: 99 });
    expect(t.inventory.boards).toBe(0);
  });

  it('refuses sales away from the kiosk, of goods you lack, or of silly amounts', () => {
    const t = fresh({ papaya: 3 });
    expect(go(t, { type: 'kioskSell', requestKey: 'a', item: 'papaya', qty: 4 }).reason).toBe("You don't have that many");
    expect(go(t, { type: 'kioskSell', requestKey: 'b', item: 'papaya', qty: 0 }).ok).toBe(false);
    expect(go(t, { type: 'kioskSell', requestKey: 'c', item: 'papaya', qty: 1.5 }).ok).toBe(false);
    t.player = { x: 1, y: 1 };
    expect(go(t, { type: 'kioskSell', requestKey: 'd', item: 'papaya', qty: 1 }).reason).toBe('Walk closer first');
    expect(t.inventory.papaya).toBe(3);
  });

  it('an order is delivered exactly once', () => {
    const t = fresh();
    expect(go(t, { type: 'kioskOrder', requestKey: 'buy-1', offer: 'seeds-greens' }).ok).toBe(true);
    expect(go(t, { type: 'kioskOrder', requestKey: 'buy-1', offer: 'seeds-greens' }).ok).toBe(false);
    expect(go(t, { type: 'kioskDeliver', requestKey: 'buy-1', item: 'seed_greens', qty: 6 }).ok).toBe(true);
    expect(go(t, { type: 'kioskDeliver', requestKey: 'buy-1', item: 'seed_greens', qty: 6 }).ok).toBe(false);
    expect(t.inventory.seed_greens).toBe(6);
    expect(go(t, { type: 'kioskDeliver', requestKey: 'never-ordered', item: 'boards', qty: 99 }).ok).toBe(false);
  });

  it('a cancelled order delivers nothing', () => {
    const t = fresh();
    go(t, { type: 'kioskOrder', requestKey: 'buy-2', offer: 'bundle-boards' });
    go(t, { type: 'kioskCancel', requestKey: 'buy-2' });
    expect(go(t, { type: 'kioskDeliver', requestKey: 'buy-2', item: 'boards', qty: 10 }).ok).toBe(false);
    expect(t.inventory.boards).toBeUndefined();
  });

  it('the kiosk blocks walking', () => {
    const t = fresh();
    expect(go(t, { type: 'move', to: { x: 6, y: 2 } }).ok).toBe(false);
  });
});

describe('relief milestones', () => {
  it('follow the town: meeting, harvesting, the path, the lesson', () => {
    const t = fresh();
    expect(kioskMilestones(t, catalog, W)).toEqual([]);
    t.npcs.rosa!.met = true;
    t.progress.harvests = 1;
    t.projects.path!.stage = 1;
    t.progress.tier = 2;
    expect(kioskMilestones(t, catalog, W)).toEqual(['met-neighbour', 'first-harvest', 'path-stage-1', 'building-tier-2']);
    t.projects.path!.completedMs = 5;
    expect(kioskMilestones(t, catalog, W)).toContain('path-done');
  });
});

describe('save v3 → v4', () => {
  it('adds the kiosk and counts a past harvest from food in hand', () => {
    const t = fresh({ greens: 2 });
    const old = JSON.parse(JSON.stringify(t)) as Record<string, unknown>;
    old.schemaVersion = 3;
    delete old.kiosk;
    old.progress = { tier: 1 };
    const body = JSON.stringify(old);
    const back = decodeSnapshot({ schemaVersion: 3, savedAt: 1, body, checksum: hashString(body).toString(16) }, { world: W, catalog });
    expect(back).toMatchObject({ schemaVersion: 4, progress: { tier: 1, harvests: 1 }, kiosk: { pendingSales: [], pendingOrders: [] } });
  });
});
