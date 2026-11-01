import { describe, expect, it } from 'vitest';
import { apply, createTown, decodeSnapshot, encodeSnapshot, newCareer } from '../src/index.ts';
import { catalog, world } from '@paradise-lost/content';

function setup(inventory: Record<string, number> = {}) {
  const town = createTown({ townId: 'careers', seed: 's', nowMs: 1, inventory: { learning_credit: 100, ...inventory }, world, catalog });
  let id = 0;
  const go = (cmd: Record<string, unknown>) => apply(town, catalog, { id: `career-${++id}`, nowMs: 1000, ...cmd } as Parameters<typeof apply>[2], world);
  const study = (skill: string) => {
    expect(go({ type: 'study', skill, method: 'book' }).ok).toBe(true);
    expect(go({ type: 'finishActivity', nowMs: 61_000 }).ok).toBe(true);
  };
  return { town, go, study };
}

describe('skills, qualifications and paid study', () => {
  it('charges once at the start, waits, and awards experience exactly once', () => {
    const { town, go } = setup();
    const command = { type: 'study', skill: 'carpentry', method: 'book', id: 'same', nowMs: 1000 } as const;
    expect(apply(town, catalog, command, world).ok).toBe(true);
    expect(apply(town, catalog, command, world).duplicate).toBe(true);
    expect(town.inventory.learning_credit).toBe(98);
    expect(go({ type: 'finishActivity', nowMs: 60_999 }).ok).toBe(false);
    expect(go({ type: 'finishActivity', nowMs: 61_000 }).ok).toBe(true);
    expect(town.career!.skills.carpentry).toBe(2);
    expect(go({ type: 'finishActivity', nowMs: 80_000 }).ok).toBe(false);
    expect(town.career!.skills.carpentry).toBe(2);
  });
  it('preserves an in-progress paid lesson through save and reload', () => {
    const { town, go } = setup();
    go({ type: 'study', skill: 'textiles', method: 'book' });
    const loaded = decodeSnapshot(encodeSnapshot(town, 1500), { world, catalog });
    expect(loaded).toEqual(town);
    expect(apply(loaded, catalog, { type: 'finishActivity', nowMs: 100_000, id: 'offline' }, world).ok).toBe(true);
    expect(loaded.career!.skills.textiles).toBe(2);
    expect(loaded.inventory.learning_credit).toBe(98);
  });
  it('keeps old v4 saves playable without career state', () => {
    const { town } = setup();
    expect(town.career).toBeUndefined();
    expect(decodeSnapshot(encodeSnapshot(town, 1500))).toEqual(town);
  });
  it('supports several independently earned professions', () => {
    const { town, go, study } = setup();
    expect(go({ type: 'qualify', skill: 'carpentry' }).ok).toBe(false);
    for (const skill of ['carpentry', 'bartending']) {
      for (let n = 0; n < 3; n++) study(skill);
      expect(go({ type: 'qualify', skill }).ok).toBe(true);
      expect(go({ type: 'qualify', skill }).ok).toBe(false);
    }
    expect(town.career!.professions).toEqual(['carpentry', 'bartending']);
    expect(town.career!.skills.cooking).toBeUndefined();
  });
  it('requires a device for online learning and rejects concurrent work', () => {
    const { town, go } = setup();
    expect(go({ type: 'study', skill: 'electronics', method: 'online' }).ok).toBe(false);
    expect(town.inventory.learning_credit).toBe(100);
    town.inventory.phone = 1;
    expect(go({ type: 'study', skill: 'electronics', method: 'online' }).ok).toBe(true);
    expect(go({ type: 'study', skill: 'cooking', method: 'book' }).ok).toBe(false);
    expect(town.inventory.learning_credit).toBe(99);
    go({ type: 'finishActivity', nowMs: 46_000 });
    expect(town.career!.skills.electronics).toBe(1);
  });
  it('provides outside teacher qualification with no teacher prerequisite', () => {
    const { town, go, study } = setup();
    expect(go({ type: 'certifyTeacher' }).ok).toBe(false);
    for (let n = 0; n < 6; n++) study('cooking');
    expect(go({ type: 'certifyTeacher' }).ok).toBe(true);
    expect(town.career!.teacherCertified).toBe(true);
    expect(town.inventory.learning_credit).toBe(84);
    expect(go({ type: 'certifyTeacher' }).ok).toBe(false);
  });
  it('does not spend goods for invalid subjects, methods, times or insufficient funds', () => {
    const { town, go } = setup({ learning_credit: 1 });
    for (const cmd of [
      { type:'study', skill:'made_up', method:'book' },
      { type:'study', skill:'carpentry', method:'free' },
      { type:'study', skill:'carpentry', method:'book', nowMs:NaN },
      { type:'study', skill:'carpentry', method:'book' },
    ]) expect(go(cmd).ok).toBe(false);
    expect(town.career).toBeUndefined();
    expect(town.inventory.learning_credit).toBe(1);
  });
});

describe('recipes and production', () => {
  it('requires a learned recipe, consumes inputs once, and retains tools', () => {
    const { town, go } = setup({ boards: 9, tool_saw: 1 });
    town.career = { ...newCareer(), skills: { carpentry: 2 } };
    expect(go({ type: 'craft', recipe: 'planks' }).ok).toBe(false);
    expect(go({ type: 'learnRecipe', recipe: 'planks' }).ok).toBe(true);
    expect(go({ type: 'learnRecipe', recipe: 'planks' }).ok).toBe(false);
    expect(go({ type: 'craft', recipe: 'planks', id: 'craft' }).ok).toBe(true);
    expect(go({ type: 'craft', recipe: 'planks', id: 'craft' }).duplicate).toBe(true);
    expect(town.inventory.boards).toBe(6);
    expect(town.inventory.lumber).toBeUndefined();
    go({ type: 'finishActivity', nowMs: 41_000 });
    expect(town.inventory.lumber).toBe(1);
    expect(town.inventory.tool_saw).toBe(1);
    expect(town.career!.skills.carpentry).toBe(3);
  });
  it('does not spend ingredients when a tool or another ingredient is missing', () => {
    const { town, go } = setup({ boards: 9 });
    town.career = { ...newCareer(), skills: { carpentry: 2 }, recipes: ['planks'] };
    expect(go({ type: 'craft', recipe: 'planks' }).ok).toBe(false);
    expect(town.inventory.boards).toBe(9);
    town.inventory.tool_saw = 1;
    town.inventory.boards = 2;
    expect(go({ type: 'craft', recipe: 'planks' }).ok).toBe(false);
    expect(town.inventory.boards).toBe(2);
  });
  it('delivers reserved craft output once after a reload', () => {
    const { town, go } = setup({ plant_fiber: 6, tool_loom: 1 });
    town.career = { ...newCareer(), skills: { textiles: 2 }, recipes: ['cloth'] };
    go({ type: 'craft', recipe: 'cloth' });
    const loaded = decodeSnapshot(encodeSnapshot(town, 1001));
    const finish = { type:'finishActivity', nowMs:50_000, id:'finish' } as const;
    expect(apply(loaded, catalog, finish, world).ok).toBe(true);
    expect(apply(loaded, catalog, finish, world).duplicate).toBe(true);
    expect(loaded.inventory.cloth).toBe(1);
    expect(loaded.inventory.plant_fiber).toBe(0);
  });
  it('builds phone parts into a phone which unlocks online study', () => {
    const { town, go } = setup({ phone_parts:4, cloth:2, tool_electronics:1 });
    town.career = { ...newCareer(), skills: { electronics:6 } };
    expect(go({ type:'learnRecipe', recipe:'phone' }).ok).toBe(true);
    expect(go({ type:'craft', recipe:'phone' }).ok).toBe(true);
    expect(go({ type:'finishActivity', nowMs:61_000 }).ok).toBe(true);
    expect(town.inventory.phone_parts).toBe(0);
    expect(town.inventory.phone).toBe(1);
    expect(go({ type:'study', skill:'repair', method:'online', nowMs:62_000 }).ok).toBe(true);
  });
});
