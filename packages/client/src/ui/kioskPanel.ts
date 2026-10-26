/**
 * The relief kiosk panel: account, balance, selling, buying, milestones.
 * All numbers come from poor.camp (KioskSession.state); this only lays them out.
 */
import { ITEMS } from '@paradise-lost/content';
import { KIOSK_MAX_SALE } from '@paradise-lost/sim';
import type { Controller } from '../game/controller.ts';
import { rc, type KioskSession } from '../game/kiosk.ts';

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, text?: string) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text !== undefined) e.textContent = text;
  return e;
};
const button = (label: string, onClick: () => void, disabled = false, cls = '') => {
  const b = el('button', cls ? { class: cls } : {}, label);
  b.disabled = disabled;
  b.addEventListener('click', onClick);
  return b;
};

const GROUPS: [string, string][] = [
  ['seeds', 'Seeds and plants'],
  ['materials', 'Building materials'],
  ['tier2', 'Lumber and block'],
  ['furniture', 'Furniture'],
];

export function kioskPanel(ctrl: Controller, kiosk: KioskSession, close: HTMLElement): HTMLElement[] {
  const name = ctrl.world.kiosk?.name ?? 'Relief kiosk';
  const kids: HTMLElement[] = [close, el('h2', {}, name), el('p', { class: 'sub' }, 'Greater America Citizen Relief. Trades in Rapture Credits, through your Poor Camp account.')];
  const fine = el('p', { class: 'fine' }, 'Rapture Credits are fictional site currency: no purchase, no cash value, no real-world prize.');

  const acct = kiosk.account;
  if (acct.state === 'unavailable') {
    kids.push(el('p', { class: 'line' }, acct.reason), fine);
    return kids;
  }
  if (acct.state === 'signed-out') {
    kids.push(
      el('p', { class: 'line' }, 'Sign in with the same Poor Camp account you use on poor.camp. Your credits are shared with the rest of the portal: the Treasury, the Gaming Hall, the Testament Drawing.'),
      el('p', { class: 'sub' }, 'Signing in takes you to poor.camp and straight back. Your town is saved first.'),
      button('Sign in with your Poor Camp account', () => void kiosk.signIn(), false, 'ok'),
      el('p', { class: 'sub' }, 'You can play without an account; only the kiosk needs one.'),
      fine,
    );
    return kids;
  }
  const s = kiosk.state;
  if (!s) {
    kids.push(el('p', { class: 'line' }, 'Consulting the national ledger…'));
    if (kiosk.message) kids.push(el('p', { class: `note ${kiosk.message.tone}` }, kiosk.message.text));
    return kids;
  }

  const here = ctrl.atKiosk();
  const busy = kiosk.busy;
  kids.push(
    el('p', { class: 'balance' }, `Balance: ${rc(s.balance)}`),
    el('p', { class: 'sub' }, `The kiosk pays up to ${rc(s.sales.capPerDay)} a day for goods. Still to pay today: ${rc(s.sales.remainingToday)}.`),
  );
  if (!here) kids.push(el('p', { class: 'note' }, 'Walk up to the kiosk by the footbridge to trade.'));
  if (kiosk.message) kids.push(el('p', { class: `note ${kiosk.message.tone}` }, kiosk.message.text));

  // Sell
  const sell = el('section', { class: 'kiosk-sell' });
  sell.append(el('h3', {}, 'Sell'));
  const goods = Object.entries(s.sales.prices).filter(([item]) => (ctrl.town.inventory[item] ?? 0) > 0);
  if (goods.length === 0) sell.append(el('p', { class: 'sub' }, `Nothing to sell. The kiosk buys ${Object.keys(s.sales.prices).map((i) => ITEMS[i]?.name.toLowerCase() ?? i).join(', ')}.`));
  for (const [item, price] of goods) {
    const have = ctrl.town.inventory[item] ?? 0;
    const max = Math.min(have, KIOSK_MAX_SALE, Math.floor(s.sales.remainingToday / price));
    const row = el('div', { class: 'trade' });
    row.append(el('span', {}, `${ITEMS[item]?.name ?? item} ×${have}`), el('span', { class: 'price' }, `${rc(price)} each`));
    const acts = el('span', { class: 'acts' });
    acts.append(button('Sell 1', () => void kiosk.sell(item, 1), !here || busy || max < 1));
    if (max > 1) acts.append(button(`Sell ${max}`, () => void kiosk.sell(item, max), !here || busy));
    row.append(acts);
    sell.append(row);
  }
  kids.push(sell);

  // Buy
  const buy = el('section', { class: 'kiosk-buy' });
  buy.append(el('h3', {}, 'Buy'));
  for (const [group, title] of GROUPS) {
    const offers = s.offers.filter((o) => o.group === group && ITEMS[o.item]);
    if (offers.length === 0) continue;
    buy.append(el('h4', {}, title));
    if (group === 'tier2' && ctrl.town.progress.tier < 2) buy.append(el('p', { class: 'sub' }, 'You can build with these once Rosa teaches you.'));
    for (const o of offers) {
      const row = el('div', { class: 'trade' });
      row.append(el('span', {}, o.label), el('span', { class: 'price' }, rc(o.price)));
      const acts = el('span', { class: 'acts' });
      acts.append(button('Buy', () => void kiosk.buy(o.id), !here || busy || s.balance < o.price));
      row.append(acts);
      buy.append(row);
    }
  }
  kids.push(buy);

  // Milestones
  const ms = el('section', { class: 'kiosk-milestones' });
  ms.append(el('h3', {}, 'Relief awards'), el('p', { class: 'sub' }, 'Paid once per account, automatically, when you reach them.'));
  const ul = el('ul');
  for (const m of s.milestones) ul.append(el('li', { class: m.claimed ? 'done' : '' }, `${m.claimed ? '✓' : '○'} ${m.label} · ${rc(m.award)}`));
  ms.append(ul);
  kids.push(ms);

  const foot = el('p', { class: 'sub kiosk-foot' });
  const ledger = el('a', { href: 'https://poor.camp/unity/credits/', target: '_blank', rel: 'noopener' }, 'Your credit ledger at poor.camp');
  const out = el('button', { class: 'link' }, 'Sign out of the game');
  out.addEventListener('click', () => void kiosk.signOut());
  foot.append(ledger, ' · ', out);
  kids.push(foot, fine);
  return kids;
}
