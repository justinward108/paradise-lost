import {describe,it,expect} from 'vitest';
import {createTown,runStaffing,runCareer,newCareer,teachingBenefits,AMBIENT_DAY_MS,encodeSnapshot,decodeSnapshot} from '../src/index.ts';
import {world,catalog,workshop} from '@paradise-lost/content';
const setup=()=>createTown({townId:'home',seed:'staff',nowMs:1,inventory:{learning_credit:20},world,catalog});
describe('teacher wanted ads',()=>{
 it('waits for an applicant, pays wages and supplies, and prevents overlapping lessons',()=>{
  const town=setup();
  expect(runStaffing(town,workshop,{type:'advertiseTeacher',id:'a',skill:'medicine',wage:2,nowMs:1}).ok).toBe(true);
  expect(runStaffing(town,workshop,{type:'hireTeacher',id:'b',nowMs:2}).ok).toBe(false);
  expect(runStaffing(town,workshop,{type:'hireTeacher',id:'c',nowMs:1+AMBIENT_DAY_MS}).ok).toBe(true);
  expect(runStaffing(town,workshop,{type:'attendLesson',id:'d',nowMs:1+AMBIENT_DAY_MS}).ok).toBe(true);
  expect(town.inventory.learning_credit).toBe(17);
  expect(town.career!.activity).toMatchObject({kind:'study',skill:'medicine',xp:4});
  expect(runStaffing(town,workshop,{type:'attendLesson',id:'e',nowMs:2+AMBIENT_DAY_MS}).ok).toBe(false);
  expect(town.inventory.learning_credit).toBe(17);
  expect(decodeSnapshot(encodeSnapshot(town,AMBIENT_DAY_MS+2)).staffing).toEqual(town.staffing);
 });
 it('rejects invalid offers and subjects without mutation',()=>{
  const town=setup();
  for(const wage of [0,1,21,NaN,2.5])expect(runStaffing(town,workshop,{type:'advertiseTeacher',id:'a',skill:'medicine',wage,nowMs:1}).ok).toBe(false);
  expect(runStaffing(town,workshop,{type:'advertiseTeacher',id:'a',skill:'__proto__',wage:2,nowMs:1}).ok).toBe(false);
  expect(town.staffing).toBeUndefined();
 });
 it('enforces specialty prerequisites and affordability before charging',()=>{
  const town=setup();
  town.staffing={teacher:{skill:'injury_medicine',wage:2,readyMs:1,hired:true}};
  expect(runStaffing(town,workshop,{type:'attendLesson',id:'a',nowMs:1}).ok).toBe(false);
  expect(town.inventory.learning_credit).toBe(20);
  town.career={...newCareer(),skills:{medicine:6}};
  town.inventory.learning_credit=2;
  expect(runStaffing(town,workshop,{type:'attendLesson',id:'b',nowMs:1}).ok).toBe(false);
  expect(town.inventory.learning_credit).toBe(2);
  town.inventory.learning_credit=3;
  expect(runStaffing(town,workshop,{type:'attendLesson',id:'c',nowMs:1}).ok).toBe(true);
  expect(town.inventory.learning_credit).toBe(0);
  expect(runCareer(town,workshop,{type:'finishActivity',id:'d',nowMs:45000}).ok).toBe(false);
  expect(runCareer(town,workshop,{type:'finishActivity',id:'e',nowMs:45001}).ok).toBe(true);
  expect(town.career.skills.injury_medicine).toBe(4);
  expect(runCareer(town,workshop,{type:'finishActivity',id:'f',nowMs:45002}).ok).toBe(false);
 });
 it('keeps an already paid lesson when dismissing the teacher',()=>{
  const town=setup();town.staffing={teacher:{skill:'medicine',wage:2,readyMs:1,hired:true}};
  runStaffing(town,workshop,{type:'attendLesson',id:'a',nowMs:1});
  expect(runStaffing(town,workshop,{type:'dismissTeacher',id:'b',nowMs:2}).ok).toBe(true);
  expect(town.staffing.teacher).toBeUndefined();
  expect(runCareer(town,workshop,{type:'finishActivity',id:'c',nowMs:45001}).ok).toBe(true);
  expect(town.career!.skills.medicine).toBe(4);
 });
 it('gives qualified player teaching a stronger and faster result',()=>{
  expect(teachingBenefits('player').xp).toBeGreaterThan(teachingBenefits('npc').xp);
  expect(teachingBenefits('player').durationMs).toBeLessThan(teachingBenefits('npc').durationMs);
 });
});
