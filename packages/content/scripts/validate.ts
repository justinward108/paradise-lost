/**
 * Build step: fail if any piece is missing art in either style.
 * Run with: npm run validate-content
 */
import { art, catalog, ITEMS, objectArt, terrainArt, validateContent, validateWorld, world } from '../src/index.ts';

const problems = [...validateContent(catalog, art, terrainArt, objectArt), ...validateWorld(world, catalog, ITEMS, objectArt)];
if (problems.length > 0) {
  console.error(`Content validation failed (${problems.length} problem${problems.length === 1 ? '' : 's'}):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`Content OK: ${Object.keys(catalog).length} pieces with art in both styles; map ${world.map.width}×${world.map.height} checked.`);
