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
 * the stylesheet keys off. Each dashboard stores its own preference under
 * `hms-theme:<dashboard>`, so a doctor switching to light does not repaint the
 * admin (or any other) dashboard. The most recent choice is also mirrored to
 * `hms-theme` for the pre-paint script in index.html.
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

const readStoredMode = (key) => {
  try {
    const stored = localStorage.getItem(key);
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

export function ThemeProvider({ pageKey = "global", children }) {
  // One preference per dashboard, e.g. hms-theme:doctor / hms-theme:admin.
  const storageKey = `${THEME_STORAGE_KEY}:${pageKey}`;
  const [mode, setModeState] = useState(() => readStoredMode(storageKey));
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

  // Switching dashboards adopts that dashboard's own saved mode.
  useEffect(() => {
    setModeState(readStoredMode(storageKey));
  }, [storageKey]);

  const resolvedTheme = mode === "system" ? systemTheme : mode;

  // Publish the resolved theme for the stylesheet + native form controls.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = resolvedTheme;
    root.dataset.themeMode = mode;
    root.style.colorScheme = resolvedTheme;
    try {
      // Remember the last used mode only for the pre-paint script; the real
      // per-dashboard preference lives under `storageKey`.
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // storage unavailable (private mode) — the session still works
    }
  }, [mode, resolvedTheme]);

  const setMode = useCallback(
    (next) => {
      if (!THEME_MODES.includes(next)) return;
      setModeState(next);
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        // storage unavailable (private mode) — the session still works
      }
    },
    [storageKey],
  );

  // Kept for the older single-button toggle.
  const cycleTheme = useCallback(() => {
    setModeState((previous) => {
      const next =
        THEME_MODES[(THEME_MODES.indexOf(previous) + 1) % THEME_MODES.length];
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, [storageKey]);

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
