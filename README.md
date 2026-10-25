# Poor Camp: Paradise Lost

A cozy life sim set in the *Poor Camp* universe: arrive with almost nothing on the Hilo/Puna side of Hawaiʻi Island, build your own house piece by piece, grow food, and help an abandoned town rebuild.

Browser first (Netlify, paradiselost.poor.camp); iOS/iPadOS later.

- Design document: [docs/GDD.md](docs/GDD.md)
- Status: **Sprint 2** — the opening loop, on placeholder art.

## What works now

**Living (Sprint 2)**
- A 34 × 34 map: your lot, a stream with a footbridge, Auntie Rosa's yard and house, a lava-rock field, and a washed-out path to the road
- Click to walk (pathfinding respects walls and doors), WASD/arrows to step, E to use what's in front of you
- Clear invasive scrub for rough boards; salvage a collapsed shed, a fallen carport, loose lava rock, and (once the path is open) an old store
- Garden: dig beds, plant greens, sweet potato or papaya, water on dry days; crops grow one step per watered in-game day, weeds grow in real hours and cut the harvest
- Auntie Rosa keeps a daily routine, gives you seeds when you meet, warms to daily chats and gifts, and teaches you tier-2 building once you're friends
- The path repair is a three-stage community project; Rosa keeps working on it while you're away
- Goals list, day/night clock and weather, "While you were away" summary
- Saves from Sprint 1 are migrated onto the new map

**Building (Sprint 1)**
- Post-and-pier foundations, floors, walls, windows, doors, roofs and furniture, only on your lot
- Every rule lives in the simulation, with plain-language reasons when something can't be placed
- Undo/redo, drag to paint, rotate; demolish asks before pulling out what holds up a roof
- Two art styles (Pixel and Storybook) switchable any time
- Mouse, keyboard and touch (two-step placement in build mode)
- Saves on every change, with a previous-save fallback and a close-the-tab safety copy

## Run it

Needs Node 22.

```
npm install
npm run dev        # local dev server
npm test           # unit tests
npm run build      # validate content, type-check, build to packages/client/dist
```

Netlify uses `netlify.toml` (build `npm run build`, publish `packages/client/dist`).

Developer URL flags: `?reset` starts a fresh game; `?away=72` pretends you were gone 72 hours (handy for watching crops grow and Rosa's work on the path).

## Controls

| Action | Mouse / keyboard | Touch |
| --- | --- | --- |
| Walk, talk, salvage, harvest | Click | Tap |
| Step | WASD or arrow keys | — |
| Use what's in front of you | E or Space | — |
| Dig, plant, water | Pick the tool in the bottom bar, then click | Same, tap |
| Build mode | B, or the Build tab | Build tab |
| Place a piece | Click; drag to paint | Tap to aim, then ✓ Place |
| Rotate | R | ↻ button |
| Undo / redo (building) | Ctrl+Z / Ctrl+Y | Buttons at the top |
| Pan / zoom | Right-drag; mouse wheel | Drag |
| Centre on me | ◎ button | ◎ button |
| Close a panel / back | Esc | ✕ |

## Layout

| Package | Holds |
| --- | --- |
| `packages/sim` | All game rules. Pure TypeScript, deterministic, no rendering. Will also run on the multiplayer server. |
| `packages/content` | Pieces, the starter map, crops, the neighbour, the path project, dialogue, and the per-style art manifest. Its validator fails the build if anything lacks art in either style or the map breaks (for example, a site you can't reach). |
| `packages/client` | Phaser 4 renderer, placeholder art generators, HTML interface, local save store. |

Every player action is a serialisable command applied by `sim` (`apply(town, catalog, command)`), so undo, saves and future multiplayer all use the same path.
