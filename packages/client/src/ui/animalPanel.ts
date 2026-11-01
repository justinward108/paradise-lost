import {animalIsSick,ambientTime} from '@paradise-lost/sim';
import {ITEMS} from '@paradise-lost/content';
import type {Controller} from '../game/controller.ts';
const text=(tag:string,value:string)=>{const e=document.createElement(tag);e.textContent=value;return e;};
const goods=(g:Record<string,number>)=>Object.entries(g).map(([id,n])=>`${n} ${ITEMS[id]?.name??id}`).join(', ');
function button(label:string,fn:()=>void,disabled=false){const b=document.createElement('button');b.textContent=label;b.disabled=disabled;b.addEventListener('click',fn);return b;}
export function animalPanel(ctrl:Controller,close:HTMLElement,note?:string,confirm?:string):HTMLElement[]{
 const home=ctrl.town.travel?.location.kind!=='town';
 const defs=ctrl.world.animalDefs??{};
 const nodes=[close,text('h2','Pets & farm animals'),text('p','Dogs and cats need food, water and toys; care improves happiness. Chickens produce eggs and cows produce milk after their first day. A fed, watered, healthy farm animal produces once per ambient day. Neglect can cause sickness. This is local plot management; pet-store buildings and staffed veterinary services are still being built.')];
 if(note)nodes.push(text('p',note));
 if(!home){nodes.push(button('Return to my plot — free',()=>ctrl.travelAction({type:'returnToPlot'})));return nodes;}
 nodes.push(text('h3','Acquire animals — barter goods'));
 for(const[id,def]of Object.entries(defs))nodes.push(button(`${def.name}: ${goods(def.cost)}`,()=>ctrl.animalAction({type:'obtainAnimal',species:id})));
 const day=ambientTime(ctrl.town,ctrl.now()).day;
 nodes.push(text('h3','Your animals'));
 for(const[id,a]of Object.entries(ctrl.town.animals?.residents??{})){
  const def=defs[a.species];if(!def)continue;
  const sick=animalIsSick(a,day);
  nodes.push(text('h3',def.name),text('p',`${a.fedDay===day?'Fed':'Needs food'} · ${a.wateredDay===day?'Watered':'Needs water'} · ${sick?'Sick — needs care medicine':'Healthy'}`));
  for(const[type,label]of [['feedAnimal','Feed'],['waterAnimal','Give water'],['treatAnimal','Give veterinary medicine']]as const)nodes.push(button(label,()=>ctrl.animalAction({type,animalId:id})));
  if(def.pet)nodes.push(button('Play with toy',()=>ctrl.animalAction({type:'playAnimal',animalId:id})));
  if(def.produce)nodes.push(button(`Collect ${goods(def.produce)}`,()=>ctrl.animalAction({type:'collectAnimal',animalId:id})));
  nodes.push(button(`Sell for ${goods(def.sale)}`,()=>ctrl.animalAction({type:'sellAnimal',animalId:id})));
  if(def.meat){
   if(confirm===id)nodes.push(text('p',`This permanently removes this ${def.name.toLowerCase()} and yields ${goods(def.meat)}.`),button('Confirm slaughter',()=>ctrl.animalAction({type:'slaughterAnimal',animalId:id})),button('Cancel',()=>ctrl.openPanel({kind:'animals'})));
   else nodes.push(button('Slaughter for meat…',()=>ctrl.openPanel({kind:'animals',confirmSlaughter:id})));
  }
 }
 return nodes;
}
