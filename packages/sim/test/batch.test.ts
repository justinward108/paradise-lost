import {describe,it,expect} from 'vitest';
import {createTown,runCareer,newCareer,batchCost,encodeSnapshot,decodeSnapshot} from '../src/index.ts';
import {world,catalog,workshop} from '@paradise-lost/content';
const setup=()=>{const t=createTown({townId:'home',seed:'batch',nowMs:1,inventory:{boards:30,tool_saw:1},world,catalog});t.career={...newCareer(),skills:{carpentry:2},recipes:['planks']};return t;};
describe('batch crafting',()=>{
 it('reserves inputs, retains tools, persists output and awards once',()=>{
  const t=setup();expect(runCareer(t,workshop,{type:'craft',recipe:'planks',quantity:5,id:'a',nowMs:1}).ok).toBe(true);
  expect(t.inventory.boards).toBe(16);expect(t.inventory.tool_saw).toBe(1);
  const loaded=decodeSnapshot(encodeSnapshot(t,2));const ready=t.career!.activity!.readyMs;
  expect(runCareer(loaded,workshop,{type:'finishActivity',id:'b',nowMs:ready-1}).ok).toBe(false);
  expect(runCareer(loaded,workshop,{type:'finishActivity',id:'c',nowMs:ready}).ok).toBe(true);
  expect(loaded.inventory.lumber).toBe(5);expect(loaded.career!.skills.carpentry).toBe(7);
  expect(runCareer(loaded,workshop,{type:'finishActivity',id:'d',nowMs:ready+1}).ok).toBe(false);
 });
 it('discounts materials in tiers and rounds up without free ingredients',()=>{
  expect(batchCost({boards:3,cloth:1},1)).toEqual({boards:3,cloth:1});
  expect(batchCost({boards:3,cloth:1},5)).toEqual({boards:14,cloth:5});
  expect(batchCost({boards:3,cloth:1},10)).toEqual({boards:26,cloth:9});
  expect(batchCost({boards:3,cloth:1},20)).toEqual({boards:48,cloth:16});
 });
 it('rejects invalid or unaffordable batches without spending',()=>{
  for(const quantity of [0,-1,1.5,21,NaN,20]){const t=setup();expect(runCareer(t,workshop,{type:'craft',recipe:'planks',quantity,id:'a',nowMs:1}).ok).toBe(false);expect(t.inventory.boards).toBe(30);expect(t.career!.activity).toBeNull();}
 });
});
