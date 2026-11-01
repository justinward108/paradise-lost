import {PROSPECT_RESOURCES,type World} from '@paradise-lost/sim';
/** Sources come from actual content definitions, not inferred item names. */
export function itemSources(item:string,world:World,items:Readonly<Record<string,{name:string}>>):string[]{
 const out:string[]=[];
 const goods=(values:Record<string,number>)=>Object.entries(values).map(([id,n])=>`${n} ${items[id]?.name??id}`).join(', ');
 if(Object.hasOwn(PROSPECT_RESOURCES,item)){const deposit=PROSPECT_RESOURCES[item as keyof typeof PROSPECT_RESOURCES];out.push(`Prospect on your plot: ${deposit.xp} mining XP, 1 water, ${deposit.durationMs/1000}s base time. Collect through Skills & workshop.`);}
 for(const crop of Object.values(world.crops)){
  if(crop.yields[item])out.push(`Grow ${crop.name}: plant ${items[crop.seed]?.name??crop.seed}; ${crop.days} watered days to first harvest.`);
  if(crop.seed===item)out.push(`Harvest ${crop.name} to recover planting material.`);
 }
 for(const recipe of Object.values(world.workshop?.recipes??{}))if(recipe.gives[item])out.push(`Craft: ${recipe.name}. Inputs: ${goods(recipe.cost)}${recipe.tool?`; tool: ${items[recipe.tool]?.name??recipe.tool}`:''}.`);
 for(const npc of world.npcs)for(const offer of npc.trades??[])if(offer.gives[item])out.push(`Trade with ${npc.name} in the starter neighborhood: ${goods(offer.cost)} for ${goods(offer.gives)}.`);
 for(const animal of Object.values(world.animalDefs??{})){
  if(animal.produce?.[item])out.push(`Care for a ${animal.name.toLowerCase()} and collect its produce after feeding and watering.`);
  if(animal.meat?.[item]&&!animal.pet)out.push(`Slaughter a healthy ${animal.name.toLowerCase()}; this consumes the animal.`);
 }
 for(const site of world.sites)if(site.yields[item])out.push(`Salvage at ${site.name} in the starter neighborhood.`);
 for(const tree of Object.values(world.chop??{}))if(tree.yields[item])out.push(`Chop ${tree.name} for materials.`);
 if(world.regrow?.brushYields[item])out.push('Clear brush for gathering materials.');
 if(item==='water')out.push('Build a water source on your plot and draw up to 6 water per game day.');
 return [...new Set(out)];
}
