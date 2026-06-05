import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#1e3567",
        "navy-deep": "#000b3f",
        "navy-soft": "#485b8f",
        accent: "#EF6B51",
        ink: "#494A52",
        "ink-strong": "#282828",
        muted: "#5a6473",
        line: "#E6E6E6",
        bg: "#f8fafc",
      },
      fontFamily: {
        sans: ["var(--font-lato)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
