import {ITEMS,catalog,workshop,world} from '@paradise-lost/content';
import {newCommandId,type Slot} from '@paradise-lost/sim';
import type {Controller} from '../game/controller.ts';
const text=(tag:string,value:string)=>{const e=document.createElement(tag);e.textContent=value;return e;};
const button=(label:string,fn:()=>void)=>{const e=document.createElement('button');e.textContent=label;e.onclick=fn;return e;};
function number(label:string,value:number,min:number,max:number){const e=document.createElement('input');e.type='number';e.value=String(value);e.min=String(min);e.max=String(max);e.setAttribute('aria-label',label);return e;}
function select(label:string,values:[string,string][]){const e=document.createElement('select');e.setAttribute('aria-label',label);for(const[id,name]of values){const o=document.createElement('option');o.value=id;o.textContent=name;e.append(o);}return e;}
const goods=(values:Record<string,number>)=>Object.entries(values).map(([id,n])=>`${n} ${ITEMS[id]?.name??id}`).join(', ');
export function jobBoard(ctrl:Controller):HTMLElement[]{
 const town=ctrl.jobsTownId,directory=ctrl.onlineDirectory;if(!town||!directory)return [];
 const nodes=[text('h3','Paid player jobs'),text('p','The employer funds the RC wage when posting. Workers supply delivery goods; construction uses town stock. Personal funding of a construction wage is a donation to the town. Completion is verified by the server and pays once, after your home town’s income tax. Claims last 24 hours; release a claim if you cannot finish.')];
 nodes.push(button('Refresh job board',()=>void ctrl.onlineAction('listJobs',{townId:town})));
 const search=document.createElement('input');search.type='search';search.placeholder='Search jobs, employers or skills';search.setAttribute('aria-label','Search paid jobs');
 const view=select('Show jobs',[['all','All jobs'],['available','Available work'],['qualified','Work I qualify for'],['claimed','My claimed jobs'],['posted','Jobs I posted']]);
 const sort=select('Sort jobs',[['recent','Newest first'],['wage','Highest wage first']]);
 const results=text('p',''),list=document.createElement('div');nodes.push(search,view,sort,results,list);
 const cards:{element:HTMLElement;job:typeof ctrl.onlineJobs[number];available:boolean;qualified:boolean;search:string}[]=[];
 for(const job of ctrl.onlineJobs){
  const card=document.createElement('section'),nodes:HTMLElement[]=[];list.append(card);
  const xp=ctrl.town.career?.skills[job.skill]??0;
  const gaps:string[]=[];
  if(xp<job.min_xp)gaps.push(`${job.min_xp-xp} more ${workshop.skills[job.skill]?.name??job.skill} XP`);
  if(job.kind==='construction'&&directory.membership!==town)gaps.push('town residency');
  if(job.kind==='animal_care'&&job.animal_action==='treat'&&!ctrl.town.career?.professions.includes('veterinary'))gaps.push('veterinary qualification');
  const supplies:Record<string,number>={};
  if(job.kind==='delivery'&&job.item)supplies[job.item]=Number(job.quantity);
  if(job.kind==='gardening'&&job.garden_action==='water')supplies.water=1;
  if(job.kind==='animal_care'){
   const def=world.animalDefs?.[job.animal_signature?.species??''];
   if(job.animal_action==='feed'&&def)supplies[def.feed]=1;
   if(job.animal_action==='water')supplies.water=1;
   if(job.animal_action==='treat')supplies.pet_medicine=1;
   if(job.animal_action==='play'&&def?.toy)supplies[def.toy]=1;
  }
  const missing=Object.fromEntries(Object.entries(supplies).map(([id,n])=>[id,Math.max(0,n-(ctrl.town.inventory[id]??0))]).filter(([,n])=>Number(n)>0));
  if(gaps.length)nodes.push(text('p',`To qualify: ${gaps.join('; ')}.`));
  else nodes.push(text('p','You meet the listed skill and residency requirements.'));
  if(Object.keys(supplies).length)nodes.push(text('p',`Bring: ${goods(supplies)}.${Object.keys(missing).length?` Missing: ${goods(missing)}.`:' You have these supplies.'}`));
  nodes.push(text('h4',job.title),text('p',`${job.employer_name??'Employer'} · ${job.wage_rc} RC · ${job.funding==='town'?'Town-funded':'Personally funded'} · ${job.status} · ${workshop.skills[job.skill]?.name??job.skill}: ${job.min_xp} XP required`));
  if(job.kind==='delivery')nodes.push(text('p',`Deliver ${job.quantity} ${ITEMS[job.item!]?.name??job.item}.`));
  else if(job.kind==='animal_care')nodes.push(text('p',`${job.animal_action} the owner’s ${world.animalDefs?.[job.animal_signature?.species??'']?.name??'animal'}. Worker supplies food, water, medicine or a reusable matching toy as needed. Produce stays with the owner. Treatment requires a veterinary qualification.`));
  else if(job.kind==='gardening')nodes.push(text('p',`${job.garden_action} the contracted crop at (${job.slot?.x}, ${job.slot?.y}) on the employer’s plot. Harvests stay with the owner.${job.garden_action==='water'?' Bring 1 water.':''}${job.work_ready_at?` Work ready after ${new Date(job.work_ready_at).toLocaleTimeString()}.`:''}`));
  else nodes.push(text('p',`Build ${catalog[job.piece_id!]?.name??job.piece_id} at (${job.slot?.x}, ${job.slot?.y}), level ${job.slot?.level}${job.slot?.kind==='edge'?`, edge ${job.slot.dir}`:''}. Town materials: ${goods(catalog[job.piece_id!]?.cost??{})}. Building support rules must be satisfied.`));
  const mine=job.employer_id===directory.ownerId,worker=job.worker_id===directory.ownerId;
  const expired=!!job.claim_expires_at&&Date.parse(job.claim_expires_at)<Date.now();
  if(!mine&&!job.interaction_blocked&&(job.status==='open'||job.status==='claimed'&&expired))nodes.push(button('Claim job',()=>void ctrl.onlineAction('claimJob',{jobId:job.id})));
  if(worker&&job.status==='claimed'){
   const complete=button('Complete work & collect wage',()=>void ctrl.onlineAction('completeJob',{jobId:job.id}));
   if(['gardening','animal_care'].includes(job.kind)&&job.work_ready_at&&!job.interaction_blocked){complete.dataset.jobReady=String(Date.parse(job.work_ready_at));complete.disabled=Date.now()<Date.parse(job.work_ready_at);}
   if(job.interaction_blocked){complete.disabled=true;nodes.push(text('p','This interaction is blocked. Release your claim to free your work slot.'));}
   nodes.push(complete,button('Release my claim',()=>void ctrl.onlineAction('releaseJob',{jobId:job.id})));
  }
  if(mine&&(job.status==='open'||job.status==='claimed'&&expired))nodes.push(button('Cancel job & recover wage',()=>void ctrl.onlineAction('cancelJob',{jobId:job.id})));
  card.append(...nodes);
  cards.push({element:card,job,available:!mine&&!job.interaction_blocked&&(job.status==='open'||job.status==='claimed'&&expired),qualified:gaps.length===0,search:[job.title,job.employer_name,workshop.skills[job.skill]?.name,job.kind,job.item&&ITEMS[job.item]?.name].join(' ').toLowerCase()});
 }
 const applyFilters=()=>{
  const query=search.value.trim().toLowerCase();let shown=0;
  const ordered=[...cards];if(sort.value==='wage')ordered.sort((a,b)=>Number(b.job.wage_rc)-Number(a.job.wage_rc));
  for(const c of ordered){const visible=c.search.includes(query)&&(view.value==='all'||view.value==='available'&&c.available||view.value==='qualified'&&c.available&&c.qualified||view.value==='claimed'&&c.job.worker_id===directory.ownerId&&c.job.status==='claimed'||view.value==='posted'&&c.job.employer_id===directory.ownerId);c.element.hidden=!visible;if(visible)shown++;list.append(c.element);}
  results.textContent=`${shown} of ${cards.length} jobs shown. Qualification and supply guidance uses your current snapshot; the server verifies all work and payments.`;
 };
 search.oninput=applyFilters;view.onchange=applyFilters;sort.onchange=applyFilters;applyFilters();
 if(directory.membership!==town){nodes.push(text('p','Join this town to post jobs. Delivery jobs can be fulfilled by players from other towns; center construction requires residency.'));return nodes;}
 nodes.push(text('h3','Post a funded job'));
 const title=document.createElement('input');title.maxLength=80;title.placeholder='Job title';title.setAttribute('aria-label','Job title');
 const kind=select('Job type',[['delivery','Goods delivery'],['construction','Town-center construction'],['gardening','Private-plot gardening'],['animal_care','Pet & farm animal care']]);
 const item=select('Goods requested',Object.entries(ITEMS).map(([id,d])=>[id,d.name]));
 const quantity=number('Quantity requested',5,1,999),wage=number('Wage in Rapture Credits',100,1,1000000);
 const piece=select('Building piece',Object.entries(catalog).map(([id,d])=>[id,d.name]));
 const x=number('Building x coordinate',10,10,23),y=number('Building y coordinate',8,8,21),level=number('Building level',0,0,8);
 const edge=select('Wall edge',[['n','North edge'],['w','West edge']]);
 const garden=select('Garden task',[['water','Water crop'],['weed','Weed bed'],['harvest','Harvest crop']]);
 const bed=select('Your planted garden bed',ctrl.onlineGardenBeds.map(b=>[`${b.x},${b.y}`,`${b.name} (${b.x}, ${b.y})`]));
 const animal=select('Your animal',ctrl.onlineAnimals.map(a=>[a.id,`${a.name} · ${a.id.slice(-6)}`]));
 const care=select('Animal care task',[['feed','Feed'],['water','Water'],['play','Play'],['collect','Collect produce'],['treat','Veterinary treatment']]);
 const funding=select('Wage funding',[['town','Town treasury (mayor only)'],['personal','My RC — personal funding']]);
 const cost=text('p','');
 const update=()=>{
  const building=kind.value==='construction',gardening=kind.value==='gardening',animalCare=kind.value==='animal_care';
  for(const e of [piece,x,y,level,edge])e.classList.toggle('hidden',!building);
  for(const e of [item,quantity])e.classList.toggle('hidden',kind.value!=='delivery');
  for(const e of [garden,bed])e.classList.toggle('hidden',!gardening);
  for(const e of [animal,care])e.classList.toggle('hidden',!animalCare);
  const selected=ctrl.onlineAnimals.find(a=>a.id===animal.value);for(const o of care.options)o.disabled=o.value==='play'&&!selected?.pet||o.value==='collect'&&!!selected?.pet;
  if(care.selectedOptions[0]?.disabled)care.value='feed';
  funding.disabled=gardening||animalCare;if(gardening||animalCare)funding.value='personal';
  cost.textContent=animalCare?'Thirty-second care order for one animal. Requires 6 XP in pet care or animal husbandry; treatment instead requires veterinary XP and qualification. Worker supplies are consumed, matching toys are retained, and all produce stays with you. Selling or slaughtering is never authorized.':building?`Town provides ${goods(catalog[piece.value]!.cost)}. Worker needs 6 construction XP; support rules apply.`:gardening?'Only the chosen crop and task are authorized. Worker needs 6 gardening XP; work takes 30 seconds. Watering uses 1 worker water. Produce stays with you. You can be away while the work is performed.':'Delivery goes to town stock for town-funded jobs, or your inventory for personal jobs.';
 };
 kind.onchange=update;piece.onchange=update;animal.onchange=update;update();
 const key=newCommandId();
 nodes.push(title,kind,funding,garden,bed,animal,care,item,quantity,piece,x,y,level,edge,cost,text('p','Wage is reserved immediately:'),wage,button('Fund & post job',()=>{
  const def=catalog[piece.value]!;const isEdge=['wall','door','window'].includes(def.kind);
  const slot={kind:isEdge?'edge':'tile',x:Number(x.value),y:Number(y.value),level:Number(level.value),...(isEdge?{dir:edge.value}:{})} as Slot;
  const[gx,gy]=bed.value.split(',').map(Number);
  const target=kind.value==='gardening'?{kind:'tile',x:gx,y:gy,level:0}:slot;
  void ctrl.onlineAction('postJob',{townId:town,requestKey:key,funding:funding.value,title:title.value,kind:kind.value,item:item.value,quantity:Number(quantity.value),pieceId:piece.value,slot:target,gardenAction:garden.value,animalId:animal.value,animalAction:care.value,wageRC:Number(wage.value)});
 }));
 return nodes;
}

export function updateJobClocks(panel:HTMLElement,now:number){for(const button of panel.querySelectorAll<HTMLButtonElement>('button[data-job-ready]'))button.disabled=now<Number(button.dataset.jobReady);}
