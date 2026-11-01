import { workDurationFactor } from './wellbeing.ts';
import type { Town } from './types.ts';

export interface SkillDef { name: string; profession: string; prerequisite?: string; note?: string }
export interface RecipeDef {
  name: string; skill: string; xp: number; learnCost: number;
  cost: Record<string, number>; gives: Record<string, number>; tool?: string; durationMs: number;
}
export interface WorkshopDef { skills: Record<string, SkillDef>; recipes: Record<string, RecipeDef> }
export interface CareerState {
  skills: Record<string, number>;
  recipes: string[];
  professions: string[];
  teacherCertified: boolean;
  activity: null | { kind: 'study'; skill: string; xp: number; readyMs: number }
    | { kind: 'craft'; recipe: string; skill: string; gives: Record<string, number>; practiceXp?: number; readyMs: number };
}
export type CareerCommand =
  | { type: 'study'; id: string; skill: string; method: 'book' | 'online'; nowMs: number }
  | { type: 'learnRecipe'; id: string; recipe: string; nowMs: number }
  | { type: 'craft'; id: string; recipe: string; quantity?: number; nowMs: number }
  | { type: 'finishActivity'; id: string; nowMs: number }
  | { type: 'qualify'; id: string; skill: string; nowMs: number }
  | { type: 'certifyTeacher'; id: string; nowMs: number };

/** Whole-material rounding prevents fractional inventory or free ingredients. */
export const batchDiscount = (quantity: number): number => quantity >= 20 ? 0.20 : quantity >= 10 ? 0.15 : quantity >= 5 ? 0.10 : 0;
export const batchCost = (cost: Record<string, number>, quantity: number): Record<string, number> => Object.fromEntries(Object.entries(cost).map(([id, amount]) => [id, Math.ceil(amount * quantity * (100 - Math.round(batchDiscount(quantity) * 100)) / 100)]));

export const newCareer = (): CareerState => ({ skills: {}, recipes: [], professions: [], teacherCertified: false, activity: null });
export const skillLevel = (xp: number): number => Math.min(5, Math.floor(Math.max(0, xp) / 6));
const no = (reason: string) => ({ ok: false, changed: false, reason });
const yes = (events: string[] = []) => ({ ok: true, changed: true, events });
const affordable = (town: Town, cost: Record<string, number>) => Object.entries(cost).every(([id, qty]) => Number.isSafeInteger(qty) && qty > 0 && (town.inventory[id] ?? 0) >= qty);
function spend(town: Town, cost: Record<string, number>) {
  for (const [id, qty] of Object.entries(cost)) town.inventory[id]! -= qty;
}

/** Local-goods progression. These commands never create or spend account Rapture Credits. */
export function runCareer(town: Town, def: WorkshopDef | undefined, cmd: CareerCommand) {
  if (!def) return no('Training and workshops are not available here');
  if (!Number.isFinite(cmd.nowMs) || cmd.nowMs < 0) return no('Invalid activity time');
  const state = town.career ?? newCareer();
  const commit = () => { town.career = state; return yes(); };
  switch (cmd.type) {
    case 'study': {
      if (!Object.hasOwn(def.skills, cmd.skill)) return no('Unknown subject');
      if (cmd.method !== 'book' && cmd.method !== 'online') return no('Unknown learning method');
      const prerequisite = def.skills[cmd.skill]!.prerequisite;
      if (prerequisite && skillLevel(state.skills[prerequisite] ?? 0) < 1) return no('Qualify in the general subject before studying this specialty');
      if (state.activity) return no('Finish your current activity first');
      if (skillLevel(state.skills[cmd.skill] ?? 0) >= 5) return no('This skill is already mastered');
      if (cmd.method === 'online' && !(town.inventory.phone || town.inventory.computer)) return no('Online learning needs a phone or computer');
      const cost = { learning_credit: cmd.method === 'book' ? 2 : 1 };
      if (!affordable(town, cost)) return no('Trade with Rosa for learning vouchers first');
      spend(town, cost);
      state.activity = { kind: 'study', skill: cmd.skill, xp: cmd.method === 'book' ? 2 : 1, readyMs: cmd.nowMs + Math.ceil((cmd.method === 'book' ? 60_000 : 45_000) * workDurationFactor(town, cmd.nowMs)) };
      return commit();
    }
    case 'learnRecipe': {
      const recipe = Object.hasOwn(def.recipes, cmd.recipe) ? def.recipes[cmd.recipe] : undefined;
      if (!recipe) return no('Unknown recipe');
      if (state.recipes.includes(cmd.recipe)) return no('You already know this recipe');
      if ((state.skills[recipe.skill] ?? 0) < recipe.xp) return no('Study or practise this skill before learning the recipe');
      if (!affordable(town, { learning_credit: recipe.learnCost })) return no('Not enough learning vouchers');
      spend(town, { learning_credit: recipe.learnCost });
      state.recipes.push(cmd.recipe);
      return commit();
    }
    case 'craft': {
      const recipe = Object.hasOwn(def.recipes, cmd.recipe) ? def.recipes[cmd.recipe] : undefined;
      if (!recipe || !state.recipes.includes(cmd.recipe)) return no('Learn this recipe first');
      if (state.activity) return no('Finish your current activity first');
      if ((state.skills[recipe.skill] ?? 0) < recipe.xp) return no('Your skill is not high enough');
      if (recipe.tool && !(town.inventory[recipe.tool]! > 0)) return no('You need the specialist tool listed for this recipe');
      const quantity = cmd.quantity ?? 1;
      if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 20) return no('Choose 1–20 batches');
      const cost = batchCost(recipe.cost, quantity);
      const gives = Object.fromEntries(Object.entries(recipe.gives).map(([id, qty]) => [id, qty * quantity]));
      if (!affordable(town, cost)) return no('You do not have all the ingredients for this batch');
      spend(town, cost);
      state.activity = { kind: 'craft', recipe: cmd.recipe, skill: recipe.skill, gives, practiceXp: quantity, readyMs: cmd.nowMs + Math.ceil(recipe.durationMs * quantity * workDurationFactor(town, cmd.nowMs)) };
      return commit();
    }
    case 'finishActivity': {
      const activity = state.activity;
      if (!activity) return no('No activity to finish');
      if (cmd.nowMs < activity.readyMs) return no('Your activity is still in progress');
      if (activity.kind === 'craft') {
        for (const [id, qty] of Object.entries(activity.gives)) town.inventory[id] = (town.inventory[id] ?? 0) + qty;
      }
      state.skills[activity.skill] = Math.min(30, (state.skills[activity.skill] ?? 0) + (activity.kind === 'study' ? activity.xp : activity.practiceXp ?? 1));
      state.activity = null;
      town.career = state;
      return yes([`career:finished:${activity.skill}`]);
    }
    case 'qualify': {
      if (!Object.hasOwn(def.skills, cmd.skill)) return no('Unknown profession');
      if (state.professions.includes(cmd.skill)) return no('You already hold this qualification');
      const prerequisite = def.skills[cmd.skill]!.prerequisite;
      if (prerequisite && skillLevel(state.skills[prerequisite] ?? 0) < 1) return no('Qualify in the general subject before this specialty');
      if (cmd.skill === 'teaching' && !state.teacherCertified) return no('Pass the outside teaching examination first');
      if (skillLevel(state.skills[cmd.skill] ?? 0) < 1) return no('Reach skill level 1 (6 experience) first');
      state.professions.push(cmd.skill);
      return commit();
    }
    case 'certifyTeacher': {
      if (state.teacherCertified) return no('You are already certified');
      if (!Object.values(state.skills).some((xp) => skillLevel(xp) >= 2)) return no('Reach level 2 in a subject before taking the teaching exam');
      if (!affordable(town, { learning_credit: 4 })) return no('The outside teaching exam costs 4 learning vouchers');
      spend(town, { learning_credit: 4 });
      state.teacherCertified = true;
      return commit();
    }
  }
}
