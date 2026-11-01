import { describe, expect, it } from 'vitest';
import { apply, createTown, decodeSnapshot, encodeSnapshot, travelWorld, walkable, tile, slotKey, type Command, type TravelCommand } from '../src/index.ts';
import { catalog, world } from '@paradise-lost/content';

function setup(inventory: Record<string,number> = {}) {
  const town = createTown({townId:'home', seed:'original-home', nowMs:1, inventory:{boards:200,stone:100,...inventory}, world,catalog});
  let n=0;
  const go = (cmd: Record<string,unknown>) => apply(town,catalog,{id:`travel${++n}`,nowMs:1000,...cmd} as Command,travelWorld(world,town));
  const found = (name:string) => { expect(go({type:'foundTown',name}).ok).toBe(true); return town.travel!.homeTownId!; };
  return {town,go,found};
}
describe('local towns and residency', () => {
  it('creates named unbuilt towns and attaches the existing plot without rebuilding it', () => {
    const {town,go,found}=setup();
    const pieces=structuredClone(town.pieces);
    const first=found('First island');
    expect(town.travel!.towns[first]!.residents).toEqual([{id:'local-player',name:'You'}]);
    expect(town.travel!.towns[first]!.mayorId).toBe('local-player');
    expect(town.inventory.boards).toBe(180);
    expect(town.inventory.stone).toBe(90);
    expect(town.pieces).toEqual(pieces);
    const second=found('Second island');
    expect(town.travel!.towns[first]!.residents).toEqual([]);
    expect(town.travel!.towns[first]!.mayorId).toBeNull();
    expect(town.travel!.homeTownId).toBe(second);
    expect(town.inventory.boards).toBe(155);
    expect(go({type:'moveResidence',townId:first}).ok).toBe(true);
    expect(town.travel!.towns[second]!.residents).toEqual([]);
    expect(town.travel!.towns[first]!.residents).toHaveLength(1);
    expect(town.pieces).toEqual(pieces);
  });
  it('rejects invalid/duplicate names and unaffordable founding without spending resources', () => {
    const {town,go,found}=setup();
    found('Ocean town');
    const inv=structuredClone(town.inventory);
    for(const name of [' ocean TOWN ','x','bad\nname','z'.repeat(49)]) expect(go({type:'foundTown',name}).ok).toBe(false);
    expect(town.inventory).toEqual(inv);
    town.inventory.stone=0;
    expect(go({type:'foundTown',name:'Unaffordable'}).ok).toBe(false);
    expect(town.inventory.boards).toBe(inv.boards);
  });
  it('requires a mayor successor before departing a populated town', () => {
    const {town,go,found}=setup();
    const first=found('One'); const second=found('Two');
    go({type:'moveResidence',townId:first});
    town.travel!.towns[first]!.mayorId='local-player';
    town.travel!.towns[first]!.residents.push({id:'member',name:'Test resident'});
    expect(go({type:'moveResidence',townId:second}).ok).toBe(false);
    expect(go({type:'appointMayor',townId:first,residentId:'outsider'}).ok).toBe(false);
    expect(go({type:'appointMayor',townId:first,residentId:'member'}).ok).toBe(true);
    expect(go({type:'moveResidence',townId:second}).ok).toBe(true);
    expect(town.travel!.towns[first]!.mayorId).toBe('member');
  });
});
describe('travel and quick return', () => {
  it('keeps home crops, buildings, terrain and history isolated from a town visit', () => {
    const {town,go,found}=setup();
    const id=found('Destination');
    town.soil['5,5']={tilledMs:1,lastWeededMs:1};
    town.crops['5,5']={cropId:'greens',sinceDay:0,wateredDays:[0],harvests:0};
    const home=structuredClone({pieces:town.pieces,crops:town.crops,soil:town.soil,history:town.history,seed:town.seed});
    expect(go({type:'visitTown',townId:id}).ok).toBe(true);
    expect(town.mapId).toContain('town-center:');
    expect(town.pieces).toEqual({});
    expect(town.crops).toEqual({});
    const away=travelWorld(world,town);
    expect(away.npcs).toEqual([]);
    expect(away.kiosk).toBeUndefined();
    expect(go({type:'place',pieceId:'pier_foundation',slot:tile(12,10)}).ok).toBe(true);
    const center=structuredClone(town.pieces);
    expect(go({type:'returnToPlot'}).ok).toBe(true);
    expect({pieces:town.pieces,crops:town.crops,soil:town.soil,history:town.history,seed:town.seed}).toEqual(home);
    expect(town.player.x).toBeGreaterThanOrEqual(town.lot.x);
    expect(town.player.x).toBeLessThan(town.lot.x+town.lot.w);
    expect(walkable(town,world,catalog,town.player.x,town.player.y)).toBe(true);
    expect(go({type:'visitTown',townId:id}).ok).toBe(true);
    expect(town.pieces).toEqual(center);
    expect(town.townId).toBe('home');
  });
  it('charges ferry fares once, carries inventory and makes quick return free without a boat', () => {
    const {town,go,found}=setup(); const id=found('Fare town');
    const before=town.inventory.boards!;
    const cmd={type:'visitTown',townId:id,id:'once',nowMs:1000} as TravelCommand;
    expect(apply(town,catalog,cmd,world).ok).toBe(true);
    expect(apply(town,catalog,cmd,travelWorld(world,town)).duplicate).toBe(true);
    expect(town.inventory.boards).toBe(before-3);
    town.inventory.boards=0;
    town.inventory.cloth=7;
    expect(go({type:'returnToPlot'}).ok).toBe(true);
    expect(town.inventory.boards).toBe(0);
    expect(town.inventory.cloth).toBe(7);
    expect(go({type:'visitTown',townId:id}).ok).toBe(false);
    town.inventory.boat=1;
    expect(go({type:'visitTown',townId:id}).ok).toBe(true);
    expect(town.inventory.boards).toBe(0);
  });
  it('survives saving while away and returns to the exact saved home', () => {
    const {town,go,found}=setup(); const id=found('Saved island');
    const original=structuredClone(town.pieces);
    go({type:'visitTown',townId:id});
    const loaded=decodeSnapshot(encodeSnapshot(town,5000),{world,catalog});
    expect(travelWorld(world,loaded).map.id).toContain('town-center:');
    expect(apply(loaded,catalog,{type:'returnToPlot',id:'return',nowMs:6000},travelWorld(world,loaded)).ok).toBe(true);
    expect(loaded.pieces).toEqual(original);
    expect(travelWorld(world,loaded)).toBe(world);
  });
  it('can quick-return while still independent, and preserves the save storage identity', () => {
    const {town,go}=setup();
    expect(go({type:'returnToPlot'}).ok).toBe(true);
    expect(town.travel!.homeTownId).toBeNull();
    expect(town.travel!.location.kind).toBe('plot');
    expect(town.townId).toBe('home');
  });
  it('does not allow visitors to change a town center or forge a destination', () => {
    const {town,go,found}=setup(); const first=found('First'); found('Second');
    expect(go({type:'visitTown',townId:'unknown'}).ok).toBe(false);
    expect(go({type:'visitTown',townId:first}).ok).toBe(true);
    expect(go({type:'place',pieceId:'pier_foundation',slot:tile(12,10)}).ok).toBe(false);
    expect(go({type:'returnToPlot'}).ok).toBe(true);
  });
});
