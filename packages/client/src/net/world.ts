import type {Town,Command,ApplyResult} from '@paradise-lost/sim';
export interface WorldSnapshot {exists:boolean;revision?:number;state?:Town}
export interface WorldReceipt {duplicate:boolean;revision:number;state:Town;result:ApplyResult}
export interface LessonOffer {id:string;teacher_id:string;subject:string;price_rc:number;active:boolean;teacher_name:string|null;teacher_xp:number;available_xp:number;quoted_price_rc:number;eligible:boolean}
export interface PlayerLesson {id:string;teacher_id:string;student_id:string;teacher_name:string|null;student_name:string|null;subject:string;price_rc:number;gain:number;status:string;ready_at:string|null;expires_at:string}
export interface TownTreasury {balance_rc:number|string;tax_percent:number;taxDue:number;inventory:Record<string,number>;ledger:{amount_rc:number|string;reason:string;created_at:string}[]}
export interface CenterReceipt {state:Town;revision:number;name:string;townId:string;result?:ApplyResult}
export interface PlayerJob {interaction_blocked?:boolean;id:string;town_id:string;employer_id:string;worker_id:string|null;employer_name:string|null;title:string;kind:'delivery'|'construction'|'gardening'|'animal_care';animal_id:string|null;animal_action:string|null;animal_signature:{species:string;acquiredDay:number}|null;garden_action:'water'|'weed'|'harvest'|null;work_ready_at:string|null;item:string|null;quantity:number|null;piece_id:string|null;slot:import('@paradise-lost/sim').Slot|null;skill:string;min_xp:number;funding:'town'|'personal';wage_rc:number|string;status:string;claim_expires_at:string|null}
export interface PlayerOffer {id:string;owner_id:string;give_item:string;give_qty:number;want_item:string;want_qty:number|null;price_rc:number|string|null}
export interface MailDelivery {id:string;sender_id:string;recipient_id:string;kind:string;item:string|null;quantity:number|null;amount_rc:string|number|null;subject:string;body:string|null;status:string;ready:boolean;ready_at:string;sender_name:string|null;recipient_name:string|null}
export interface OnlineDirectory {
 blocked:{blocked_id:string;display_name:string|null}[];
 ownerId:string;
 towns:{id:string;name:string;mayor_id:string;residents:number;admission:'open'|'invite';recruitment:string;tax_percent:number}[];
 membership:string|null;
 residents:{owner_id:string;display_name:string;allow_visits:boolean;online:boolean}[];
 profile:{display_name:string;allow_visits:boolean;seeking_town:boolean;seeking_note:string}|null;
 seekers:{owner_id:string;display_name:string;seeking_note:string;professions:string[]}[];
 invitations:{id:string;town_id:string;name:string;expires_at:string}[];
 outgoing:{id:string;display_name:string;expires_at:string}[];
}
export class WorldRefused extends Error {constructor(message:string,readonly status:number){super(message);}}
/** Sends intent only. Server determines ownership, time, costs and results. */
export class WorldConnection {
 // Browser fetch requires the Window/global receiver, not this connection.
 constructor(private readonly send:typeof fetch=(...args)=>globalThis.fetch(...args)){}
 private async request<T>(body?:Record<string,unknown>):Promise<T>{
  const movement=body&&['command','centerCommand'].includes(String(body.action))&&(body.command as {type?:string}|undefined)?.type==='move';
  const response=await this.send(movement?'/api/paradise-move':'/api/paradise-world',{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{accept:'application/json'},body:body?JSON.stringify(body):undefined});
  const payload=await response.json() as {data?:T;error?:string};
  if(!response.ok)throw new WorldRefused(payload.error??'World service unavailable',response.status);
  if(!payload.data)throw new Error('Invalid world response');return payload.data;
 }
 social<T=Record<string,unknown>>(action:string,values:Record<string,unknown>={}){return this.request<T>({...values,action});}
 load(){return this.request<WorldSnapshot>();}
 create(){return this.request<WorldSnapshot>({action:'create'});}
 /** Keep request identity when retrying an uncertain outcome. Never auto-retry a stale revision. */
 command(requestKey:string,revision:number,command:Command){
  const {id:_id,...intent}=command;
  return this.request<WorldReceipt>({action:'command',requestKey,revision,command:intent});
 }
}
