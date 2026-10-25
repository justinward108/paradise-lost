/**
 * Playtest notes: a quick box for "this felt slow / I got stuck here", saved with a snapshot
 * of what the player was doing at that moment.
 *
 * Notes are kept in localStorage, apart from the town save, so they survive ?reset and a
 * fresh game. There is no server yet; "Copy all" puts them on the clipboard to paste
 * into a chat or an issue.
 */
import { catalog, ITEMS } from '@paradise-lost/content';
import { ambientTime, goals, onLot } from '@paradise-lost/sim';
import type { Controller } from '../game/controller.ts';

declare const __BUILD__: string;

export interface Note {
  at: string;
  text: string;
  context: string;
}

const KEY = 'pl.feedback';

export function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(KEY);
    const v: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? (v as Note[]) : [];
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(notes));
    return true;
  } catch {
    return false;
  }
}

const hhmm = (hour: number) => {
  const h = Math.floor(hour);
  const m = Math.floor((hour - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/** A few plain lines describing the game state, for reading alongside the note. */
export function describeMoment(ctrl: Controller): string {
  const t = ctrl.town;
  const a = ambientTime(t, ctrl.now());
  const g = goals(t, catalog, ctrl.world);
  const next = g.find((x) => !x.done);
  const inv = Object.entries(t.inventory)
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${ITEMS[k]?.name ?? k} ${n}`)
    .join(', ');
  const npcs = ctrl.world.npcs.map((n) => {
    const s = t.npcs[n.id];
    return s ? `${n.name}: ${s.met ? `met, friendship ${s.friendship}${s.taught ? ', taught you' : ''}` : 'not met'}` : `${n.name}: —`;
  });
  const projects = ctrl.world.projects.map((p) => {
    const s = t.projects[p.id];
    if (!s?.startedMs) return `${p.name}: not started`;
    if (s.completedMs) return `${p.name}: done`;
    const st = s.stages[s.stage];
    return `${p.name}: stage ${s.stage + 1} of ${p.stages.length}, your labour ${st?.playerLabour ?? 0}`;
  });
  const tool = ctrl.tool.mode === 'build' ? `build ${catalog[ctrl.tool.pieceId]?.name ?? ctrl.tool.pieceId}` : ctrl.tool.mode;
  return [
    `Build ${typeof __BUILD__ === 'string' ? __BUILD__ : 'dev'} · ${ctrl.style} · ${window.innerWidth}×${window.innerHeight}${matchMedia('(pointer: coarse)').matches ? ' touch' : ''}`,
    `Game day ${a.day + 1}, ${hhmm(a.hour)}, ${a.rain ? 'rain' : 'clear'} · ${ctrl.mode} mode, tool ${tool} · at ${t.player.x},${t.player.y}`,
    `Goals done: ${g.filter((x) => x.done).length}/${g.length}${next ? ` · next: ${next.text}` : ''} · building tier ${t.progress.tier}`,
    `Pieces on your lot: ${Object.values(t.pieces).filter((p) => onLot(t, p.slot)).length} · shelter: ${ctrl.shelterReady() ? 'yes' : 'no'} · garden beds: ${Object.keys(t.soil).length}, crops: ${Object.keys(t.crops).length}`,
    `Carrying: ${inv || 'nothing'}`,
    ...npcs,
    ...projects,
    `Last message: ${ctrl.status.text}`,
  ].join('\n');
}

export function notesText(notes: Note[]): string {
  const head = `Paradise Lost playtest notes (${notes.length})`;
  return [head, '='.repeat(head.length), ...notes.map((n, i) => `\n#${i + 1} · ${new Date(n.at).toLocaleString()}\n${n.text}\n\n${n.context.replace(/^/gm, '  ')}`)].join('\n') + '\n';
}

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, text?: string) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text !== undefined) e.textContent = text;
  return e;
};

let openModal: HTMLElement | null = null;

export function isFeedbackOpen(): boolean {
  return openModal !== null;
}

export function closeFeedback(): void {
  openModal?.remove();
  openModal = null;
}

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers / no permission: fall back to a selected textarea.
    const ta = el('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

/** Open the notes box. The game moment is captured now, when the player opened it. */
export function showFeedback(root: HTMLElement, ctrl: Controller): void {
  closeFeedback();
  const context = describeMoment(ctrl);

  const modal = el('div', { class: 'modal feedback', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'fb-title' });
  const card = el('div', { class: 'card feedback-card' });
  const close = el('button', { class: 'close', 'aria-label': 'Close' }, '✕');
  close.addEventListener('click', closeFeedback);

  const box = el('textarea', { rows: '5', placeholder: 'What happened? What did you expect? Anything slow, confusing or fun…', 'aria-label': 'Your note' });
  const details = el('details');
  details.append(el('summary', {}, 'Saved with your note'), el('pre', {}, context));

  const msg = el('p', { class: 'fb-msg', role: 'status', 'aria-live': 'polite' });
  const count = el('p', { class: 'fb-count' });
  const save = el('button', { class: 'ok' }, 'Save note');
  const copyBtn = el('button', {}, 'Copy all notes');
  const dl = el('button', {}, 'Download');
  const clear = el('button', { class: 'link' }, 'Delete all notes');

  const refresh = () => {
    const n = loadNotes().length;
    count.textContent = n === 0 ? 'No notes saved yet.' : `${n} note${n === 1 ? '' : 's'} saved on this device.`;
    for (const b of [copyBtn, dl, clear]) b.toggleAttribute('disabled', n === 0);
  };

  save.addEventListener('click', () => {
    const text = box.value.trim();
    if (!text) {
      msg.textContent = 'Type a note first.';
      box.focus();
      return;
    }
    const ok = saveNotes([...loadNotes(), { at: new Date().toISOString(), text, context }]);
    if (!ok) {
      msg.textContent = "Couldn't save on this device. Copy your note before closing.";
      return;
    }
    box.value = '';
    msg.textContent = 'Saved. Keep playing; add more any time.';
    refresh();
  });
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) save.click();
  });

  copyBtn.addEventListener('click', async () => {
    msg.textContent = (await copy(notesText(loadNotes()))) ? 'Copied. Paste them into the chat.' : "Couldn't copy. Try Download instead.";
  });
  dl.addEventListener('click', () => {
    const blob = new Blob([notesText(loadNotes())], { type: 'text/plain' });
    const a = el('a', { href: URL.createObjectURL(blob), download: `paradise-lost-notes-${new Date().toISOString().slice(0, 10)}.txt` });
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  let armed = false;
  clear.addEventListener('click', () => {
    if (!armed) {
      armed = true;
      clear.textContent = 'Tap again to delete them all';
      setTimeout(() => {
        armed = false;
        clear.textContent = 'Delete all notes';
      }, 4000);
      return;
    }
    saveNotes([]);
    armed = false;
    clear.textContent = 'Delete all notes';
    msg.textContent = 'All notes deleted.';
    refresh();
  });

  const row = el('div', { class: 'row' });
  row.append(save, copyBtn, dl);
  card.append(
    close,
    el('h2', { id: 'fb-title' }, 'Playtest note'),
    el('p', { class: 'sub' }, 'Jot down anything as it happens. Notes stay on this device until you copy or download them.'),
    box,
    details,
    row,
    msg,
    count,
    clear,
  );
  modal.append(card);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeFeedback();
  });
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      closeFeedback();
    }
  });
  root.append(modal);
  openModal = modal;
  refresh();
  box.focus();
}
