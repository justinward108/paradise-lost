import {describe,it,expect} from 'vitest';
import {apply,tile,edge,hasShelter,AMBIENT_DAY_MS,businessQuote,encodeSnapshot,decodeSnapshot,type Command} from '../src/index.ts';
import {catalog,newTown} from './fixtures.ts';
import {world,workshop} from '@paradise-lost/content';
function setup(shelter=true){
 const town=newTown();town.inventory={boards:500,cloth:100,stone:100,roofing:100,lumber:100,plant_fiber:100,water:100,learning_credit:100,tool_saw:1};let serial=0;
 const go=(command:Record<string,unknown>)=>apply(town,catalog,{id:`business-test-${++serial}`,nowMs:1,business:'furniture',...command} as Command,world);
 if(shelter){for(const pieceId of ['pier','floor'])expect(apply(town,catalog,{type:'place',id:`build-${++serial}`,pieceId,slot:tile(2,2)}).ok).toBe(true);
 for(const[slot,pieceId]of [[edge(2,2,'n'),'wall'],[edge(2,2,'w'),'wall'],[edge(3,2,'w'),'wall'],[edge(2,3,'n'),'door']] as const)expect(apply(town,catalog,{type:'place',id:`build-${++serial}`,pieceId,slot}).ok).toBe(true);
 expect(apply(town,catalog,{type:'place',id:`build-${++serial}`,pieceId:'roof',slot:tile(2,2)}).ok).toBe(true);expect(hasShelter(town,catalog)).toBe(true);}
 return{town,go};
}
function hire(go:ReturnType<typeof setup>['go'],business='furniture'){
 expect(go({type:'openBusiness',business}).ok).toBe(true);expect(go({type:'advertiseBusinessWorker',business,wage:2}).ok).toBe(true);
 expect(go({type:'hireBusinessWorker',business,nowMs:AMBIENT_DAY_MS+1}).ok).toBe(true);
}
describe('staffed production businesses',()=>{
 it('requires a shelter, charges setup once, waits for applicants and preserves teachers',()=>{
  const{town,go}=setup(false);expect(go({type:'openBusiness'}).ok).toBe(false);expect(town.businesses).toBeUndefined();
  const other=setup();other.town.staffing={teacher:{skill:'medicine',wage:2,readyMs:1,hired:true}};const boards=other.town.inventory.boards!;
  expect(other.go({type:'openBusiness'}).ok).toBe(true);expect(other.town.inventory.boards).toBe(boards-20);
  expect(other.go({type:'openBusiness'}).ok).toBe(false);expect(other.go({type:'advertiseBusinessWorker',wage:2}).ok).toBe(true);
  expect(other.go({type:'hireBusinessWorker',nowMs:AMBIENT_DAY_MS}).ok).toBe(false);expect(other.town.staffing.teacher?.hired).toBe(true);
 });
 it('reserves materials and wages, retains tools, persists work and collects output exactly once',()=>{
  const{town,go}=setup();hire(go);const now=AMBIENT_DAY_MS+1,quote=businessQuote(workshop,'chair',5,2)!;
  const before={...town.inventory};expect(go({type:'startBusinessOrder',recipe:'chair',quantity:5,nowMs:now,id:'business-paid-order'}).ok).toBe(true);
  for(const[id,n]of Object.entries(quote.cost))expect(town.inventory[id]).toBe(before[id]!-n);
  expect(town.inventory.tool_saw).toBe(1);expect(go({type:'startBusinessOrder',recipe:'chair',quantity:5,nowMs:now,id:'business-paid-order'}).duplicate).toBe(true);
  expect(go({type:'dismissBusinessWorker'}).ok).toBe(false);expect(go({type:'collectBusinessOrder',nowMs:now+quote.durationMs-1}).ok).toBe(false);
  expect(decodeSnapshot(encodeSnapshot(town,now)).businesses).toEqual(town.businesses);
  expect(go({type:'collectBusinessOrder',nowMs:now+quote.durationMs}).ok).toBe(true);expect(town.inventory.kit_chair).toBe(5);
  expect(go({type:'collectBusinessOrder',nowMs:now+quote.durationMs+1}).ok).toBe(false);expect(town.inventory.kit_chair).toBe(5);expect(town.career?.skills.furniture??0).toBe(0);
 });
 it('rejects invalid wages, foreign recipes, missing tools and insufficient funds without charging',()=>{
  const{town,go}=setup();expect(go({type:'openBusiness'}).ok).toBe(true);
  for(const wage of [0,1,21,NaN,2.5])expect(go({type:'advertiseBusinessWorker',wage}).ok).toBe(false);
  expect(go({type:'advertiseBusinessWorker',wage:2}).ok).toBe(true);expect(go({type:'hireBusinessWorker',nowMs:AMBIENT_DAY_MS+1}).ok).toBe(true);
  const before={...town.inventory};for(const recipe of ['care_medicine','__proto__'])expect(go({type:'startBusinessOrder',recipe,quantity:1}).ok).toBe(false);
  for(const quantity of [0,21,1.5,NaN])expect(go({type:'startBusinessOrder',recipe:'chair',quantity}).ok).toBe(false);expect(town.inventory).toEqual(before);
  town.inventory.tool_saw=0;expect(go({type:'startBusinessOrder',recipe:'chair',quantity:1}).ok).toBe(false);town.inventory.tool_saw=1;town.inventory.learning_credit=0;
  const poor={...town.inventory};expect(go({type:'startBusinessOrder',recipe:'chair',quantity:1}).ok).toBe(false);expect(town.inventory).toEqual(poor);
 });
 it('runs independent tailor and pharmacy orders and refuses management while travelling',()=>{
  const{town,go}=setup();hire(go,'tailor');hire(go,'pharmacy');const now=AMBIENT_DAY_MS+1;
  expect(go({type:'startBusinessOrder',business:'tailor',recipe:'shirt',quantity:1,nowMs:now}).ok).toBe(true);
  expect(go({type:'startBusinessOrder',business:'pharmacy',recipe:'pet_medicine',quantity:1,nowMs:now}).ok).toBe(true);
  for(const business of ['tailor','pharmacy'])expect(go({type:'collectBusinessOrder',business,nowMs:now+1000000}).ok).toBe(true);
  expect(town.inventory.clothing_shirt).toBe(1);expect(town.inventory.pet_medicine).toBe(1);
  town.travel={homeTownId:null,location:{kind:'town',townId:'somewhere'},home:null,towns:{}};
  expect(go({type:'advertiseBusinessWorker',business:'tailor',wage:2}).ok).toBe(false);
 });
 it('keeps NPC production slower and more expensive than skilled crafting',()=>{
  const quote=businessQuote(workshop,'chair',1,2)!;expect(quote.durationMs).toBeGreaterThan(workshop.recipes.chair!.durationMs);
  expect(quote.cost.learning_credit).toBe(2);expect(quote.cost.lumber).toBe(workshop.recipes.chair!.cost.lumber);
 });
});
