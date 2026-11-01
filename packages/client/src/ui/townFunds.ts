import {ITEMS} from '@paradise-lost/content';
import {newCommandId} from '@paradise-lost/sim';
import type {Controller} from '../game/controller.ts';
const text=(tag:string,value:string)=>{const e=document.createElement(tag);e.textContent=value;return e;};
const button=(label:string,fn:()=>void)=>{const e=document.createElement('button');e.textContent=label;e.onclick=fn;return e;};
export function townFunds(ctrl:Controller):HTMLElement[]{
 const state=ctrl.onlineTreasury,town=ctrl.treasuryTownId,directory=ctrl.onlineDirectory;if(!state||!town||!directory)return [];
 const nodes=[text('h3','Town treasury & shared stock'),text('p',`${state.balance_rc} RC in town funds. Income tax: ${state.tax_percent}% of resident job wages and credit sales.`),text('p','Income tax is collected when wages or sales income arrive. Gifts, mailed credits and donations are exempt. Fractional credits carry forward to later income. Town stock funds shared buildings by default.')];
 nodes.push(button('Refresh treasury',()=>void ctrl.onlineAction('payTownTax',{townId:town})));
 const stock=Object.entries(state.inventory).filter(([,n])=>n>0).map(([id,n])=>`${n} ${ITEMS[id]?.name??id}`).join(', ');nodes.push(text('p',`Shared items: ${stock||'none yet'}.`));
 if(directory.membership===town){
  const item=document.createElement('select');item.setAttribute('aria-label','Item donation');for(const[id,d]of Object.entries(ITEMS)){const option=document.createElement('option');option.value=id;option.textContent=d.name;item.append(option);}
  const count=document.createElement('input');count.type='number';count.min='1';count.max='999';count.value='5';count.setAttribute('aria-label','Quantity donated');
  const amount=document.createElement('input');amount.type='number';amount.min='1';amount.max='1000000';amount.value='100';amount.setAttribute('aria-label','Credits donated');
  const itemKey=newCommandId(),moneyKey=newCommandId();
  nodes.push(text('h4','Donate personal resources'),item,count,button('Donate items to town stock',()=>void ctrl.onlineAction('contributeTown',{townId:town,kind:'items',item:item.value,quantity:Number(count.value),requestKey:itemKey})),amount,button('Donate RC to the treasury',()=>void ctrl.onlineAction('contributeTown',{townId:town,kind:'credits',amountRC:Number(amount.value),requestKey:moneyKey})));
  if(directory.towns.find(t=>t.id===town)?.mayor_id===directory.ownerId){const rate=document.createElement('input');rate.type='number';rate.min='0';rate.max='100';rate.value=String(state.tax_percent);rate.setAttribute('aria-label','Town income tax percentage');nodes.push(text('h4','Tax policy'),rate,button('Set income tax %',()=>void ctrl.onlineAction('setTownTax',{townId:town,rate:Number(rate.value)})));}
 }
 nodes.push(text('h4','Recent town transactions'));for(const row of state.ledger)nodes.push(text('p',`${Number(row.amount_rc)>0?'+':''}${row.amount_rc} RC · ${row.reason}`));
 return nodes;
}
