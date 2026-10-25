import { describe, expect, it } from 'vitest';
import {
  apply,
  checkPlace,
  decodeSnapshot,
  edge,
  encodeSnapshot,
  hasShelter,
  rooms,
  slotKey,
  SnapshotError,
  tile,
  type Command,
  type Town,
} from '../src/index.ts';
import { catalog, newTown } from './fixtures.ts';

let n = 0;
const id = () => `c${++n}`;
const place = (town: Town, pieceId: string, slot: Parameters<typeof checkPlace>[3], rotation = 0) =>
  apply(town, catalog, { type: 'place', id: id(), pieceId, slot, rotation });

/** Build a 2×2 room at (2,2)–(3,3) with walls, one door, optionally roofed. */
function buildRoom(town: Town, { roof = true, door = true } = {}) {
  for (const [x, y] of [[2, 2], [3, 2], [2, 3], [3, 3]] as const) {
    expect(place(town, 'pier', tile(x, y)).ok).toBe(true);
    expect(place(town, 'floor', tile(x, y)).ok).toBe(true);
  }
  const walls = [edge(2, 2, 'n'), edge(3, 2, 'n'), edge(2, 4, 'n'), edge(3, 4, 'n'), edge(2, 2, 'w'), edge(2, 3, 'w'), edge(4, 2, 'w'), edge(4, 3, 'w')];
  walls.forEach((w, i) => expect(place(town, door && i === 2 ? 'door' : 'wall', w).ok).toBe(true));
  if (roof) for (const [x, y] of [[2, 2], [3, 2], [2, 3], [3, 3]] as const) expect(place(town, 'roof', tile(x, y)).ok).toBe(true);
}

describe('grid placement', () => {
  it('places and removes on tiles and both edge directions', () => {
    const town = newTown();
    expect(place(town, 'pier', tile(0, 0)).ok).toBe(true);
    expect(place(town, 'floor', tile(0, 0)).ok).toBe(true);
    expect(place(town, 'wall', edge(0, 0, 'n')).ok).toBe(true);
    expect(place(town, 'wall', edge(0, 0, 'w')).ok).toBe(true);
    expect(Object.keys(town.pieces)).toHaveLength(4);

    const r = apply(town, catalog, { type: 'remove', id: id(), slot: edge(0, 0, 'w'), layer: 'wall' });
    expect(r.ok).toBe(true);
    expect(slotKey(edge(0, 0, 'w'), 'wall') in town.pieces).toBe(false);
  });

  it('allows walls on the far boundary edges and rejects outside', () => {
    const town = newTown();
    place(town, 'pier', tile(9, 9));
    place(town, 'floor', tile(9, 9));
    expect(place(town, 'wall', edge(9, 10, 'n')).ok).toBe(true);
    expect(place(town, 'wall', edge(10, 9, 'w')).ok).toBe(true);
    expect(place(town, 'pier', tile(10, 0))).toMatchObject({ ok: false, reason: 'Outside your lot' });
  });
});

describe('validation reasons', () => {
  const cases: [string, (t: Town) => ReturnType<typeof checkPlace>, string][] = [
    ['unknown piece', (t) => checkPlace(t, catalog, 'nope', tile(0, 0)), 'Unknown piece "nope"'],
    ['locked tier', (t) => checkPlace(t, catalog, 'boardwall', edge(0, 0, 'n')), 'Unlocks at tier 2'],
    ['wall on tile', (t) => checkPlace(t, catalog, 'wall', tile(0, 0)), 'Walls go on the edge between tiles'],
    ['floor on edge', (t) => checkPlace(t, catalog, 'floor', edge(0, 0, 'n')), 'This goes on a tile, not an edge'],
    ['out of bounds', (t) => checkPlace(t, catalog, 'pier', tile(-1, 0)), 'Outside your lot'],
    ['bad rotation', (t) => checkPlace(t, catalog, 'pier', tile(0, 0), 3), 'Invalid rotation'],
    ['floor without foundation', (t) => checkPlace(t, catalog, 'floor', tile(0, 0)), 'Needs a foundation underneath'],
    ['wall without floor', (t) => checkPlace(t, catalog, 'wall', edge(0, 0, 'n')), 'Walls need a floor on at least one side'],
    ['furniture without floor', (t) => checkPlace(t, catalog, 'bedroll', tile(0, 0)), 'Needs a floor'],
    ['roof without room', (t) => checkPlace(t, catalog, 'roof', tile(0, 0)), 'Roofs need a room enclosed by walls'],
  ];
  for (const [name, run, reason] of cases) {
    it(name, () => expect(run(newTown())).toEqual({ ok: false, reason }));
  }

  it('occupied slot', () => {
    const t = newTown();
    place(t, 'pier', tile(0, 0));
    expect(checkPlace(t, catalog, 'pier', tile(0, 0))).toEqual({ ok: false, reason: 'Something is already here' });
  });

  it('not enough materials', () => {
    const t = newTown({ inventory: { boards: 1 } });
    expect(checkPlace(t, catalog, 'pier', tile(0, 0))).toEqual({ ok: false, reason: 'Needs 2 boards (you have 1)' });
  });

  it('warns when a wall seals a room with no door', () => {
    const t = newTown();
    place(t, 'pier', tile(0, 0));
    place(t, 'floor', tile(0, 0));
    place(t, 'wall', edge(0, 0, 'n'));
    place(t, 'wall', edge(0, 0, 'w'));
    place(t, 'wall', edge(1, 0, 'w'));
    expect(checkPlace(t, catalog, 'wall', edge(0, 1, 'n'))).toEqual({ ok: true, warning: 'This closes a room with no door' });
    expect(checkPlace(t, catalog, 'door', edge(0, 1, 'n'))).toEqual({ ok: true });
  });

  it('a rejected command changes nothing', () => {
    const t = newTown();
    const before = JSON.stringify(t);
    expect(place(t, 'floor', tile(0, 0)).ok).toBe(false);
    expect(JSON.stringify(t)).toBe(before);
  });
});

describe('materials', () => {
  it('spends on place and refunds on remove', () => {
    const t = newTown();
    place(t, 'pier', tile(0, 0));
    expect(t.inventory.boards).toBe(498);
    apply(t, catalog, { type: 'remove', id: id(), slot: tile(0, 0), layer: 'foundation' });
    expect(t.inventory.boards).toBe(500);
  });
});

describe('rooms and shelter', () => {
  it('detects an enclosed, roofed room with a door as a shelter', () => {
    const t = newTown();
    buildRoom(t);
    const rs = rooms(t, catalog);
    expect(rs).toHaveLength(1);
    expect(rs[0]).toMatchObject({ enclosed: true, doors: 1, roofed: true, shelter: true });
    expect(rs[0]!.tiles).toEqual(['2,2', '2,3', '3,2', '3,3']);
    expect(hasShelter(t, catalog)).toBe(true);
  });

  it('a room without a door is enclosed but not a shelter', () => {
    const t = newTown();
    buildRoom(t, { door: false });
    expect(rooms(t, catalog)[0]).toMatchObject({ enclosed: true, doors: 0, shelter: false });
  });

  it('removing a wall that holds a roof is refused, then cascades when confirmed', () => {
    const t = newTown();
    buildRoom(t);
    const wall = edge(2, 2, 'w');
    const refused = apply(t, catalog, { type: 'remove', id: id(), slot: wall, layer: 'wall' });
    expect(refused).toMatchObject({ ok: false, reason: 'This holds up 4× Tin roof' });
    expect(hasShelter(t, catalog)).toBe(true);

    const boardsBefore = t.inventory.boards!;
    const roofingBefore = t.inventory.roofing!;
    const done = apply(t, catalog, { type: 'remove', id: id(), slot: wall, layer: 'wall', cascade: true });
    expect(done.ok).toBe(true);
    expect(hasShelter(t, catalog)).toBe(false);
    expect(Object.values(t.pieces).filter((p) => p.pieceId === 'roof')).toHaveLength(0);
    expect(t.inventory.boards).toBe(boardsBefore + 3);
    expect(t.inventory.roofing).toBe(roofingBefore + 8);
  });

  it('removing a floor takes walls that lose their only floor, and the roof above', () => {
    const t = newTown();
    place(t, 'pier', tile(0, 0));
    place(t, 'floor', tile(0, 0));
    place(t, 'wall', edge(0, 0, 'n'));
    place(t, 'bedroll', tile(0, 0));
    const r = apply(t, catalog, { type: 'remove', id: id(), slot: tile(0, 0), layer: 'floor' });
    expect(r).toMatchObject({ ok: false, reason: 'This holds up Plank wall, Bedroll' });
  });
});

describe('undo and redo', () => {
  it('100 steps of undo then redo round-trip to identical state', () => {
    const t = newTown({ width: 30, height: 30, inventory: { boards: 10_000, roofing: 100, cloth: 20 } });
    const snapshots: string[] = [JSON.stringify({ p: t.pieces, i: t.inventory })];
    for (let k = 0; k < 100; k++) {
      const x = k % 25;
      const y = Math.floor(k / 25) * 2;
      const r = k % 2 === 0 ? place(t, 'pier', tile(x, y)) : place(t, 'pier', tile(x, y + 1));
      expect(r.ok).toBe(true);
      snapshots.push(JSON.stringify({ p: t.pieces, i: t.inventory }));
    }
    const final = snapshots[100]!;
    for (let k = 99; k >= 0; k--) {
      expect(apply(t, catalog, { type: 'undo', id: id() }).ok).toBe(true);
      expect(JSON.stringify({ p: t.pieces, i: t.inventory })).toBe(snapshots[k]);
    }
    expect(apply(t, catalog, { type: 'undo', id: id() })).toMatchObject({ ok: false, reason: 'Nothing to undo' });
    for (let k = 0; k < 100; k++) expect(apply(t, catalog, { type: 'redo', id: id() }).ok).toBe(true);
    expect(JSON.stringify({ p: t.pieces, i: t.inventory })).toBe(final);
  });

  it('undo restores a cascaded removal exactly', () => {
    const t = newTown();
    buildRoom(t);
    const before = structuredClone({ p: t.pieces, i: t.inventory });
    apply(t, catalog, { type: 'remove', id: id(), slot: edge(2, 2, 'w'), layer: 'wall', cascade: true });
    apply(t, catalog, { type: 'undo', id: id() });
    expect({ p: t.pieces, i: t.inventory }).toEqual(before);
  });

  it('a new action clears the redo stack', () => {
    const t = newTown();
    place(t, 'pier', tile(0, 0));
    apply(t, catalog, { type: 'undo', id: id() });
    place(t, 'pier', tile(1, 1));
    expect(apply(t, catalog, { type: 'redo', id: id() })).toMatchObject({ ok: false, reason: 'Nothing to redo' });
  });

  it('resending the same command id does nothing', () => {
    const t = newTown();
    const cmd: Command = { type: 'place', id: 'same', pieceId: 'pier', slot: tile(0, 0) };
    expect(apply(t, catalog, cmd).changed).toBe(true);
    expect(apply(t, catalog, cmd)).toMatchObject({ ok: true, changed: false, duplicate: true });
    expect(t.inventory.boards).toBe(498);
  });
});

describe('save snapshots', () => {
  it('round-trips a town', () => {
    const t = newTown();
    buildRoom(t);
    const back = decodeSnapshot(encodeSnapshot(t, 123));
    expect(back).toEqual(t);
  });

  it('detects corruption', () => {
    const snap = encodeSnapshot(newTown(), 1);
    expect(() => decodeSnapshot({ ...snap, body: snap.body.replace('"boards":500', '"boards":999') })).toThrow(SnapshotError);
  });

  it('refuses saves from a newer game version', () => {
    const t = { ...newTown(), schemaVersion: 99 } as unknown as Town;
    expect(() => decodeSnapshot(encodeSnapshot(t, 1))).toThrow(/newer version/);
  });
});
