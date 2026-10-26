/**
 * The game's connection to poor.camp: the shared Poor Camp account (single sign-on) and
 * Rapture Credits at the relief kiosk.
 *
 * Paradise Lost is an enrolled poor.camp property (poor.camp docs/ecosystem-accounts.md).
 * It never sees a password or an Identity token. It asks its own host for a property
 * session (`/api/sso/session`, proxied to poor.camp by `public/_redirects`); signing in
 * hands the browser to poor.camp and back. Unlike poor.camp's account-gate.js, nothing
 * here walls the page: the game is fully playable signed out, and credits are optional.
 *
 * poor.camp is the authority for every credit: prices, the daily sales cap, milestone
 * awards and balances all live in its `/api/paradise-lost` Function.
 */

export const PROPERTY_ID = 'paradiselost';
const PLATFORM_ORIGIN = 'https://poor.camp';
const VERIFIER_COOKIE = '__Host-pc_sso_verifier';

export type Account = { state: 'signed-in'; userId: string } | { state: 'signed-out' } | { state: 'unavailable'; reason: string };

export interface KioskOffer {
  id: string;
  item: string;
  qty: number;
  price: number;
  label: string;
  group: string;
}

export interface KioskPurchase {
  id: number | string;
  offer: string;
  item: string;
  qty: number;
  price: number;
  requestKey: string;
}

export interface KioskState {
  balance: number;
  sales: { capPerDay: number; paidToday: number; remainingToday: number; prices: Record<string, number>; maxQuantity: number };
  offers: KioskOffer[];
  milestones: { id: string; award: number; label: string; claimed: boolean }[];
  purchases: KioskPurchase[];
}

/** A request the server answered with a refusal (as opposed to the network failing). */
export class Refused extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** Is the account service reachable from here at all? (Local dev servers have no proxy.) */
export function servicesHere(): boolean {
  return location.protocol === 'https:' && !['localhost', '127.0.0.1'].includes(location.hostname);
}

export async function account(): Promise<Account> {
  if (!servicesHere()) return { state: 'unavailable', reason: 'Rapture Credits work on paradiselost.poor.camp.' };
  try {
    const r = await fetch(`/api/sso/session?property=${PROPERTY_ID}`, { credentials: 'same-origin', headers: { accept: 'application/json' } });
    if (!r.ok) return { state: 'unavailable', reason: 'The Poor Camp account service is not answering.' };
    const body = (await r.json()) as { data?: { signedIn?: boolean; userId?: string } };
    return body.data?.signedIn && body.data.userId ? { state: 'signed-in', userId: body.data.userId } : { state: 'signed-out' };
  } catch {
    return { state: 'unavailable', reason: 'The Poor Camp account service is not answering.' };
  }
}

function base64Url(bytes: ArrayBuffer | Uint8Array): string {
  let text = '';
  new Uint8Array(bytes).forEach((b) => (text += String.fromCharCode(b)));
  return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Sign in with the Poor Camp account: the same handoff as poor.camp's account gate.
 * A one-time verifier stays in this host's cookie; poor.camp only sees its hash.
 */
export async function signIn(returnPath = '/'): Promise<void> {
  const verifier = base64Url(crypto.getRandomValues(new Uint8Array(32)));
  document.cookie = `${VERIFIER_COOKIE}=${verifier}; Path=/; Secure; SameSite=Lax; Max-Age=600`;
  const challenge = base64Url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  const q = new URLSearchParams({ property: PROPERTY_ID, challenge, return: returnPath });
  location.assign(`${PLATFORM_ORIGIN}/api/sso/authorize?${q.toString()}`);
}

/** Sign out of the game (poor.camp itself stays signed in). */
export async function signOut(): Promise<void> {
  await fetch('/api/sso/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => undefined);
}

async function kiosk<T>(body?: Record<string, unknown>): Promise<T> {
  const r = await fetch('/api/paradise-lost', {
    method: body ? 'POST' : 'GET',
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : { accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  let payload: { data?: T; error?: string } = {};
  try {
    payload = (await r.json()) as typeof payload;
  } catch {
    /* not JSON: treat as a network problem below */
  }
  if (!r.ok) {
    if (r.status >= 400 && r.status < 500 && payload.error) throw new Refused(payload.error, r.status);
    throw new Error(payload.error ?? `Kiosk unavailable (${r.status})`);
  }
  return payload.data as T;
}

export const kioskApi = {
  state: () => kiosk<KioskState>(),
  sell: (requestKey: string, item: string, qty: number) =>
    kiosk<{ acceptedQty: number; credits: number; remainingToday: number; balance: number; duplicate: boolean }>({ action: 'sell', requestKey, item, qty }),
  buy: (requestKey: string, offer: string) => kiosk<{ purchase: KioskPurchase; balance: number; duplicate: boolean }>({ action: 'buy', requestKey, offer }),
  claim: (milestone: string) => kiosk<{ awarded: number; alreadyClaimed: boolean; balance: number }>({ action: 'claim', milestone }),
};

/** A fresh request key (poor.camp accepts [A-Za-z0-9:_-]{12,120}). */
export function requestKey(): string {
  return `pl-${crypto.randomUUID()}`;
}
