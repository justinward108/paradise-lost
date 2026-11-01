import {workshop} from '@paradise-lost/content';
import {newCommandId,skillLevel} from '@paradise-lost/sim';
import type {Controller} from '../game/controller.ts';
const text=(tag:string,value:string)=>{const e=document.createElement(tag);e.textContent=value;return e;};
const button=(label:string,fn:()=>void)=>{const e=document.createElement('button');e.textContent=label;e.onclick=fn;return e;};
function subjects(label:string){const e=document.createElement('select');e.setAttribute('aria-label',label);for(const[id,s]of Object.entries(workshop.skills)){const o=document.createElement('option');o.value=id;o.textContent=s.name;e.append(o);}return e;}
export function playerLessons(ctrl:Controller):HTMLElement[]{
 if(!ctrl.onlineDirectory)return [];
 const me=ctrl.onlineDirectory.ownerId;
 const nodes=[text('h3','Player teachers'),text('p','Certified players offer paid lessons. Reserve the fee plus 1 supply voucher; the teacher starts when both work slots are free. A full 30-second player lesson grants 6 XP versus 4 from an NPC. The full fee is capped at the server’s NPC benchmark, matching the cheapest NPC wage benchmark; both use 1 supply voucher. Short lessons cost proportionally less. Either participant can cancel an unfinished lesson for a full refund. Fees are subject to the teacher’s town income tax.')];
 const filter=subjects('Browse lesson subject');nodes.push(filter,button('Find teachers for subject',()=>void ctrl.onlineAction('lessonBoard',{subject:filter.value})),button('My lessons & all subjects',()=>void ctrl.onlineAction('lessonBoard')));
 for(const offer of ctrl.lessonOffers){
  const own=offer.teacher_id===me;
  nodes.push(text('p',`${offer.teacher_name??'Player teacher'} · ${workshop.skills[offer.subject]?.name??offer.subject} · subject level ${skillLevel(offer.teacher_xp??0)} · ${own?offer.price_rc:offer.quoted_price_rc} RC${!own?` · ${offer.available_xp} XP`:''}${offer.active?'':' · withdrawn'}`));
  if(own&&offer.active)nodes.push(button('Withdraw new bookings',()=>void ctrl.onlineAction('withdrawLesson',{subject:offer.subject})));
  else if(!own&&offer.active){const key=newCommandId();const book=button(`Reserve lesson — ${offer.quoted_price_rc} RC + 1 voucher`,()=>void ctrl.onlineAction('bookLesson',{offerId:offer.id,requestKey:key,quotedPriceRC:offer.quoted_price_rc}));book.disabled=!offer.eligible;nodes.push(book);}
 }
 nodes.push(text('h4','Your pending and recent lessons'));
 for(const lesson of ctrl.playerLessons){
  const teacher=lesson.teacher_id===me;
  nodes.push(text('p',`${workshop.skills[lesson.subject]?.name??lesson.subject} · ${teacher?'Student: '+(lesson.student_name??'Player'):'Teacher: '+(lesson.teacher_name??'Player')} · ${lesson.price_rc} RC · ${lesson.status}${lesson.ready_at?` · ready after ${new Date(lesson.ready_at).toLocaleTimeString()}`:''}`));
  if(lesson.status==='waiting'&&teacher)nodes.push(button('Start teaching',()=>void ctrl.onlineAction('startLesson',{lessonId:lesson.id})));
  if(lesson.status==='active'){
   const complete=button('Finish lesson & settle payment',()=>void ctrl.onlineAction('completeLesson',{lessonId:lesson.id}));
   if(lesson.ready_at){complete.dataset.jobReady=String(Date.parse(lesson.ready_at));complete.disabled=Date.now()<Date.parse(lesson.ready_at);}nodes.push(complete);
  }
  if(['waiting','active'].includes(lesson.status))nodes.push(button('Cancel & refund student',()=>void ctrl.onlineAction('cancelLesson',{lessonId:lesson.id})));
 }
 nodes.push(text('h4','Offer your teaching services'));
 const subject=subjects('Subject to teach');
 const price=document.createElement('input');price.type='number';price.min='1';price.max=String(ctrl.lessonMaxPriceRC);price.value='100';price.setAttribute('aria-label','Lesson fee in RC');
 nodes.push(text('p',`Maximum full fee: ${ctrl.lessonMaxPriceRC} RC.`),text('p','Requires the outside certificate, qualification as a teacher, and level 2 in this subject. Full fees cannot exceed the displayed price limit and default to 100 RC. Shorter lessons receive a proportional discount. Existing reservations never become more expensive.'),subject,price,button('Publish lesson offer',()=>void ctrl.onlineAction('offerLesson',{subject:subject.value,priceRC:Number(price.value)})));
 return nodes;
}
