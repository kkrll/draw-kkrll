/**
 * Theme Store for SolidJS
 *
 * Manages light/dark theme state with localStorage persistence.
 */

import { createSignal } from "solid-js";
import { track } from "../lib/posthog";

export type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";

  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Global signal for theme state
const [theme, setThemeInternal] = createSignal<Theme>(getInitialTheme());

// Apply initial theme class to document on load
if (typeof window !== "undefined") {
  document.documentElement.classList.toggle("dark", theme() === "dark");
}

export function useTheme() {
  const updateTheme = (newTheme: Theme) => {
    setThemeInternal(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    track("theme_changed", { theme: newTheme });
  };

  return {
    theme,
    setTheme: updateTheme,
  };
}

// Direct exports for convenience
export { theme };
