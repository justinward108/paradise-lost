import { describe, expect, it } from 'vitest';
import { art, catalog, ITEMS, objectArt, terrainArt, validateContent, validateWorld, world } from '../src/index.ts';

describe('content', () => {
  it('passes validation', () => {
    expect(validateContent(catalog, art, terrainArt, objectArt)).toEqual([]);
  });

  it('reports a missing style and a missing wall frame', () => {
    const broken = structuredClone(art);
    delete (broken.plank_wall as Record<string, unknown>).storybook;
    broken.plank_door!.pixel.frames = ['n'];
    expect(validateContent(catalog, broken, terrainArt)).toEqual([
      'plank_wall: no storybook art',
      'plank_door (pixel): missing frame "w"',
    ]);
  });
});

describe('starter world', () => {
  it('passes the reachability and naming checks', () => {
    expect(validateWorld(world, catalog, ITEMS, objectArt)).toEqual([]);
  });

  it('catches an unreachable site', () => {
    const broken = { ...world, sites: [...world.sites, { id: 'island', name: 'x', x: 26, y: 31, uses: 1, yields: { boards: 1 }, art: 'shed' }] };
    expect(validateWorld(broken, catalog, ITEMS)).toContain('site island: unreachable');
  });
});

import { readFileSync } from 'node:fs';
import { HELP_SECTIONS, helpMarkdown, TIPS } from '../src/index.ts';

describe('help', () => {
  it('docs/HOW_TO_PLAY.md matches the in-game help (run npm run help-doc)', () => {
    const doc = readFileSync(new URL('../../../docs/HOW_TO_PLAY.md', import.meta.url), 'utf8');
    expect(doc).toBe(helpMarkdown());
  });

  it('every tip points at a real help section', () => {
    const ids = new Set(HELP_SECTIONS.map((s) => s.id));
    for (const [id, tip] of Object.entries(TIPS)) expect(ids.has(tip.section), id).toBe(true);
  });
});
