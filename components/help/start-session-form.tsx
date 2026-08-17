"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { HelpSubject } from "@/lib/supabase/database.types";
import { startHelpSession } from "@/lib/help/actions";

const SUBJECTS: HelpSubject[] = ["RLA", "Math", "Science", "Social Studies"];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function StartSessionForm() {
  const router = useRouter();
  const [subject, setSubject] = useState<HelpSubject>("Math");
  const [files, setFiles] = useState<File[]>([]);
  const [typedText, setTypedText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capped, setCapped] = useState(false);

  async function handleSubmit() {
    setError(null);
    setCapped(false);
    setBusy(true);
    try {
      const imageDataUrls = await Promise.all(files.map(fileToDataUrl));
      const result = await startHelpSession(subject, imageDataUrls, typedText);
      if (result.capped) {
        setCapped(true);
        setBusy(false);
        return;
      }
      if (result.sessionId) {
        router.push(`/ask/session/${result.sessionId}`);
        return;
      }
      setError("Something went wrong starting your session.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong starting your session.");
    }
    setBusy(false);
  }

  if (capped) {
    return (
      <Card className="bg-amber-soft">
        <p className="text-sm leading-relaxed">
          You&rsquo;ve used today&rsquo;s sessions — more tomorrow, or try{" "}
          <a href="/ask/talk-to-claude" className="font-semibold underline">
            Talk to Claude
          </a>{" "}
          in the meantime.
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-3.5">
      <CardLabel className="mt-0">Get Help With a Problem</CardLabel>

      <select
        value={subject}
        onChange={(e) => setSubject(e.target.value as HelpSubject)}
        className="rounded-xl border border-line bg-card px-3 py-2.5 text-sm"
      >
        {SUBJECTS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border-[1.5px] border-dashed border-line bg-background px-4 py-6 text-center">
        <span className="text-xl">📷</span>
        <span className="text-[13px] font-semibold">Upload or Photograph a Problem</span>
        <span className="text-xs text-ink-soft">
          {files.length > 0 ? `${files.length} photo${files.length === 1 ? "" : "s"} selected` : "Any number of pages"}
        </span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        />
      </label>

      <div className="flex items-center gap-2 text-xs text-ink-soft">
        <span className="h-px flex-1 bg-line" />
        or type it in
        <span className="h-px flex-1 bg-line" />
      </div>

      <textarea
        value={typedText}
        onChange={(e) => setTypedText(e.target.value)}
        placeholder="Type the problem here…"
        className="min-h-[80px] resize-none rounded-xl border border-line bg-card p-3 text-sm"
      />

      {error && <p className="text-xs font-medium text-amber">{error}</p>}

      <Button
        className="w-full"
        disabled={busy || (files.length === 0 && typedText.trim().length === 0)}
        onClick={handleSubmit}
      >
        {busy ? "Reading your problem…" : "Get Help"}
      </Button>
    </Card>
  );
}
