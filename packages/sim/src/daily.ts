import type {Town} from './types.ts';
import type {World} from './world.ts';
import {ambientTime} from './time.ts';
import {npcPosition,addFriendship} from './npc.ts';
import {inReach} from './nav.ts';
import {socialReward} from './wellbeing.ts';
export interface DailyState{day:number;donated:number;requestDone:boolean}
export type DailyCommand={type:'donateFood';id:string;npcId:string;item:string;qty:number;nowMs:number}|{type:'completeDailyRequest';id:string;npcId:string;nowMs:number};
export interface DailyRequest {title:string;cost:Record<string,number>;gives:Record<string,number>}
const REQUESTS:DailyRequest[]=[
 {title:'Share the harvest',cost:{greens:3},gives:{boards:4,seed_greens:1}},
 {title:'Building supplies',cost:{boards:4},gives:{cloth:1,learning_credit:1}},
 {title:'Stone delivery',cost:{stone:4},gives:{slip_sweet_potato:1,learning_credit:1}},
 {title:'Fruit delivery',cost:{papaya:2},gives:{boards:3,seed_papaya:1}},
 {title:'Kitchen supplies',cost:{sweet_potato:3},gives:{cloth:1,water:2}},
];
export const dailyRequest=(day:number):DailyRequest=>REQUESTS[((day%5)+5)%5]!;
export function dailyState(town:Town,nowMs:number):DailyState{const day=ambientTime(town,nowMs).day;return town.daily?.day===day?{...town.daily}:{day,donated:0,requestDone:false};}
export function runDaily(town:Town,world:World,cmd:DailyCommand){
 const no=(reason:string)=>({ok:false,changed:false,reason});
 if(!Number.isSafeInteger(cmd.nowMs)||cmd.nowMs<0)return no('Invalid request time');
 const def=world.npcs.find(n=>n.id===cmd.npcId);const npc=town.npcs[cmd.npcId];
 if(!def||!npc?.met)return no('Visit your neighbor and introduce yourself first');
 const pos=npcPosition(town,world,def,cmd.nowMs);
 if(pos.inside)return no('Your neighbor has gone in for the night');
 if(!inReach(town.player,pos))return no('Walk closer to your neighbor');
 const state=dailyState(town,cmd.nowMs);const request=dailyRequest(state.day);
 const gain=(items:Record<string,number>)=>{for(const[id,n]of Object.entries(items))town.inventory[id]=(town.inventory[id]??0)+n;};
 if(cmd.type==='donateFood'){
  const food=Object.values(world.crops).some(c=>Object.hasOwn(c.yields,cmd.item))||['meal_salad','drink_fruit','meal_eggs','meal_chicken','meal_beef'].includes(cmd.item);
  if(!food)return no('Choose harvested or prepared food');
  if(!Number.isSafeInteger(cmd.qty)||cmd.qty<1||cmd.qty>10)return no('Choose 1–10 food to donate');
  if(state.donated+cmd.qty>10)return no('The neighborhood can reward up to 10 donated food per day; additional food can be bartered');
  if((town.inventory[cmd.item]??0)<cmd.qty)return no('You do not have that much food');
  town.inventory[cmd.item]!-=cmd.qty;
  const vouchers=Math.floor((state.donated+cmd.qty)/2)-Math.floor(state.donated/2);
  gain({learning_credit:vouchers});if(state.donated===0)socialReward(town,cmd.nowMs,'kindness');state.donated+=cmd.qty;addFriendship(town,def.id,cmd.qty);
 }else{
  if(state.requestDone)return no('Today’s request is complete; a new request arrives next ambient day');
  if(!Object.entries(request.cost).every(([id,n])=>(town.inventory[id]??0)>=n!))return no('Bring the goods listed in today’s request');
  for(const[id,n]of Object.entries(request.cost))town.inventory[id]!-=n!;
  gain(request.gives as Record<string,number>);state.requestDone=true;addFriendship(town,def.id,3);socialReward(town,cmd.nowMs,'kindness');
 }
 town.daily=state;return{ok:true,changed:true,events:['daily:reward']};
}
