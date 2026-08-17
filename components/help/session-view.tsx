"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardLabel } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { HelpSessionView } from "@/lib/help/types";
import { completeHelpSession } from "@/lib/help/actions";
import { ChatThread } from "./chat-thread";

export function SessionView({ session }: { session: HelpSessionView }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(
    session.problems.length === 1 ? session.problems[0].id : null,
  );

  const selected = session.problems.find((p) => p.id === selectedId);

  if (selected) {
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col">
        <ChatThread
          subject={session.subject}
          problem={selected}
          initialMessages={selected.messages}
          onBack={() => setSelectedId(null)}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col gap-4 pb-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-terracotta">{session.subject}</p>
        <h1 className="mt-1 font-serif text-xl font-medium">Your Problems</h1>
      </div>

      <div>
        <CardLabel className="mt-0">Tap a problem to work through it</CardLabel>
        <div className="flex flex-col gap-2.5">
          {session.problems.map((p) => (
            <button key={p.id} type="button" onClick={() => setSelectedId(p.id)} className="text-left">
              <Card className="flex items-center justify-between gap-3">
                <p className="flex-1 truncate text-[13px]">{p.extractedText}</p>
                {p.solved && <Badge variant="sage">Solved</Badge>}
              </Card>
            </button>
          ))}
        </div>
      </div>

      <Button
        variant="secondary"
        className="w-full"
        onClick={() => {
          void completeHelpSession(session.id);
          router.push("/home");
        }}
      >
        Done for now
      </Button>
    </main>
  );
}
