import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { apply, createTown, tile } from '@paradise-lost/sim';
import { catalog, STARTER_INVENTORY, world } from '@paradise-lost/content';
import { IndexedDbKV, LocalTownStore, MemoryKV } from '../src/store/townStore.ts';

const fresh = () => createTown({ townId: 'home', seed: 's', nowMs: 0, inventory: { ...STARTER_INVENTORY, boards: 20 }, world, catalog });

describe('LocalTownStore', () => {
  it('saves and loads the exact town', async () => {
    const store = new LocalTownStore(new MemoryKV());
    const t = fresh();
    apply(t, catalog, { type: 'place', id: 'a', pieceId: 'pier_foundation', slot: tile(9, 14) });
    await store.save(t);
    expect(await store.load('home')).toEqual({ town: t, recovered: false });
  });

  it('falls back to the previous save when the current one is corrupted', async () => {
    const kv = new MemoryKV();
    const store = new LocalTownStore(kv);
    const t = fresh();
    await store.save(t);
    const first = structuredClone(t);
    apply(t, catalog, { type: 'place', id: 'a', pieceId: 'pier_foundation', slot: tile(9, 14) });
    await store.save(t);

    const cur = kv.data.get('town:home:current') as { body: string };
    kv.data.set('town:home:current', { ...cur, body: cur.body.slice(0, -5) });

    expect(await store.load('home')).toEqual({ town: first, recovered: true });
  });

  it('returns null when nothing is saved', async () => {
    expect(await new LocalTownStore(new MemoryKV()).load('home')).toBeNull();
  });

  it('works on IndexedDB', async () => {
    const store = new LocalTownStore(new IndexedDbKV('test-db', 'kv', new IDBFactory()));
    const t = fresh();
    await store.save(t);
    await store.setMeta('lastSeen', '123');
    expect((await store.load('home'))?.town).toEqual(t);
    expect(await store.getMeta('lastSeen')).toBe('123');
  });
});

class MemorySync {
  data = new Map<string, string>();
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}

describe('emergency copy on page close', () => {
  it('restores a change whose IndexedDB write never finished', async () => {
    const kv = new MemoryKV();
    const sync = new MemorySync();
    const store = new LocalTownStore(kv, sync);
    const t = fresh();
    await store.save(t);
    apply(t, catalog, { type: 'place', id: 'a', pieceId: 'pier_foundation', slot: tile(9, 14) });
    // Simulate the page closing mid-write: the snapshot is taken, the async write is lost.
    const stuck = new LocalTownStore({ get: kv.get.bind(kv), set: () => new Promise<void>(() => {}) }, sync);
    await new Promise((r) => setTimeout(r, 2)); // a later moment than the first save
    void stuck.save(t);
    stuck.flushSync();

    const reopened = new LocalTownStore(kv, sync);
    expect((await reopened.load('home'))?.town).toEqual(t);
    expect(sync.data.size).toBe(0); // moved into IndexedDB and cleared
  });

  it('ignores an emergency copy older than the IndexedDB save', async () => {
    const kv = new MemoryKV();
    const sync = new MemorySync();
    const store = new LocalTownStore(kv, sync);
    const t = fresh();
    await store.save(t);
    store.flushSync();
    const old = JSON.parse(sync.data.get('pl.emergency.home')!);
    sync.data.set('pl.emergency.home', JSON.stringify({ ...old, savedAt: 0 }));
    apply(t, catalog, { type: 'place', id: 'b', pieceId: 'pier_foundation', slot: tile(10, 14) });
    await store.save(t);
    sync.data.set('pl.emergency.home', JSON.stringify({ ...old, savedAt: 0 }));
    expect((await new LocalTownStore(kv, sync).load('home'))?.town).toEqual(t);
  });
});
