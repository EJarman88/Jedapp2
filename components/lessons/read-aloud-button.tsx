"use client";

import { useEffect, useState } from "react";
import { getReadAloudPrefs } from "@/lib/read-aloud/prefs";

function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function applyReadAloudPrefs(utterance: SpeechSynthesisUtterance): void {
  const prefs = getReadAloudPrefs();
  utterance.pitch = prefs.pitch;
  utterance.rate = prefs.rate;
  if (prefs.voiceURI) {
    const voice = window.speechSynthesis.getVoices().find((v) => v.voiceURI === prefs.voiceURI);
    if (voice) utterance.voice = voice;
  }
}

export function ReadAloudButton({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      if (speechSupported()) window.speechSynthesis.cancel();
    };
  }, []);

  function toggle() {
    if (!speechSupported()) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    applyReadAloudPrefs(utterance);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={speaking ? "Stop reading aloud" : "Read this lesson aloud"}
      aria-pressed={speaking}
      className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-line bg-card text-sm"
    >
      {speaking ? "⏸" : "🔊"}
    </button>
  );
}
