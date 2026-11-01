import {describe,it,expect,vi} from 'vitest';
import {createTown,townCenterWorld,type Town} from '@paradise-lost/sim';
import {world,catalog} from '@paradise-lost/content';
import {Controller} from '../src/game/controller.ts';
import {WorldConnection} from '../src/net/world.ts';
import {LocalTownStore,MemoryKV} from '../src/store/townStore.ts';
const id='00000000-0000-0000-0000-000000000001';
function setup(send:typeof fetch){const home=createTown({townId:'home-online',seed:'s',nowMs:1,inventory:{boards:100},world,catalog});const store=new LocalTownStore(new MemoryKV());const ctrl=new Controller(home,catalog,world,store,'pixel');const map=townCenterWorld(world,id);const center=createTown({townId:`center:${id}`,seed:'c',nowMs:1,inventory:{boards:10},world:map,catalog});return{home,store,ctrl,center,connection:new WorldConnection(send)};}
describe('shared center controller isolation',()=>{
 it('sends center intent and updates town stock without modifying the home object',async()=>{
  let result!:Town;
  const send=vi.fn(async(_url:RequestInfo|URL,_options?:RequestInit)=>new Response(JSON.stringify({data:{townId:id,name:'Town',revision:1,state:result,result:{ok:true,changed:true}}})));
  const{home,store,ctrl,center,connection}=setup(send);await ctrl.connectOnline(connection,0);ctrl.onlineCenter={townId:id,name:'Town',revision:0};ctrl.town=center;
  result=structuredClone(center);result.inventory.boards=8;
  const r=await ctrl.sendOnline({type:'place',pieceId:'pier_foundation',slot:{kind:'tile',x:10,y:8,level:0},id:'center-controller-001'});
  expect(r.ok).toBe(true);expect(home.inventory.boards).toBe(100);expect(ctrl.town.inventory.boards).toBe(8);
  const body=JSON.parse(send.mock.calls[0]![1]!.body as string);expect(body.action).toBe('centerCommand');expect(body.command.donate).toBe(false);
  expect(await store.getMeta(`center-pending:home-online:${id}`)).toBe('');
 });
 it('requires explicit donation mode and retries an uncertain original command',async()=>{
  const send=vi.fn().mockRejectedValueOnce(new Error('Disconnected'));
  const{ctrl,center,connection}=setup(send);await ctrl.connectOnline(connection,0);ctrl.onlineCenter={townId:id,name:'Town',revision:0};ctrl.town=center;ctrl.centerDonation=true;
  const command={type:'place',pieceId:'pier_foundation',slot:{kind:'tile',x:10,y:8,level:0},id:'center-donation-001'} as const;
  expect((await ctrl.sendOnline(command)).ok).toBe(false);
  send.mockResolvedValueOnce(new Response(JSON.stringify({data:{townId:id,name:'Town',revision:1,state:center,result:{ok:true,changed:true}}})));
  await ctrl.sendOnline({...command,id:'new-center-command-001'});
  const body=JSON.parse(send.mock.calls[1]![1].body);expect(body.requestKey).toBe('center-donation-001');expect(body.command.donate).toBe(true);
 });
});
