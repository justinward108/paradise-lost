import { wellbeingAt, waterRemaining, workDurationFactor } from '@paradise-lost/sim';
import { ITEMS } from '@paradise-lost/content';
import type { Controller } from '../game/controller.ts';
const text=(tag:string,value:string)=>{const e=document.createElement(tag);e.textContent=value;return e;};
function button(label:string,action:()=>void,disabled=false) {const b=document.createElement('button');b.textContent=label;b.disabled=disabled;b.addEventListener('click',action);return b;}
export function wellbeingPanel(ctrl:Controller,close:HTMLElement,note?:string):HTMLElement[] {
  const state=wellbeingAt(ctrl.town,ctrl.now());
  const nodes=[close,text('h2','Food, water & wellbeing')];
  for(const [name,value] of [['Nourishment',state.food],['Hydration',state.water],['Happiness',state.happiness],['Kindness',state.kindness],['Charisma',state.charisma]] as const) {
    const label=document.createElement('label');label.textContent=`${name}: ${Math.round(value)}/100 `;
    const meter=document.createElement('meter');meter.min=0;meter.max=100;meter.value=value;meter.setAttribute('aria-label',name);label.append(meter);nodes.push(label,document.createElement('br'));
  }
  if(note) nodes.push(text('p',note));
  const factor=workDurationFactor(ctrl.town,ctrl.now());
  nodes.push(text('p',factor>1?'Low food or water makes new study/crafting activities take 25% longer.':factor<1?'Your prepared meal/drink bonus makes new study/crafting activities 10% faster.':'You are ready to work at the normal pace.'));
  nodes.push(text('p','Food and water decline gradually. Catch-up while away is capped at four real hours. Low needs reduce happiness and work pace. Successful daily conversations improve charisma; giving food improves kindness and happiness.'));
  nodes.push(text('h3','Eat & drink'));
  for(const [id,effect] of Object.entries(ctrl.world.wellbeing?.foods??{})) {
    const count=ctrl.town.inventory[id]??0;if(!count)continue;
    nodes.push(button(`${id==='water'?'Drink':'Consume'} ${ITEMS[id]?.name??id} (${count}) · +${effect.food} food, +${effect.water} water, +${effect.happiness} happiness${effect.focusMs?` · ${Math.round(effect.focusMs/60000)} min work bonus`:''}`,()=>ctrl.wellbeingAction({type:'consume',item:id})));
  }
  nodes.push(text('h3','Water supply'),text('p','Rosa barters 2 water for 1 board. Your own water source costs 6 lumber, 12 stone and 2 cloth; it supplies 6 water per ambient day. Drinking and hand-watering plants draw from the same inventory. Rain still waters crops for free.'));
  const home=ctrl.town.travel?.location.kind!=='town';
  if(ctrl.town.waterSource?.built) nodes.push(button(`Draw water (${waterRemaining(ctrl.town,ctrl.now())} left today)`,()=>ctrl.wellbeingAction({type:'drawWater'}),!home||waterRemaining(ctrl.town,ctrl.now())===0));
  else nodes.push(button('Build water source on my plot',()=>ctrl.wellbeingAction({type:'buildWaterSource'}),!home));
  if(!home) nodes.push(button('Return to my plot — free',()=>ctrl.travelAction({type:'returnToPlot'})));
  return nodes;
}
