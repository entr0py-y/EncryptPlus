"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("encryptplus-theme") as Theme | null;
      if (saved === "light" || saved === "dark") {
        setThemeState(saved);
        updateDom(saved);
      } else {
        setThemeState("dark");
        updateDom("dark");
      }
    } catch (e) {
      updateDom("dark");
    }
  }, []);

  const updateDom = (t: Theme) => {
    if (typeof document !== "undefined") {
      if (t === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      }
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem("encryptplus-theme", newTheme);
    } catch (e) {}
    updateDom(newTheme);
  };

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: "dark" as Theme,
      setTheme: () => {},
      toggleTheme: () => {
        if (typeof document !== "undefined") {
          const isDark = document.documentElement.classList.contains("dark");
          if (isDark) {
            document.documentElement.classList.remove("dark");
            document.documentElement.classList.add("light");
            try { localStorage.setItem("encryptplus-theme", "light"); } catch(e){}
          } else {
            document.documentElement.classList.add("dark");
            document.documentElement.classList.remove("light");
            try { localStorage.setItem("encryptplus-theme", "dark"); } catch(e){}
          }
        }
      },
    };
  }
  return context;
}
