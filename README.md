# Poor Camp: Paradise Lost

A cozy life sim set in the *Poor Camp* universe: arrive with almost nothing on the Hilo/Puna side of Hawaiʻi Island, build your own house piece by piece, grow food, and help an abandoned town rebuild.

Browser first (Netlify, paradiselost.poor.camp); iOS/iPadOS later.

- Design document: [docs/GDD.md](docs/GDD.md)
- Status: **Sprint 1** — the building foundation, on placeholder art.

## What works now

- Isometric lot with post-and-pier foundations, floors, walls, windows, doors, roofs and two furniture pieces
- Every rule lives in the simulation: support, materials, locked tiers, room detection, "shelter ready"
- Plain-language reasons when something can't be placed; a warning when a wall seals a room with no door
- Demolish refuses to pull out a wall that holds up a roof, and offers to remove the lot
- Undo/redo (100 steps), drag to paint floors and walls, rotate furniture
- Two art styles (Pixel and Storybook) switchable mid-build without touching the house
- Mouse, keyboard and two-step touch placement
- Saves on every change (IndexedDB, with a previous-save fallback and a close-the-tab safety copy)
- Time prototype: a garden plot grows weeds in real hours; a "While you were away" card on return

## Run it

Needs Node 22.

```
npm install
npm run dev        # local dev server
npm test           # unit tests
npm run build      # validate content, type-check, build to packages/client/dist
```

Netlify uses `netlify.toml` (build `npm run build`, publish `packages/client/dist`).

Developer URL flags: `?reset` starts a fresh lot; `?away=72` pretends you were gone 72 hours.

## Controls

| Action | Mouse / keyboard | Touch |
| --- | --- | --- |
| Pick a piece | Click it in the bar at the bottom | Tap it |
| Place | Click; drag to paint | Tap to aim, then ✓ Place |
| Rotate | R | ↻ button |
| Demolish | Delete, or the ⛏ tool | ⛏ tool |
| Undo / redo | Ctrl+Z / Ctrl+Y | Buttons at the top |
| Pan / zoom | Right-drag; mouse wheel | Drag; ＋/－ buttons |
| Back to looking | Esc | ✋ tool |

## Layout

| Package | Holds |
| --- | --- |
| `packages/sim` | All game rules. Pure TypeScript, deterministic, no rendering. Will also run on the multiplayer server. |
| `packages/content` | Piece definitions and the per-style art manifest, plus the validator that fails the build if any piece lacks art in either style. |
| `packages/client` | Phaser 4 renderer, placeholder art generators, HTML interface, local save store. |

Every player action is a serialisable command applied by `sim` (`apply(town, catalog, command)`), so undo, saves and future multiplayer all use the same path.
