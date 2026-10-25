import { describe, expect, it } from 'vitest';
import { art, catalog, terrainArt, validateContent } from '../src/index.ts';

describe('content', () => {
  it('passes validation', () => {
    expect(validateContent(catalog, art, terrainArt)).toEqual([]);
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
