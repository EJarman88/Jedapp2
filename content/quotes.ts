import quotesData from "./quotes.json";

export type QuoteCategory = "resilience" | "general";

export interface Quote {
  text: string;
  attribution: string;
  category: QuoteCategory;
}

// Static, curated, sponsor-supplied bank — loaded from the JSON seed file below, never
// AI-generated at runtime. Rotate contextually per CLAUDE.md: 'resilience' before
// heavy-lift tasks (extended response, full practice sets), 'general' elsewhere.
export const QUOTES: Quote[] = quotesData as Quote[];

/** Deterministic per-day pick within a category, so everyone sees the same quote on a given day. */
export function quoteForDate(date: Date, category: QuoteCategory = "general"): Quote {
  const pool = QUOTES.filter((q) => q.category === category);
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const today = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const dayOfYear = Math.floor((today - start) / 86_400_000);
  return pool[dayOfYear % pool.length];
}
