import type {Catalog,Town} from './types.ts';
import type {WorkshopDef} from './progression.ts';
import {batchCost} from './progression.ts';
import {hasShelter} from './town.ts';
import {AMBIENT_DAY_MS} from './time.ts';
export const BUSINESS_TYPES={
 furniture:{name:'Furniture workshop',worker:'Furniture maker',recipes:['chair','table','dog_toy','cat_toy']},
 tailor:{name:'Tailor shop',worker:'Tailor',recipes:['shirt','trousers','shoes','hat','bag','outfit']},
 pharmacy:{name:'Pharmacy',worker:'Pharmacist',recipes:['care_medicine','pet_medicine']},
} as const;
export type BusinessKind=keyof typeof BUSINESS_TYPES;
export const BUSINESS_SETUP_COST={boards:20,stone:10,cloth:4};
export interface BusinessState {wage?:number;applicantMs?:number;hired?:boolean;order?:{recipe:string;quantity:number;gives:Record<string,number>;readyMs:number}}
export type BusinessCommand={type:'openBusiness'|'hireBusinessWorker'|'dismissBusinessWorker'|'collectBusinessOrder';id:string;business:BusinessKind;nowMs:number}
 |{type:'advertiseBusinessWorker';id:string;business:BusinessKind;wage:number;nowMs:number}
 |{type:'startBusinessOrder';id:string;business:BusinessKind;recipe:string;quantity:number;nowMs:number};
export function businessQuote(def:WorkshopDef,recipeId:string,quantity:number,wage:number){
 const recipe=Object.hasOwn(def.recipes,recipeId)?def.recipes[recipeId]:undefined;
 if(!recipe||!Number.isSafeInteger(quantity)||quantity<1||quantity>20||!Number.isSafeInteger(wage)||wage<2||wage>20)return null;
 const cost=batchCost(recipe.cost,quantity);cost.learning_credit=(cost.learning_credit??0)+wage*quantity;
 return{cost,gives:Object.fromEntries(Object.entries(recipe.gives).map(([id,n])=>[id,n*quantity])),durationMs:recipe.durationMs*quantity*2,tool:recipe.tool};
}
export function runBusiness(town:Town,catalog:Catalog,def:WorkshopDef|undefined,cmd:BusinessCommand){
 const no=(reason:string)=>({ok:false,changed:false,reason});
 if(!Number.isSafeInteger(cmd.nowMs)||cmd.nowMs<0)return no('Invalid business time');
 if(!Object.hasOwn(BUSINESS_TYPES,cmd.business))return no('Unknown business');
 if(town.travel?.location.kind==='town')return no('Return to your own plot to manage this business');
 const kind=BUSINESS_TYPES[cmd.business],business=town.businesses?.[cmd.business];
 const afford=(cost:Record<string,number>)=>Object.entries(cost).every(([id,n])=>(town.inventory[id]??0)>=n);
 const spend=(cost:Record<string,number>)=>{for(const[id,n]of Object.entries(cost))town.inventory[id]!-=n;};
 if(cmd.type==='openBusiness'){
  if(business)return no('This business is already open');
  if(!hasShelter(town,catalog))return no('Build a weatherproof shelter before fitting out a business');
  if(!afford(BUSINESS_SETUP_COST))return no('Fitting out a business costs 20 boards, 10 stone and 4 cloth');
  spend(BUSINESS_SETUP_COST);town.businesses??={};town.businesses[cmd.business]={};
 }else{
  if(!business)return no('Open this business first');
  switch(cmd.type){
   case'advertiseBusinessWorker':
    if(business.wage!==undefined)return no('Dismiss the current worker or cancel the existing ad first');
    if(!Number.isSafeInteger(cmd.wage)||cmd.wage<2||cmd.wage>20)return no('Offer 2–20 learning vouchers per batch');
    business.wage=cmd.wage;business.applicantMs=cmd.nowMs+AMBIENT_DAY_MS;business.hired=false;break;
   case'hireBusinessWorker':
    if(business.wage===undefined||business.applicantMs===undefined)return no('Post a wanted ad first');
    if(business.hired)return no('This worker is already hired');
    if(cmd.nowMs<business.applicantMs)return no('An NPC applicant arrives after one game day');
    business.hired=true;break;
   case'dismissBusinessWorker':
    if(business.order)return no('Collect the paid order before dismissing this worker');
    delete business.wage;delete business.applicantMs;delete business.hired;break;
   case'startBusinessOrder':{
    if(!business.hired||business.wage===undefined)return no('Hire a worker first');
    if(business.order)return no('Collect the existing order first');
    if(!hasShelter(town,catalog))return no('Repair your weatherproof shelter before starting more work');
    if(!(kind.recipes as readonly string[]).includes(cmd.recipe)||!def)return no('This business does not make that recipe');
    const quote=businessQuote(def,cmd.recipe,cmd.quantity,business.wage);
    if(!quote)return no('Choose 1–20 batches');
    if(quote.tool&&!(town.inventory[quote.tool]!>0))return no('Supply the specialist tool required for this recipe');
    if(!afford(quote.cost))return no('Supply the ingredients and agreed worker wages');
    spend(quote.cost);business.order={recipe:cmd.recipe,quantity:cmd.quantity,gives:quote.gives,readyMs:cmd.nowMs+quote.durationMs};break;
   }
   case'collectBusinessOrder':{
    const order=business.order;if(!order)return no('There is no order to collect');
    if(cmd.nowMs<order.readyMs)return no('This order is still being made');
    for(const[id,n]of Object.entries(order.gives))town.inventory[id]=(town.inventory[id]??0)+n;
    delete business.order;break;
   }
  }
 }
 return{ok:true,changed:true,events:['business:changed']};
}
