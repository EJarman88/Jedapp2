export interface Quote {
  text: string;
  attribution: string;
}

// A small curated starting set — Phase 4 owns expanding this into a real bank.
export const QUOTES: Quote[] = [
  {
    text: "If you can't fly then run, if you can't run then walk, if you can't walk then crawl, but whatever you do you have to keep moving forward.",
    attribution: "Martin Luther King Jr.",
  },
  {
    text: "It always seems impossible until it's done.",
    attribution: "Nelson Mandela",
  },
  {
    text: "The secret of getting ahead is getting started.",
    attribution: "Mark Twain",
  },
  {
    text: "You don't have to see the whole staircase, just take the first step.",
    attribution: "Martin Luther King Jr.",
  },
];

export function quoteForDate(date: Date): Quote {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const today = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const dayOfYear = Math.floor((today - start) / 86_400_000);
  return QUOTES[dayOfYear % QUOTES.length];
}
