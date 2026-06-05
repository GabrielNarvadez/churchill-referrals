import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#203367",
        "navy-deep": "#000b3f",
        "navy-soft": "#485b8f",
        accent: "#E31F26",
        ink: "#494A52",
        "ink-strong": "#282828",
        muted: "#5a6473",
        line: "#E6E6E6",
        bg: "#F2F2F2",
      },
      fontFamily: {
        sans: ["var(--font-lato)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
