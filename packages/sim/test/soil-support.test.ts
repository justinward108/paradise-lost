import {describe,it,expect} from 'vitest';
import {createTown,apply,encodeSnapshot,decodeSnapshot,AMBIENT_DAY_MS} from '../src/index.ts';
import {world,catalog,ITEMS,itemSources} from '@paradise-lost/content';
function setup(){const t=createTown({townId:'soil',seed:'s',nowMs:1,inventory:{compost:2,fertilizer:2},world,catalog});t.player={x:9,y:15};t.soil['9,14']={tilledMs:1,lastWeededMs:1};t.crops['9,14']={cropId:'tomato',sinceDay:0,wateredDays:[0,1,2],harvests:0};return t;}
describe('usable soil improvements and ingredient sources',()=>{
 it('saves a single-harvest boost, rejects stacking and consumes it after collection',()=>{
  const t=setup();
  expect(apply(t,catalog,{type:'fertilize',x:9,y:14,item:'fertilizer',id:'soil-a',nowMs:1},world).ok).toBe(true);
  expect(t.inventory.fertilizer).toBe(1);
  expect(apply(t,catalog,{type:'fertilize',x:9,y:14,item:'compost',id:'soil-b',nowMs:1},world).ok).toBe(false);
  expect(t.inventory.compost).toBe(2);
  const saved=decodeSnapshot(encodeSnapshot(t,2));expect(saved.soil['9,14']!.harvestBoost).toBe(2);
  const now=1+3*AMBIENT_DAY_MS;saved.soil['9,14']!.lastWeededMs=now;
  expect(apply(saved,catalog,{type:'harvest',x:9,y:14,id:'harvest-a',nowMs:now},world).ok).toBe(true);
  expect(saved.inventory.tomato).toBe(5);expect(saved.soil['9,14']!.harvestBoost).toBeUndefined();
  saved.crops['9,14']!.wateredDays=[3,4];const later=1+5*AMBIENT_DAY_MS;saved.soil['9,14']!.lastWeededMs=later;
  expect(apply(saved,catalog,{type:'harvest',x:9,y:14,id:'harvest-b',nowMs:later},world).ok).toBe(true);
  expect(saved.inventory.tomato).toBe(8);
 });
 it('requires proximity and a planted owned bed without spending on refusal',()=>{
  const t=setup();t.player={x:5,y:5};
  expect(apply(t,catalog,{type:'fertilize',x:9,y:14,item:'compost',id:'far',nowMs:1},world).ok).toBe(false);
  expect(t.inventory.compost).toBe(2);expect(t.soil['9,14']!.harvestBoost).toBeUndefined();
  t.player={x:9,y:15};delete t.crops['9,14'];
  expect(apply(t,catalog,{type:'fertilize',x:9,y:14,item:'compost',id:'empty',nowMs:1},world).ok).toBe(false);
  expect(t.inventory.compost).toBe(2);
 });
 it('reports actual mineral, crop, seed, animal and craft acquisition sources',()=>{
  expect(itemSources('copper_ore',world,ITEMS).some(s=>s.includes('Prospect'))).toBe(true);
  expect(itemSources('tomato',world,ITEMS).some(s=>s.includes('Grow Tomato'))).toBe(true);
  expect(itemSources('keiki_banana',world,ITEMS).some(s=>s.includes('Trade with Visiting seed trader'))).toBe(true);
  expect(itemSources('milk',world,ITEMS).some(s=>s.includes('cow'))).toBe(true);
  expect(itemSources('fertilizer',world,ITEMS).some(s=>s.includes('Blend mineral fertilizer'))).toBe(true);
  expect(itemSources('not-an-item',world,ITEMS)).toEqual([]);
 });
});
