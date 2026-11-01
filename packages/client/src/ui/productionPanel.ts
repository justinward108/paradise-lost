import {CLOTHING_SLOTS,PROSPECT_RESOURCES} from '@paradise-lost/sim';
import {workshop,itemSources,world as starterWorld} from '@paradise-lost/content';
import {ITEMS} from '@paradise-lost/content';
import type {Controller} from '../game/controller.ts';
const text=(tag:string,value:string)=>{const e=document.createElement(tag);e.textContent=value;return e;};
function button(label:string,fn:()=>void){const b=document.createElement('button');b.textContent=label;b.addEventListener('click',fn);return b;}
export function productionPanel(ctrl:Controller,close:HTMLElement,note?:string):HTMLElement[]{
 const nodes=[close,text('h2','Resources, garden & wardrobe')];if(note)nodes.push(text('p',note));
 nodes.push(text('h3','Prospecting'),text('p','Craft a mining pick in Skills & workshop. Each job uses 1 water and returns 2 selected minerals plus 2 stone. Three jobs per plot per ambient day. Underground exploration is still being built. Collect finished work in Skills & workshop.'));
 for(const [id,deposit]of Object.entries(PROSPECT_RESOURCES)){
  const mine=button(`Prospect: ${deposit.name} · ${deposit.xp} mining XP · ${deposit.durationMs/1000}s`,()=>ctrl.productionAction({type:'prospect',resource:id as keyof typeof PROSPECT_RESOURCES}));
  mine.disabled=(ctrl.town.career?.skills.mining??0)<deposit.xp;nodes.push(mine);
 }
 if(ctrl.town.career?.activity)nodes.push(button('View or collect current work',()=>ctrl.openPanel({kind:'workshop'})));
 nodes.push(text('h3','Ingredient & resource guide'));
 const resource=document.createElement('select');resource.setAttribute('aria-label','Item acquisition guide');
 for(const[id,item]of Object.entries(ITEMS).sort((a,b)=>a[1].name.localeCompare(b[1].name))){const option=document.createElement('option');option.value=id;option.textContent=item.name;resource.append(option);}
 const sources=document.createElement('div');
 const showSources=()=>{const lines=itemSources(resource.value,starterWorld,ITEMS);sources.replaceChildren(...(lines.length?lines:['No repeatable acquisition source is registered for this item yet.']).map(line=>text('p',line)));};
 resource.addEventListener('change',showSources);showSources();nodes.push(resource,sources);
 nodes.push(text('h3','Garden soil'),text('p','Make compost and mineral fertilizer in Skills & workshop. Stand next to a planted bed, then apply one treatment. Compost adds 1 produce per harvest item; fertilizer adds 2. The boost lasts for one harvest, does not stack, and does not speed growth.'));
 const beds=document.createElement('select');beds.setAttribute('aria-label','Garden bed to fertilize');
 for(const[key,crop]of Object.entries(ctrl.town.crops)){const option=document.createElement('option');option.value=key;option.textContent=`${key}: ${ctrl.world.crops[crop.cropId]?.name??crop.cropId}${ctrl.town.soil[key]?.harvestBoost?' · already treated':''}`;beds.append(option);}
 const target=()=>{const[x,y]=beds.value.split(',').map(Number);return{x:x!,y:y!};};
 if(beds.options.length){
  nodes.push(beds,button('Show selected bed',()=>ctrl.focusPoint(target())));
  for(const item of ['compost','fertilizer'] as const){const use=button(`Apply ${item} (${ctrl.town.inventory[item]??0})`,()=>ctrl.productionAction({type:'fertilize',item,...target()}));use.disabled=!(ctrl.town.inventory[item]!>0);nodes.push(use);}
 }else nodes.push(text('p','Plant a crop on your plot to prepare its soil.'));
 nodes.push(text('h3','Wardrobe'),text('p',`Wearing: ${Object.values(ctrl.town.wardrobe?.equipped??{}).map(id=>ITEMS[id]?.name??id).join(', ')||'starter clothes'}. Clothing design offers individual garments and a complete outfit recipe.`));
 for(const id of Object.keys(CLOTHING_SLOTS))if((ctrl.town.inventory[id]??0)>0)nodes.push(button(`Wear ${ITEMS[id]?.name??id}`,()=>ctrl.productionAction({type:'equipClothing',item:id})));
 nodes.push(text('h3','Video games'),text('p','A crafted console and game provide a 30-second leisure session, worth 12 happiness once per ambient day. Interactive console minigames are still being built.'));
 nodes.push(ctrl.town.wardrobe?.gameReadyMs?button('Finish game session',()=>ctrl.productionAction({type:'finishConsole'})):button('Play a video game',()=>ctrl.productionAction({type:'playConsole'})));
 nodes.push(text('h3','Wanted: a teacher'),text('p','NPC teachers arrive after one ambient day. Each lesson costs the agreed wage plus 1 voucher for supplies, gives 4 skill points in 45 seconds, and is collected in Skills & workshop. Player teaching is planned to give 6 points in 30 seconds when online hiring is connected.'));
 const ad=ctrl.town.staffing?.teacher;
 if(ad){
  nodes.push(text('p',`${workshop.skills[ad.skill]?.name??ad.skill}: ${ad.hired?'hired':'wanted ad posted'} · ${ad.wage} vouchers per lesson.`));
  nodes.push(ad.hired?button('Attend lesson',()=>ctrl.productionAction({type:'attendLesson'})):button('Hire applicant',()=>ctrl.productionAction({type:'hireTeacher'})));
  nodes.push(button('Dismiss teacher / cancel ad',()=>ctrl.productionAction({type:'dismissTeacher'})));
 }else{
  const subject=document.createElement('select');subject.setAttribute('aria-label','Teaching subject');
  for(const [id,skill] of Object.entries(workshop.skills)){const option=document.createElement('option');option.value=id;option.textContent=skill.name;subject.append(option);}
  const wage=document.createElement('input');wage.type='number';wage.min='2';wage.max='20';wage.value='2';wage.setAttribute('aria-label','Teacher wage in learning vouchers');
  nodes.push(subject,wage,button('Post teacher wanted ad',()=>ctrl.productionAction({type:'advertiseTeacher',skill:subject.value,wage:Number(wage.value)})));
 }
 return nodes;
}
