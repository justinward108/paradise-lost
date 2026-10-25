/**
 * Content validator: every piece must have art in every style, with every frame its
 * kind requires. Run on every build; a missing frame fails the build.
 */
import type { Catalog } from '@paradise-lost/sim';
import { GENERATORS, STYLES, requiredFrames, type ArtManifest } from './art.ts';

export function validateContent(catalog: Catalog, art: ArtManifest, terrainArt: ArtManifest): string[] {
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

  for (const [id, entry] of Object.entries(terrainArt)) {
    for (const style of STYLES) if (!entry[style]) problems.push(`terrain ${id}: no ${style} art`);
  }
  return problems;
}
