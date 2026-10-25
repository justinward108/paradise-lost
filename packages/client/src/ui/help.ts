/**
 * The Help screen and first-time tips. All text comes from @paradise-lost/content (help.ts).
 *
 * Tips are a player preference, not part of the town, so which ones have been seen is kept
 * in localStorage rather than the save.
 */
import { HELP_SECTIONS, TIPS } from '@paradise-lost/content';

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, text?: string) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text !== undefined) e.textContent = text;
  return e;
};

function renderBody(lines: string[]): HTMLElement[] {
  const out: HTMLElement[] = [];
  let list: HTMLUListElement | null = null;
  for (const line of lines) {
    if (line.startsWith('- ')) {
      list ??= el('ul');
      list.append(el('li', {}, line.slice(2)));
      continue;
    }
    if (list) {
      out.push(list);
      list = null;
    }
    out.push(el('p', {}, line));
  }
  if (list) out.push(list);
  return out;
}

let open: HTMLElement | null = null;

export function isHelpOpen(): boolean {
  return open !== null;
}

export function closeHelp(): void {
  open?.remove();
  open = null;
}

/** Open the Help screen at a section. */
export function showHelp(root: HTMLElement, sectionId = 'start', footer?: HTMLElement): void {
  closeHelp();
  const modal = el('div', { class: 'modal help', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'help-title' });
  const card = el('div', { class: 'card help-card' });
  const nav = el('nav', { class: 'help-nav', 'aria-label': 'Help topics' });
  const content = el('article', { class: 'help-content', tabindex: '-1' });
  const close = el('button', { class: 'close', 'aria-label': 'Close help' }, '✕');
  close.addEventListener('click', closeHelp);

  const show = (id: string) => {
    const s = HELP_SECTIONS.find((x) => x.id === id) ?? HELP_SECTIONS[0]!;
    content.replaceChildren(el('h2', { id: 'help-title' }, s.title), ...renderBody(s.body));
    for (const b of nav.querySelectorAll('button')) b.setAttribute('aria-current', String(b.dataset.id === s.id));
    content.scrollTop = 0;
  };
  for (const s of HELP_SECTIONS) {
    const b = el('button', { 'data-id': s.id }, s.title);
    b.addEventListener('click', () => {
      show(s.id);
      content.focus();
    });
    nav.append(b);
  }
  card.append(close, nav, content);
  if (footer) card.append(footer);
  modal.append(card);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeHelp();
  });
  root.append(modal);
  open = modal;
  show(sectionId);
  close.focus();
}

const SEEN_KEY = 'pl.tips.seen';
const OFF_KEY = 'pl.tips.off';

function load(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function store(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: tips may repeat next session */
  }
}

/** One-time tips, shown one at a time and never over a dialog. */
export class Tips {
  private seen = new Set<string>((load(SEEN_KEY) ?? '').split(',').filter(Boolean));
  private off = load(OFF_KEY) === '1';
  private queue: string[] = [];
  private card: HTMLElement | null = null;

  constructor(
    private root: HTMLElement,
    private openHelp: (section: string) => void,
  ) {
    setInterval(() => this.pump(), 500);
  }

  get enabled(): boolean {
    return !this.off;
  }

  setEnabled(on: boolean): void {
    this.off = !on;
    store(OFF_KEY, on ? '0' : '1');
    if (!on) this.dismiss();
  }

  /** Forget which tips were seen (from the Help screen). */
  reset(): void {
    this.seen.clear();
    store(SEEN_KEY, '');
    this.setEnabled(true);
  }

  /** Ask for a tip; it shows once, the first time its situation comes up. */
  trigger(id: string): void {
    if (this.off || this.seen.has(id) || this.queue.includes(id) || !TIPS[id]) return;
    this.queue.push(id);
    // Next tick: a dialog opened in the same moment (the welcome card) gets to appear first.
    setTimeout(() => this.pump(), 0);
  }

  private pump(): void {
    if (this.card || this.off || this.queue.length === 0) return;
    if (this.root.querySelector('.modal')) return; // wait for dialogs to close
    const id = this.queue.shift()!;
    const tip = TIPS[id]!;
    this.seen.add(id);
    store(SEEN_KEY, [...this.seen].join(','));

    const card = el('aside', { class: 'tip', role: 'note', 'aria-live': 'polite' });
    const more = el('button', {}, 'More help');
    const ok = el('button', { class: 'ok' }, 'Got it');
    const stop = el('button', { class: 'link' }, 'Turn off tips');
    more.addEventListener('click', () => {
      this.dismiss();
      this.openHelp(tip.section);
    });
    ok.addEventListener('click', () => this.dismiss());
    stop.addEventListener('click', () => this.setEnabled(false));
    const row = el('div', { class: 'row' });
    row.append(ok, more, stop);
    card.append(el('strong', {}, tip.title), el('p', {}, tip.text), row);
    this.root.append(card);
    this.card = card;
  }

  dismiss(): void {
    this.card?.remove();
    this.card = null;
    setTimeout(() => this.pump(), 400);
  }
}
