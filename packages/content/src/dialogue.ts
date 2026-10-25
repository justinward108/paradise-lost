/**
 * What people say, and how events are described to the player.
 *
 * Placeholder writing for playtesting. The neighbour's voice, any local speech (including
 * Pidgin) and any Hawaiian words need review by the cultural consultant (GDD §4.4) before
 * release, so this draft keeps her speech plain and avoids Hawaiian vocabulary. It also
 * avoids naming why the town emptied out, pending the canon ruling (GDD §4.3, K1).
 */
import { hashString } from '@paradise-lost/sim';
import { ITEMS } from './world.ts';

const pick = (lines: string[], seed: string) => lines[hashString(seed) % lines.length]!;

export interface NpcLineContext {
  day: number;
  hour: number;
  rain: boolean;
  friendship: number;
  projectState: 'not_started' | 'active' | 'done';
  projectStage?: string;
}

export const ROSA = {
  firstMeet: [
    "Oh! You're the one who moved onto the old lot. I'm Rosa. Nobody's lived over there since everyone left.",
    'Here, take some seeds. Greens come up fast with all this rain, and sweet potato will feed you for weeks.',
    "One more thing: the path down to the road washed out in the last big storm, and a tree came down across it. I can't move it by myself. Clear the tree and I'll help with the rest.",
  ],
  lesson: [
    "You've been a good neighbour. Come here, I want to show you something.",
    "My husband left lumber and blocks in the shed. I'll never use them. Take them, and let me show you how to frame a proper wall.",
  ],
  greet(c: NpcLineContext): string {
    const seed = `rosa:${c.day}`;
    if (c.projectState === 'active' && c.hour >= 14 && c.hour < 18) {
      return pick(
        [
          `Back to it! We're on the ${c.projectStage?.toLowerCase() ?? 'next part'}.`,
          'My knees are complaining, but this path will get done.',
          "Every bit helps. I'll keep at it when you're not here.",
        ],
        seed,
      );
    }
    if (c.rain) {
      return pick(['Good rain today. Your garden will thank you.', 'Rain again. Good for the beans, bad for my laundry.', 'Wet one today. Come in under the eaves.'], seed);
    }
    if (c.friendship >= 30) {
      return pick(['There you are! I was hoping you would come by.', 'Sit for a minute. How is the house coming along?', "You look tired. Don't work too hard."], seed);
    }
    if (c.projectState === 'done') {
      return pick(['I walked all the way to the road yesterday. First time in months!', 'That path looks better than it ever did.'], seed);
    }
    return pick(['Morning! Or is it afternoon already?', 'How are you settling in?', 'The mangoes will be in soon. Well, someday.'], seed);
  },
  chatAgain: ["We already talked today, dear. Go on, you've got things to do!"],
  giftLiked: (item: string) => `${ITEMS[item]?.name ?? item}! My favourite. Thank you.`,
  gift: (item: string) => `Oh, ${(ITEMS[item]?.name ?? item).toLowerCase()}. That's kind of you.`,
};

export const PROJECT_TEXT: Record<string, { stageDone: string[]; done: string }> = {
  path_repair: {
    stageDone: [
      'The fallen tree is cleared. Now the washout needs shoring up with boards.',
      'The washout is shored up. Stepping stones next.',
      'The path is done!',
    ],
    done: 'The path to the road is open. Rosa is delighted, and there is an old general store down by the road worth a look.',
  },
};

/** Turn a gain event ("gain:boards:4") into "+4 Boards". */
export function describeGain(event: string): string | null {
  const [kind, item, n] = event.split(':');
  if (kind !== 'gain' || !item) return null;
  return `+${n} ${ITEMS[item]?.name ?? item}`;
}
