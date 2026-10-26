/**
 * Help text: the in-game Help screen, the first-time tips, and docs/HOW_TO_PLAY.md are
 * all built from this file, so they can't drift apart.
 *
 * Keep it true to the game as it is. When a rule changes, change it here.
 */

export interface HelpSection {
  id: string;
  title: string;
  /** Paragraphs. A line starting with "- " is a bullet. */
  body: string[];
}

export const HELP_SECTIONS: readonly HelpSection[] = [
  {
    id: 'start',
    title: 'Getting started',
    body: [
      'You arrive with a tarp, a few tools and an overgrown lot on the wet side of the island. The town was bombed and left behind: craters, burnt trees, wrecked houses. Most of the neighbours have gone.',
      'The Goals list at the top left suggests what to do next. None of it is required, and you can do things in any order.',
      '- Clear some scrub and rubble from your lot',
      '- Salvage boards and roofing from the wrecks south of your lot, and chop trees for more boards',
      '- Build a shelter: foundation, floor, walls with a door, roof',
      '- Cross the footbridge to the east and meet your neighbour',
      '- Dig a garden bed and plant something',
      '- Help repair the washed-out path to the road',
      'This is an early test build. The art is placeholder, drawn by code, and things will change.',
    ],
  },
  {
    id: 'moving',
    title: 'Walking and using things',
    body: [
      'Click the ground to walk there. Click something to use it: your character walks over and does it.',
      'The line above the bottom bar always says what a click will do, or why it can’t be done. A tick means you can; a cross means you can’t, with the reason.',
      '- Scrub (green bushes on your lot): clear it for a board',
      '- Rubble (broken block and charred wood on your lot): clear it for stone and a board',
      '- Trees: chop albizia (an invasive tree that grows back) and burnt trees for boards',
      '- Wrecks, ruins and rock piles: salvage them for materials',
      '- Auntie Rosa: talk to her',
      '- The broken path: see what the repair needs',
      '- Crops: harvest when ready, pull weeds, or water',
      'On a keyboard, WASD or the arrow keys take one step, and E or Space uses whatever is in front of you.',
      'Walls block you; doors let you through. To look around, right-drag with a mouse or drag on a touch screen; press ◎ to centre on yourself again.',
    ],
  },
  {
    id: 'materials',
    title: 'Getting materials',
    body: [
      'There is always somewhere to get more. Point at anything to see what it gives.',
      '- Boards: chop trees (3 from an albizia, which grows back in a real day; 2 from a burnt tree, which is gone for good), clear brush (1, and it keeps growing back on your lot), clear rubble, salvage wrecks and ruins',
      '- Roofing: the fallen carport, the bombed-out house and the burnt-out car east of the stream, and more past the path once it is fixed',
      '- Stone: the loose lava rock east of the stream (more turns up every couple of hours), rubble on your lot, the burnt-out car',
      '- Lumber and block: Rosa gives you some when she teaches you to build with them; the relief kiosk sells them for Rapture Credits',
      '- Anything above can also be bought at the relief kiosk, and goods sold there for Rapture Credits',
      'Wrecks and ruins run out; trees, brush and rock come back.',
    ],
  },
  {
    id: 'kiosk',
    title: 'Relief kiosk and Rapture Credits',
    body: [
      'A Ministry relief kiosk still runs on the stream bank by the footbridge, north of the path to Rosa’s. It trades in Rapture Credits, the currency used across poor.camp.',
      'To use it, sign in with your Poor Camp account: the same account as poor.camp, so your credits are the same ones you see in the Treasury, the Gaming Hall and the Testament Drawing. Signing in takes you to poor.camp and straight back; your town is saved first. Everything else in the game works without an account.',
      '- Sell crops, boards, stone and roofing for credits. The kiosk pays fixed prices, up to a daily limit; after that it pays again the next day.',
      '- Buy seeds (including long beans and banana, which only the kiosk has), building materials, lumber and block, and furniture kits.',
      '- Relief awards: one-time payments when you meet Rosa, harvest, build a shelter, finish each stage of the path, and learn tier-2 building. They are paid automatically, once per account.',
      'If the connection drops mid-trade, nothing is lost: sold goods are held and bought goods are delivered when the kiosk next answers, and you are never charged twice.',
      'Rapture Credits are fictional site currency. They cannot be bought, sold or exchanged for anything of real-world value.',
    ],
  },
  {
    id: 'building',
    title: 'Building',
    body: [
      'Press B or tap the Build tab. Pick a piece in the bar at the bottom, then click to place it. Drag to place a row of floors or walls.',
      'Pieces need something to stand on, in this order:',
      '- Foundation on cleared ground on your lot',
      '- Floor on a foundation',
      '- Walls, windows and doors on the edges between tiles, next to a floor',
      '- Roof on a tile with a wall along one of its edges, or next to another roof (a roof reaches up to 2 tiles past a wall, for eaves and porches)',
      '- Furniture on a floor',
      'The ghost piece turns green when it fits, amber when it fits but something is off (like a room with no door), and red when it doesn’t, with the reason in the status line.',
      'A room counts as a shelter when it is closed in, has a door, and has a roof over every tile. The game tells you when you have one.',
      'You can only build on your own lot. Costs are shown under each piece; see Getting materials for where they come from.',
      'A garden bed is in the way of building: fill it in first (Live tab, Dig bed, click the bed).',
      'If a wall or roof hides something, point at it: walls in front of the pointer and in front of you fade so you can see and click behind them.',
      'Locked pieces (faded) need a higher building tier. Rosa can teach you the next one.',
    ],
  },
  {
    id: 'changing',
    title: 'Changing what you built',
    body: [
      'Undo and Redo (Ctrl+Z and Ctrl+Y, or the buttons at the top in Build mode) step back and forward through your building, up to 100 steps.',
      'The Demolish tool removes a piece and gives its materials back. If a piece holds something up, like a wall under a roof, the game says what and offers to remove them all.',
      'R rotates furniture that can face more than one way.',
      'Roofs fade while you work inside a house. The Roofs button at the top hides them completely.',
      'Undo only covers building. Gardening, salvage, gifts and project work can’t be undone.',
    ],
  },
  {
    id: 'garden',
    title: 'Garden',
    body: [
      'Pick Dig bed in the bottom bar and click cleared ground on your lot to make a garden bed. Dig bed on an existing bed fills it in again (if something is growing, it asks first, and the crop is lost).',
      'Pick a seed in the bottom bar (they appear once you have some) and click an empty bed to plant it.',
      'Crops grow one step for each in-game day they get water. It rains here most days, which counts. On dry days, pick Water and click the crop.',
      '- Leafy greens: 2 watered days',
      '- Sweet potato: 5 watered days',
      '- Papaya: 8 watered days, then fruits again every 3',
      '- Long beans (relief kiosk only): 3 watered days, then again every 2',
      '- Banana (relief kiosk only): 10 watered days, then again every 5',
      'Every planted bed has a stake with a coloured tag: green for greens, purple for sweet potato, orange for papaya, teal for long beans, yellow for banana. Each crop also has its own shape as it grows: greens are a round clump, sweet potato spreads out on purple stems, papaya grows a trunk, long beans climb two poles, banana grows big paddle leaves.',
      'A blue drop over a crop means it needs water today. A yellow star means it is ready to harvest. Point at a crop to see how many days it has grown.',
      'Weeds come up on beds after about a real day and take a share of the harvest until you pull them. Click a weedy bed to pull them.',
      'Harvest by clicking a ripe crop. Food can be given to Rosa.',
    ],
  },
  {
    id: 'rosa',
    title: 'Auntie Rosa',
    body: [
      'Your neighbour lives across the footbridge to the east. She keeps a routine: her garden in the morning, her porch around midday and in the evening, and indoors at night.',
      'Once you have started on the path repair, you will find her there in the afternoons.',
      'Talk to her once a day, work on the path with her, and give her food to become friends. She is fondest of papaya and sweet potato (marked ♥).',
      'When you are friends enough, she will teach you to build with lumber and block, and give you some to start.',
    ],
  },
  {
    id: 'projects',
    title: 'Repairing the path',
    body: [
      'The path south of your lot to the road is blocked by a fallen tree and a washout. Fixing it opens the road and an old general store to salvage.',
      'The repair has three stages. Each needs hours of work, and some need materials:',
      '- Clear the fallen tree: work only',
      '- Shore up the washout: work and 10 boards',
      '- Lay stepping stones: work and 12 stone (from the lava rock east of the stream)',
      'Click the broken path to open the project. “Work for an hour” adds an hour of your labour; the Give buttons hand over materials.',
      'Once you have met Rosa and started the repair, she adds an hour of work every 10 real minutes, day or night, even while you are away. She can only work on a stage once its materials are there.',
    ],
  },
  {
    id: 'time',
    title: 'Time, weather and being away',
    body: [
      'The clock at the top runs fast: an in-game day passes in about 48 real minutes. Night falls in the evening and lifts in the morning.',
      'The world keeps going while you are away, but gently. Crops keep growing, weeds come up, and Rosa keeps working on the path. Chopped trees grow back, brush springs up again on your lot, and more loose rock turns up. Nothing you own is lost, and nothing dies.',
      'When you come back after a while, a card tells you what changed.',
      'These speeds are a first guess and will be tuned after playtesting.',
    ],
  },
  {
    id: 'styles',
    title: 'Art styles',
    body: [
      'The Style button at the top switches between Pixel and Storybook. It only changes the look: your house, garden and progress stay exactly the same.',
    ],
  },
  {
    id: 'saving',
    title: 'Saving',
    body: [
      'The game saves itself after every change, in this browser on this device. There is no save button.',
      'Clearing your browser’s site data, or playing in a private window, loses the save. Accounts and cloud saves come later.',
      'If a save is ever damaged, the game falls back to the one before it and tells you.',
    ],
  },
  {
    id: 'controls',
    title: 'Controls',
    body: [
      '- Walk, talk, salvage, harvest: click (tap on touch screens)',
      '- Step: WASD or arrow keys',
      '- Use what’s in front of you: E or Space',
      '- Switch between Live and Build: B, or the tabs above the bottom bar',
      '- Place a piece: click, drag to place a row (touch: tap to aim, then ✓ Place)',
      '- Rotate furniture: R',
      '- Undo and redo building: Ctrl+Z and Ctrl+Y',
      '- Demolish: Delete, or the ⛏ tool in Build mode',
      '- Look around: right-drag with a mouse, or drag on a touch screen; zoom with the mouse wheel',
      '- Centre on yourself: ◎',
      '- Help: H or the ? button; close panels with Esc',
      '- Playtest note: N or ✎ Note. Your note is saved with what you were doing; Copy all notes puts them on the clipboard to send on.',
    ],
  },
];

export interface Tip {
  title: string;
  text: string;
  /** Help section that explains more. */
  section: string;
}

/** One-time contextual tips, shown the first time each situation comes up. */
export const TIPS: Readonly<Record<string, Tip>> = {
  firstSteps: {
    title: 'Getting around',
    text: 'Click the ground to walk and click things to use them. The line above the bottom bar always says what a click will do.',
    section: 'moving',
  },
  firstSalvage: {
    title: 'Materials',
    text: 'Salvage wrecks a few times each to collect boards and roofing. Your stock is shown at the top.',
    section: 'materials',
  },
  kiosk: {
    title: 'Rapture Credits',
    text: 'The kiosk trades through your Poor Camp account (the one you use on poor.camp). Sign in here to sell goods, buy seeds and materials, and collect relief awards.',
    section: 'kiosk',
  },
  needMaterials: {
    title: 'Need more?',
    text: 'Chop trees for boards (they grow back), clear brush and rubble, and salvage the ruins east of the stream. Loose rock keeps turning up.',
    section: 'materials',
  },
  buildMode: {
    title: 'Build mode',
    text: 'Build in this order: foundation, floor, walls with a door, then a roof. Building works anywhere on your lot, without walking there.',
    section: 'building',
  },
  rejected: {
    title: 'Red means no, with a reason',
    text: 'When something can’t be done, the status line says why. Fix that and try again.',
    section: 'building',
  },
  locked: {
    title: 'Locked pieces',
    text: 'Faded pieces need a higher building tier. Make friends with Rosa across the stream and she will teach you.',
    section: 'rosa',
  },
  demolish: {
    title: 'Demolish',
    text: 'Removing a piece gives its materials back. If it holds something up, you will be asked before the rest comes down too.',
    section: 'changing',
  },
  shelter: {
    title: 'You have a shelter',
    text: 'A closed room with a door and a roof keeps the rain off. Next, try a garden or go and meet your neighbour.',
    section: 'start',
  },
  garden: {
    title: 'Gardening',
    text: 'Dig beds on cleared ground, then plant seeds. Each planted bed gets a coloured tag. A blue drop means water it today; a star means it is ready.',
    section: 'garden',
  },
  metRosa: {
    title: 'Auntie Rosa',
    text: 'Chat once a day and bring her food. Once you start on the path, she will help with it, even while you are away.',
    section: 'rosa',
  },
  project: {
    title: 'Community project',
    text: 'Each stage needs hours of work and sometimes materials. Rosa only works on a stage once its materials are there.',
    section: 'projects',
  },
  night: {
    title: 'Night',
    text: 'An in-game day lasts about 48 real minutes. Rosa goes in for the night; you can keep working.',
    section: 'time',
  },
  away: {
    title: 'The world kept going',
    text: 'While you are away, crops grow, weeds come up and Rosa keeps working. Nothing you own is lost.',
    section: 'time',
  },
};

/** The help sections as a Markdown document (docs/HOW_TO_PLAY.md). */
export function helpMarkdown(): string {
  const out = ['# How to play Paradise Lost', '', '_Generated from `packages/content/src/help.ts`. Edit that file, then run `npm run help-doc`._', ''];
  for (const s of HELP_SECTIONS) {
    out.push(`## ${s.title}`, '');
    let inList = false;
    for (const line of s.body) {
      const bullet = line.startsWith('- ');
      if (inList && !bullet) out.push('');
      out.push(line);
      if (!bullet) out.push('');
      inList = bullet;
    }
    if (inList) out.push('');
  }
  return out.join('\n');
}
