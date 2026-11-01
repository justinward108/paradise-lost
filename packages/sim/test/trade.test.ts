import { describe, expect, it } from 'vitest';
import { AMBIENT_DAY_MS, apply, createTown, npcPosition } from '../src/index.ts';
import { catalog, testWorld } from './fixtures.ts';

const EPOCH = 1_000_000;
const nowMs = EPOCH + AMBIENT_DAY_MS * 9 / 24;
function setup() {
  const world = testWorld();
  world.npcs[0]!.trades = [{ id: 'seeds', cost: { boards: 2, stone: 1 }, gives: { seed_greens: 1 } }];
  const town = createTown({ townId: 'barter', seed: 's', inventory: { boards: 4, stone: 2 }, nowMs: EPOCH, world, catalog });
  town.npcs.rosa!.met = true;
  const pos = npcPosition(town, world, world.npcs[0]!, nowMs);
  town.player = { x: pos.x, y: pos.y };
  const trade = (id = 'trade1', offerId = 'seeds', time = nowMs) => apply(town, catalog, { type: 'trade', id, npcId: 'rosa', offerId, nowMs: time }, world);
  return { town, world, trade };
}
describe('neighbor barter', () => {
  it('exchanges all costs atomically, saves the output and cannot replay a command', () => {
    const { town, trade } = setup();
    expect(trade().ok).toBe(true);
    expect(town.inventory).toMatchObject({ boards: 2, stone: 1, seed_greens: 1 });
    expect(trade().duplicate).toBe(true);
    expect(town.inventory.seed_greens).toBe(1);
  });
  it('does not spend any goods when one cost is missing', () => {
    const { town, trade } = setup();
    town.inventory.stone = 0;
    expect(trade().ok).toBe(false);
    expect(town.inventory.boards).toBe(4);
    expect(town.inventory.seed_greens).toBeUndefined();
  });
  it('rejects unknown or malformed offers', () => {
    const { town, world, trade } = setup();
    expect(trade('unknown', 'made-up').ok).toBe(false);
    world.npcs[0]!.trades![0]!.cost.boards = -2;
    expect(trade().ok).toBe(false);
    expect(town.inventory.boards).toBe(4);
  });
  it('requires an introduction, proximity and an awake neighbor', () => {
    const { town, trade } = setup();
    town.npcs.rosa!.met = false;
    expect(trade('intro').reason).toBe('Say hello first');
    town.npcs.rosa!.met = true;
    town.player = { x: 0, y: 0 };
    expect(trade('far').reason).toBe('Walk closer first');
    expect(trade('night', 'seeds', EPOCH + AMBIENT_DAY_MS * 23 / 24).reason).toContain('night');
  });
});
