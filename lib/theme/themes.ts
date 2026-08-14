export type ThemeId =
  | "warm-cream"
  | "soft-sage"
  | "warm-gray"
  | "quiet-night"
  | "golden-hour"
  | "soft-clay"
  | "cocoa";

export interface ThemeDef {
  id: ThemeId;
  name: string;
  bg: string;
  ink: string;
  card: string;
  line: string;
}

export const THEMES: ThemeDef[] = [
  { id: "warm-cream", name: "Warm Cream", bg: "#F6F1E8", ink: "#2C2620", card: "#FFFEFB", line: "#E7DFD1" },
  { id: "soft-sage", name: "Soft Sage", bg: "#EDF1E7", ink: "#2E3928", card: "#FBFCF9", line: "#D9E1D1" },
  { id: "warm-gray", name: "Warm Gray", bg: "#EBE9E4", ink: "#2C2C2A", card: "#FAFAF8", line: "#DCDAD3" },
  { id: "quiet-night", name: "Quiet Night", bg: "#242220", ink: "#F1EDE6", card: "#2E2B27", line: "#3C3833" },
  { id: "golden-hour", name: "Golden Hour", bg: "#F5EAD3", ink: "#4A3A18", card: "#FDFAF3", line: "#E9DAB4" },
  { id: "soft-clay", name: "Soft Clay", bg: "#F5E6DE", ink: "#4A2E24", card: "#FDF7F3", line: "#EAD3C4" },
  { id: "cocoa", name: "Cocoa", bg: "#3E2E22", ink: "#F1E6D9", card: "#4A3829", line: "#5A4636" },
];

export const DEFAULT_THEME: ThemeId = "warm-cream";

export function getTheme(id: ThemeId): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
