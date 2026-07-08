"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "pm-theme";

export function useTheme() {
  // Default to light; corrected on first client render via useEffect
  const [isDark, setIsDark] = useState(false);

  // On mount: read persisted preference and sync the <html> class
  useEffect(() => {
    const saved = typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEY)
      : null;
    const dark = saved === "dark";
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
  }

  return { isDark, toggle };
}
