import { describe, expect, it } from 'vitest';
import { createTown, tile } from '@paradise-lost/sim';
import { catalog, world } from '@paradise-lost/content';
import { Controller } from '../src/game/controller.ts';
import { toScreen } from '../src/iso.ts';
import { LocalTownStore, MemoryKV } from '../src/store/townStore.ts';

describe('gardening pointer targeting', () => {
  it('keeps a garden tool on its ground tile when a tall salvage sprite overlaps it', () => {
    const map = { ...world, npcs: [], kiosk: undefined, sites: [{ ...world.sites[0]!, x: 6, y: 6 }] };
    const town = createTown({ townId: 'targeting', seed: 's', nowMs: 0, inventory: {}, world: map, catalog });
    const ctrl = new Controller(town, catalog, map, new LocalTownStore(new MemoryKV()), 'pixel', () => 0);
    const point = toScreen(5.5, 5.5);
    // Normal interaction should still select the tall sprite.
    expect(ctrl.targetAt(point.x, point.y)).toEqual(tile(6, 6));
    for (const tool of [{ mode: 'dig' }, { mode: 'plant', cropId: 'greens' }, { mode: 'water' }] as const) {
      ctrl.setTool(tool);
      expect(ctrl.targetAt(point.x, point.y)).toEqual(tile(5, 5));
    }
  });
});
