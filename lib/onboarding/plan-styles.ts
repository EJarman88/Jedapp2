import type { PlanStyle } from "@/lib/supabase/database.types";

export const PLAN_STYLES: { id: PlanStyle; title: string; description: string }[] = [
  {
    id: "fixed",
    title: "Fixed order",
    description: "Items shown in a set order — complete each one before moving to the next.",
  },
  {
    id: "flexible",
    title: "Flexible",
    description: "Same items, any order — pick whatever you feel like tackling first.",
  },
  {
    id: "suggested",
    title: "Suggested order",
    description: "A suggested order, but nothing is locked — skip around anytime.",
  },
];
