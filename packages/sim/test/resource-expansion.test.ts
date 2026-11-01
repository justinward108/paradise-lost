import {describe,it,expect} from 'vitest';
import {createTown,apply,newCareer,runCareer,runProduction,PROSPECT_RESOURCES,AMBIENT_DAY_MS} from '../src/index.ts';
import {world,catalog,ITEMS,workshop,RESOURCE_CROPS,RESOURCE_RECIPES,objectArt} from '@paradise-lost/content';
describe('obtainable plants, minerals and ingredients',()=>{
 it('plants, grows and harvests every new crop with seed replenishment and growth art',()=>{
  for(const def of Object.values(RESOURCE_CROPS)){
   const t=createTown({townId:def.id,seed:'garden',nowMs:1,inventory:{[def.seed]:1},world,catalog});
   t.player={x:9,y:15};t.soil['9,14']={tilledMs:1,lastWeededMs:1};
   expect(apply(t,catalog,{type:'plant',cropId:def.id,x:9,y:14,id:'plant',nowMs:1},world).ok,def.id).toBe(true);
   t.crops['9,14']!.wateredDays=Array.from({length:def.days},(_,i)=>i);
   const now=1+def.days*AMBIENT_DAY_MS;t.soil['9,14']!.lastWeededMs=now;
   expect(apply(t,catalog,{type:'harvest',x:9,y:14,id:'harvest',nowMs:now},world).ok,def.id).toBe(true);
   expect(t.inventory[def.seed],def.id).toBe(1);
   for(const item of Object.keys(def.yields))expect(t.inventory[item],def.id).toBeGreaterThan(0);
   expect(world.npcs.find(n=>n.id==='visitor_seed_trader')!.trades!.some(o=>(o.gives[def.seed]??0)>0),def.id).toBe(true);
   expect(objectArt['crop_'+def.id],def.id).toBeDefined();
  }
 });
 it('obtains every prospecting resource through timed work and enforces mining skill',()=>{
  for(const resource of Object.keys(PROSPECT_RESOURCES) as (keyof typeof PROSPECT_RESOURCES)[]){
   const t=createTown({townId:resource,seed:'mine',nowMs:1,inventory:{tool_pick:1,water:3},world,catalog});t.career={...newCareer(),skills:{mining:30}};
   expect(runProduction(t,{type:'prospect',resource,id:'a',nowMs:1}).ok,resource).toBe(true);
   const ready=t.career.activity!.readyMs;expect(runCareer(t,workshop,{type:'finishActivity',id:'b',nowMs:ready}).ok).toBe(true);
   expect(t.inventory[resource]).toBe(2);expect(t.inventory.water).toBe(2);
  }
  const t=createTown({townId:'no-gems',seed:'s',nowMs:1,inventory:{tool_pick:1,water:3},world,catalog});
  expect(runProduction(t,{type:'prospect',resource:'gemstone',id:'a',nowMs:1}).ok).toBe(false);expect(t.inventory.water).toBe(3);
 });
 it('crafts every new recipe through timed production with registered outputs',()=>{
  for(const[id,r]of Object.entries(RESOURCE_RECIPES)){
   const inventory={...r.cost};if(r.tool)inventory[r.tool]=(inventory[r.tool]??0)+1;
   const t=createTown({townId:id,seed:'recipe',nowMs:1,inventory,world,catalog});t.career={...newCareer(),skills:{[r.skill]:30},recipes:[id]};
   expect(runCareer(t,workshop,{type:'craft',recipe:id,id:'a',nowMs:1}).ok,id).toBe(true);
   expect(runCareer(t,workshop,{type:'finishActivity',id:'b',nowMs:t.career.activity!.readyMs}).ok,id).toBe(true);
   for(const[item,qty]of Object.entries(r.gives)){expect(ITEMS[item]).toBeDefined();expect(t.inventory[item],id).toBe(qty);}
  }
 });
});
