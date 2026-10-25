/**
 * HTML interface over the game canvas: catalogue, tools, status line, touch controls.
 * Built in the DOM (not on the canvas) for real text, screen readers and easy layout.
 */
import { art, catalog, MATERIALS, pieceOrder, type Style } from '@paradise-lost/content';
import { requiredFrames } from '@paradise-lost/content';
import { drawFrame } from '../art/generate.ts';
import type { Controller } from '../game/controller.ts';

export interface UiHooks {
  zoom(f: number): void;
  setRoofs(show: boolean): void;
}

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, text?: string) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text !== undefined) e.textContent = text;
  return e;
};

export function mountUi(root: HTMLElement, ctrl: Controller, hooks: UiHooks): void {
  let roofs = true;

  // Top bar
  const top = el('header', { class: 'topbar' });
  const title = el('div', { class: 'title' }, 'Paradise Lost');
  const inv = el('div', { class: 'inventory', 'aria-label': 'Materials' });
  const shelter = el('div', { class: 'shelter' });
  const undo = el('button', { 'aria-label': 'Undo (Ctrl+Z)', title: 'Undo (Ctrl+Z)' }, '↶ Undo');
  const redo = el('button', { 'aria-label': 'Redo (Ctrl+Y)', title: 'Redo (Ctrl+Y)' }, '↷ Redo');
  const roofBtn = el('button', { 'aria-pressed': 'true', title: 'Show or hide roofs' }, 'Roofs: on');
  const styleBtn = el('button', { title: 'Switch art style' });
  top.append(title, inv, shelter, undo, redo, roofBtn, styleBtn);

  // Left tools
  const tools = el('aside', { class: 'tools', 'aria-label': 'Tools' });
  const toolBtn = (icon: string, label: string, title: string) => {
    const b = el('button', { title, 'aria-label': label });
    b.append(el('span', { class: 'glyph', 'aria-hidden': 'true' }, icon), el('span', { class: 'label' }, label));
    return b;
  };
  const selectBtn = toolBtn('✋', 'Look', 'Look and interact (Esc)');
  const demoBtn = toolBtn('⛏', 'Demolish', 'Demolish (Delete)');
  const rotBtn = toolBtn('↻', 'Rotate', 'Rotate (R)');
  const zin = el('button', { 'aria-label': 'Zoom in' }, '＋');
  const zout = el('button', { 'aria-label': 'Zoom out' }, '－');
  tools.append(selectBtn, demoBtn, rotBtn, zin, zout);

  // Status line + touch confirm
  const status = el('div', { class: 'status', role: 'status', 'aria-live': 'polite' });
  const statusIcon = el('span', { class: 'icon', 'aria-hidden': 'true' });
  const statusText = el('span');
  const cascadeBtn = el('button', { class: 'cascade hidden' }, 'Remove all');
  status.append(statusIcon, statusText, cascadeBtn);

  const touch = el('div', { class: 'touch-confirm hidden' });
  const okBtn = el('button', { class: 'ok', 'aria-label': 'Confirm' }, '✓ Place');
  const noBtn = el('button', { class: 'no', 'aria-label': 'Cancel' }, '✕');
  touch.append(okBtn, noBtn);

  // Catalogue
  const cat = el('nav', { class: 'catalog', 'aria-label': 'Building pieces' });
  const buttons = new Map<string, HTMLButtonElement>();
  for (const id of pieceOrder) {
    const def = catalog[id]!;
    const b = el('button', { class: 'piece', 'data-id': id });
    const img = el('img', { alt: '' });
    const name = el('span', { class: 'name' }, def.name);
    const cost = el('span', { class: 'cost' }, Object.entries(def.cost).map(([m, n]) => `${n} ${m}`).join(', '));
    b.append(img, name, cost);
    b.addEventListener('click', () => ctrl.setTool({ mode: 'build', pieceId: id, rotation: 0 }));
    buttons.set(id, b);
    cat.append(b);
  }

  root.append(top, tools, status, touch, cat);

  // ----- behaviour -----
  undo.addEventListener('click', () => ctrl.undo());
  redo.addEventListener('click', () => ctrl.redo());
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
      /* storage unavailable: preference lasts this session only */
    }
    ctrl.setStyle(next);
  });
  selectBtn.addEventListener('click', () => ctrl.setTool({ mode: 'select' }));
  demoBtn.addEventListener('click', () => ctrl.setTool({ mode: 'demolish' }));
  rotBtn.addEventListener('click', () => ctrl.rotate());
  zin.addEventListener('click', () => hooks.zoom(1.15));
  zout.addEventListener('click', () => hooks.zoom(1 / 1.15));
  okBtn.addEventListener('click', () => ctrl.commit());
  noBtn.addEventListener('click', () => {
    ctrl.pendingTouch = false;
    ctrl.updatePreview(null);
    renderStatus();
  });
  cascadeBtn.addEventListener('click', () => ctrl.commit(true));

  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement) return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      ctrl.undo();
    } else if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
      e.preventDefault();
      ctrl.redo();
    } else if (e.key === 'r' || e.key === 'R') ctrl.rotate();
    else if (e.key === 'Escape') ctrl.setTool({ mode: 'select' });
    else if (e.key === 'Delete' || e.key === 'Backspace') ctrl.setTool({ mode: 'demolish' });
  });

  function renderThumbs() {
    for (const [id, b] of buttons) {
      const def = catalog[id]!;
      const frame = requiredFrames(def)[0]!;
      const d = drawFrame(art[id]![ctrl.style], ctrl.style, frame, `thumb:${id}`);
      const img = b.querySelector('img')!;
      img.src = d.canvas.toDataURL();
      img.style.width = `${d.canvas.width * d.displayScale * 0.6}px`;
    }
  }

  function renderStyle() {
    document.body.classList.toggle('style-pixel', ctrl.style === 'pixel');
    document.body.classList.toggle('style-storybook', ctrl.style === 'storybook');
    styleBtn.textContent = ctrl.style === 'pixel' ? 'Style: Pixel' : 'Style: Storybook';
    renderThumbs();
  }

  function renderTown() {
    inv.replaceChildren(
      ...MATERIALS.filter((m) => (ctrl.town.inventory[m.id] ?? 0) > 0 || m.id === 'boards').map((m) =>
        el('span', { class: 'mat' }, `${m.name} ${ctrl.town.inventory[m.id] ?? 0}`),
      ),
    );
    const ready = ctrl.shelterReady();
    shelter.textContent = ready ? '✓ Shelter ready' : 'No shelter yet';
    shelter.classList.toggle('ready', ready);
    undo.disabled = ctrl.town.history.undo.length === 0;
    redo.disabled = ctrl.town.history.redo.length === 0;
    for (const [id, b] of buttons) {
      const def = catalog[id]!;
      const locked = def.tier > ctrl.town.progress.tier;
      b.classList.toggle('locked', locked);
      b.title = locked ? `${def.name} — unlocks at tier ${def.tier}` : def.name;
    }
  }

  function renderTool() {
    const t = ctrl.tool;
    for (const [id, b] of buttons) b.classList.toggle('active', t.mode === 'build' && t.pieceId === id);
    selectBtn.classList.toggle('active', t.mode === 'select');
    demoBtn.classList.toggle('active', t.mode === 'demolish');
    rotBtn.disabled = !(t.mode === 'build' && (catalog[t.pieceId]?.rotations ?? 1) > 1);
  }

  function renderStatus() {
    const p = ctrl.preview;
    let text = ctrl.status.text;
    let tone = ctrl.status.tone;
    if (p.kind === 'place' || p.kind === 'remove') {
      text = p.message;
      tone = !p.ok ? 'error' : p.kind === 'place' && p.warning ? 'warn' : 'ok';
    } else if (p.kind === 'plot') {
      text = p.message;
      tone = 'info';
    }
    // If the latest command was rejected, that reason wins until the pointer moves on.
    if (ctrl.status.tone === 'error' && p.kind === 'none') tone = 'error';
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

  ctrl.on((what) => {
    if (what === 'style') renderStyle();
    if (what === 'town') renderTown();
    if (what === 'tool') renderTool();
    renderStatus();
  });

  renderStyle();
  renderTown();
  renderTool();
  renderStatus();
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
