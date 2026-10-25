/**
 * Writes docs/HOW_TO_PLAY.md from the in-game help text.
 * Run with: npm run help-doc
 */
import { writeFileSync } from 'node:fs';
import { helpMarkdown } from '../src/help.ts';

const out = new URL('../../../docs/HOW_TO_PLAY.md', import.meta.url);
writeFileSync(out, helpMarkdown());
console.log(`Wrote ${out.pathname}`);
