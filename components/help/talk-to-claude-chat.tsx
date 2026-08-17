"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sendTalkToClaudeMessage } from "@/lib/help/actions";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function TalkToClaudeChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const reply = await sendTalkToClaudeMessage(next);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col gap-3">
      <div className="flex items-center gap-3">
        <Link
          href="/ask"
          aria-label="Back"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-card text-[15px]"
        >
          ←
        </Link>
        <div>
          <h1 className="font-serif text-lg font-medium">Talk to Claude</h1>
          <p className="text-xs text-ink-soft">A separate conversation, outside EdApp.</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm text-ink-soft">Ask anything — this isn&rsquo;t tracked or logged.</p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
              m.role === "user"
                ? "self-end bg-terracotta text-white"
                : "self-start border border-line bg-card",
            )}
          >
            {m.content}
          </div>
        ))}
        {sending && <p className="text-xs text-ink-soft">Thinking…</p>}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask anything…"
          className="flex-1 rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm"
        />
        <Button disabled={sending || input.trim().length === 0} onClick={handleSend}>
          Send
        </Button>
      </div>
    </main>
  );
}
