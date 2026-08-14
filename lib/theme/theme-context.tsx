"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DEFAULT_THEME, type ThemeId } from "./themes";

interface ThemeContextValue {
  theme: ThemeId;
  /** True once a theme has been picked but not yet confirmed with Save. */
  isPreviewing: boolean;
  setTheme: (id: ThemeId) => void;
  /** Confirms the currently previewed theme, clearing the "not saved yet" state. */
  save: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME);
  const [isPreviewing, setIsPreviewing] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeState(id);
    setIsPreviewing(true);
  }, []);

  const save = useCallback(() => {
    setIsPreviewing(false);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, isPreviewing, setTheme, save }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
