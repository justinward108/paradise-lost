/**
 * Save snapshots: versioning, migration and integrity.
 *
 * Storage (IndexedDB now, cloud later) lives in the client; this module only turns a
 * town into a checked string and back, so every store shares the same format.
 */
import { hashString } from './rng.ts';
import { SCHEMA_VERSION, type Town } from './types.ts';

export interface Snapshot {
  schemaVersion: number;
  savedAt: number;
  checksum: string;
  /** JSON of the town. */
  body: string;
}

/** One function per schema bump: migrations[n] turns a version-n town into version n+1. */
export const migrations: Record<number, (old: Record<string, unknown>) => Record<string, unknown>> = {};

export function encodeSnapshot(town: Town, savedAt: number): Snapshot {
  const body = JSON.stringify(town);
  return { schemaVersion: town.schemaVersion, savedAt, checksum: hashString(body).toString(16), body };
}

export class SnapshotError extends Error {}

export function decodeSnapshot(snap: Snapshot): Town {
  if (hashString(snap.body).toString(16) !== snap.checksum) throw new SnapshotError('Save is corrupted (checksum mismatch)');
  let data = JSON.parse(snap.body) as Record<string, unknown>;
  let version = Number(data['schemaVersion'] ?? 0);
  if (version > SCHEMA_VERSION) throw new SnapshotError(`Save is from a newer version of the game (v${version})`);
  while (version < SCHEMA_VERSION) {
    const step = migrations[version];
    if (!step) throw new SnapshotError(`No migration from save version ${version}`);
    data = step(data);
    version += 1;
    data['schemaVersion'] = version;
  }
  return data as unknown as Town;
}
