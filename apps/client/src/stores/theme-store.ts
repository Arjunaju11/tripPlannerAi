import { create } from "zustand";

type Theme = "light" | "dark";
type ThemeState = { theme: Theme; setTheme: (theme: Theme) => void; toggle: () => void };

const initialTheme = (): Theme => {
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: initialTheme(),
  setTheme: (theme) => {
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    set({ theme });
  },
  toggle: () => get().setTheme(get().theme === "dark" ? "light" : "dark")
}));
