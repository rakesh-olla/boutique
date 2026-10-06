"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        type="button"
        className="rounded-lg border border-[var(--card-border)] p-2 opacity-50"
        aria-label="Theme"
      >
        <Sun className="h-5 w-5" />
      </button>
    );
  }

  const dark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-2 text-[var(--foreground)] transition hover:bg-[var(--sidebar)]"
      aria-label={dark ? "Light mode" : "Dark mode"}
    >
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
