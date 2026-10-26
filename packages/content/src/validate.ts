/**
 * Content validator: every piece must have art in every style, with every frame its
 * kind requires. Run on every build; a missing frame fails the build.
 */
import { createTown, findPath, inReach, walkable, type Catalog, type World } from '@paradise-lost/sim';
import { GENERATORS, STYLES, requiredFrames, type ArtManifest } from './art.ts';

export function validateContent(catalog: Catalog, art: ArtManifest, terrainArt: ArtManifest, objectArt: ArtManifest = {}): string[] {
  const problems: string[] = [];
  const known = new Set<string>(GENERATORS);

  for (const def of Object.values(catalog)) {
    const entry = art[def.id];
    if (!entry) {
      problems.push(`${def.id}: no art entry`);
      continue;
    }
    for (const style of STYLES) {
      const a = entry[style];
      if (!a) {
        problems.push(`${def.id}: no ${style} art`);
        continue;
      }
      if (!known.has(a.generator)) problems.push(`${def.id} (${style}): unknown generator "${a.generator}"`);
      for (const f of requiredFrames(def)) {
        if (!a.frames.includes(f)) problems.push(`${def.id} (${style}): missing frame "${f}"`);
      }
    }
  }
  for (const id of Object.keys(art)) if (!catalog[id]) problems.push(`${id}: art entry for a piece that does not exist`);

  for (const [label, manifest] of [['terrain', terrainArt], ['object', objectArt]] as const) {
    for (const [id, entry] of Object.entries(manifest)) {
      for (const style of STYLES) {
        if (!entry[style]) problems.push(`${label} ${id}: no ${style} art`);
        else if (!known.has(entry[style].generator)) problems.push(`${label} ${id} (${style}): unknown generator "${entry[style].generator}"`);
      }
      const [a, b] = STYLES.map((st) => entry[st]?.frames.join(',') ?? '');
      if (entry.pixel && entry.storybook && a !== b) problems.push(`${label} ${id}: styles have different frames (${a} vs ${b})`);
    }
  }
  return problems;
}

/**
 * World checks: map shape, item names, and that everything the opening needs can be
 * reached on foot from the spawn point (the store only after the path is repaired).
 */
export function validateWorld(
  world: World,
  catalog: Catalog,
  items: Readonly<Record<string, unknown>>,
  objectArt: ArtManifest = {},
): string[] {
  const problems: string[] = [];
  if (Object.keys(objectArt).length > 0) {
    for (const s of world.sites) if (!objectArt[s.art]) problems.push(`site ${s.id}: no art "${s.art}"`);
    for (const c of Object.keys(world.crops)) if (!objectArt[`crop_${c}`]) problems.push(`crop ${c}: no art "crop_${c}"`);
    for (const n of world.npcs) if (!objectArt[n.id]) problems.push(`npc ${n.id}: no art`);
    const need = ['tree', 'stump', 'marker', 'bush'];
    if (world.chop?.D) need.push('deadtree');
    if ((world.map.rubble ?? []).length > 0) need.push('smallrubble');
    for (const id of need) if (!objectArt[id]) problems.push(`object art "${id}" missing`);
  }
  for (const id of world.map.rubble ?? []) {
    const [x, y] = id.split(',').map(Number) as [number, number];
    if (world.map.rows[y]?.[x] !== 'L') problems.push(`rubble at ${id} is not on the lot`);
    if (world.map.brush.includes(id)) problems.push(`rubble at ${id} is also brush`);
  }
  for (const s of world.sites) if (s.refillMs !== undefined && s.refillMs <= 0) problems.push(`site ${s.id}: refillMs must be positive`);
  const m = world.map;
  if (m.rows.length !== m.height) problems.push(`map: ${m.rows.length} rows, expected ${m.height}`);
  m.rows.forEach((r, i) => r.length !== m.width && problems.push(`map row ${i}: ${r.length} columns, expected ${m.width}`));

  const known = (id: string, where: string) => !(id in items) && problems.push(`${where}: unknown item "${id}"`);
  for (const s of world.sites) for (const id of Object.keys(s.yields)) known(id, `site ${s.id}`);
  for (const c of Object.values(world.crops)) {
    known(c.seed, `crop ${c.id}`);
    for (const id of Object.keys(c.yields)) known(id, `crop ${c.id}`);
  }
  for (const n of world.npcs) {
    for (const id of [...Object.keys(n.firstGift), ...Object.keys(n.lessonGift), ...n.likes]) known(id, `npc ${n.id}`);
  }
  for (const p of world.fixedPieces) if (!catalog[p.pieceId]) problems.push(`fixed piece: unknown "${p.pieceId}"`);

  const town = createTown({ townId: 'check', seed: 'check', nowMs: 0, inventory: {}, world, catalog });
  if (!walkable(town, world, catalog, m.spawn.x, m.spawn.y)) problems.push('spawn is not walkable');
  const reach = (x: number, y: number) => findPath(town, world, catalog, m.spawn, (p) => inReach(p, { x, y }));
  for (const s of world.sites) {
    const ok = reach(s.x, s.y) !== null;
    if (s.requiresProject ? ok : !ok) problems.push(`site ${s.id}: ${ok ? 'reachable before its project is done' : 'unreachable'}`);
  }
  for (const n of world.npcs) {
    for (const stop of n.schedule) {
      if (stop.inside) continue;
      if (!walkable(town, world, catalog, stop.x, stop.y)) problems.push(`npc ${n.id}: stop at ${stop.x},${stop.y} not walkable`);
      else if (!reach(stop.x, stop.y)) problems.push(`npc ${n.id}: stop at ${stop.x},${stop.y} unreachable`);
    }
  }
  for (const p of world.projects) {
    if (!p.tiles.some((t) => reach(t.x, t.y))) problems.push(`project ${p.id}: no tile reachable`);
  }
  if (world.kiosk) {
    if (!reach(world.kiosk.x, world.kiosk.y)) problems.push('kiosk: unreachable from the spawn point');
    if (Object.keys(objectArt).length > 0 && !objectArt.kiosk) problems.push('kiosk: no art');
  }
  return problems;
}
