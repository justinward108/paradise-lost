import type {Town} from './types.ts';
import {ambientTime} from './time.ts';
import {socialReward} from './wellbeing.ts';
export interface AnimalDef {name:string;pet:boolean;cost:Record<string,number>;sale:Record<string,number>;feed:string;toy?:string;produce?:Record<string,number>;meat?:Record<string,number>}
export interface Animal {species:string;acquiredDay:number;fedDay:number;wateredDay:number;playedDay:number;producedDay:number;sick:boolean}
export interface AnimalState {residents:Record<string,Animal>}
export type AnimalCommand=
 |{type:'obtainAnimal';id:string;species:string;nowMs:number}
 |{type:'feedAnimal'|'waterAnimal'|'playAnimal'|'collectAnimal'|'sellAnimal'|'slaughterAnimal'|'treatAnimal';id:string;animalId:string;nowMs:number};
export function animalIsSick(animal:Animal,day:number){return animal.sick||day>animal.acquiredDay+2&&(day-animal.fedDay>2||day-animal.wateredDay>2);}
export function runAnimals(town:Town,defs:Record<string,AnimalDef>|undefined,cmd:AnimalCommand){
 const no=(reason:string)=>({ok:false,changed:false,reason});
 if(!defs)return no('Animal care is unavailable here');
 if(town.travel?.location.kind==='town')return no('Return to your plot to care for your animals');
 if(!Number.isSafeInteger(cmd.nowMs)||cmd.nowMs<0)return no('Invalid care time');
 const day=ambientTime(town,cmd.nowMs).day;
 const state=structuredClone(town.animals??{residents:{}});
 const pay=(cost:Record<string,number>)=>{for(const[id,qty]of Object.entries(cost))town.inventory[id]!-=qty;};
 const afford=(cost:Record<string,number>)=>Object.entries(cost).every(([id,qty])=>(town.inventory[id]??0)>=qty);
 const give=(goods:Record<string,number>)=>{for(const[id,qty]of Object.entries(goods))town.inventory[id]=(town.inventory[id]??0)+qty;};
 if(cmd.type==='obtainAnimal'){
  const def=Object.hasOwn(defs,cmd.species)?defs[cmd.species]:undefined;
  if(!def)return no('Unknown animal');
  if(Object.keys(state.residents).length>=12)return no('This playtest plot supports up to 12 animals');
  if(!afford(def.cost))return no('You do not have the goods for this animal');
  pay(def.cost);state.residents[`animal:${cmd.id}`]={species:cmd.species,acquiredDay:day,fedDay:day-1,wateredDay:day-1,playedDay:day-1,producedDay:day,sick:false};
 }else{
  const animal=Object.hasOwn(state.residents,cmd.animalId)?state.residents[cmd.animalId]:undefined;
  if(!animal)return no('That animal is not here');
  const def=defs[animal.species];if(!def)return no('Unknown animal');
  animal.sick=animalIsSick(animal,day);
  switch(cmd.type){
   case'feedAnimal':if(animal.fedDay===day)return no('Already fed today');if(!(town.inventory[def.feed]!>0))return no('Make or buy the required animal food');pay({[def.feed]:1});animal.fedDay=day;break;
   case'waterAnimal':if(animal.wateredDay===day)return no('Already watered today');if(!(town.inventory.water!>0))return no('You need 1 water');pay({water:1});animal.wateredDay=day;break;
   case'playAnimal':if(!def.pet||!def.toy)return no('This animal does not use a pet toy');if(animal.playedDay===day)return no('Already played today');if(!(town.inventory[def.toy]!>0))return no('Make or buy the matching pet toy');if(animal.fedDay!==day||animal.wateredDay!==day||animal.sick)return no('Feed, water and treat your pet before playing');animal.playedDay=day;socialReward(town,cmd.nowMs,'kindness');town.wellbeing!.happiness=Math.min(100,town.wellbeing!.happiness+4);break;
   case'collectAnimal':if(!def.produce)return no('This is a pet, not a production animal');if(day<=animal.acquiredDay||animal.producedDay===day)return no('No new produce until the next ambient day');if(animal.fedDay!==day||animal.wateredDay!==day||animal.sick)return no('Production needs a healthy, fed and watered animal');give(def.produce);animal.producedDay=day;break;
   case'sellAnimal':if(animal.sick)return no('Treat the animal before selling');give(def.sale);delete state.residents[cmd.animalId];break;
   case'slaughterAnimal':if(def.pet||!def.meat)return no('Pets cannot be slaughtered');if(animal.sick)return no('Sick livestock cannot be used for meat');give(def.meat);delete state.residents[cmd.animalId];break;
   case'treatAnimal':if(!animal.sick)return no('This animal is not sick');if(!(town.inventory.pet_medicine!>0))return no('You need a veterinary care medicine');if(animal.fedDay!==day||animal.wateredDay!==day)return no('Provide food and water before treatment');pay({pet_medicine:1});animal.sick=false;break;
  }
 }
 town.animals=state;return{ok:true,changed:true,events:['animals:changed']};
}
