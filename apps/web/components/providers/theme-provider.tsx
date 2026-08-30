"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";
type ThemeProviderProps = {
  children: React.ReactNode;
  attribute?: "class" | "data-theme" | Array<"class" | "data-theme">;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  storageKey?: string;
};

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "system",
  enableSystem = true,
  disableTransitionOnChange = false,
  storageKey = "theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;

    const storedTheme = window.localStorage.getItem(storageKey);
    if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
      return storedTheme;
    }

    return defaultTheme;
  });

  const resolvedTheme =
    theme === "system" && enableSystem ? getSystemTheme() : theme === "dark" ? "dark" : "light";

  React.useEffect(() => {
    const root = document.documentElement;
    const attributes = Array.isArray(attribute) ? attribute : [attribute];

    if (disableTransitionOnChange) {
      root.classList.add("theme-transition-disabled");
    }

    attributes.forEach((value) => {
      if (value === "class") {
        root.classList.toggle("dark", resolvedTheme === "dark");
        root.classList.toggle("light", resolvedTheme === "light");
      } else {
        root.setAttribute(value, resolvedTheme);
      }
    });

    root.style.colorScheme = resolvedTheme;

    if (disableTransitionOnChange) {
      const timer = window.setTimeout(() => {
        root.classList.remove("theme-transition-disabled");
      }, 300);
      return () => window.clearTimeout(timer);
    }
  }, [attribute, defaultTheme, disableTransitionOnChange, resolvedTheme]);

  const setTheme = React.useCallback(
    (nextTheme: Theme) => {
      setThemeState(nextTheme);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, nextTheme);
      }
    },
    [storageKey],
  );

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme: enableSystem
        ? theme
        : theme === "system"
          ? resolvedTheme === "dark"
            ? "dark"
            : "light"
          : theme,
      resolvedTheme,
      setTheme,
    }),
    [enableSystem, resolvedTheme, setTheme, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = React.useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
