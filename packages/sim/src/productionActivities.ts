import {PROSPECT_RESOURCES} from './mining.ts';
import type {Town} from './types.ts';
import {ambientTime} from './time.ts';
import {newCareer} from './progression.ts';
import {wellbeingAt,workDurationFactor} from './wellbeing.ts';
export const CLOTHING_SLOTS:Record<string,string>={clothing_work_shirt:'shirt',clothing_coat:'shirt',clothing_boots:'shoes',clothing_cap:'hat',clothing_satchel:'bag',clothing_shirt:'shirt',clothing_trousers:'pants',clothing_shoes:'shoes',clothing_hat:'hat',clothing_bag:'bag',clothing_outfit:'outfit'};
export interface Wardrobe {equipped:Record<string,string>;gameDay?:number;gameReadyMs?:number}
export type ProductionCommand={type:'fertilize';id:string;x:number;y:number;item:'compost'|'fertilizer';nowMs:number}|{type:'prospect';id:string;resource:keyof typeof PROSPECT_RESOURCES;nowMs:number}|{type:'equipClothing';id:string;item:string;nowMs:number}|{type:'playConsole'|'finishConsole';id:string;nowMs:number};
export function runProduction(town:Town,cmd:ProductionCommand){
 const no=(reason:string)=>({ok:false,changed:false,reason});
 if(!Number.isSafeInteger(cmd.nowMs)||cmd.nowMs<0)return no('Invalid activity time');
 const day=ambientTime(town,cmd.nowMs).day;
 switch(cmd.type){
  case'fertilize':{
   if(town.travel?.location.kind==='town')return no('Return to your plot to improve your garden');
   if(!Number.isSafeInteger(cmd.x)||!Number.isSafeInteger(cmd.y))return no('Choose a garden bed');
   if(cmd.x<town.lot.x||cmd.y<town.lot.y||cmd.x>=town.lot.x+town.lot.w||cmd.y>=town.lot.y+town.lot.h)return no('Choose a bed on your own plot');
   const key=`${cmd.x},${cmd.y}`,soil=town.soil[key];
   if(!soil||!town.crops[key])return no('Plant a crop in this bed first');
   if(Math.max(Math.abs(town.player.x-cmd.x),Math.abs(town.player.y-cmd.y))>1)return no('Walk next to that garden bed first');
   if(soil.harvestBoost)return no('This crop already has a harvest boost');
   if(!['compost','fertilizer'].includes(cmd.item)||!(town.inventory[cmd.item]!>0))return no('You need compost or fertilizer');
   town.inventory[cmd.item]!--;soil.harvestBoost=cmd.item==='compost'?1:2;break;
  }
  case'prospect':{
   if(town.travel?.location.kind==='town')return no('Return to your plot to prospect');
   if(!Object.hasOwn(PROSPECT_RESOURCES,cmd.resource))return no('Unknown mining resource');
   if(!(town.inventory.tool_pick!>0))return no('Craft a mining pick first');
   const career=town.career??newCareer();
   const deposit=PROSPECT_RESOURCES[cmd.resource];if((career.skills.mining??0)<deposit.xp)return no(`Mining requires ${deposit.xp} experience for ${deposit.name}`);
   if(career.activity)return no('Finish your current activity first');
   const used=town.mining?.day===day?town.mining.used:0;if(used>=3)return no('Three prospecting jobs are available per plot per ambient day');
   if(!(town.inventory.water!>0))return no('Prospecting needs 1 water');
   town.inventory.water!--;town.mining={day,used:used+1};
   career.activity={kind:'craft',recipe:'prospecting',skill:'mining',gives:{[cmd.resource]:2,stone:2},readyMs:cmd.nowMs+Math.ceil(deposit.durationMs*workDurationFactor(town,cmd.nowMs))};town.career=career;break;
  }
  case'equipClothing':{
   const slot=Object.hasOwn(CLOTHING_SLOTS,cmd.item)?CLOTHING_SLOTS[cmd.item]:undefined;
   if(!slot||!(town.inventory[cmd.item]!>0))return no('You do not own that garment');
   const wardrobe=structuredClone(town.wardrobe??{equipped:{}});
   if(slot==='outfit')wardrobe.equipped={outfit:cmd.item};else{delete wardrobe.equipped.outfit;wardrobe.equipped[slot]=cmd.item;}
   town.wardrobe=wardrobe;break;
  }
  case'playConsole':{
   if(!(town.inventory.game_console!>0)||!(town.inventory.video_game!>0))return no('You need a video game system and a game');
   const wardrobe=structuredClone(town.wardrobe??{equipped:{}});
   if(wardrobe.gameReadyMs)return no('Finish the current game session first');
   if(wardrobe.gameDay===day)return no('The game happiness bonus is available once per ambient day');
   wardrobe.gameReadyMs=cmd.nowMs+30000;wardrobe.gameDay=day;town.wardrobe=wardrobe;break;
  }
  case'finishConsole':{
   const wardrobe=town.wardrobe;if(!wardrobe?.gameReadyMs)return no('No game session to finish');
   if(cmd.nowMs<wardrobe.gameReadyMs)return no('The game session is still in progress');
   const state=wellbeingAt(town,cmd.nowMs);state.happiness=Math.min(100,state.happiness+12);town.wellbeing=state;delete wardrobe.gameReadyMs;break;
  }
 }
 return{ok:true,changed:true,events:['production:changed']};
}
