# Poor Camp: Paradise Lost

A cozy life sim set in the *Poor Camp* universe: arrive with almost nothing on the Hilo/Puna side of Hawaiʻi Island, build your own house piece by piece, grow food, and help an abandoned town rebuild.

Browser first (Netlify, paradiselost.poor.camp); iOS/iPadOS later.

- Design document: [docs/GDD.md](docs/GDD.md)
- How to play: [docs/HOW_TO_PLAY.md](docs/HOW_TO_PLAY.md) (the same text as the in-game Help, press H)
- Status: **Sprint 2.6** — the opening loop with Rapture Credits, on placeholder art.

## What works now

**Rapture Credits (Sprint 2.6)**
- A Ministry relief kiosk on the stream bank by the footbridge trades in Rapture Credits, the poor.camp portal currency
- Sign in with your Poor Camp account (poor.camp single sign-on); the game is fully playable without signing in
- Sell crops and salvage (capped per day by poor.camp), collect one-time relief awards, buy seeds (including long beans and banana), materials, lumber and block, and furniture kits (table, chair, solar lantern, rug)
- Trades survive a closed tab or a dropped connection, and are never paid or charged twice
- poor.camp holds every price, cap and balance (`/api/paradise-lost` in the poor.camp repository); this site proxies only that route and the sign-on endpoints (`packages/client/public/_redirects`)

**After the first playtest (Sprint 2.5)**
- No dead ends: chop albizia trees for boards (they grow back in a real day), brush grows back on the lot, loose lava rock refills, burnt trees and lot rubble can be cleared
- The town looks bombed and abandoned: craters, scorched ground, cracked road, burnt trees, a bombed-out house, wrecked cars, rubble on the lot; the ruins are salvage
- Roofs need only a wall beside them and reach two tiles past it (eaves and porches), so a part-built house can be roofed
- Crops get a coloured tag on a stake and their own shape; a blue drop means water today, a star means ready; pointing at a crop says how far along it is
- Dig bed on an existing bed fills it in (asks first if something is growing), so the ground can be built on
- Walls and roofs in front of the pointer or the player fade, so you can see and click behind buildings
- Working on the path with Auntie Rosa raises friendship once a day
- Saves from Sprint 2 carry over

**Living (Sprint 2)**
- A 34 × 34 map: your lot, a stream with a footbridge, Auntie Rosa's yard and house, a lava-rock field, and a washed-out path to the road
- Click to walk (pathfinding respects walls and doors), WASD/arrows to step, E to use what's in front of you
- Clear invasive scrub for rough boards; salvage a collapsed shed, a fallen carport, loose lava rock, and (once the path is open) an old store
- Garden: dig beds, plant greens, sweet potato or papaya, water on dry days; crops grow one step per watered in-game day, weeds grow in real hours and cut the harvest
- Auntie Rosa keeps a daily routine, gives you seeds when you meet, warms to daily chats and gifts, and teaches you tier-2 building once you're friends
- The path repair is a three-stage community project; Rosa keeps working on it while you're away
- Goals list, day/night clock and weather, "While you were away" summary
- Help screen (H or ? Help) that opens on the topic you're in, plus one-time tips the first time things come up
- Saves from Sprint 1 are migrated onto the new map
- Playtest notes (N or ✎ Note): each note is saved on the device with a snapshot of the game state, and can be copied or downloaded

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

Netlify uses `netlify.toml` (build `npm run build`, publish `packages/client/dist`). For a manual deploy, zip the contents of `packages/client/dist` and drop the zip on Netlify's Deploys page.

Help text lives in `packages/content/src/help.ts`; after editing it, run `npm run help-doc` (a test fails if the doc is out of date).

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
| Help | H or ? Help | ? Help |
| Playtest note | N or ✎ Note | ✎ Note |

## Layout

| Package | Holds |
| --- | --- |
| `packages/sim` | All game rules. Pure TypeScript, deterministic, no rendering. Will also run on the multiplayer server. |
| `packages/content` | Pieces, the starter map, crops, the neighbour, the path project, dialogue, and the per-style art manifest. Its validator fails the build if anything lacks art in either style or the map breaks (for example, a site you can't reach). |
| `packages/client` | Phaser 4 renderer, placeholder art generators, HTML interface, local save store. |

Every player action is a serialisable command applied by `sim` (`apply(town, catalog, command)`), so undo, saves and future multiplayer all use the same path.
