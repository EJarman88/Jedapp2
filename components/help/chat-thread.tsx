"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HelpProblemView } from "@/lib/help/types";
import type { HelpMessageView } from "@/lib/help/types";
import { markProblemSolved, sendHelpMessage, transcribeCanvas } from "@/lib/help/actions";
import { CanvasScratchpad } from "./canvas-scratchpad";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function ChatThread({
  subject,
  problem,
  initialMessages,
  onBack,
}: {
  subject: string;
  problem: HelpProblemView;
  initialMessages: HelpMessageView[];
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages.map((m) => ({ role: m.role, content: m.content })),
  );
  const [input, setInput] = useState("");
  const [wasPasted, setWasPasted] = useState(false);
  const [sending, setSending] = useState(false);
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [checkingWork, setCheckingWork] = useState(false);
  const [solved, setSolved] = useState(problem.solved);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    const pasted = wasPasted;
    setInput("");
    setWasPasted(false);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setSending(true);
    try {
      const reply = await sendHelpMessage(problem.id, subject, problem.extractedText, text, pasted);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } finally {
      setSending(false);
    }
  }

  async function handleCheckWork(dataUrl: string) {
    setCheckingWork(true);
    try {
      const transcription = await transcribeCanvas(dataUrl);
      setInput(transcription);
      setShowScratchpad(false);
    } finally {
      setCheckingWork(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to problem list"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-card text-[15px]"
        >
          ←
        </button>
        <p className="flex-1 truncate text-[13px] font-medium">{problem.extractedText}</p>
      </div>

      {problem.sourceImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={problem.sourceImageUrl}
          alt="Uploaded problem"
          className="max-h-40 w-full rounded-2xl border border-line object-contain"
        />
      )}

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto">
        {messages.length === 0 && (
          <Card className="bg-terracotta-soft text-[13px] leading-relaxed">
            What&rsquo;s the first thing you notice about this problem?
          </Card>
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

      {subject === "Math" && (
        <div>
          <button
            type="button"
            onClick={() => setShowScratchpad((s) => !s)}
            className="text-xs font-semibold text-terracotta underline decoration-dotted"
          >
            {showScratchpad ? "Hide scratch pad" : "Show scratch pad"}
          </button>
          {showScratchpad && (
            <div className="mt-2">
              <CanvasScratchpad onCheckWork={handleCheckWork} checking={checkingWork} />
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPaste={() => setWasPasted(true)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type your answer or thinking…"
          className="flex-1 rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm"
        />
        <Button disabled={sending || input.trim().length === 0} onClick={handleSend}>
          Send
        </Button>
      </div>

      {!solved && (
        <Button
          variant="secondary"
          onClick={() => {
            setSolved(true);
            void markProblemSolved(problem.id);
          }}
        >
          Mark solved
        </Button>
      )}
    </div>
  );
}
