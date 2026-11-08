import {townFunds} from './townFunds.ts';
import {jobBoard} from './jobBoard.ts';
import {ITEMS} from '@paradise-lost/content';
import {newCommandId} from '@paradise-lost/sim';
import { LOCAL_RESIDENT } from '@paradise-lost/sim';
import type { Controller } from '../game/controller.ts';
const el = (tag: string, value: string) => { const e = document.createElement(tag); e.textContent = value; return e; };
function button(label: string, fn: () => void, disabled = false) {
  const b = document.createElement('button'); b.textContent = label; b.disabled = disabled; b.addEventListener('click', fn); return b;
}

export function travelPanel(ctrl: Controller, close: HTMLElement, note?: string): HTMLElement[] {
  if(ctrl.online)return onlineTravelPanel(ctrl,close,note);
  const state = ctrl.town.travel;
  const towns = Object.values(state?.towns ?? {});
  const location = state?.location;
  const current = location?.kind === 'town' ? state?.towns[location.townId]?.name : 'Your plot';
  const home = state?.homeTownId ? state.towns[state.homeTownId]?.name : 'Independent plot';
  const nodes = [close, el('h2', 'Towns & travel'), el('p', `Location: ${current}. Residence: ${home}.`), el('p', 'These towns are saved on this device. Online town discovery, invitations and other players are not connected yet.')];
  if (note) nodes.push(el('p', note));
  if (!ctrl.town.privatePlot) nodes.push(button('Expand to a 64 × 64 private plot — free', () => ctrl.travelAction({type:'expandPrivatePlot'})));
  nodes.push(button('Return to my plot — free', () => ctrl.travelAction({ type: 'returnToPlot' })));
  nodes.push(el('p', (ctrl.town.inventory.boat ?? 0) > 0 ? 'Your boat provides fare-free travel.' : 'Ferry passage costs 3 boards per trip. Return to your plot is always free.'));
  nodes.push(el('h3', 'Found a town'));
  const form = document.createElement('form');
  const label = document.createElement('label'); label.textContent = 'Town name ';
  const input = document.createElement('input'); input.name = 'townName'; input.minLength = 2; input.maxLength = 48; input.required = true;
  label.append(input);
  const submit = document.createElement('button'); submit.type = 'submit'; submit.textContent = 'Found town & attach my plot';
  form.append(label, submit);
  form.addEventListener('submit', e => { e.preventDefault(); ctrl.travelAction({ type: 'foundTown', name: input.value }); });
  nodes.push(form, el('p', 'Founding costs 20 boards and 10 stone. Moving from an existing town adds 5 boards. You become mayor; the new town center starts unbuilt.'));
  nodes.push(el('h3', 'Destinations'));
  if (!towns.length) nodes.push(el('p', 'No towns founded yet. Your independent plot is preserved when you found one.'));
  // Schematic route diagram, not invented geographical coordinates.
  if (towns.length) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', `0 0 300 ${60 + towns.length * 40}`); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Boat routes from your plot to the towns in the destination list');
    svg.style.width = '100%'; svg.style.maxHeight = '260px';
    const title = document.createElementNS(ns, 'text'); title.setAttribute('x','12'); title.setAttribute('y','20'); title.setAttribute('fill','currentColor'); title.textContent = 'Your plot — boat routes'; svg.append(title);
    towns.forEach((town,i) => {
      const y = 50 + i * 40;
      const route = document.createElementNS(ns,'path'); route.setAttribute('d',`M 20 30 V ${y} H 70`); route.setAttribute('stroke','currentColor'); route.setAttribute('fill','none'); svg.append(route);
      const island = document.createElementNS(ns,'ellipse'); island.setAttribute('cx','82'); island.setAttribute('cy',String(y)); island.setAttribute('rx','12'); island.setAttribute('ry','8'); island.setAttribute('fill','#6eaa79'); svg.append(island);
      const name = document.createElementNS(ns,'text'); name.setAttribute('x','104'); name.setAttribute('y',String(y+5)); name.setAttribute('fill','currentColor'); name.textContent = town.name; svg.append(name);
    });
    const diagram = document.createElement('div'); diagram.append(svg); nodes.push(diagram);
  }
  for (const town of towns) {
    nodes.push(el('h3', town.name));
    nodes.push(el('p', `Residents: ${town.residents.map(r => r.name).join(', ') || 'none'}. Mayor: ${town.residents.find(r => r.id === town.mayorId)?.name ?? 'vacant'}.`));
    nodes.push(button(town.kind === 'neighborhood' ? 'Visit neighbors — free' : 'Visit town center', () => ctrl.travelAction({ type: 'visitTown', townId: town.id }), location?.kind === 'town' && location.townId === town.id));
    if (town.kind !== 'neighborhood' && state?.homeTownId !== town.id) nodes.push(button(`Move my plot here${state?.homeTownId ? ' — 5 boards' : ' — free'}`, () => ctrl.travelAction({ type: 'moveResidence', townId: town.id })));
    if (town.mayorId === LOCAL_RESIDENT) {
      for (const resident of town.residents.filter(r => r.id !== LOCAL_RESIDENT)) nodes.push(button(`Appoint ${resident.name} mayor`, () => ctrl.travelAction({ type: 'appointMayor', townId: town.id, residentId: resident.id })));
    }
  }
  return nodes;
}

function onlineTravelPanel(ctrl:Controller,close:HTMLElement,note?:string):HTMLElement[]{
 const nodes=[close,el('h2','Shared towns & travel'),el('p',ctrl.onlineCenter?`Town center: ${ctrl.onlineCenter.name}. Residents share construction here.`:ctrl.visitingName?`Visiting ${ctrl.visitingName}. You can exchange goods through player trade offers.`:'Your server-owned plot. Joining a town preserves your buildings and possessions.')];
 nodes.push(el('p','No travel agency is required. Visit the starter neighborhood for Auntie Rosa, the seed trader and the road repair project. Return home at any time for free. Shared town centers and player visits are available below.'));
 if(note)nodes.push(el('p',note));
 nodes.push(button('Return to my plot — free',()=>void ctrl.onlineAction('returnHome')),button('Refresh towns & residents',()=>void ctrl.onlineAction('directory')));
 nodes.push(button('Visit starter neighborhood — Rosa, seeds & road (free)',()=>ctrl.travelAction({type:'visitTown',townId:'local-neighborhood'})));
 if(ctrl.onlineCenter){
  const own=document.createElement('input');own.type='checkbox';own.checked=ctrl.centerDonation;
  const label=document.createElement('label');label.append(own,' Donate my own materials for each build (otherwise use town stock)');
  own.onchange=()=>{ctrl.centerDonation=own.checked;void ctrl.refreshCenter();};nodes.push(label,el('p','Shared buildings and recovered demolition materials belong to the town. Donations are not returned to your personal inventory.'));
 }
 const directory=ctrl.onlineDirectory;
 if(!directory){nodes.push(el('p','Load the directory to see towns and residents.'));return nodes;}
 nodes.push(el('h3','Your public presence'));
 const name=document.createElement('input');name.value=directory.profile?.display_name??'';name.maxLength=32;name.setAttribute('aria-label','Public player name');
 const visits=document.createElement('input');visits.type='checkbox';visits.checked=directory.profile?.allow_visits??false;
 const label=document.createElement('label');label.append(visits,' Allow players from any town to visit my plot');
 nodes.push(name,label,button('Save name & visit permission',()=>void ctrl.onlineAction('presence',{name:name.value,allowVisits:visits.checked})));
 nodes.push(el('h3','Find a town'));
 const seeking=document.createElement('input');seeking.type='checkbox';seeking.checked=directory.profile?.seeking_town??false;
 const seekLabel=document.createElement('label');seekLabel.append(seeking,' List me publicly as looking for a town');
 const seekNote=document.createElement('textarea');seekNote.maxLength=400;seekNote.value=directory.profile?.seeking_note??'';seekNote.setAttribute('aria-label','What you want in a town');
 nodes.push(seekLabel,seekNote,button('Save town search listing',()=>void ctrl.onlineAction('seekTown',{seeking:seeking.checked,note:seekNote.value})));
 for(const invitation of directory.invitations??[]){nodes.push(el('p',`Invitation to ${invitation.name} · expires ${new Date(invitation.expires_at).toLocaleDateString()}`),button('Accept invitation',()=>void ctrl.onlineAction('respondInvitation',{invitationId:invitation.id,response:'accept'})),button('Decline invitation',()=>void ctrl.onlineAction('respondInvitation',{invitationId:invitation.id,response:'decline'})));}
 const myTown=directory.towns.find(t=>t.id===directory.membership);
 const mayor=myTown?.mayor_id===directory.ownerId;
 if(mayor&&myTown){
  nodes.push(el('h3','Town recruitment settings'));
  const admission=document.createElement('select');admission.setAttribute('aria-label','Town admission policy');
  for(const [id,name]of [['open','Open joining'],['invite','Invitation required']]){const option=document.createElement('option');option.value=id!;option.textContent=name!;admission.append(option);}admission.value=myTown.admission;
  const notice=document.createElement('textarea');notice.maxLength=600;notice.value=myTown.recruitment;notice.setAttribute('aria-label','Town recruitment notice');
  nodes.push(admission,notice,button('Save recruitment settings',()=>void ctrl.onlineAction('townRecruitment',{admission:admission.value,text:notice.value})));
  for(const invitation of directory.outgoing??[])nodes.push(el('p',`Pending invitation: ${invitation.display_name}`),button('Revoke invitation',()=>void ctrl.onlineAction('revokeInvitation',{invitationId:invitation.id})));
 }
 nodes.push(el('h3','Players looking for towns'));
 for(const seeker of directory.seekers??[]){
  nodes.push(el('p',`${seeker.display_name}: ${seeker.seeking_note} · Qualified professions: ${seeker.professions.map(id=>ctrl.world.workshop?.skills[id]?.profession??id).join(', ')||'none listed'}`));
  if(mayor&&seeker.owner_id!==directory.ownerId)nodes.push(button(`Invite ${seeker.display_name}`,()=>void ctrl.onlineAction('invitePlayer',{residentId:seeker.owner_id})));
 }
 if(directory.membership)nodes.push(button('Leave my town',()=>void ctrl.onlineAction('leaveTown')));
 else{
  const townName=document.createElement('input');townName.maxLength=48;townName.setAttribute('aria-label','New town name');
  nodes.push(townName,button('Found a shared town — 20 boards, 10 stone',()=>void ctrl.onlineAction('foundTown',{name:townName.value})));
 }
 for(const town of directory.towns){
  nodes.push(el('h3',town.name),el('p',`${town.residents} residents · ${town.tax_percent??5}% income tax · ${town.admission==='invite'?'Invitation required':'Open joining'}${directory.membership===town.id?' · Your town':''}`),el('p',town.recruitment));
  nodes.push(button('Town treasury & stock',()=>void ctrl.onlineAction('treasury',{townId:town.id})));
  nodes.push(button('Visit shared center',()=>void ctrl.onlineAction('visitCenter',{townId:town.id})),button('Town job board',()=>void ctrl.onlineAction('listJobs',{townId:town.id})));
  nodes.push(button('Browse residents & traders',()=>void ctrl.onlineAction('directory',{townId:town.id})));
  if(!directory.membership&&town.admission!=='invite')nodes.push(button('Join this town',()=>void ctrl.onlineAction('joinTown',{townId:town.id})));
 }
 nodes.push(...townFunds(ctrl));
 nodes.push(...jobBoard(ctrl));
 nodes.push(button('Player teachers & lessons',()=>void ctrl.onlineAction('lessonBoard')));
 nodes.push(el('h3','Town residents'));
 for(const resident of directory.residents){
  if(resident.owner_id!==directory.ownerId)nodes.push(button(`Give or mail to ${resident.display_name}`,()=>{ctrl.giftRecipient={id:resident.owner_id,name:resident.display_name};ctrl.openPanel({kind:'travel'});}));
  if(resident.owner_id!==directory.ownerId)nodes.push(button(`Block ${resident.display_name}`,()=>void ctrl.onlineAction('blockPlayer',{residentId:resident.owner_id})));
  nodes.push(button(`Trade with ${resident.display_name}`,()=>void ctrl.onlineAction('listTrades',{ownerId:resident.owner_id})));
  nodes.push(el('p',`${resident.display_name} · ${resident.online?'online recently':'away'}`));
  if(resident.allow_visits&&resident.owner_id!==directory.ownerId)nodes.push(button(`Visit ${resident.display_name}`,()=>void ctrl.onlineAction('visitPlot',{residentId:resident.owner_id})));
  if(directory.towns.some(t=>t.id===directory.membership&&t.mayor_id===directory.ownerId)&&resident.owner_id!==directory.ownerId)nodes.push(button(`Appoint ${resident.display_name} mayor`,()=>void ctrl.onlineAction('appointMayor',{residentId:resident.owner_id})));
 }
 nodes.push(el('p',`Rapture Credits: ${ctrl.onlineCreditBalance??'refresh to load'}`),el('h3','Player trade offers'),el('p','Offered goods are reserved when posted. Accepting exchanges both sides atomically. Offers work across towns; building permission is separate.'));
 nodes.push(button('My offers',()=>void ctrl.onlineAction('listTrades',{ownerId:directory.ownerId})));
 for(const offer of ctrl.onlineOffers){
  nodes.push(el('p',`${offer.give_qty} ${ITEMS[offer.give_item]?.name??offer.give_item} for ${offer.price_rc!==null?`${offer.price_rc} RC`:`${offer.want_qty} ${ITEMS[offer.want_item]?.name??offer.want_item}`}`));
  nodes.push(offer.owner_id===directory.ownerId?button('Cancel & recover reserved goods',()=>void ctrl.onlineAction('cancelTrade',{offerId:offer.id})):button('Accept trade',()=>void ctrl.onlineAction('acceptTrade',{offerId:offer.id})));
 }
 const select=(label:string)=>{const e=document.createElement('select');e.setAttribute('aria-label',label);for(const[id,item]of Object.entries(ITEMS)){const o=document.createElement('option');o.value=id;o.textContent=item.name;e.append(o);}return e;};
 const count=(label:string)=>{const e=document.createElement('input');e.type='number';e.min='1';e.max='999';e.value='1';e.setAttribute('aria-label',label);return e;};
 const give=select('Item to offer'),want=select('Item requested'),giveQty=count('Quantity offered'),wantQty=count('Quantity requested');
 const currency=document.createElement('select');currency.setAttribute('aria-label','Payment type');for(const value of ['barter','RC']){const option=document.createElement('option');option.value=value;option.textContent=value==='RC'?'Rapture Credits':'Items (barter)';currency.append(option);}
 const price=count('Rapture Credit price');price.max='1000000';price.hidden=true;currency.onchange=()=>{price.hidden=currency.value!=='RC';want.hidden=wantQty.hidden=currency.value==='RC';};
 const key=newCommandId();
 nodes.push(el('h3','Post an offer'),el('p','Give:'),give,giveQty,el('p','Receive:'),currency,want,wantQty,price,button('Reserve goods & post offer',()=>void ctrl.onlineAction('offerTrade',{requestKey:key,currency:currency.value,priceRC:Number(price.value),giveItem:give.value,giveQty:Number(giveQty.value),wantItem:want.value,wantQty:Number(wantQty.value)})));
 nodes.push(el('h3','Gifts & mail'),el('p','Give items or Rapture Credits instantly, or mail items, credits and letters with a 10-minute delivery delay. Sent assets are reserved immediately.'));
 if(ctrl.giftRecipient){
  const recipient=ctrl.giftRecipient;nodes.push(el('p',`To: ${recipient.name}`));
  const kind=document.createElement('select');kind.setAttribute('aria-label','Gift type');for(const value of ['item','credits','letter']){const option=document.createElement('option');option.value=value;option.textContent=value;kind.append(option);}
  const delivery=document.createElement('select');delivery.setAttribute('aria-label','Delivery method');for(const value of ['instant','mail']){const option=document.createElement('option');option.value=value;option.textContent=value==='mail'?'Mail — 10 minutes':'Give instantly';delivery.append(option);}
  const item=select('Gift item'),quantity=count('Gift quantity'),amount=count('Gift credit amount');amount.max='1000000';
  const subject=document.createElement('input');subject.maxLength=80;subject.value='A gift for you';subject.setAttribute('aria-label','Mail subject');
  const letter=document.createElement('textarea');letter.maxLength=1200;letter.setAttribute('aria-label','Letter text');
  const fields=()=>{item.classList.toggle('hidden',kind.value!=='item');quantity.classList.toggle('hidden',kind.value!=='item');amount.classList.toggle('hidden',kind.value!=='credits');};kind.addEventListener('change',fields);fields();
  const confirmation=textGift();const sendKey=newCommandId();
  const send=button('Confirm & send',()=>void ctrl.onlineAction('sendGift',{recipientId:recipient.id,requestKey:sendKey,kind:kind.value,delivery:delivery.value,item:item.value,quantity:Number(quantity.value),amountRC:Number(amount.value),subject:subject.value,body:letter.value}));send.disabled=true;
  const review=button('Review gift or mail',()=>{confirmation.textContent=`Send ${kind.value==='credits'?`${amount.value} RC`:kind.value==='item'?`${quantity.value} ${ITEMS[item.value]?.name??item.value}`:'a letter'} to ${recipient.name} by ${delivery.value}. No payment is requested in return.`;send.disabled=false;});
  for(const field of [kind,delivery,item,quantity,amount,subject,letter])field.addEventListener('input',()=>{send.disabled=true;confirmation.textContent='Review your changes before sending.';});
  nodes.push(kind,delivery,item,quantity,amount,subject,letter,review,confirmation,send);
 }
 nodes.push(button('Refresh inbox & sent mail',()=>void ctrl.onlineAction('mailbox')));
 for(const mail of ctrl.onlineMailbox){
  const incoming=mail.recipient_id===directory.ownerId;
  nodes.push(el('p',`${incoming?'From '+(mail.sender_name??'Player'):'To '+(mail.recipient_name??'Player')}: ${mail.subject} · ${mail.status==='delivered'?'Delivered':mail.ready?'Ready to collect':`In transit until ${new Date(mail.ready_at).toLocaleTimeString()}`}`));
  if(mail.body)nodes.push(el('p',mail.body));
  if(incoming&&mail.status!=='delivered')nodes.push(button('Collect delivery',()=>void ctrl.onlineAction('collectMail',{deliveryId:mail.id}),!mail.ready));
 }
 nodes.push(el('h3','Blocked players'),el('p','Shared with poor.camp messaging. Blocking applies to visits, trades and invitations, and hides messages between the pair in shared group chats.'));
 for(const blocked of directory.blocked??[])nodes.push(el('p',blocked.display_name??'Blocked player'),button('Unblock player',()=>void ctrl.onlineAction('unblockPlayer',{residentId:blocked.blocked_id})));
 nodes.push(el('h3','Preserve old browser progress'),el('p','Archive the old browser save on the server for migration review. This preserves a copy without granting unverified online items or credits.'),button('Archive my legacy browser save',()=>void ctrl.onlineAction('archiveLegacy')));
 return nodes;
}

function textGift(){const e=document.createElement('p');e.setAttribute('aria-live','polite');return e;}
