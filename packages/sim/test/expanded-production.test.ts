import {describe,it,expect} from 'vitest';
import {createTown,newCareer,runCareer,runWellbeing} from '../src/index.ts';
import {world,catalog,workshop} from '@paradise-lost/content';
describe('expanded production and prepared foods',()=>{
 it('makes a smoothie from farm products and consumes its distinct benefits once',()=>{
  const t=createTown({townId:'food',seed:'s',nowMs:1,inventory:{milk:1,banana:1,papaya:1},world,catalog});
  t.career={...newCareer(),skills:{bartending:2},recipes:['smoothie']};
  expect(runCareer(t,workshop,{type:'craft',recipe:'smoothie',id:'a',nowMs:1}).ok).toBe(true);
  expect(t.inventory.milk).toBe(0);expect(t.inventory.banana).toBe(0);expect(t.inventory.papaya).toBe(0);
  expect(runCareer(t,workshop,{type:'finishActivity',id:'b',nowMs:40001}).ok).toBe(true);
  expect(t.inventory.drink_smoothie).toBe(1);
  t.wellbeing={food:20,water:20,happiness:20,kindness:0,charisma:0,lastMs:40001,focusUntil:0};
  expect(runWellbeing(t,world,{type:'consume',item:'drink_smoothie',id:'c',nowMs:40001}).ok).toBe(true);
  expect(t.wellbeing).toMatchObject({food:45,water:55,happiness:30,focusUntil:40001+360000});
  expect(runWellbeing(t,world,{type:'consume',item:'drink_smoothie',id:'d',nowMs:40001}).ok).toBe(false);
 });
 it('forges usable roofing with a retained smelter and refuses missing inputs',()=>{
  const t=createTown({townId:'roof',seed:'s',nowMs:1,inventory:{metal:2,tool_smelter:1},world,catalog});
  t.career={...newCareer(),skills:{mining:4},recipes:['roofing_sheets']};
  expect(runCareer(t,workshop,{type:'craft',recipe:'roofing_sheets',quantity:5,id:'a',nowMs:1}).ok).toBe(false);
  expect(t.inventory.metal).toBe(2);
  expect(runCareer(t,workshop,{type:'craft',recipe:'roofing_sheets',id:'b',nowMs:1}).ok).toBe(true);
  runCareer(t,workshop,{type:'finishActivity',id:'c',nowMs:50001});
  expect(t.inventory.roofing).toBe(4);expect(t.inventory.tool_smelter).toBe(1);
 });
 it('allows existing prepared livestock meals and milk to be consumed',()=>{
  for(const item of ['meal_eggs','meal_chicken','meal_beef','milk']){
   const t=createTown({townId:'consume',seed:'s',nowMs:1,inventory:{[item]:1},world,catalog});
   expect(runWellbeing(t,world,{type:'consume',item,id:'a',nowMs:1}).ok).toBe(true);expect(t.inventory[item]).toBe(0);
  }
 });
});
