import {ambientTime, AMBIENT_DAY_MS, dailyRequest,dailyState,npcPosition} from '@paradise-lost/sim';
import {ITEMS} from '@paradise-lost/content';
import type {Controller} from '../game/controller.ts';
const text=(tag:string,value:string)=>{const e=document.createElement(tag);e.textContent=value;return e;};
const button=(label:string,run:()=>void)=>{const b=document.createElement('button');b.textContent=label;b.onclick=run;return b;};
const goods=(items:Record<string,number>)=>Object.entries(items).map(([id,n])=>`${n} ${ITEMS[id]?.name??id}`).join(', ');
export function neighborhoodPanel(ctrl:Controller,close:HTMLElement):HTMLElement[]{
 const view=ctrl.neighborhoodView(),now=ctrl.now(),time=ambientTime(view.town,now),daily=dailyState(view.town,now),request=dailyRequest(daily.day);
 const minutes=Math.max(1,Math.ceil((AMBIENT_DAY_MS-((now-view.town.clock.epochMs)%AMBIENT_DAY_MS))/60000));
 const nodes=[close,text('h2','Neighborhood & daily life'),text('p',`Day ${time.day}. A game day lasts 48 real minutes. Next daily request in about ${minutes} minutes.`)];
 if(!view.here)nodes.push(text('p','These neighbors live in the starter neighborhood, separate from your private plot.'),button('Visit starter neighborhood — free',()=>ctrl.travelAction({type:'visitTown',townId:'local-neighborhood'})));
 nodes.push(text('h3',daily.requestDone?'Daily request completed':`Today: ${request.title}`),text('p',`Bring ${goods(request.cost)}. Reward: ${goods(request.gives)}. One request reward per day across all neighbors.`),text('p',`Rewarded food donations: ${daily.donated}/10 today. Every two food earns a learning voucher. Surplus food can also be bartered without waiting for tomorrow.`));
 for(const def of view.world.npcs){
  const pos=npcPosition(view.town,view.world,def,now),hours=def.schedule.filter(s=>!s.inside&&!s.whileProject).map(s=>s.fromHour),opens=Math.min(...hours);
  nodes.push(text('h3',def.name),text('p',pos.inside?`Indoors now; available from ${opens}:00.`:`Out in the neighborhood at tile ${pos.x}, ${pos.y}${pos.stop.whileProject?' — helping with the road project':pos.stop.patrol?.length?' — making the rounds':''}.`));
  if(def.trades?.length)nodes.push(text('p',`Offers: ${def.trades.map(t=>goods(t.gives)).join('; ')}.`));
  if(view.here&&!pos.inside)nodes.push(button(`Walk to ${def.name}`,()=>ctrl.walkToNeighbor(def.id)),button('Show on map',()=>{ctrl.openPanel(null);ctrl.focusPoint(pos);}));
 }
 nodes.push(button('Skills & recipes',()=>ctrl.openPanel({kind:'workshop'})),button('Garden, resources & wanted ads',()=>ctrl.openPanel({kind:'production'})),button('Pets & farm animals',()=>ctrl.openPanel({kind:'animals'})),button('Return to my plot — free',()=>ctrl.travelAction({type:'returnToPlot'})));
 return nodes;
}
