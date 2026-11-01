import type { Town } from './types.ts';
import type { World } from './world.ts';
import { ambientTime } from './time.ts';

export interface Wellbeing { food: number; water: number; happiness: number; kindness: number; charisma: number; lastMs: number; focusUntil: number }
export interface FoodEffect { food: number; water: number; happiness: number; focusMs?: number }
export interface WellbeingDef { foods: Record<string, FoodEffect> }
export interface WaterSource { built: boolean; day: number; drawn: number }
export type WellbeingCommand =
  | { type:'consume'; id:string; item:string; nowMs:number }
  | { type:'buildWaterSource'; id:string; nowMs:number }
  | { type:'drawWater'; id:string; nowMs:number };
const HOUR=3_600_000;
const cap=(n:number)=>Math.min(100,Math.max(0,n));
export function wellbeingAt(town:Town,nowMs:number):Wellbeing {
  const previous=town.wellbeing ?? {food:80,water:80,happiness:60,kindness:0,charisma:0,lastMs:nowMs,focusUntil:0};
  const hours=Math.min(4,Math.max(0,nowMs-previous.lastMs)/HOUR);
  const food=cap(previous.food-hours*6), water=cap(previous.water-hours*10);
  const lowFraction=(start:number,rate:number)=> start<=25 ? hours : Math.max(0,hours-(start-25)/rate);
  const unhappy=Math.max(lowFraction(previous.food,6),lowFraction(previous.water,10))*3;
  return {...previous,food,water,happiness:cap(previous.happiness-unhappy),lastMs:Math.max(nowMs,previous.lastMs)};
}
export function workDurationFactor(town:Town,nowMs:number):number {
  const state=wellbeingAt(town,nowMs);
  return state.food<25 || state.water<25 ? 1.25 : state.focusUntil>nowMs ? 0.9 : 1;
}
export function settleWellbeing(town:Town,nowMs:number) {
  const next=wellbeingAt(town,nowMs);
  if (JSON.stringify(next)===JSON.stringify(town.wellbeing)) return {ok:true,changed:false,events:[]};
  town.wellbeing=next;
  return {ok:true,changed:true,events:[]};
}
export function socialReward(town:Town,nowMs:number,kind:'kindness'|'charisma') {
  const state=wellbeingAt(town,nowMs);
  state[kind]=cap(state[kind]+(kind==='kindness'?2:1));
  state.happiness=cap(state.happiness+1);
  town.wellbeing=state;
}
export const WELL_COST={lumber:6,stone:12,cloth:2};
export const WATER_PER_DAY=6;
export function waterRemaining(town:Town,nowMs:number):number {
  const source=town.waterSource;
  if(!source?.built) return 0;
  const day=ambientTime(town,nowMs).day;
  return day===source.day ? Math.max(0,WATER_PER_DAY-source.drawn) : WATER_PER_DAY;
}
export function runWellbeing(town:Town,world:World,cmd:WellbeingCommand) {
  const no=(reason:string)=>({ok:false,changed:false,reason});
  if(!world.wellbeing) return no('Food and water systems are unavailable here');
  if(!Number.isSafeInteger(cmd.nowMs)||cmd.nowMs<0) return no('Invalid activity time');
  switch(cmd.type) {
    case 'consume': {
      const effect=Object.hasOwn(world.wellbeing.foods,cmd.item)?world.wellbeing.foods[cmd.item]:undefined;
      if(!effect) return no('That item cannot be eaten or drunk');
      if(!(town.inventory[cmd.item]!>0)) return no('You do not have that item');
      const state=wellbeingAt(town,cmd.nowMs);
      if((!effect.food||state.food>=100)&&(!effect.water||state.water>=100)&&(!effect.happiness||state.happiness>=100)&&(!effect.focusMs||state.focusUntil>=cmd.nowMs+effect.focusMs)) return no('You already have all the benefits of that item');
      town.inventory[cmd.item]!--;
      state.food=cap(state.food+effect.food); state.water=cap(state.water+effect.water); state.happiness=cap(state.happiness+effect.happiness);
      if(effect.focusMs) state.focusUntil=Math.max(state.focusUntil,cmd.nowMs+effect.focusMs);
      town.wellbeing=state;
      return {ok:true,changed:true,events:[`wellbeing:consumed:${cmd.item}`]};
    }
    case 'buildWaterSource': {
      if(town.travel?.location.kind==='town') return no('Return to your personal plot to build its water source');
      if(town.waterSource?.built) return no('Your plot already has a water source');
      if(!Object.entries(WELL_COST).every(([id,qty])=>(town.inventory[id]??0)>=qty)) return no('A water source costs 6 lumber, 12 stone and 2 cloth');
      for(const [id,qty] of Object.entries(WELL_COST)) town.inventory[id]!-=qty;
      town.waterSource={built:true,day:ambientTime(town,cmd.nowMs).day,drawn:0};
      return {ok:true,changed:true,events:['wellbeing:water-source']};
    }
    case 'drawWater': {
      if(town.travel?.location.kind==='town') return no('Return to your plot to use its water source');
      if(!town.waterSource?.built) return no('Build a water source first, or barter with Rosa for water');
      const remaining=waterRemaining(town,cmd.nowMs);
      if(!remaining) return no('The source needs until the next ambient day to refill');
      const day=ambientTime(town,cmd.nowMs).day;
      const qty=Math.min(2,remaining);
      if(day!==town.waterSource.day) {town.waterSource.day=day;town.waterSource.drawn=0;}
      town.waterSource.drawn+=qty;
      town.inventory.water=(town.inventory.water??0)+qty;
      return {ok:true,changed:true,events:[`gain:water:${qty}`]};
    }
  }
}
