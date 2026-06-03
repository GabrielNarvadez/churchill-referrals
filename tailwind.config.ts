import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#1f3567",
        red: "#E4211B",
        ink: "#11151f",
        muted: "#5a6473",
        line: "#e6e8ee",
        bg: "#f7f8fb",
      },
      fontFamily: {
        sans: ["var(--font-lato)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
