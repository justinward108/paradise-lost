import type {Town} from './types.ts';
import {AMBIENT_DAY_MS} from './time.ts';
import {newCareer,skillLevel,type WorkshopDef} from './progression.ts';
export interface TeachingAd {skill:string;wage:number;readyMs:number;hired:boolean}
export interface StaffingState {teacher?:TeachingAd}
export type StaffingCommand = {type:'advertiseTeacher';id:string;skill:string;wage:number;nowMs:number}|{type:'hireTeacher'|'dismissTeacher'|'attendLesson';id:string;nowMs:number};
/** Shared service balance. Player availability and qualifications must be verified by the online service. */
export const teachingBenefits=(provider:'npc'|'player')=>provider==='player'?{xp:6,durationMs:30000}:{xp:4,durationMs:45000};
export function runStaffing(town:Town,def:WorkshopDef|undefined,cmd:StaffingCommand){
 const no=(reason:string)=>({ok:false,changed:false,reason});
 if(!Number.isSafeInteger(cmd.nowMs)||cmd.nowMs<0)return no('Invalid activity time');
 const ad=town.staffing?.teacher;
 if(cmd.type==='advertiseTeacher'){
  if(ad)return no('Dismiss the existing teacher or cancel the ad first');
  if(!def||!Object.hasOwn(def.skills,cmd.skill))return no('Unknown teaching subject');
  if(!Number.isSafeInteger(cmd.wage)||cmd.wage<2||cmd.wage>20)return no('Offer 2–20 learning vouchers per lesson');
  town.staffing={teacher:{skill:cmd.skill,wage:cmd.wage,readyMs:cmd.nowMs+AMBIENT_DAY_MS,hired:false}};
 }else{
  if(!ad)return no('Post a wanted ad first');
  if(cmd.type==='dismissTeacher'){delete town.staffing!.teacher;}
  else if(cmd.type==='hireTeacher'){
   if(ad.hired)return no('This teacher is already hired');
   if(cmd.nowMs<ad.readyMs)return no('An applicant will be available after one ambient day');
   ad.hired=true;
  }else{
   if(!ad.hired)return no('Hire the applicant first');
   if(!def||!Object.hasOwn(def.skills,ad.skill))return no('This subject is unavailable');
   const career=town.career??newCareer();
   if(career.activity)return no('Finish your current activity first');
   if(skillLevel(career.skills[ad.skill]??0)>=5)return no('This skill is already mastered');
   const prerequisite=def.skills[ad.skill]!.prerequisite;
   if(prerequisite&&skillLevel(career.skills[prerequisite]??0)<1)return no('Study the general subject before this specialty');
   if((town.inventory.learning_credit??0)<ad.wage+1)return no('You need the agreed wage plus 1 learning voucher for supplies');
   town.inventory.learning_credit!-=ad.wage+1;
   const benefit=teachingBenefits('npc');
   career.activity={kind:'study',skill:ad.skill,xp:benefit.xp,readyMs:cmd.nowMs+benefit.durationMs};town.career=career;
  }
 }
 return {ok:true,changed:true,events:['staffing:changed']};
}
