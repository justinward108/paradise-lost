import {BUSINESS_TYPES,BUSINESS_SETUP_COST,businessQuote,hasShelter,type BusinessKind} from '@paradise-lost/sim';
import {ITEMS,workshop} from '@paradise-lost/content';
import type {Controller} from '../game/controller.ts';
const text=(tag:string,value:string)=>{const e=document.createElement(tag);e.textContent=value;return e;};
const button=(label:string,run:()=>void)=>{const e=document.createElement('button');e.textContent=label;e.onclick=run;return e;};
const goods=(items:Record<string,number>)=>Object.entries(items).map(([id,n])=>`${n} ${ITEMS[id]?.name??id}`).join(', ');
export function businessPanel(ctrl:Controller,close:HTMLElement,note?:string):HTMLElement[]{
 const nodes=[close,text('h2','Staffed businesses'),text('p','Fit out a weatherproof shelter as a furniture workshop, tailor shop or pharmacy. These are production businesses on your own plot: supply materials and tools, hire NPC fallback staff, then collect goods to use, give away or sell through player trade offers.')];
 if(note)nodes.push(text('p',note));
 if(ctrl.onlineCenter||ctrl.visitingName||ctrl.town.travel?.location.kind==='town'){nodes.push(button('Return home to manage businesses',()=>ctrl.travelAction({type:'returnToPlot'})));return nodes;}
 nodes.push(text('p','NPC applicants arrive one game day after posting a wanted ad. Wages are learning vouchers per batch, paid when work starts. Skilled players can craft at the regular faster pace without this NPC wage surcharge. Public customer ordering and player employee shifts are still being built.'));
 for(const[id,kind]of Object.entries(BUSINESS_TYPES)){
  const business=id as BusinessKind,state=ctrl.town.businesses?.[business];nodes.push(text('h3',kind.name));
  if(!state){nodes.push(text('p',`Setup: ${goods(BUSINESS_SETUP_COST)}. ${hasShelter(ctrl.town,ctrl.catalog)?'Shelter ready.':'A weatherproof shelter is required.'}`),button('Fit out business',()=>ctrl.businessAction({type:'openBusiness',business})));continue;}
  if(state.wage===undefined){
   const wage=document.createElement('input');wage.type='number';wage.min='2';wage.max='20';wage.value='2';wage.setAttribute('aria-label',`${kind.worker} wage per batch`);
   nodes.push(wage,button(`Post wanted ad: ${kind.worker}`,()=>ctrl.businessAction({type:'advertiseBusinessWorker',business,wage:Number(wage.value)})));continue;
  }
  if(!state.hired){const remaining=Math.max(0,Math.ceil(((state.applicantMs??0)-ctrl.now())/60000));nodes.push(text('p',remaining?`Applicant in about ${remaining} minutes. Wage: ${state.wage} vouchers per batch.`:'An NPC applicant is ready.'),button('Hire applicant',()=>ctrl.businessAction({type:'hireBusinessWorker',business})));}
  else if(state.order){const remaining=Math.max(0,Math.ceil((state.order.readyMs-ctrl.now())/1000));nodes.push(text('p',`${workshop.recipes[state.order.recipe]?.name}: ${state.order.quantity} batches. ${remaining?`${remaining} seconds remaining.`:'Ready to collect.'}`),button('Collect completed order',()=>ctrl.businessAction({type:'collectBusinessOrder',business})));}
  else{
   nodes.push(text('p',`${kind.worker} hired · ${state.wage} vouchers per batch.`));
   const recipe=document.createElement('select');recipe.setAttribute('aria-label',`${kind.name} recipe`);for(const id of kind.recipes){const e=document.createElement('option');e.value=id;e.textContent=workshop.recipes[id]?.name??id;recipe.append(e);}
   const quantity=document.createElement('input');quantity.type='number';quantity.min='1';quantity.max='20';quantity.value='1';quantity.setAttribute('aria-label',`${kind.name} batch quantity`);
   const quote=text('p','');const update=()=>{const q=businessQuote(workshop,recipe.value,Number(quantity.value),state.wage!);quote.textContent=q?`Pay: ${goods(q.cost)}. Receive: ${goods(q.gives)}. Time: ${q.durationMs/1000}s.${q.tool?` Required tool: ${ITEMS[q.tool]?.name??q.tool} (retained).`:''}`:'Choose 1–20 batches.';};recipe.onchange=update;quantity.oninput=update;update();
   nodes.push(recipe,quantity,quote,button('Pay wages & start order',()=>ctrl.businessAction({type:'startBusinessOrder',business,recipe:recipe.value,quantity:Number(quantity.value)})));
  }
  if(!state.order)nodes.push(button('Dismiss worker / cancel wanted ad',()=>ctrl.businessAction({type:'dismissBusinessWorker',business})));
 }
 return nodes;
}
