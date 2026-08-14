import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--color-bg)",
        ink: {
          DEFAULT: "var(--color-ink)",
          soft: "var(--color-ink-soft)",
        },
        card: "var(--color-card)",
        line: "var(--color-line)",
        terracotta: {
          DEFAULT: "var(--color-terracotta)",
          soft: "var(--color-terracotta-soft)",
        },
        sage: {
          DEFAULT: "var(--color-sage)",
          soft: "var(--color-sage-soft)",
        },
        amber: {
          DEFAULT: "var(--color-amber)",
          soft: "var(--color-amber-soft)",
        },
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        card: "18px",
      },
    },
  },
};

export default config;
