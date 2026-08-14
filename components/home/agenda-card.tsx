"use client";

import { useState, useTransition } from "react";
import { Card, CardLabel } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toggleAgendaItem } from "@/lib/agenda/actions";
import type { AgendaItemView } from "@/lib/agenda/data";

export function AgendaCard({ items: initialItems }: { items: AgendaItemView[] }) {
  const [items, setItems] = useState(initialItems);
  const [, startTransition] = useTransition();

  function handleToggle(item: AgendaItemView) {
    if (item.locked) return;
    const nextDone = item.status !== "done";

    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: nextDone ? "done" : "pending" } : i)),
    );

    startTransition(() => {
      void toggleAgendaItem(item.id, nextDone);
    });
  }

  return (
    <div>
      <CardLabel className="mb-2 mt-0">Today</CardLabel>
      <Card className="flex flex-col">
        {items.length === 0 ? (
          <p className="text-sm text-ink-soft">Nothing on the agenda today.</p>
        ) : (
          items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleToggle(item)}
              disabled={item.locked}
              className={cn(
                "flex items-center gap-3 border-line py-2.5 text-left",
                index > 0 && "border-t",
                item.locked && "opacity-50",
              )}
            >
              <span
                className={cn(
                  "flex h-[21px] w-[21px] shrink-0 items-center justify-center rounded-full border text-[11px]",
                  item.status === "done"
                    ? "border-sage bg-sage text-white"
                    : "border-line text-ink-soft",
                )}
              >
                {item.status === "done" ? "✓" : ""}
              </span>
              <span className="flex-1">
                <span className="text-[13px] font-medium">
                  {item.title}
                  {item.isCarryover && (
                    <span className="ml-1.5 text-[11px] font-normal italic text-ink-soft">
                      carryover
                    </span>
                  )}
                </span>
                <span className="block text-[11px] text-ink-soft">
                  {item.subject ? `${item.subject} · ${item.subtitle ?? ""}` : item.subtitle}
                </span>
              </span>
              {!item.locked && <span className="text-ink-soft">›</span>}
            </button>
          ))
        )}
      </Card>
    </div>
  );
}
