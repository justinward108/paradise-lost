import { newCareer, skillLevel, batchCost, batchDiscount } from '@paradise-lost/sim';
import { ITEMS } from '@paradise-lost/content';
import type { Controller } from '../game/controller.ts';

const text = (tag: string, value: string) => { const e = document.createElement(tag); e.textContent = value; return e; };
function button(label: string, action: () => void, disabled = false) {
  const b = document.createElement('button'); b.textContent = label; b.disabled = disabled; b.addEventListener('click', action); return b;
}
const goods = (items: Record<string, number>) => Object.entries(items).map(([id, qty]) => `${qty} ${ITEMS[id]?.name ?? id}`).join(', ');

export function workshopPanel(ctrl: Controller, close: HTMLElement, note?: string): HTMLElement[] {
  const def = ctrl.world.workshop;
  if (!def) return [close, text('p', 'Workshops are unavailable here.')];
  const state = ctrl.town.career ?? newCareer();
  const nodes = [close, text('h2', 'Skills & workshop'), text('p', 'Learn several trades at your own pace. Rosa barters learning vouchers for goods. Vouchers are local inventory items, separate from Rapture Credits.')];
  nodes.push(text('p', `Learning vouchers: ${ctrl.town.inventory.learning_credit ?? 0}. Qualified professions: ${state.professions.map((id) => def.skills[id]?.profession ?? id).join(', ') || 'none yet'}.`));
  if (note) nodes.push(text('p', note));
  const activity = state.activity;
  const playerLessonBusy=ctrl.playerLessons.some(l=>l.status==='active'&&Date.parse(l.expires_at)>ctrl.now());
  if(playerLessonBusy)nodes.push(text('p','Your work slot is in use by a player lesson. Finish or cancel it through Towns & travel.'));
  if (activity) {
    const seconds = Math.max(0, Math.ceil((activity.readyMs - ctrl.now()) / 1000));
    const title = activity.kind === 'study' ? `Studying ${def.skills[activity.skill]?.name}` : def.recipes[activity.recipe]?.name ?? 'Crafting';
    nodes.push(text('p', `${title}. Progress continues while away.`));
    const timer = text('p', seconds ? `${seconds}s remaining` : 'Ready to collect');
    timer.dataset.workshopReady = String(activity.readyMs);
    nodes.push(timer);
    const collect = button('Collect completed activity', () => ctrl.careerAction({ type: 'finishActivity' }), seconds > 0);
    collect.dataset.workshopCollect = 'true';
    nodes.push(collect);
  }
  nodes.push(text('h3', 'Learning & professions'), text('p', 'Book study: buy/read a lesson for 2 vouchers, 60 seconds, +2 experience. Online: 1 voucher, 45 seconds, +1 experience; requires a phone or computer. Each 6 experience earns a skill level, up to level 5.'));
  const skillSearch=document.createElement('input');skillSearch.type='search';skillSearch.placeholder='Find a skill or profession';skillSearch.setAttribute('aria-label','Search skills and professions');
  const skillRows:{element:HTMLElement;terms:string}[]=[];nodes.push(skillSearch);
  skillSearch.addEventListener('input',()=>{const query=skillSearch.value.trim().toLocaleLowerCase();for(const row of skillRows)row.element.classList.toggle('hidden',!row.terms.includes(query));});
  for (const [id, skill] of Object.entries(def.skills)) {
    const xp = state.skills[id] ?? 0;
    const line = document.createElement('div'); line.className = 'gifts';
    line.append(text('p', `${skill.name}: level ${skillLevel(xp)} · ${xp}/30 experience${skill.prerequisite?` · requires ${def.skills[skill.prerequisite]?.name} level 1`:''}`));
    if(skill.note)line.append(text('p',skill.note));
    line.append(button('Buy & study book lesson', () => ctrl.careerAction({ type: 'study', skill: id, method: 'book' }), !!activity || playerLessonBusy || xp >= 30 || (ctrl.town.inventory.learning_credit ?? 0) < 2));
    line.append(button('Study online', () => ctrl.careerAction({ type: 'study', skill: id, method: 'online' }), !!activity || playerLessonBusy || xp >= 30 || !(ctrl.town.inventory.phone || ctrl.town.inventory.computer) || !(ctrl.town.inventory.learning_credit! > 0)));
    if (!state.professions.includes(id)) line.append(button(`Qualify as ${skill.profession}`, () => ctrl.careerAction({ type: 'qualify', skill: id }), skillLevel(xp) < 1 || !!skill.prerequisite && skillLevel(state.skills[skill.prerequisite]??0)<1 || id==='teaching'&&!state.teacherCertified));
    skillRows.push({element:line,terms:`${skill.name} ${skill.profession}`.toLocaleLowerCase()});
    nodes.push(line);
  }
  nodes.push(text('h3', 'Teacher lessons'));
  const teacher = ctrl.town.staffing?.teacher;
  if (teacher) {
    const subject = def.skills[teacher.skill];
    nodes.push(text('p', `${subject?.name ?? teacher.skill}: ${teacher.hired ? 'teacher hired' : 'awaiting hire'}. A lesson costs ${teacher.wage} wage vouchers plus 1 supply voucher, takes 45 seconds and earns 4 experience.`));
    if (teacher.hired) {
      const prerequisite = subject?.prerequisite;
      const unavailable = !!activity || playerLessonBusy || (state.skills[teacher.skill] ?? 0) >= 30 || (ctrl.town.inventory.learning_credit ?? 0) < teacher.wage + 1 || !!prerequisite && skillLevel(state.skills[prerequisite] ?? 0) < 1;
      nodes.push(button('Attend teacher lesson', () => ctrl.productionAction({type:'attendLesson'}), unavailable));
    }
  } else nodes.push(text('p', 'Hire an NPC teacher through Resources & garden, or find a player teacher through Towns & travel. Player lessons give up to 6 XP in 30 seconds; NPC lessons give 4 XP in 45 seconds.'));
  if(ctrl.online)nodes.push(button('Browse player teachers',()=>void ctrl.onlineAction('lessonBoard')));
  nodes.push(button('Manage teacher wanted ad', () => ctrl.openPanel({kind:'production'})));
  nodes.push(text('h3', 'Teaching qualification'));
  nodes.push(text('p', state.teacherCertified ? 'Outside teaching certificate earned. NPC lessons are available now; player lessons are available through Towns & travel; staffed school operations are still being built.' : 'An outside examination provides a route into teaching without requiring a teacher teacher. Requires level 2 in any subject and 4 learning vouchers.'));
  if (!state.teacherCertified) nodes.push(button('Take outside teaching exam', () => ctrl.careerAction({ type: 'certifyTeacher' }), !Object.values(state.skills).some(xp => skillLevel(xp) >= 2) || (ctrl.town.inventory.learning_credit ?? 0) < 4));
  nodes.push(text('h3', 'Recipes & production'), text('p', 'Recipes cost 1 learning voucher to learn. Tools are retained. Ingredients are spent when work starts; collect the output when ready. Phones enable online study; boats now remove ferry fares in Towns & travel; other device services are still being built.'));
  const search=document.createElement('input');search.type='search';search.placeholder='Find a recipe or ingredient';search.setAttribute('aria-label','Search recipes and ingredients');
  const subject=document.createElement('select');subject.setAttribute('aria-label','Recipe profession');
  const all=document.createElement('option');all.value='';all.textContent='All professions';subject.append(all);
  for(const[id,skill]of Object.entries(def.skills)){const option=document.createElement('option');option.value=id;option.textContent=skill.name;subject.append(option);}
  const rows:{element:HTMLElement;skill:string;terms:string}[]=[];
  const count=text('p','');count.setAttribute('aria-live','polite');
  const filter=()=>{let visible=0;for(const row of rows){row.element.hidden=!!subject.value&&row.skill!==subject.value||!row.terms.includes(search.value.trim().toLocaleLowerCase());row.element.classList.toggle('hidden',row.element.hidden);if(!row.element.hidden)visible++;}count.textContent=`${visible} recipes shown`;};
  search.addEventListener('input',filter);subject.addEventListener('change',filter);nodes.push(search,subject,count);
  for (const [id, recipe] of Object.entries(def.recipes)) {
    const line = document.createElement('div'); line.className = 'gifts';
    line.append(text('p', `${recipe.name} · ${def.skills[recipe.skill]?.name}, ${recipe.xp} experience required. ${goods(recipe.cost)} → ${goods(recipe.gives)}. ${recipe.tool ? `Tool: ${ITEMS[recipe.tool]?.name ?? recipe.tool}. ` : ''}${recipe.durationMs / 1000}s.`));
    if (!state.recipes.includes(id)) line.append(button('Learn recipe (1 voucher)', () => ctrl.careerAction({ type: 'learnRecipe', recipe: id }), (state.skills[recipe.skill] ?? 0) < recipe.xp || !(ctrl.town.inventory.learning_credit! > 0)));
    else {
      const quantity = document.createElement('select'); quantity.setAttribute('aria-label', `Batches of ${recipe.name}`);
      for (const count of [1, 5, 10, 20]) { const option = document.createElement('option'); option.value = String(count); option.textContent = `${count} batch${count === 1 ? '' : 'es'}`; quantity.append(option); }
      const summary = text('p', '');
      const start = button('Start crafting', () => ctrl.careerAction({ type: 'craft', recipe: id, quantity: Number(quantity.value) }));
      const update = () => {
        const count = Number(quantity.value);
        const scale = (items: Record<string, number>) => Object.fromEntries(Object.entries(items).map(([item, amount]) => [item, amount * count]));
        const cost = batchCost(recipe.cost, count);
        summary.textContent = `${goods(cost)} → ${goods(scale(recipe.gives))}. Material discount: ${Math.round(batchDiscount(count) * 100)}% (whole materials rounded up). Base duration: ${recipe.durationMs * count / 1000}s. Tools are retained.`;
        const missing=Object.entries(cost).filter(([item,amount])=>(ctrl.town.inventory[item]??0)<amount).map(([item,amount])=>`${amount-(ctrl.town.inventory[item]??0)} ${ITEMS[item]?.name??item}`);
        if(missing.length)summary.textContent+=` Missing: ${missing.join(', ')}. Use the ingredient guide in Resources & garden for sources.`;
        start.disabled = !!activity || playerLessonBusy || (state.skills[recipe.skill] ?? 0) < recipe.xp || !!recipe.tool && !(ctrl.town.inventory[recipe.tool]! > 0) || Object.entries(cost).some(([item, amount]) => (ctrl.town.inventory[item] ?? 0) < amount);
      };
      quantity.addEventListener('change', update); update(); line.append(quantity, summary, start);
    }
    rows.push({element:line,skill:recipe.skill,terms:`${recipe.name} ${def.skills[recipe.skill]?.name} ${goods(recipe.cost)} ${goods(recipe.gives)}`.toLocaleLowerCase()});
    nodes.push(line);
  }
  filter();
  return nodes;
}

/** Update only the timer: replacing the whole panel would lose scroll and keyboard focus. */
export function updateWorkshopClock(panel: HTMLElement, nowMs: number) {
  const timer = panel.querySelector<HTMLElement>('[data-workshop-ready]');
  const collect = panel.querySelector<HTMLButtonElement>('[data-workshop-collect]');
  if (!timer || !collect) return;
  const seconds = Math.max(0, Math.ceil((Number(timer.dataset.workshopReady) - nowMs) / 1000));
  timer.textContent = seconds ? `${seconds}s remaining` : 'Ready to collect';
  collect.disabled = seconds > 0;
}

