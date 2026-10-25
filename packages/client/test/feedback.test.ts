import { describe, expect, it } from 'vitest';
import { notesText } from '../src/ui/feedback.ts';

describe('playtest notes export', () => {
  it('numbers the notes and indents their context', () => {
    const out = notesText([
      { at: '2026-10-25T22:00:00.000Z', text: 'Walking feels slow', context: 'Game day 1, 08:10\nCarrying: Cloth 3' },
      { at: '2026-10-25T22:05:00.000Z', text: 'Where do I get stone?', context: 'Game day 1, 09:00' },
    ]);
    expect(out).toMatch(/^Paradise Lost playtest notes \(2\)\n=+\n/);
    expect(out).toContain('#1 · ');
    expect(out).toContain('Walking feels slow\n\n  Game day 1, 08:10\n  Carrying: Cloth 3');
    expect(out).toContain('#2 · ');
  });
});
