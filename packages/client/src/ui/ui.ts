import {neighborhoodPanel} from './neighborhoodPanel.ts';
import {playerLessons} from './playerLessons.ts';
import {updateJobClocks} from './jobBoard.ts';
/**
 * HTML interface over the game canvas. Built in the DOM (not on the canvas) for real
 * text, screen readers and easy layout.
 */
import { art, catalog, crops, ITEMS, pieceOrder, requiredFrames, type Style } from '@paradise-lost/content';
import { shelterReport, dailyRequest, dailyState, ambientTime, friendshipLevel, goals, helperLabour, materialsMet } from '@paradise-lost/sim';
import { drawFrame } from '../art/generate.ts';
import { resolveGeneratedAssetUrl } from '../art/generatedManifest.ts';
import { closeHelp, isHelpOpen, showHelp, Tips } from './help.ts';
import { isFeedbackOpen, showFeedback } from './feedback.ts';
import {productionPanel} from './productionPanel.ts';
import { animalPanel } from './animalPanel.ts';
import { wellbeingPanel } from './wellbeingPanel.ts';
import { travelPanel } from './travelPanel.ts';
import { workshopPanel, updateWorkshopClock } from './workshopPanel.ts';
import { kioskPanel } from './kioskPanel.ts';
import { rc } from '../game/kiosk.ts';
import type { Controller } from '../game/controller.ts';

export interface UiHooks {
  zoom(f: number): void;
  setRoofs(show: boolean): void;
  follow(): void;
}

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, text?: string) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text !== undefined) e.textContent = text;
  return e;
};

function btn(label: string, attrs: Record<string, string> = {}, onClick?: () => void) {
  const b = el('button', attrs, label);
  if (onClick) b.addEventListener('click', onClick);
  return b;
}

function clockText(hour: number) {
  const h = Math.floor(hour);
  const m = Math.floor((hour - h) * 60);
  const suffix = h < 12 ? 'am' : 'pm';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m - (m % 10)).padStart(2, '0')} ${suffix}`;
}

const NIGHT = 0.6;

/** Night darkening by ambient hour: 0 by day, up to NIGHT after dark. */
function nightAlpha(hour: number) {
  if (hour >= 7 && hour <= 17.5) return 0;
  if (hour > 17.5 && hour < 20) return ((hour - 17.5) / 2.5) * NIGHT;
  if (hour >= 5 && hour < 7) return ((7 - hour) / 2) * NIGHT;
  return NIGHT;
}

/** Which help section fits what the player is doing right now. */
function helpSectionFor(ctrl: Controller): string {
  if (['activities','animals','production','shelter'].includes(ctrl.panel?.kind ?? '')) return 'homestead';
  if (ctrl.panel?.kind === 'wellbeing') return 'homestead';
  if (ctrl.panel?.kind === 'travel') return 'travel';
  if (ctrl.panel?.kind === 'workshop') return 'workshop';
  if (ctrl.panel?.kind === 'npc') return 'rosa';
  if (ctrl.panel?.kind === 'project') return 'projects';
  if (ctrl.panel?.kind === 'kiosk') return 'kiosk';
  if (ctrl.mode === 'build') return ctrl.tool.mode === 'demolish' ? 'changing' : 'building';
  if (ctrl.tool.mode === 'dig' || ctrl.tool.mode === 'plant' || ctrl.tool.mode === 'water') return 'garden';
  return 'start';
}

const GOAL_SECTION: Record<string, string> = { brush: 'moving', salvage: 'materials', shelter: 'building', neighbour: 'rosa', garden: 'garden', path: 'projects', townbuild: 'travel', returnplot: 'travel', training: 'workshop', recipe: 'workshop', profession: 'workshop', multitrade: 'workshop', device: 'workshop' };

export function mountUi(root: HTMLElement, ctrl: Controller, hooks: UiHooks): Tips {
  let roofs = true;
  let nextGoal = 'start';

  const openHelp = (section: string) => {
    const footer = el('div', { class: 'help-footer' });
    const toggle = btn(tips.enabled ? 'Turn off tips' : 'Turn tips back on', {}, () => {
      tips.setEnabled(!tips.enabled);
      toggle.textContent = tips.enabled ? 'Turn off tips' : 'Turn tips back on';
    });
    const again = btn('Show all tips again', {}, () => tips.reset());
    footer.append(toggle, again);
    showHelp(root, section, footer);
  };
  const tips = new Tips(root, openHelp);

  const night = el('div', { class: 'night', 'aria-hidden': 'true' });

  // ----- top bar -----
  const top = el('header', { class: 'topbar' });
  const clock = el('div', { class: 'chip clock', 'aria-live': 'off' });
  const inv = el('div', { class: 'chip inventory', 'aria-label': 'Inventory' });
  const undo = btn('↶ Undo', { title: 'Undo (Ctrl+Z)', class: 'build-only' }, () => ctrl.undo());
  const redo = btn('↷ Redo', { title: 'Redo (Ctrl+Y)', class: 'build-only' }, () => ctrl.redo());
  const roofBtn = btn('Roofs: on', { 'aria-pressed': 'true', title: 'Show or hide roofs' });
  const styleBtn = btn('', { title: 'Switch art style' });
  const meBtn = btn('◎', { title: 'Centre on me', 'aria-label': 'Centre on me' }, () => hooks.follow());
  const helpBtn = btn('? Help', { title: 'Help (H)', 'aria-label': 'Help' }, () => openHelp(helpSectionFor(ctrl)));
  const credits = btn('', { class: 'chip credits hidden', title: 'Rapture Credits (your Poor Camp account)' }, () => ctrl.openPanel({ kind: 'kiosk' }));
  const noteBtn = btn('✎ Note', { title: 'Write a playtest note (N)', 'aria-label': 'Write a playtest note' }, () => showFeedback(root, ctrl));
  const exitBtn = btn('Back to poor.camp', { title: 'Save and return to poor.camp' }, () => {
    ctrl.flushSave();
    window.location.assign('https://poor.camp/');
  });
  const workshopBtn = btn('Skills & workshop', {}, () => ctrl.openPanel({ kind: 'workshop' }));
  const travelBtn = btn('Towns & travel', {}, () => ctrl.openPanel({ kind: 'travel' }));
  const returnBtn = btn('Return to my plot', { title: 'Quick travel to your plot, free' }, () => ctrl.travelAction({ type: 'returnToPlot' }));
  const wellbeingBtn = btn('Food & water', {}, () => ctrl.openPanel({ kind: 'wellbeing' }));
  const animalsBtn = btn('Animals', {}, () => ctrl.openPanel({ kind: 'animals' }));
  const inspectBtn = btn('Check shelter', {}, () => ctrl.openPanel({kind:'shelter'}));
  const lessonsBtn=btn('Player teachers',{},()=>void ctrl.onlineAction('lessonBoard'));lessonsBtn.disabled=!ctrl.online;
  const productionBtn = btn('Resources & garden',{},()=>ctrl.openPanel({kind:'production'}));
  const activitiesBtn = btn('Activities',{},()=>ctrl.openPanel({kind:'activities'}));
  top.append(activitiesBtn, returnBtn, clock, inv, credits, undo, redo, meBtn, helpBtn, exitBtn);

  // ----- goals -----
  const goalsBox = el('section', { class: 'goals', 'aria-label': 'Goals' });
  const goalsHead = btn('Goals', { class: 'goals-head', 'aria-expanded': 'true' });
  const goalsList = el('ul');
  const goalsHint = el('p', { class: 'hint' });
  const goalsMore = btn('How?', { class: 'link', title: 'Help for this goal' }, () => openHelp(GOAL_SECTION[nextGoal] ?? 'start'));
  goalsBox.append(goalsHead, goalsList, goalsHint, goalsMore);
  if (window.innerWidth < 700) {
    goalsBox.classList.add('collapsed');
    goalsHead.setAttribute('aria-expanded', 'false');
  }
  goalsHead.addEventListener('click', () => {
    const open = goalsBox.classList.toggle('collapsed');
    goalsHead.setAttribute('aria-expanded', String(!open));
  });

  // ----- status + touch confirm -----
  const status = el('div', { class: 'status', role: 'status', 'aria-live': 'polite' });
  const statusIcon = el('span', { class: 'icon', 'aria-hidden': 'true' });
  const statusText = el('span');
  const cascadeBtn = btn('Remove all', { class: 'cascade hidden' }, () => ctrl.commit(true));
  status.append(statusIcon, statusText, cascadeBtn);
  const toasts = el('div', { class: 'toasts', 'aria-live': 'polite' });

  const touch = el('div', { class: 'touch-confirm hidden' });
  const okBtn = btn('✓ Place', { class: 'ok', 'aria-label': 'Confirm' }, () => ctrl.commit());
  const noBtn = btn('✕', { class: 'no', 'aria-label': 'Cancel' }, () => {
    ctrl.pendingTouch = false;
    ctrl.updatePreview(null);
    renderStatus();
  });
  touch.append(okBtn, noBtn);

  // ----- bottom bar -----
  const bottom = el('nav', { class: 'bottom', 'aria-label': 'Tools' });
  const tabs = el('div', { class: 'tabs', role: 'tablist' });
  const playTab = btn('🌿 Live', { role: 'tab', title: 'Walk, gather, garden and talk (B)' }, () => ctrl.setMode('play'));
  const buildTab = btn('🔨 Build', { role: 'tab', title: 'Build on your lot (B)' }, () => ctrl.setMode('build'));
  tabs.append(playTab, buildTab);

  const playBar = el('div', { class: 'bar play-bar' });
  const buildBar = el('div', { class: 'bar build-bar' });
  bottom.append(tabs, playBar, buildBar);

  const demoBtn = btn('⛏ Demolish', { class: 'tool', title: 'Demolish (Delete)' }, () => ctrl.setTool({ mode: 'demolish' }));
  const rotBtn = btn('↻ Rotate', { class: 'tool', title: 'Rotate (R)' }, () => ctrl.rotate());
  const pieceButtons = new Map<string, HTMLButtonElement>();
  const category = el('select', {'aria-label':'Building part category'});
  for (const name of ['All parts', ...new Set(pieceOrder.map(id => catalog[id]!.category))]) {
    const option = el('option', {value:name}, name); category.append(option);
  }
  category.addEventListener('change', () => {
    for (const [id,b] of pieceButtons) b.classList.toggle('hidden', category.value !== 'All parts' && catalog[id]!.category !== category.value);
  });
  buildBar.append(category, demoBtn, rotBtn);
  for (const id of pieceOrder) {
    const def = catalog[id]!;
    const b = el('button', { class: 'piece', 'data-id': id });
    b.append(el('img', { alt: '' }), el('span', { class: 'name' }, def.name), el('span', { class: 'cost' }, Object.entries(def.cost).map(([m, n]) => `${n} ${ITEMS[m]?.name.toLowerCase() ?? m}`).join(', ')));
    b.addEventListener('click', () => ctrl.setTool({ mode: 'build', pieceId: id, rotation: 0 }));
    pieceButtons.set(id, b);
    buildBar.append(b);
  }

  // ----- side panel -----
  const panel = el('aside', { class: 'panel hidden', role: 'dialog', 'aria-live': 'polite' });
  window.setInterval(() => {
    if (ctrl.panel?.kind === 'workshop') updateWorkshopClock(panel, ctrl.now());
    updateJobClocks(panel,ctrl.now());
  }, 1000);

  root.append(night, top, goalsBox, status, toasts, touch, panel, bottom);

  // ----- behaviour -----
  roofBtn.addEventListener('click', () => {
    roofs = !roofs;
    hooks.setRoofs(roofs);
    roofBtn.textContent = `Roofs: ${roofs ? 'on' : 'off'}`;
    roofBtn.setAttribute('aria-pressed', String(roofs));
  });
  styleBtn.addEventListener('click', () => {
    const next: Style = ctrl.style === 'pixel' ? 'storybook' : 'pixel';
    try {
      localStorage.setItem('pl.style', next);
    } catch {
      /* storage unavailable */
    }
    ctrl.setStyle(next);
  });

  const keys: Record<string, [number, number]> = {
    w: [0, -1], arrowup: [0, -1], s: [0, 1], arrowdown: [0, 1], a: [-1, 0], arrowleft: [-1, 0], d: [1, 0], arrowright: [1, 0],
  };
  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || isFeedbackOpen()) return;
    const k = e.key.toLowerCase();
    const mod = e.ctrlKey || e.metaKey;
    if (mod && k === 'z' && !e.shiftKey) {
      e.preventDefault();
      ctrl.undo();
    } else if (mod && (k === 'y' || (k === 'z' && e.shiftKey))) {
      e.preventDefault();
      ctrl.redo();
    } else if (k === 'r' && ctrl.mode === 'build') ctrl.rotate();
    else if (k === 'n' && !mod && !isHelpOpen()) {
      e.preventDefault();
      showFeedback(root, ctrl);
    } else if (k === 'h' || k === 'f1' || (k === '?' && !mod)) {
      e.preventDefault();
      if (isHelpOpen()) closeHelp();
      else openHelp(helpSectionFor(ctrl));
    } else if (isHelpOpen()) {
      if (k === 'escape') closeHelp();
    } else if (k === 'escape') {
      if (ctrl.panel) ctrl.openPanel(null);
      else ctrl.setTool(ctrl.mode === 'play' ? { mode: 'walk' } : { mode: 'demolish' });
    } else if (k === 'b') ctrl.setMode(ctrl.mode === 'play' ? 'build' : 'play');
    else if ((k === 'delete' || k === 'backspace') && ctrl.mode === 'build') ctrl.setTool({ mode: 'demolish' });
    else if (ctrl.mode === 'play' && keys[k]) {
      e.preventDefault();
      ctrl.stepDir(...keys[k]!);
    } else if (ctrl.mode === 'play' && (k === 'e' || k === ' ')) {
      e.preventDefault();
      ctrl.interactFacing();
    }
  });

  // ----- renderers -----
  function renderThumbs() {
    for (const [id, b] of pieceButtons) {
      const frame = requiredFrames(catalog[id]!)[0]!;
      const d = drawFrame(art[id]![ctrl.style], ctrl.style, frame, `thumb:${id}`);
      const img = b.querySelector('img')!;
      img.src = resolveGeneratedAssetUrl('pieces', id, ctrl.style, frame) ?? d.canvas.toDataURL();
      img.style.width = `${d.canvas.width * d.displayScale * 0.6}px`;
    }
  }

  function renderStyle() {
    document.body.classList.toggle('style-pixel', ctrl.style === 'pixel');
    document.body.classList.toggle('style-storybook', ctrl.style === 'storybook');
    styleBtn.textContent = ctrl.style === 'pixel' ? 'Style: Pixel' : 'Style: Storybook';
    renderThumbs();
  }

  function renderPlayBar() {
    const t = ctrl.tool;
    const items: HTMLButtonElement[] = [
      btn('✋ Walk & use', { class: `tool ${t.mode === 'walk' ? 'active' : ''}`, title: 'Click to walk; click things to use them (Esc)' }, () => ctrl.setTool({ mode: 'walk' })),
      btn('⛏ Dig bed', { class: `tool ${t.mode === 'dig' ? 'active' : ''}`, title: 'Click cleared ground on your lot to make a garden bed' }, () => ctrl.setTool({ mode: 'dig' })),
    ];
    items.push(btn('💧 Water', { class: `tool ${t.mode === 'water' ? 'active' : ''}`, title: 'Water a crop on a dry day. Rain does it for you most days.' }, () => ctrl.setTool({ mode: 'water' })));
    items.push(btn('Seed supplies', {class:'tool',title:'Where to get seeds and how to choose plants'},()=>ctrl.setStatus('Scroll this planting bar to see every crop. Visit the seed trader in the starter neighborhood for the new seeds; harvesting also returns planting material.', 'info')));
    for (const c of Object.values(crops)) {
      const n = ctrl.town.inventory[c.seed] ?? 0;
      // Empty stock stays visible so the player knows planting material is needed.
      const active = t.mode === 'plant' && t.cropId === c.id;
      const time = c.regrowDays ? `${c.days} watered days, then every ${c.regrowDays}` : `${c.days} watered days`;
      items.push(btn(`🌱 ${c.name} (${n})`, { class: `tool ${active ? 'active' : ''}`, ...(n <= 0 ? { disabled: 'true' } : {}), title: `Plant ${c.name.toLowerCase()} in an empty bed. Ready in ${time}.` }, () => ctrl.setTool({ mode: 'plant', cropId: c.id })));
    }

    if (!Object.values(crops).some((c) => (ctrl.town.inventory[c.seed] ?? 0) > 0)) {
      items.push(btn('Where are seeds?', { class: 'tool' }, () => ctrl.setStatus('Visit Rosa or the seed trader for planting material. On a private plot, use Towns & travel → Neighborhood (free). Harvested crops also return planting material.', 'info')));
    }
    playBar.replaceChildren(...items);
  }

  function renderClock() {
    const a = ambientTime(ctrl.town, ctrl.now());
    clock.textContent = `Day ${a.day + 1} · ${clockText(a.hour)} · ${a.rain ? 'Rain' : 'Clear'}`;
    night.style.opacity = String(nightAlpha(a.hour));
    if (a.hour >= 19.5 || a.hour < 5) tips.trigger('night');
    document.body.classList.toggle('raining', a.rain);
  }

  function renderTown(refreshPanel = true) {
    const list = ctrl.inventoryList();
    inv.replaceChildren(...(list.length ? list : [{ id: 'none', name: 'Empty-handed', kind: '', n: 0 }]).map((i) => el('span', { class: `item ${i.kind}` }, i.n ? `${i.name} ${i.n}` : i.name)));
    undo.disabled = ctrl.town.history.undo.length === 0;
    redo.disabled = ctrl.town.history.redo.length === 0;
    for (const [id, b] of pieceButtons) {
      const def = catalog[id]!;
      const locked = def.tier > ctrl.town.progress.tier;
      b.classList.toggle('locked', locked);
      b.title = locked ? `${def.name} — unlocks at tier ${def.tier}` : def.name;
    }
    const gs = ctrl.onlineCenter ? [] : goals(ctrl.town, ctrl.catalog, ctrl.world);
    goalsList.replaceChildren(...gs.map((g) => {
      const row=el('li', { class: g.done ? 'done' : '' }, `${g.done ? '✓' : '○'} ${g.text}`);
      row.title=g.hint;
      if(!g.done&&['neighbour','path','salvage'].includes(g.id)&&ctrl.town.privatePlot){
        row.append(btn('Find in starter neighborhood', {class:'link'}, ()=>ctrl.travelAction({type:'visitTown',townId:'local-neighborhood'})));
      }
      return row;
    }));
    const next = gs.find((g) => !g.done);
    goalsHint.textContent = ctrl.onlineCenter ? `Town center: ${ctrl.onlineCenter.name}. ${ctrl.centerDonation?'You are donating personal building materials.':'Building uses shared town stock.'} Open Towns & travel for treasury contributions and paid jobs.` : next ? next.hint : 'All done for now. The town has more to discover soon.';
    nextGoal = next?.id ?? 'start';
    goalsMore.classList.toggle('hidden', !next);
    // Tips for things that have just happened.
    if (Object.values(ctrl.town.sites).some((x) => x.used > 0)) tips.trigger('firstSalvage');
    if (ctrl.shelterReady()) tips.trigger('shelter');
    if (Object.values(ctrl.town.npcs).some((n) => n.met)) tips.trigger('metRosa');
    if (Object.keys(ctrl.town.inventory).some((k) => k.startsWith('seed_') || k.startsWith('slip_'))) tips.trigger('garden');
    renderPlayBar();
    if (refreshPanel) renderPanel();
  }

  function renderMode() {
    if (ctrl.mode === 'build') tips.trigger('buildMode');
    document.body.classList.toggle('mode-build', ctrl.mode === 'build');
    document.body.classList.toggle('mode-play', ctrl.mode === 'play');
    playTab.setAttribute('aria-selected', String(ctrl.mode === 'play'));
    buildTab.setAttribute('aria-selected', String(ctrl.mode === 'build'));
  }

  function renderTool() {
    const t = ctrl.tool;
    for (const [id, b] of pieceButtons) b.classList.toggle('active', t.mode === 'build' && t.pieceId === id);
    demoBtn.classList.toggle('active', t.mode === 'demolish');
    rotBtn.disabled = !(t.mode === 'build' && (catalog[t.pieceId]?.rotations ?? 1) > 1);
    if (t.mode === 'build' && (catalog[t.pieceId]?.tier ?? 1) > ctrl.town.progress.tier) tips.trigger('locked');
    if (t.mode === 'demolish' && ctrl.mode === 'build') tips.trigger('demolish');
    if (t.mode === 'dig' || t.mode === 'plant' || t.mode === 'water') tips.trigger('garden');
    renderPlayBar();
  }

  function renderStatus() {
    const p = ctrl.preview;
    let text = ctrl.status.text;
    let tone = ctrl.status.tone;
    if (p.kind === 'place' || p.kind === 'remove') {
      text = p.message;
      tone = !p.ok ? 'error' : p.kind === 'place' && p.warning ? 'warn' : 'ok';
    } else if (p.kind === 'action') {
      text = p.action.message;
      tone = p.action.tone ?? (p.action.ok ? (p.action.arm ? 'warn' : 'ok') : 'error');
    }
    if (tone === 'error' && (ctrl.status.tone === 'error' || ctrl.preview.kind === 'none')) tips.trigger('rejected');
    if (tone === 'error' && /^Needs \d/.test(text)) tips.trigger('needMaterials');
    statusText.textContent = text;
    statusIcon.textContent = tone === 'ok' ? '✓' : tone === 'warn' ? '!' : tone === 'error' ? '✕' : 'ℹ';
    status.dataset.tone = tone;
    const canCascade = p.kind === 'remove' && !p.ok && p.dependents.length > 0;
    cascadeBtn.classList.toggle('hidden', !canCascade);
    if (canCascade) cascadeBtn.textContent = `Remove all ${p.dependents.length + 1}`;
    touch.classList.toggle('hidden', !ctrl.pendingTouch);
    okBtn.disabled = p.kind === 'none' || ((p.kind === 'place' || p.kind === 'remove') && !p.ok);
    okBtn.textContent = p.kind === 'remove' ? '✓ Remove' : '✓ Place';
  }

  function toast(text: string) {
    const t = el('div', { class: 'toast' }, text);
    toasts.append(t);
    setTimeout(() => t.classList.add('fade'), 1800);
    setTimeout(() => t.remove(), 2600);
  }

  function renderPanel() {
    const p = ctrl.panel;
    panel.classList.toggle('hidden', p === null);
    if (!p) return;
    const close = btn('✕', { class: 'close', 'aria-label': 'Close' }, () => ctrl.openPanel(null));
    if (p.kind === 'activities') {
      const menu = el('div',{class:'activity-menu'});
      menu.append(btn('Neighborhood & daily life',{},()=>ctrl.openPanel({kind:'neighborhood'})),workshopBtn,lessonsBtn,productionBtn,animalsBtn,wellbeingBtn,travelBtn,inspectBtn,roofBtn,styleBtn,noteBtn);
      panel.replaceChildren(close,el('h2',{},'Activities & settings'),menu);
      return;
    }
    if(p.kind==='neighborhood'){panel.replaceChildren(...neighborhoodPanel(ctrl,close));return;}
    if(p.kind==='lessons'){panel.replaceChildren(close,...playerLessons(ctrl));return;}
    if (p.kind === 'production') {panel.replaceChildren(...productionPanel(ctrl,close,p.note));return;}
    if (p.kind === 'shelter') {
      const report = shelterReport(ctrl.town, ctrl.catalog);
      panel.replaceChildren(close, el('h2', {}, 'Shelter check'), el('p', {}, report.summary));
      for (const issue of report.issues) panel.append(btn(`${issue.text} — show location`, {}, () => ctrl.focusPoint(issue)));
      return;
    }
    if (p.kind === 'animals') {
      panel.replaceChildren(...animalPanel(ctrl, close, p.note, p.confirmSlaughter));
      return;
    }
    if (p.kind === 'wellbeing') {
      panel.replaceChildren(...wellbeingPanel(ctrl, close, p.note));
      return;
    }
    if (p.kind === 'travel') {
      panel.replaceChildren(...travelPanel(ctrl, close, p.note));
      return;
    }
    if (p.kind === 'workshop') {
      panel.replaceChildren(...workshopPanel(ctrl, close, p.note));
      return;
    }
    if (p.kind === 'project') tips.trigger('project');
    if (p.kind === 'kiosk') {
      tips.trigger('kiosk');
      panel.replaceChildren(...(ctrl.kiosk ? kioskPanel(ctrl, ctrl.kiosk, close) : [close, el('h2', {}, 'Relief kiosk'), el('p', { class: 'line' }, 'Not available.')]));
      if (ctrl.kiosk && !ctrl.kiosk.state && ctrl.kiosk.signedIn) void ctrl.kiosk.sync();
      return;
    }
    if (p.kind === 'npc') {
      const def = ctrl.world.npcs.find((n) => n.id === p.npcId);
      const st = ctrl.town.npcs[p.npcId];
      if (!def || !st) return;
      const foods = ctrl.inventoryList().filter((i) => i.kind === 'food');
      const gifts = el('div', { class: 'gifts' });
      gifts.append(el('span', { class: 'label' }, foods.length ? 'Give:' : 'Grow food to share with her.'));
      for (const f of foods) gifts.append(btn(`${f.name} (${f.n})${def.likes.includes(f.id) ? ' ♥' : ''}`, {}, () => ctrl.give(def.id, f.id)));
      const daily = dailyState(ctrl.town, ctrl.now());
      const request = dailyRequest(daily.day);
      const requests = el('div', { class: 'gifts' });
      const describe = (items: Record<string, number>) => Object.entries(items).map(([id,n]) => `${n} ${ITEMS[id]?.name ?? id}`).join(', ');
      requests.append(el('p', {}, `Today's request: ${request.title}. Bring ${describe(request.cost as Record<string,number>)}; receive ${describe(request.gives as Record<string,number>)}. A new request arrives each ambient day.`));
      requests.append(btn(daily.requestDone ? 'Request completed today' : 'Deliver requested goods', daily.requestDone ? {disabled:'true'} : {}, () => ctrl.dailyAction({type:'completeDailyRequest',npcId:def.id})));
      requests.append(el('p', {}, `Food donations: ${daily.donated}/10 today. Every two donated food earns a learning voucher; donations also improve friendship.`));
      for (const f of foods) {
        const qty = Math.min(f.n, 10-daily.donated);
        if (qty > 0) requests.append(btn(`Donate ${qty} ${f.name}`, {}, () => ctrl.dailyAction({type:'donateFood',npcId:def.id,item:f.id,qty})));
      }
      const trades = el('div', { class: 'gifts' });
      if (def.trades?.length) trades.append(el('span', { class: 'label' }, 'Trade goods:'));
      const goods = (items: Record<string, number>) => Object.entries(items).map(([id, qty]) => `${qty} ${ITEMS[id]?.name ?? id}`).join(', ');
      for (const offer of def.trades ?? []) {
        const afford = Object.entries(offer.cost).every(([id, qty]) => (ctrl.town.inventory[id] ?? 0) >= qty);
        trades.append(btn(`Give ${goods(offer.cost)} → get ${goods(offer.gives)}`, afford ? {} : { disabled: 'true' }, () => ctrl.trade(def.id, offer.id)));
      }
      panel.replaceChildren(
        close,
        el('h2', {}, def.name),
        el('p', { class: 'sub' }, `${friendshipLevel(st.friendship)} · ${st.friendship} / 100`),
        ...p.lines.map((l) => el('p', { class: 'line' }, l)),
        gifts,
        trades,
        requests,
      );
      return;
    }
    const def = ctrl.world.projects.find((x) => x.id === p.projectId);
    const st = ctrl.town.projects[p.projectId];
    if (!def || !st) return;
    const now = ctrl.now();
    const kids: HTMLElement[] = [close, el('h2', {}, def.name)];
    const ol = el('ol', { class: 'stages' });
    def.stages.forEach((s, i) => ol.append(el('li', { class: i < st.stage ? 'done' : i === st.stage ? 'current' : '' }, `${i < st.stage ? '✓ ' : ''}${s.name}`)));
    kids.push(ol);
    if (st.completedMs != null) {
      kids.push(el('p', { class: 'line' }, 'Finished. Thank you for your help.'));
    } else {
      const s = def.stages[st.stage]!;
      const stage = st.stages[st.stage]!;
      const helper = helperLabour(ctrl.town, def, now);
      const helperName = ctrl.world.npcs.find((n) => n.id === def.helper)?.name ?? 'Your neighbour';
      kids.push(el('p', { class: 'line' }, `Labour: ${Math.min(s.labour, stage.playerLabour + helper)} of ${s.labour} hours (you ${stage.playerLabour}, ${helperName} ${helper})`));
      const actions = el('div', { class: 'gifts' });
      actions.append(btn('Work for an hour', {}, () => ctrl.work(def.id)));
      for (const [m, need] of Object.entries(s.materials)) {
        const given = stage.given[m] ?? 0;
        const have = ctrl.town.inventory[m] ?? 0;
        kids.push(el('p', { class: 'line' }, `${ITEMS[m]?.name ?? m}: ${given} of ${need} given (you have ${have})`));
        if (given < need) actions.append(btn(`Give ${Math.min(need - given, have)} ${ITEMS[m]?.name.toLowerCase() ?? m}`, have ? {} : { disabled: 'true' }, () => ctrl.contribute(def.id, m)));
      }
      kids.push(actions);
      if (!materialsMet(stage, s.materials)) kids.push(el('p', { class: 'sub' }, `${helperName} can only work on this stage once its materials are here.`));
      else if (def.helper && ctrl.town.npcs[def.helper]?.met) kids.push(el('p', { class: 'sub' }, `${helperName} adds an hour of work every 10 minutes, even while you're away.`));
      else if (def.helper) kids.push(el('p', { class: 'sub' }, `Your neighbour across the stream might help, if you introduce yourself.`));
    }
    if (p.note) kids.push(el('p', { class: 'note' }, p.note));
    panel.replaceChildren(...kids);
  }

  ctrl.on((what, data) => {
    if (what === 'style') renderStyle();
    if (what === 'town') {
      const passive = data && typeof data === 'object' && 'commandType' in data && ['tick','move'].includes(String(data.commandType));
      renderTown(!passive);
    }
    if (what === 'tool') renderTool();
    if (what === 'mode') renderMode();
    if (what === 'panel') renderPanel();
    if (what === 'credits') {
      const k = ctrl.kiosk;
      const show = Boolean(k?.signedIn && k.state);
      credits.classList.toggle('hidden', !show);
      if (show) credits.textContent = `◈ ${rc(k!.state!.balance)}`;
    }
    if (what === 'clock') {
      if(ctrl.panel?.kind==='neighborhood')renderPanel();
      if (ctrl.panel?.kind === 'workshop') updateWorkshopClock(panel, ctrl.now());
    updateJobClocks(panel,ctrl.now());
      renderClock();
      renderTown();
    }
    if (what === 'status' && data && typeof data === 'object' && 'toast' in data) toast(String((data as { toast: string }).toast));
    renderStatus();
  });

  renderStyle();
  renderMode();
  renderTown();
  renderTool();
  renderClock();
  renderStatus();
  tips.trigger('firstSteps');
  return tips;
}

export function showAwayCard(root: HTMLElement, lines: string[], hours: number): void {
  const modal = el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'away-title' });
  const card = el('div', { class: 'card' });
  const days = hours >= 48 ? `${Math.round(hours / 24)} days` : `${Math.round(hours)} hours`;
  card.append(el('h2', { id: 'away-title' }, `While you were away (${days})`));
  const ul = el('ul');
  for (const l of lines) ul.append(el('li', {}, l));
  const ok = el('button', {}, 'Back to it');
  ok.addEventListener('click', () => modal.remove());
  card.append(ul, ok);
  modal.append(card);
  root.append(modal);
  ok.focus();
}

export function showWelcome(root: HTMLElement, onClose: () => void): void {
  const modal = el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'welcome-title' });
  const card = el('div', { class: 'card' });
  card.append(
    el('h2', { id: 'welcome-title' }, 'Paradise Lost'),
    el('p', {}, 'You have a tarp, a few tools, and an overgrown lot on the wet side of the island. Most of the neighbours have gone.'),
    el('p', {}, 'Salvage what you can, build yourself a shelter, and see who is still around.'),
    el('p', { class: 'sub' }, 'Click to walk and to use things. Press B or tap Build to build, and H or ? Help any time. This is an early test: the art is placeholder. Press N or ✎ Note whenever something feels slow, confusing or fun.'),
  );
  const ok = el('button', {}, 'Start');
  ok.addEventListener('click', () => {
    modal.remove();
    onClose();
  });
  card.append(ok);
  modal.append(card);
  root.append(modal);
  ok.focus();
}
