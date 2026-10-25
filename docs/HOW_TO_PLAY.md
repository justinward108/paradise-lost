# How to play Paradise Lost

_Generated from `packages/content/src/help.ts`. Edit that file, then run `npm run help-doc`._

## Getting started

You arrive with a tarp, a few tools and an overgrown lot on the wet side of the island. Most of the neighbours have gone.

The Goals list at the top left suggests what to do next. None of it is required, and you can do things in any order.

- Clear some scrub from your lot
- Salvage boards and roofing from the wrecks south of your lot
- Build a shelter: foundation, floor, walls with a door, roof
- Cross the footbridge to the east and meet your neighbour
- Dig a garden bed and plant something
- Help repair the washed-out path to the road

This is an early test build. The art is placeholder, drawn by code, and things will change.

## Walking and using things

Click the ground to walk there. Click something to use it: your character walks over and does it.

The line above the bottom bar always says what a click will do, or why it can’t be done. A tick means you can; a cross means you can’t, with the reason.

- Scrub (green bushes on your lot): clear it for a rough board
- Wrecks and rock piles: salvage them for materials until nothing is left
- Auntie Rosa: talk to her
- The broken path: see what the repair needs
- Crops: harvest when ready, pull weeds, or water

On a keyboard, WASD or the arrow keys take one step, and E or Space uses whatever is in front of you.

Walls block you; doors let you through. To look around, right-drag with a mouse or drag on a touch screen; press ◎ to centre on yourself again.

## Building

Press B or tap the Build tab. Pick a piece in the bar at the bottom, then click to place it. Drag to place a row of floors or walls.

Pieces need something to stand on, in this order:

- Foundation on cleared ground on your lot
- Floor on a foundation
- Walls, windows and doors on the edges between tiles, next to a floor
- Roof over a room that walls close in on every side
- Furniture on a floor

The ghost piece turns green when it fits, amber when it fits but something is off (like a room with no door), and red when it doesn’t, with the reason in the status line.

A room counts as a shelter when it is closed in, has a door, and has a roof over every tile. The game tells you when you have one.

You can only build on your own lot. Building materials come from salvage; costs are shown under each piece.

Locked pieces (faded) need a higher building tier. Rosa can teach you the next one.

## Changing what you built

Undo and Redo (Ctrl+Z and Ctrl+Y, or the buttons at the top in Build mode) step back and forward through your building, up to 100 steps.

The Demolish tool removes a piece and gives its materials back. If a piece holds something up, like a wall under a roof, the game says what and offers to remove them all.

R rotates furniture that can face more than one way.

Roofs fade while you work inside a house. The Roofs button at the top hides them completely.

Undo only covers building. Gardening, salvage, gifts and project work can’t be undone.

## Garden

Pick Dig bed in the bottom bar and click cleared ground on your lot to make a garden bed.

Pick a seed in the bottom bar (they appear once you have some) and click an empty bed to plant it.

Crops grow one step for each in-game day they get water. It rains here most days, which counts. On dry days, pick Water and click the crop.

- Leafy greens: 2 watered days
- Sweet potato: 5 watered days
- Papaya: 8 watered days, then fruits again every 3

Weeds come up on beds after about a real day and take a share of the harvest until you pull them. Click a weedy bed to pull them.

Harvest by clicking a ripe crop. Food can be given to Rosa.

## Auntie Rosa

Your neighbour lives across the footbridge to the east. She keeps a routine: her garden in the morning, her porch around midday and in the evening, and indoors at night.

Once you have started on the path repair, you will find her there in the afternoons.

Talk to her once a day and give her food to become friends. She is fondest of papaya and sweet potato (marked ♥).

When you are friends enough, she will teach you to build with lumber and block, and give you some to start.

## Repairing the path

The path south of your lot to the road is blocked by a fallen tree and a washout. Fixing it opens the road and an old general store to salvage.

The repair has three stages. Each needs hours of work, and some need materials:

- Clear the fallen tree: work only
- Shore up the washout: work and 10 boards
- Lay stepping stones: work and 12 stone (from the lava rock east of the stream)

Click the broken path to open the project. “Work for an hour” adds an hour of your labour; the Give buttons hand over materials.

Once you have met Rosa and started the repair, she adds an hour of work every 10 real minutes, day or night, even while you are away. She can only work on a stage once its materials are there.

## Time, weather and being away

The clock at the top runs fast: an in-game day passes in about 48 real minutes. Night falls in the evening and lifts in the morning.

The world keeps going while you are away, but gently. Crops keep growing, weeds come up, and Rosa keeps working on the path. Nothing you own is lost, and nothing dies.

When you come back after a while, a card tells you what changed.

These speeds are a first guess and will be tuned after playtesting.

## Art styles

The Style button at the top switches between Pixel and Storybook. It only changes the look: your house, garden and progress stay exactly the same.

## Saving

The game saves itself after every change, in this browser on this device. There is no save button.

Clearing your browser’s site data, or playing in a private window, loses the save. Accounts and cloud saves come later.

If a save is ever damaged, the game falls back to the one before it and tells you.

## Controls

- Walk, talk, salvage, harvest: click (tap on touch screens)
- Step: WASD or arrow keys
- Use what’s in front of you: E or Space
- Switch between Live and Build: B, or the tabs above the bottom bar
- Place a piece: click, drag to place a row (touch: tap to aim, then ✓ Place)
- Rotate furniture: R
- Undo and redo building: Ctrl+Z and Ctrl+Y
- Demolish: Delete, or the ⛏ tool in Build mode
- Look around: right-drag with a mouse, or drag on a touch screen; zoom with the mouse wheel
- Centre on yourself: ◎
- Help: H or the ? button; close panels with Esc
