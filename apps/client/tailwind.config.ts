import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: "hsl(var(--primary))",
        muted: "hsl(var(--muted))",
        surface: "hsl(var(--surface))"
      },
      boxShadow: {
        soft: "0 16px 50px rgb(15 23 42 / 0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;
