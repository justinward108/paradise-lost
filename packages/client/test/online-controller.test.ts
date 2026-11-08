import {describe,it,expect,vi} from 'vitest';
import {createTown,AMBIENT_DAY_MS} from '@paradise-lost/sim';
import {world,catalog} from '@paradise-lost/content';
import {Controller} from '../src/game/controller.ts';
import {LocalTownStore,MemoryKV} from '../src/store/townStore.ts';
import {WorldConnection} from '../src/net/world.ts';
function setup(){const town=createTown({townId:'online-test',seed:'s',nowMs:1,inventory:{boards:10},world,catalog});const store=new LocalTownStore(new MemoryKV());const ctrl=new Controller(town,catalog,world,store,'pixel');return{town,store,ctrl};}
describe('server-authoritative controller',()=>{
 it('walks at the normal pace while awaiting authoritative step confirmation',async()=>{
  const {town,ctrl}=setup();const to={x:town.player.x+1,y:town.player.y};const state=structuredClone(town);state.player=to;
  let resolve!:(value:Response)=>void;
  const send=vi.fn<typeof fetch>(()=>new Promise<Response>(r=>{resolve=r;}));
  await ctrl.connectOnline(new WorldConnection(send),0);
  expect(ctrl.stepMs()).toBe(230);ctrl.walk([to]);ctrl.arrived(to);ctrl.arrived(to);
  await vi.waitFor(()=>expect(send).toHaveBeenCalledTimes(1));
  expect(send.mock.calls[0]![0]).toBe('/api/paradise-move');
  expect(ctrl.town.player).toEqual(town.player);expect(ctrl.route).toEqual([to]);
  resolve(new Response(JSON.stringify({data:{revision:1,state,result:{ok:true,changed:true}}})));
  await vi.waitFor(()=>expect(ctrl.route).toHaveLength(0));expect(ctrl.town.player).toEqual(to);
 });
 it('keeps a replacement destination when a previous step confirms',async()=>{
  const {town,ctrl}=setup();const first={x:town.player.x+1,y:town.player.y},second={x:town.player.x+2,y:town.player.y};
  let resolve!:(value:Response)=>void;const send=vi.fn<typeof fetch>(()=>new Promise<Response>(r=>{resolve=r;}));
  await ctrl.connectOnline(new WorldConnection(send),0);ctrl.walk([first]);ctrl.arrived(first);
  await vi.waitFor(()=>expect(send).toHaveBeenCalledTimes(1));
  ctrl.walk([first,second]);ctrl.tick();expect(send).toHaveBeenCalledTimes(1);expect(ctrl.awaitingMovement).toBe(true);
  const state=structuredClone(town);state.player=first;
  resolve(new Response(JSON.stringify({data:{revision:1,state,result:{ok:true,changed:true}}})));
  await vi.waitFor(()=>expect(ctrl.awaitingMovement).toBe(false));expect(ctrl.route).toEqual([second]);
 });
 it('does not walk to a neighbor who is indoors',()=>{
  const {town,store}=setup();const ctrl=new Controller(town,catalog,world,store,'pixel',()=>town.clock.epochMs);
  ctrl.walkToNeighbor('rosa');expect(ctrl.route).toEqual([]);
 });
 it('walks within reach of an available neighbor and introduces the player',()=>{
  const {town,store}=setup();const now=town.clock.epochMs+AMBIENT_DAY_MS*11/24;
  const ctrl=new Controller(town,catalog,world,store,'pixel',()=>now);
  ctrl.walkToNeighbor('rosa');expect(ctrl.route.length).toBeGreaterThan(0);
  let steps=0;while(ctrl.route.length&&steps++<200)ctrl.arrived(ctrl.route[0]!);
  expect(ctrl.town.npcs.rosa?.met).toBe(true);expect(ctrl.panel?.kind).toBe('npc');
 });
 it('does not mutate inventory before confirmation and installs only server state',async()=>{
  const {town,ctrl}=setup();const state=structuredClone(town);state.inventory.boards=7;
  let resolve!:(value:Response)=>void;
  const send=vi.fn(()=>new Promise<Response>(r=>{resolve=r;}));
  await ctrl.connectOnline(new WorldConnection(send),0);
  const action=ctrl.sendOnline({type:'finishActivity',id:'online-request-001',nowMs:1});
  await vi.waitFor(()=>expect(send).toHaveBeenCalledTimes(1));
  expect(ctrl.town.inventory.boards).toBe(10);
  resolve(new Response(JSON.stringify({data:{revision:1,state,result:{ok:true,changed:true}}})));
  expect((await action).ok).toBe(true);expect(ctrl.town.inventory.boards).toBe(7);expect(ctrl.online!.revision).toBe(1);
 });
 it('blocks inventory actions while viewing another player plot',async()=>{
  const {ctrl}=setup();const send=vi.fn();await ctrl.connectOnline(new WorldConnection(send),0);ctrl.visitingName='Neighbor';
  expect(ctrl.dispatch({type:'finishActivity',id:'visitor-request-001',nowMs:1}).ok).toBe(false);
  expect((await ctrl.sendOnline({type:'finishActivity',id:'visitor-request-002',nowMs:1})).ok).toBe(false);
  expect(send).not.toHaveBeenCalled();
 });
 it('recovers an uncertain action after reconnect using its original key',async()=>{
  const {town,store,ctrl}=setup();const failed=vi.fn().mockRejectedValue(new Error('Disconnected'));
  await ctrl.connectOnline(new WorldConnection(failed),0);
  expect((await ctrl.sendOnline({type:'finishActivity',id:'online-original-001',nowMs:1})).ok).toBe(false);
  const restored=new Controller(structuredClone(town),catalog,world,store,'pixel');
  const send=vi.fn().mockResolvedValue(new Response(JSON.stringify({data:{revision:1,state:town,duplicate:true,result:{ok:true,changed:true}}})));
  await restored.connectOnline(new WorldConnection(send),1);
  await restored.sendOnline({type:'tick',id:'online-new-tick-001',nowMs:2});
  expect(JSON.parse(send.mock.calls[0]![1].body).requestKey).toBe('online-original-001');
  expect(await store.getMeta('online-pending:online-test')).toBe('');
 });
});
