import {WorldConnection} from './net/world.ts';
import {account,signIn,servicesHere} from './net/poorcamp.ts';
/**
 * Entry point: load (or create) the town, start the renderer, mount the UI.
 */
import Phaser from 'phaser';
import { catalog, STARTER_INVENTORY, world, type Style } from '@paradise-lost/content';
import * as sim from '@paradise-lost/sim';
import { AMBIENT_DAY_MS, createTown, summariseAbsence, type Town } from '@paradise-lost/sim';
import { Controller } from './game/controller.ts';
import { KioskSession } from './game/kiosk.ts';
import { BuildScene } from './scene/BuildScene.ts';
import { IndexedDbKV, LocalTownStore, MemoryKV, type TownStore } from './store/townStore.ts';
import { mountUi, showAwayCard, showWelcome } from './ui/ui.ts';
import './style.css';

const TOWN_ID = 'home';
const HOUR = 3_600_000;
const TICK_MS = 20_000;

function readStyle(): Style {
  try {
    const s = localStorage.getItem('pl.style');
    if (s === 'pixel' || s === 'storybook') return s;
  } catch {
    /* ignore */
  }
  return 'storybook';
}

function openStore(): TownStore {
  const ctx = { world, catalog };
  try {
    let sync: Storage | null = null;
    try {
      sync = window.localStorage;
    } catch {
      /* no localStorage */
    }
    if (typeof indexedDB !== 'undefined') return new LocalTownStore(new IndexedDbKV(), sync, ctx);
  } catch {
    /* private mode etc. */
  }
  console.warn('IndexedDB unavailable; progress will not be saved.');
  return new LocalTownStore(new MemoryKV(), null, ctx);
}

function newTown(now: number): Town {
  // Start the town's first day at 8 in the morning rather than midnight.
  const epoch = now - (8 / 24) * AMBIENT_DAY_MS;
  const created = createTown({ townId: TOWN_ID, seed: `${TOWN_ID}-${now.toString(36)}`, nowMs: epoch, inventory: { ...STARTER_INVENTORY }, world, catalog });
  sim.apply(created, catalog, { type: 'expandPrivatePlot', id: 'initial-private-plot', nowMs: now }, world);
  return created;
}

/** Developer aid: pretend the player was away for `ms` (moves every timestamp back). */
function shiftBack(town: Town, ms: number) {
  town.clock.epochMs -= ms;
  for (const s of Object.values(town.soil)) {
    s.tilledMs -= ms;
    s.lastWeededMs -= ms;
  }
  for (const k of Object.keys(town.felled)) town.felled[k]! -= ms;
  if (town.growMs != null) town.growMs -= ms;
  for (const s of Object.values(town.sites)) if (s.refillMs != null) s.refillMs -= ms;
  for (const p of Object.values(town.projects)) {
    if (p.startedMs != null) p.startedMs -= ms;
    if (p.completedMs != null) p.completedMs -= ms;
    for (const st of p.stages) {
      for (const k of ['startedMs', 'materialsMetMs', 'completedMs'] as const) if (st[k] != null) st[k] = st[k]! - ms;
    }
  }
}

async function boot() {
  const root = document.getElementById('app')!;
  const now = Date.now();
  const online = servicesHere() ? new WorldConnection() : null;
  let serverSnapshot: Awaited<ReturnType<WorldConnection['load']>> | null = null;
  if(online){
    root.textContent='Connecting to the shared world…';
    try{
      const user=await account();
      if(user.state!=='signed-in'){
        root.textContent='Sign in to enter the shared Paradise Lost world. Existing browser progress is preserved.';
        const login=document.createElement('button');login.textContent='Sign in with poor.camp';login.onclick=()=>void signIn('/');root.append(login);return;
      }
      serverSnapshot=await online.load();
      if(!serverSnapshot.exists)serverSnapshot=await online.create();
      if(!serverSnapshot.state||serverSnapshot.revision===undefined)throw new Error('Invalid world state');
    }catch{
      root.textContent='The world server is unavailable. Your world has not been replaced by a local save.';
      const retry=document.createElement('button');retry.textContent='Reconnect';retry.onclick=()=>location.reload();root.append(retry);return;
    }
    root.replaceChildren();
  }
  const store = openStore();
  void navigator.storage?.persist?.();

  const params = new URLSearchParams(location.search);
  let fresh = false;
  if (!online && params.has('reset')) {
    await store.save(newTown(now));
    fresh = true;
    history.replaceState(null, '', location.pathname);
  }

  let loaded: Awaited<ReturnType<TownStore['load']>> = null;
  try {
    if(!online)loaded = await store.load(TOWN_ID);
  } catch (err) {
    console.warn('Could not read the save:', err);
  }
  const town = serverSnapshot?.state ?? loaded?.town ?? newTown(now);
  if (!loaded && !online) {
    fresh = true;
    await store.save(town);
  }

  let lastSeen = Number((await store.getMeta('lastSeen')) ?? now);
  const away = Number(params.get('away'));
  if (!online && away > 0) {
    shiftBack(town, away * HOUR);
    lastSeen = now - away * HOUR;
  }

  const ctrl = new Controller(town, catalog, world, store, readStyle());
  if(online)await ctrl.connectOnline(online,serverSnapshot!.revision!);
  const kiosk = new KioskSession(ctrl);
  ctrl.kiosk = kiosk;
  if (loaded?.recovered) ctrl.setStatus('Your last save was damaged, so the one before it was restored.', 'warn');

  // Summarise before settling time, so the card can say what happened.
  const summary = summariseAbsence(town, ctrl.world, lastSeen, now);

  const scene = new BuildScene();
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#93b273',
    scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
    antialias: true,
    scene: [],
    banner: false,
  });
  game.scene.add('build', scene, true, { ctrl });

  const tips = mountUi(root, ctrl, { zoom: (f) => scene.zoomBy(f), setRoofs: (s) => scene.setRoofs(s), follow: () => scene.follow() });
  ctrl.tick();
  setInterval(() => ctrl.tick(), TICK_MS);
  if(online)setInterval(()=>void ctrl.refreshCenter(),10000);
  if(online)setInterval(()=>{void online.social('heartbeat').catch(()=>undefined);},30000);

  if (fresh) showWelcome(root, () => undefined);
  else if (summary.lines.length > 0) {
    showAwayCard(root, summary.lines, summary.awayHours);
    tips.trigger('away');
  }

  // Rapture Credits: check the Poor Camp account, finish any half-done trades, and pay
  // milestones as they are reached (poor.camp pays each once per account).
  if(!online)void kiosk.start();
  let milestoneTimer: ReturnType<typeof setTimeout> | null = null;
  ctrl.on((what) => {
    if (what !== 'town' || !kiosk.signedIn || milestoneTimer) return;
    milestoneTimer = setTimeout(() => {
      milestoneTimer = null;
      void kiosk.claimMilestones();
    }, 1500);
  });

  const markSeen = () => void store.setMeta('lastSeen', String(Date.now()));
  markSeen();
  setInterval(markSeen, 30_000);
  document.addEventListener('visibilitychange', () => {
    markSeen();
    if (document.visibilityState === 'hidden') store.flushSync();
    else if (kiosk.signedIn) void kiosk.sync();
  });
  window.addEventListener('pagehide', () => store.flushSync());

  // Exposed for automated checks and debugging.
  (window as unknown as { paradise: unknown }).paradise = { ctrl, scene, store, sim };
}

void boot();
