"use client";

import { useEffect, useState } from "react";
import { applyReadAloudPrefs } from "@/components/lessons/read-aloud-button";
import { getReadAloudPrefs, saveReadAloudPrefs, type ReadAloudPrefs } from "@/lib/read-aloud/prefs";

const SAMPLE_TEXT = "This is what your voice, pitch, and speed will sound like.";

export function ReadAloudSettings() {
  const [prefs, setPrefs] = useState<ReadAloudPrefs>(() => getReadAloudPrefs());
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  function update(next: Partial<ReadAloudPrefs>) {
    const merged = { ...prefs, ...next };
    setPrefs(merged);
    saveReadAloudPrefs(merged);
  }

  function testVoice() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(SAMPLE_TEXT);
    applyReadAloudPrefs(utterance);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  return (
    <div>
      <p className="mb-4 text-xs text-ink-soft">
        Changes save automatically and apply to every lesson&rsquo;s read-aloud button.
      </p>

      <label className="mb-3 block">
        <span className="mb-1.5 block text-xs font-semibold">Voice</span>
        <select
          value={prefs.voiceURI ?? ""}
          onChange={(e) => update({ voiceURI: e.target.value || null })}
          className="w-full rounded-xl border border-line bg-card px-3 py-2.5 text-sm"
        >
          <option value="">Device default</option>
          {voices.map((v) => (
            <option key={v.voiceURI} value={v.voiceURI}>
              {v.name} ({v.lang})
            </option>
          ))}
        </select>
      </label>

      <label className="mb-3 block">
        <span className="mb-1.5 flex justify-between text-xs font-semibold">
          <span>Pitch</span>
          <span className="text-ink-soft">{prefs.pitch.toFixed(1)}</span>
        </span>
        <input
          type="range"
          min={0.5}
          max={2}
          step={0.1}
          value={prefs.pitch}
          onChange={(e) => update({ pitch: Number(e.target.value) })}
          className="w-full"
        />
      </label>

      <label className="mb-4 block">
        <span className="mb-1.5 flex justify-between text-xs font-semibold">
          <span>Speed</span>
          <span className="text-ink-soft">{prefs.rate.toFixed(1)}×</span>
        </span>
        <input
          type="range"
          min={0.5}
          max={2}
          step={0.1}
          value={prefs.rate}
          onChange={(e) => update({ rate: Number(e.target.value) })}
          className="w-full"
        />
      </label>

      <button
        type="button"
        onClick={testVoice}
        className="w-full rounded-xl border border-line bg-card py-2.5 text-sm font-medium"
      >
        {speaking ? "Playing…" : "🔊 Test this voice"}
      </button>
    </div>
  );
}
