import {computeRooms} from './rooms.ts';
import {edgesAroundTile,slotKey,tile} from './grid.ts';
import type {Town,Catalog} from './types.ts';
export interface ShelterIssue {text:string;x:number;y:number}
export function shelterReport(town:Town,catalog:Catalog):{complete:boolean;summary:string;issues:ShelterIssue[]} {
 const own=(x:number,y:number)=>x>=town.lot.x&&x<town.lot.x+town.lot.w&&y>=town.lot.y&&y<town.lot.y+town.lot.h;
 const rooms=computeRooms(town.pieces,catalog,town.width,town.height).filter(r=>r.tiles.every(key=>{const[x,y]=key.split(',').map(Number);return own(x!,y!);}));
 if(rooms.some(r=>r.shelter))return{complete:true,summary:'Your plot has a complete weatherproof shelter.',issues:[]};
 const issues:ShelterIssue[]=[];
 const enclosed=rooms.filter(r=>r.enclosed).sort((a,b)=>b.tiles.length-a.tiles.length)[0];
 if(enclosed){
  for(const key of enclosed.tiles){const[x,y]=key.split(',').map(Number);if(!(slotKey(tile(x!,y!),'roof')in town.pieces))issues.push({text:'Missing roof tile',x:x!,y:y!});}
  if(!enclosed.doors){const[x,y]=enclosed.tiles[0]!.split(',').map(Number);issues.push({text:'This enclosed room needs a door',x:x!,y:y!});}
  return{complete:false,summary:'The room is enclosed, but needs the parts listed below. Demolition may also remove dependent roofing.',issues};
 }
 const covered=new Set<string>();
 for(const p of Object.values(town.pieces))if(p.slot.kind==='tile'&&own(p.slot.x,p.slot.y)&&catalog[p.pieceId]?.kind==='floor'&&slotKey(p.slot,'roof')in town.pieces)covered.add(`${p.slot.x},${p.slot.y}`);
 const seen=new Set<string>();
 for(const key of covered){const[x,y]=key.split(',').map(Number);for(const {edge,across}of edgesAroundTile(tile(x!,y!))){const boundary=!covered.has(`${across.x},${across.y}`);const wall=slotKey(edge,'wall');if(boundary&&!(wall in town.pieces)&&!seen.has(wall)){seen.add(wall);issues.push({text:`Missing boundary wall or door (${edge.dir==='n'?'north':'west'} edge)`,x:edge.x,y:edge.y});}}}
 return{complete:false,summary:covered.size?'The roofed floor is open to the outside. Check the highlighted boundary gaps; connected outdoor flooring does not count as shelter.':'Build foundation, flooring, enclosing walls with a door, and roofing. A roof by itself is not an enclosed room.',issues:issues.slice(0,24)};
}
