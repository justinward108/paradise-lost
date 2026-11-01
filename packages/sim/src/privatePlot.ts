import type {Town} from './types.ts';
import type {World} from './world.ts';
import type {PlaceState,TravelState} from './travel.ts';
import {onLot} from './rules.ts';
export const PRIVATE_MAP='private-homestead-v1';
export const NEIGHBORHOOD='local-neighborhood';
export const PRIVATE_SIZE=64;
export function privatePlotWorld(base:World):World {
 const width=80,height=80,lot={x:3,y:3,w:PRIVATE_SIZE,h:PRIVATE_SIZE};
 const rows=Array.from({length:height},(_,y)=>Array.from({length:width},(_,x)=>x<2||y<2||x>=width-2||y>=height-2?'T':x>=lot.x&&x<lot.x+lot.w&&y>=lot.y&&y<lot.y+lot.h?'L':'.').join(''));
 const brush=[...base.map.brush];
 for(let y=22;y<66;y+=9)for(let x=6;x<66;x+=11)brush.push(`${x},${y}`);
 return {...base,travelBase:base,map:{id:PRIVATE_MAP,width,height,lot,rows,spawn:{x:9,y:15},brush,rubble:[...(base.map.rubble??[])]},npcs:[],sites:[],projects:[],fixedPieces:[],kiosk:undefined};
}
/** Keep the original plot coordinates; archive public neighborhood state separately. */
export function expandPrivatePlot(town:Town,base:World,state:TravelState,capture:(t:Town)=>PlaceState){
 if(state.location.kind!=='plot')return{ok:false,changed:false,reason:'Return to your plot before expanding it'};
 if(town.privatePlot)return{ok:false,changed:false,reason:'Your private plot is already expanded'};
 const oldLot={...town.lot};
 const inside=(key:string)=>{const[x,y]=key.split(',').map(Number);return x!>=oldLot.x&&x!<oldLot.x+oldLot.w&&y!>=oldLot.y&&y!<oldLot.y+oldLot.h;};
 const original=capture(town);
 const ownPieces=Object.fromEntries(Object.entries(town.pieces).filter(([,p])=>onLot(town,p.slot)));
 original.pieces=Object.fromEntries(Object.entries(original.pieces).filter(([key])=>!(key in ownPieces)));
 original.soil=Object.fromEntries(Object.entries(original.soil).filter(([key])=>!inside(key)));
 original.crops=Object.fromEntries(Object.entries(original.crops).filter(([key])=>!inside(key)));
 original.history={undo:[],redo:[]};
 original.animals=undefined;original.waterSource=undefined;
 state.towns[NEIGHBORHOOD]={id:NEIGHBORHOOD,name:'Neighborhood',kind:'neighborhood',mayorId:null,residents:base.npcs.map(n=>({id:n.id,name:n.name})),place:original};
 town.pieces=ownPieces;
 town.soil=Object.fromEntries(Object.entries(town.soil).filter(([key])=>inside(key)));
 town.crops=Object.fromEntries(Object.entries(town.crops).filter(([key])=>inside(key)));
 town.npcs={};town.projects={};town.sites={};
 const expanded=privatePlotWorld(base);
 town.width=expanded.map.width;town.height=expanded.map.height;town.lot={...expanded.map.lot};town.mapId=PRIVATE_MAP;
 town.privatePlot={size:PRIVATE_SIZE};
 state.home=null;
 town.travel=state;
 return{ok:true,changed:true,events:['travel:location']};
}
