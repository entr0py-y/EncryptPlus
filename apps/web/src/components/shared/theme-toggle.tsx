"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "./theme-provider";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleTheme();
      }}
      aria-label="Toggle theme"
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className={`p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 hover:bg-zinc-200 dark:bg-[#121214] dark:hover:bg-zinc-800 dark:hover:border-zinc-700 text-black dark:text-white transition-all flex items-center justify-center shadow-sm active:scale-95 cursor-pointer z-20 ${className}`}
    >
      {mounted ? (
        theme === "dark" ? (
          <Sun className="w-4 h-4 text-yellow-400 transition-transform duration-200" />
        ) : (
          <Moon className="w-4 h-4 text-black dark:text-white transition-transform duration-200" />
        )
      ) : (
        <Sun className="w-4 h-4 text-yellow-400 opacity-60" />
      )}
    </button>
  );
}
