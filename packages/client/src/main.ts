/**
 * Entry point: load (or create) the town, start the renderer, mount the UI.
 */
import Phaser from 'phaser';
import { catalog, LOT, STARTER_INVENTORY, type Style } from '@paradise-lost/content';
import { createTown, summariseAbsence, type Town } from '@paradise-lost/sim';
import { Controller } from './game/controller.ts';
import { BuildScene } from './scene/BuildScene.ts';
import { IndexedDbKV, LocalTownStore, MemoryKV, type TownStore } from './store/townStore.ts';
import { mountUi, showAwayCard } from './ui/ui.ts';
import './style.css';

const TOWN_ID = 'home';
const HOUR = 3_600_000;

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
  try {
    let sync: Storage | null = null;
    try {
      sync = window.localStorage;
    } catch {
      /* no localStorage */
    }
    if (typeof indexedDB !== 'undefined') return new LocalTownStore(new IndexedDbKV(), sync);
  } catch {
    /* private mode etc. */
  }
  console.warn('IndexedDB unavailable; progress will not be saved.');
  return new LocalTownStore(new MemoryKV(), null);
}

function newTown(now: number): Town {
  return createTown({
    townId: TOWN_ID,
    seed: `${TOWN_ID}-${now.toString(36)}`,
    width: LOT.width,
    height: LOT.height,
    nowMs: now,
    inventory: { ...STARTER_INVENTORY },
    plots: [{ id: 'plot1', x: LOT.width - 3, y: LOT.height - 3 }],
  });
}

async function boot() {
  const root = document.getElementById('app')!;
  const now = Date.now();
  const store = openStore();
  void navigator.storage?.persist?.();

  const params = new URLSearchParams(location.search);
  if (params.has('reset')) {
    await store.save(newTown(now));
    history.replaceState(null, '', location.pathname);
  }

  let loaded: Awaited<ReturnType<TownStore['load']>> = null;
  try {
    loaded = await store.load(TOWN_ID);
  } catch (err) {
    console.warn('Could not read the save:', err);
  }
  const town = loaded?.town ?? newTown(now);
  if (!loaded) await store.save(town);

  // Developer aid for the time prototype: ?away=72 pretends you were gone 72 hours.
  let lastSeen = Number((await store.getMeta('lastSeen')) ?? now);
  const away = Number(params.get('away'));
  if (away > 0) {
    const shift = away * HOUR;
    town.clock.epochMs -= shift;
    for (const p of Object.values(town.plots)) p.lastTendedMs -= shift;
    lastSeen = now - shift;
  }

  const ctrl = new Controller(town, catalog, store, readStyle());
  if (loaded?.recovered) ctrl.setStatus('Your last save was damaged, so the one before it was restored.', 'warn');

  const scene = new BuildScene();
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#a9c48b',
    scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
    antialias: true,
    scene: [],
    banner: false,
  });
  game.scene.add('build', scene, true, { ctrl });

  mountUi(root, ctrl, { zoom: (f) => scene.zoomBy(f), setRoofs: (s) => scene.setRoofs(s) });

  const summary = summariseAbsence(town, lastSeen, now);
  if (summary.lines.length > 0) showAwayCard(root, summary.lines, summary.awayHours);

  const markSeen = () => void store.setMeta('lastSeen', String(Date.now()));
  markSeen();
  setInterval(markSeen, 30_000);
  document.addEventListener('visibilitychange', () => {
    markSeen();
    if (document.visibilityState === 'hidden') store.flushSync();
  });
  window.addEventListener('pagehide', () => store.flushSync());

  // Exposed for automated checks and debugging.
  (window as unknown as { paradise: unknown }).paradise = { ctrl, scene, store };
}

void boot();
