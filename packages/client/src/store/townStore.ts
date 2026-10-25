/**
 * Town storage (GDD §23.2).
 *
 * The game talks only to `TownStore`. Sprint 1 ships the local version on IndexedDB;
 * cloud saves and the multiplayer server will be other implementations of the same
 * interface. Every save keeps the previous snapshot, so one corrupted write can be rolled
 * back automatically.
 */
import { decodeSnapshot, encodeSnapshot, type Snapshot, type Town } from '@paradise-lost/sim';

export interface TownStore {
  load(townId: string): Promise<{ town: Town; recovered: boolean } | null>;
  save(town: Town): Promise<void>;
  /** Write the newest snapshot synchronously. Call when the page is hidden or closing. */
  flushSync(): void;
  getMeta(key: string): Promise<string | null>;
  setMeta(key: string, value: string): Promise<void>;
}

/** Key–value backend, so the store logic can be tested without a browser. */
export interface KV {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
}

export class MemoryKV implements KV {
  readonly data = new Map<string, unknown>();
  async get(key: string) {
    return structuredClone(this.data.get(key));
  }
  async set(key: string, value: unknown) {
    this.data.set(key, structuredClone(value));
  }
}

export class IndexedDbKV implements KV {
  private db: Promise<IDBDatabase>;

  constructor(name = 'paradise-lost', private storeName = 'kv', factory: IDBFactory = indexedDB) {
    this.db = new Promise((resolve, reject) => {
      const req = factory.open(name, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(this.storeName);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private async tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await this.db;
    return new Promise((resolve, reject) => {
      const t = db.transaction(this.storeName, mode);
      const req = fn(t.objectStore(this.storeName));
      t.oncomplete = () => resolve(req.result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  }

  get(key: string) {
    return this.tx('readonly', (s) => s.get(key));
  }

  async set(key: string, value: unknown) {
    await this.tx('readwrite', (s) => s.put(value, key));
  }
}

/** Synchronous storage (localStorage) used only for the emergency copy. */
export interface SyncKV {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * IndexedDB writes still in flight are dropped if the page closes, so the newest snapshot
 * is also kept in memory and written synchronously to `sync` on page hide. On load, the
 * newer of the two copies wins.
 */
export class LocalTownStore implements TownStore {
  private queue: Promise<void> = Promise.resolve();
  private latest: Snapshot | null = null;
  private latestTownId = '';
  private lastSavedAt = 0;

  constructor(
    private kv: KV,
    private sync: SyncKV | null = null,
  ) {}

  private emergencyKey(townId: string) {
    return `pl.emergency.${townId}`;
  }

  private readEmergency(townId: string): Snapshot | null {
    try {
      const raw = this.sync?.getItem(this.emergencyKey(townId));
      return raw ? (JSON.parse(raw) as Snapshot) : null;
    } catch {
      return null;
    }
  }

  async load(townId: string) {
    const candidates: [Snapshot | undefined | null, boolean][] = [];
    const current = (await this.kv.get(`town:${townId}:current`)) as Snapshot | undefined;
    const emergency = this.readEmergency(townId);
    if (emergency && (!current || emergency.savedAt > current.savedAt)) candidates.push([emergency, false]);
    candidates.push([current, false]);
    candidates.push([(await this.kv.get(`town:${townId}:previous`)) as Snapshot | undefined, true]);

    for (const [snap, recovered] of candidates) {
      if (!snap) continue;
      try {
        const town = decodeSnapshot(snap);
        if (snap === emergency) await this.save(town); // move it into IndexedDB
        return { town, recovered };
      } catch (err) {
        console.warn('Save unusable:', err);
      }
    }
    return null;
  }

  flushSync(): void {
    if (!this.latest || !this.sync) return;
    try {
      this.sync.setItem(this.emergencyKey(this.latestTownId), JSON.stringify(this.latest));
    } catch (err) {
      console.warn('Emergency save failed:', err);
    }
  }

  /** Saves run one at a time, in order, so a slow write never overtakes a newer one. */
  save(town: Town): Promise<void> {
    // Strictly increasing, so "newer" is never a tie between two saves in one millisecond.
    this.lastSavedAt = Math.max(Date.now(), this.lastSavedAt + 1);
    const snap = encodeSnapshot(town, this.lastSavedAt);
    this.latest = snap;
    this.latestTownId = town.townId;
    this.queue = this.queue.then(async () => {
      const key = `town:${town.townId}`;
      const current = await this.kv.get(`${key}:current`);
      if (current) await this.kv.set(`${key}:previous`, current);
      await this.kv.set(`${key}:current`, snap);
      // The emergency copy is only needed while a write is outstanding.
      if (this.latest === snap) {
        try {
          this.sync?.removeItem(this.emergencyKey(town.townId));
        } catch {
          /* ignore */
        }
      }
    });
    return this.queue;
  }

  async getMeta(key: string) {
    const v = await this.kv.get(`meta:${key}`);
    return typeof v === 'string' ? v : null;
  }

  async setMeta(key: string, value: string) {
    await this.kv.set(`meta:${key}`, value);
  }
}
