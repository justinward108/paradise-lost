import {describe,it,expect} from 'vitest';
import {createTown,newCareer,runCareer,runProduction} from '../src/index.ts';
import {world,catalog,ITEMS,workshop} from '@paradise-lost/content';
import {EXPANDED_RECIPES,EXPANDED_SKILLS} from '@paradise-lost/content';
describe('expanded profession and recipe catalog',()=>{
 it('makes every new recipe output through normal timed crafting without losing tools',()=>{
  for(const[id,recipe]of Object.entries(EXPANDED_RECIPES)){
   const inventory={...recipe.cost};if(recipe.tool)inventory[recipe.tool]=(inventory[recipe.tool]??0)+1;
   const t=createTown({townId:id,seed:'s',nowMs:1,inventory,world,catalog});
   t.career={...newCareer(),skills:{[recipe.skill]:30},recipes:[id]};
   expect(runCareer(t,workshop,{type:'craft',recipe:id,id:'a',nowMs:1}).ok,id).toBe(true);
   const ready=t.career.activity!.readyMs;
   expect(runCareer(t,workshop,{type:'finishActivity',id:'b',nowMs:ready-1}).ok,id).toBe(false);
   expect(runCareer(t,workshop,{type:'finishActivity',id:'c',nowMs:ready}).ok,id).toBe(true);
   for(const[item,amount]of Object.entries(recipe.gives)){expect(ITEMS[item],item).toBeDefined();expect(t.inventory[item],id).toBe(amount);}
   if(recipe.tool)expect(t.inventory[recipe.tool],id).toBe(1);
   expect(runCareer(t,workshop,{type:'finishActivity',id:'d',nowMs:ready+1}).ok,id).toBe(false);
  }
 });
 it('can reach every new manufactured input and tool from available resource sources',()=>{
  const available=new Set(['boards','stone','cloth','plant_fiber','water','metal_ore','silica','greens','sweet_potato','papaya','long_beans','banana','eggs','milk','chicken_meat','beef']);
  let changed=true;while(changed){changed=false;for(const recipe of Object.values(workshop.recipes)){if(Object.keys(recipe.cost).every(id=>available.has(id))&&(!recipe.tool||available.has(recipe.tool))){for(const id of Object.keys(recipe.gives))if(!available.has(id)){available.add(id);changed=true;}}}}
  for(const recipe of Object.values(EXPANDED_RECIPES)){for(const id of [...Object.keys(recipe.cost),...(recipe.tool?[recipe.tool]:[])])expect(available.has(id),`unreachable input ${id}`).toBe(true);}
 });
 it('requires outside certification for teachers and general training for specialties',()=>{
  const t=createTown({townId:'qualify',seed:'s',nowMs:1,inventory:{learning_credit:10},world,catalog});
  t.career={...newCareer(),skills:{teaching:6,carpentry:12,pediatric_nursing:6}};
  expect(runCareer(t,workshop,{type:'qualify',skill:'teaching',id:'a',nowMs:1}).ok).toBe(false);
  expect(runCareer(t,workshop,{type:'certifyTeacher',id:'b',nowMs:1}).ok).toBe(true);
  expect(runCareer(t,workshop,{type:'qualify',skill:'teaching',id:'c',nowMs:1}).ok).toBe(true);
  expect(runCareer(t,workshop,{type:'qualify',skill:'pediatric_nursing',id:'d',nowMs:1}).ok).toBe(false);
  t.career.skills.nursing=6;
  expect(runCareer(t,workshop,{type:'qualify',skill:'pediatric_nursing',id:'e',nowMs:1}).ok).toBe(true);
  expect(t.career.professions).toEqual(['teaching','pediatric_nursing']);
 });
 it('registers every new skill prerequisite and lets crafted garments be worn',()=>{
  for(const skill of Object.values(EXPANDED_SKILLS))if(skill.prerequisite)expect(workshop.skills[skill.prerequisite]).toBeDefined();
  const t=createTown({townId:'clothes',seed:'s',nowMs:1,inventory:{clothing_coat:1,clothing_boots:1,clothing_satchel:1},world,catalog});
  for(const item of ['clothing_coat','clothing_boots','clothing_satchel'])expect(runProduction(t,{type:'equipClothing',item,id:item,nowMs:1}).ok).toBe(true);
  expect(t.wardrobe!.equipped).toEqual({shirt:'clothing_coat',shoes:'clothing_boots',bag:'clothing_satchel'});
 });
});

