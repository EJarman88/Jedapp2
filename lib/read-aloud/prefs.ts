// Read-aloud is pure browser SpeechSynthesis (components/lessons/read-aloud-button.tsx)
// with no server-side concept of "the selected voice" — voice lists differ per device
// anyway — so these preferences live in localStorage, not the database.

export interface ReadAloudPrefs {
  voiceURI: string | null;
  pitch: number;
  rate: number;
}

const STORAGE_KEY = "edapp-read-aloud-prefs";
export const DEFAULT_READ_ALOUD_PREFS: ReadAloudPrefs = { voiceURI: null, pitch: 1, rate: 1 };

export function getReadAloudPrefs(): ReadAloudPrefs {
  if (typeof window === "undefined") return DEFAULT_READ_ALOUD_PREFS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_READ_ALOUD_PREFS;
    return { ...DEFAULT_READ_ALOUD_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_READ_ALOUD_PREFS;
  }
}

export function saveReadAloudPrefs(prefs: ReadAloudPrefs): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}
