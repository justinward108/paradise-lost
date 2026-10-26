/**
 * The relief kiosk's side of a trade: talks to poor.camp and turns its answers into sim
 * commands. poor.camp decides every price, cap and balance; the sim keeps the goods.
 *
 * Order of operations, so a closed tab never loses anything:
 * - Selling: the goods leave the inventory (kioskSell, saved) BEFORE the request. When
 *   poor.camp answers, what it didn't take comes back (kioskSettle). If the request never
 *   arrives, the same request key is retried next time, and poor.camp pays at most once.
 * - Buying: the order is recorded (kioskOrder, saved) BEFORE the request. When poor.camp
 *   confirms, the goods arrive (kioskDeliver). A retry with the same key returns the
 *   original purchase instead of charging again.
 */
import { kioskMilestones, newCommandId } from '@paradise-lost/sim';
import { ITEMS } from '@paradise-lost/content';
import { account, kioskApi, Refused, requestKey, signIn, signOut, type Account, type KioskState } from '../net/poorcamp.ts';
import type { Controller } from './controller.ts';

const fmt = new Intl.NumberFormat('en-US');
export const rc = (n: number) => `${fmt.format(n)} RC`;

export class KioskSession {
  account: Account = { state: 'unavailable', reason: 'Checking your Poor Camp account…' };
  state: KioskState | null = null;
  busy = false;
  /** The last thing that happened, shown in the kiosk panel. */
  message: { text: string; tone: 'ok' | 'error' | 'info' } | null = null;
  private syncing: Promise<void> | null = null;

  constructor(private ctrl: Controller) {}

  get signedIn(): boolean {
    return this.account.state === 'signed-in';
  }

  /** Check the account and, if signed in, finish anything pending and load the kiosk. */
  async start(): Promise<void> {
    this.account = await account();
    this.ctrl.creditsChanged();
    if (this.signedIn) await this.sync();
  }

  sync(): Promise<void> {
    this.syncing ??= this.doSync().finally(() => (this.syncing = null));
    return this.syncing;
  }

  private async doSync(): Promise<void> {
    try {
      await this.retryPending();
      this.state = await kioskApi.state();
      await this.claimMilestones();
    } catch (err) {
      if (err instanceof Refused && (err.status === 401 || err.status === 403)) {
        this.account = { state: 'signed-out' };
        this.state = null;
      } else this.say(`The kiosk isn't answering right now. ${err instanceof Error ? err.message : ''}`.trim(), 'error');
    }
    this.ctrl.creditsChanged();
  }

  private dispatch(cmd: Record<string, unknown>) {
    return this.ctrl.dispatch({ id: newCommandId(), ...cmd } as Parameters<Controller['dispatch']>[0]);
  }

  private say(text: string, tone: 'ok' | 'error' | 'info' = 'info') {
    this.message = { text, tone };
  }

  /** Finish trades a closed tab or a dropped connection left half-done. */
  private async retryPending(): Promise<void> {
    const k = this.ctrl.town.kiosk;
    for (const sale of [...k.pendingSales]) {
      try {
        const r = await kioskApi.sell(sale.key, sale.item, sale.qty);
        this.dispatch({ type: 'kioskSettle', requestKey: sale.key, acceptedQty: r.acceptedQty });
      } catch (err) {
        if (!(err instanceof Refused) || err.status === 401 || err.status === 403) throw err;
        this.dispatch({ type: 'kioskSettle', requestKey: sale.key, acceptedQty: 0 });
      }
    }
    for (const order of [...k.pendingOrders]) {
      try {
        const r = await kioskApi.buy(order.key, order.offer);
        this.dispatch({ type: 'kioskDeliver', requestKey: order.key, item: r.purchase.item, qty: r.purchase.qty });
      } catch (err) {
        if (!(err instanceof Refused) || err.status === 401 || err.status === 403) throw err;
        this.dispatch({ type: 'kioskCancel', requestKey: order.key });
      }
    }
  }

  /** Claim any milestone this town has reached that this account hasn't been paid for. */
  async claimMilestones(): Promise<void> {
    if (!this.signedIn || !this.state) return;
    const reached = new Set(kioskMilestones(this.ctrl.town, this.ctrl.catalog, this.ctrl.world));
    for (const m of this.state.milestones) {
      if (m.claimed || !reached.has(m.id)) continue;
      try {
        const r = await kioskApi.claim(m.id);
        m.claimed = true;
        this.state.balance = r.balance;
        if (r.awarded > 0) this.ctrl.toast(`+${rc(r.awarded)} · ${m.label}`);
      } catch {
        return; // try again next time
      }
    }
    this.ctrl.creditsChanged();
  }

  async signIn(): Promise<void> {
    this.ctrl.flushSave();
    await signIn('/');
  }

  async signOut(): Promise<void> {
    await signOut();
    this.account = { state: 'signed-out' };
    this.state = null;
    this.say('Signed out of Paradise Lost. You are still signed in at poor.camp.', 'info');
    this.ctrl.creditsChanged();
  }

  async sell(item: string, qty: number): Promise<void> {
    if (this.busy || !this.state) return;
    const key = requestKey();
    const r = this.dispatch({ type: 'kioskSell', requestKey: key, item, qty });
    if (!r.ok) {
      this.say(r.reason ?? "Can't sell that", 'error');
      this.ctrl.creditsChanged();
      return;
    }
    this.ctrl.flushSave();
    this.busy = true;
    this.ctrl.creditsChanged();
    const name = ITEMS[item]?.name.toLowerCase() ?? item;
    try {
      const res = await kioskApi.sell(key, item, qty);
      this.dispatch({ type: 'kioskSettle', requestKey: key, acceptedQty: res.acceptedQty });
      this.state.balance = res.balance;
      this.state.sales.remainingToday = res.remainingToday;
      this.state.sales.paidToday = this.state.sales.capPerDay - res.remainingToday;
      const back = qty - res.acceptedQty;
      this.say(`Sold ${res.acceptedQty} ${name} for ${rc(res.credits)}.${back > 0 ? ` The kiosk hit today's limit; ${back} came back to you.` : ''}`, 'ok');
    } catch (err) {
      if (err instanceof Refused && err.status !== 401 && err.status !== 403) {
        this.dispatch({ type: 'kioskSettle', requestKey: key, acceptedQty: 0 });
        this.say(`${err.message} Your ${name} came back to you.`, 'error');
      } else {
        this.say("The kiosk didn't answer. Your goods are held until it does; nothing is lost.", 'error');
      }
    } finally {
      this.busy = false;
      this.ctrl.creditsChanged();
    }
  }

  async buy(offerId: string): Promise<void> {
    if (this.busy || !this.state) return;
    const offer = this.state.offers.find((o) => o.id === offerId);
    if (!offer) return;
    const key = requestKey();
    const r = this.dispatch({ type: 'kioskOrder', requestKey: key, offer: offerId });
    if (!r.ok) {
      this.say(r.reason ?? "Can't order that", 'error');
      this.ctrl.creditsChanged();
      return;
    }
    this.ctrl.flushSave();
    this.busy = true;
    this.ctrl.creditsChanged();
    try {
      const res = await kioskApi.buy(key, offerId);
      this.dispatch({ type: 'kioskDeliver', requestKey: key, item: res.purchase.item, qty: res.purchase.qty });
      this.state.balance = res.balance;
      this.say(`Bought ${offer.label} for ${rc(offer.price)}.`, 'ok');
    } catch (err) {
      if (err instanceof Refused && err.status !== 401 && err.status !== 403) {
        this.dispatch({ type: 'kioskCancel', requestKey: key });
        this.say(err.message, 'error');
      } else {
        this.say("The kiosk didn't answer. Your order is kept and will be finished when it does; you won't be charged twice.", 'error');
      }
    } finally {
      this.busy = false;
      this.ctrl.creditsChanged();
    }
  }
}
