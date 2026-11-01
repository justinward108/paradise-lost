import { describe, expect, it } from 'vitest';
import { createTown } from '@paradise-lost/sim';
import { catalog, world } from '@paradise-lost/content';
import { Controller } from '../src/game/controller.ts';
import { LocalTownStore, MemoryKV } from '../src/store/townStore.ts';

describe('controller location changes', () => {
  it('switches the runtime world, cancels walking and building, and retains home after saving away', async () => {
    const town = createTown({townId:'home',seed:'s',nowMs:1,inventory:{boards:200,stone:100},world,catalog});
    const store = new LocalTownStore(new MemoryKV());
    const ctrl = new Controller(town,catalog,world,store,'pixel',()=>1000);
    ctrl.travelAction({type:'foundTown',name:'Local test'});
    const id = town.travel!.homeTownId!;
    let arrived = false;
    ctrl.walk([{x:9,y:14}],()=>{arrived=true;});
    ctrl.setMode('build');
    ctrl.travelAction({type:'visitTown',townId:id});
    expect(ctrl.world.map.id).toContain('town-center:');
    expect(ctrl.route).toEqual([]);
    expect(arrived).toBe(false);
    expect(ctrl.mode).toBe('play');
    expect(ctrl.tool.mode).toBe('walk');
    await store.save(town);
    const loaded = await store.load('home');
    expect(loaded).not.toBeNull();
    const resumed = new Controller(loaded!.town,catalog,world,store,'pixel',()=>2000);
    expect(resumed.world.map.id).toBe(ctrl.world.map.id);
    resumed.travelAction({type:'returnToPlot'});
    expect(resumed.world).toBe(world);
    expect(resumed.town.travel!.location.kind).toBe('plot');
    expect(resumed.town.townId).toBe('home');
  });
});
