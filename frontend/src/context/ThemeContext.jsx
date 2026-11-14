import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Colour theme for the HMS dashboards.
 *
 * Three modes:
 *   light  – light palette (see src/light-theme.css)
 *   dark   – the original dark-green design
 *   system – follows the operating system preference and updates live
 *
 * The resolved theme is written to <html data-theme="light|dark">, which is what
 * the stylesheet keys off. The chosen mode is stored under `hms-theme` so every
 * dashboard (and the next sign-in) uses the same preference.
 */
export const THEME_STORAGE_KEY = "hms-theme";
export const THEME_MODES = ["light", "dark", "system"];
const DEFAULT_MODE = "system";

const getSystemTheme = () => {
  if (typeof window === "undefined" || !window.matchMedia) return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const readStoredMode = () => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return THEME_MODES.includes(stored) ? stored : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
};

const ThemeContext = createContext({
  mode: DEFAULT_MODE,
  theme: DEFAULT_MODE,
  resolvedTheme: "dark",
  setMode: () => {},
  cycleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(readStoredMode);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  // Track the OS preference so "system" follows it live.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event) =>
      setSystemTheme(event.matches ? "dark" : "light");

    setSystemTheme(query.matches ? "dark" : "light");
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  const resolvedTheme = mode === "system" ? systemTheme : mode;

  // Publish the resolved theme for the stylesheet + native form controls.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = resolvedTheme;
    root.dataset.themeMode = mode;
    root.style.colorScheme = resolvedTheme;
  }, [mode, resolvedTheme]);

  const setMode = useCallback((next) => {
    if (!THEME_MODES.includes(next)) return;
    setModeState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // storage unavailable (private mode) — the session still works
    }
  }, []);

  // Kept for the older single-button toggle.
  const cycleTheme = useCallback(() => {
    setModeState((previous) => {
      const next = THEME_MODES[(THEME_MODES.indexOf(previous) + 1) % THEME_MODES.length];
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ mode, theme: mode, resolvedTheme, setMode, cycleTheme }),
    [mode, resolvedTheme, setMode, cycleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// Backwards-compatible alias for the old per-page provider name.
export const PageThemeProvider = ThemeProvider;

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeContext;
