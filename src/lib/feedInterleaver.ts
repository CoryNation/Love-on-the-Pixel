import { type Affirmation } from '@/lib/bidirectional-connections';

export type { Affirmation };
export type Story = { id: string; snippet: string; };
export type DateRecap = { id: string; recap: string; supporterName?: string; title?: string; };

export type InterleavedItem = 
  | { kind: 'affirmation'; data: Affirmation }
  | { kind: 'story'; data: Story }
  | { kind: 'date'; data: DateRecap };

export function interleaveCards(
  affirmations: Affirmation[],
  extras: Array<{ kind: 'story'; data: Story } | { kind: 'date'; data: DateRecap }>,
  interval = 10
): InterleavedItem[] {
  const out: InterleavedItem[] = [];
  let extraIdx = 0;

  affirmations.forEach((a, i) => {
    out.push({ kind: 'affirmation', data: a });
    if ((i + 1) % interval === 0 && extraIdx < extras.length) {
      out.push(extras[extraIdx++]);
    }
  });
  return out;
}

// Sample data for development
export const sampleStories: Story[] = [
  { id: 'story-1', snippet: "It started with a simple idea: send each other love, daily." },
  { id: 'story-2', snippet: "Pixels became our little love notes." },
  { id: 'story-3', snippet: "Your support turns screens into real memories." }
];

export const sampleDateRecaps: DateRecap[] = [
  { 
    id: 'date-1', 
    recap: "You treated us to a slow coffee and a long laugh. Thank you.",
    supporterName: "Sarah",
    title: "Coffee Date"
  },
  { 
    id: 'date-2', 
    recap: "Your gift became dinner and a walk at sunset.",
    supporterName: "Mike",
    title: "Sunset Dinner"
  },
  { 
    id: 'date-3', 
    recap: "We pressed pause and chose each other — thanks to you.",
    supporterName: "Alex",
    title: "Quiet Moment"
  }
];
