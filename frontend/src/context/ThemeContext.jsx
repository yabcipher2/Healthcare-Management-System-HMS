import React, { createContext, useContext, useEffect, useState } from "react";

// ─── Theme modes — cycle order: light (default) → system → dark → light ──────
const MODES = ["light", "system", "dark"];

// ─── Per-theme CSS variable values ───────────────────────────────────────────
const THEME_VARS = {
  system: {
    "--hms-bg":           "#050B09",
    "--hms-surface":      "#0E1B17",
    "--hms-surface2":     "#0a1510",
    "--hms-surface3":     "#152318",
    "--hms-border":       "#29323a",
    "--hms-text":         "#ffffff",
    "--hms-muted":        "#94A3B8",
    "--hms-accent":       "#10B981",
    "--hms-accent2":      "#0d9a6e",
    "--hms-accent-deep":  "#1e3a8a",
    "--hms-danger":       "#EF4444",
    "--hms-danger2":      "#b91c1c",
    "--hms-header-bg":    "#0E1B17",
    "--hms-sidebar-bg":   "#0E1B17",
    "--hms-row-hover":    "#152318",
    "--hms-input-bg":     "#0a1510",
    "--hms-light-panel":  "#0a1510",
  },
  dark: {
    "--hms-bg":           "#09090b",
    "--hms-surface":      "#111116",
    "--hms-surface2":     "#18181f",
    "--hms-surface3":     "#1e1e2a",
    "--hms-border":       "#27272a",
    "--hms-text":         "#f4f4f5",
    "--hms-muted":        "#71717a",
    "--hms-accent":       "#818cf8",
    "--hms-accent2":      "#6366f1",
    "--hms-accent-deep":  "#3730a3",
    "--hms-danger":       "#f87171",
    "--hms-danger2":      "#b91c1c",
    "--hms-header-bg":    "#111116",
    "--hms-sidebar-bg":   "#111116",
    "--hms-row-hover":    "#1e1e2a",
    "--hms-input-bg":     "#09090b",
    "--hms-light-panel":  "#1e1e2a",
  },
  light: {
    "--hms-bg":           "#f1f5f9",
    "--hms-surface":      "#ffffff",
    "--hms-surface2":     "#f8fafc",
    "--hms-surface3":     "#f0f9ff",
    "--hms-border":       "#e2e8f0",
    "--hms-text":         "#0f172a",
    "--hms-muted":        "#64748b",
    "--hms-accent":       "#0ea5e9",
    "--hms-accent2":      "#0284c7",
    "--hms-accent-deep":  "#0369a1",
    "--hms-danger":       "#dc2626",
    "--hms-danger2":      "#dc2626",
    "--hms-header-bg":    "#ffffff",
    "--hms-sidebar-bg":   "#1e293b",
    "--hms-row-hover":    "#f0f9ff",
    "--hms-input-bg":     "#f8fafc",
    "--hms-light-panel":  "#f0f9ff",
  },
};

// ─── The CSS override block injected by each page's provider ─────────────────
// Scoped to .hms-page so only the active page's subtree is affected.
const buildOverrideCSS = (scopeClass) => `
  /* ── Root page ── */
  .${scopeClass} {
    background-color: var(--hms-bg) !important;
    color: var(--hms-text) !important;
  }

  /* ── Sidebar — always stays dark for contrast in all themes ── */
  .${scopeClass} aside {
    background-color: var(--hms-sidebar-bg) !important;
    border-color: var(--hms-border) !important;
  }
  .${scopeClass} aside * {
    border-color: color-mix(in srgb, var(--hms-border) 60%, transparent) !important;
  }

  /* ── Sticky header ── */
  .${scopeClass} header {
    background-color: var(--hms-header-bg) !important;
    border-color: var(--hms-border) !important;
    color: var(--hms-text) !important;
  }

  /* ── Main content area panels ── */
  .${scopeClass} main {
    background-color: var(--hms-bg) !important;
  }

  /* Cards / panels with the standard dark surface colors */
  .${scopeClass} main .bg-\\[\\#0E1B17\\],
  .${scopeClass} main .bg-\\[\\#050B09\\],
  .${scopeClass} main .bg-\\[\\#0a1510\\],
  .${scopeClass} main .bg-\\[\\#0a1f19\\],
  .${scopeClass} main .bg-\\[\\#152318\\] {
    background-color: var(--hms-surface) !important;
    border-color: var(--hms-border) !important;
  }

  /* Slightly elevated panels */
  .${scopeClass} main .bg-\\[\\#29323a\\],
  .${scopeClass} main .bg-\\[\\#1e3a26\\],
  .${scopeClass} main .bg-\\[\\#0c1f17\\] {
    background-color: var(--hms-surface2) !important;
  }

  /* White / light panels that should stay white in light mode */
  .${scopeClass} main .bg-white {
    background-color: var(--hms-surface) !important;
  }
  .${scopeClass} main .bg-slate-50 {
    background-color: var(--hms-surface2) !important;
  }
  .${scopeClass} main .bg-slate-100 {
    background-color: var(--hms-surface2) !important;
  }

  /* Text colors in main content */
  .${scopeClass} main .text-white,
  .${scopeClass} main .text-slate-200,
  .${scopeClass} main .text-slate-300 {
    color: var(--hms-text) !important;
  }
  .${scopeClass} main .text-slate-400,
  .${scopeClass} main .text-slate-500,
  .${scopeClass} main .text-\\[\\#94A3B8\\] {
    color: var(--hms-muted) !important;
  }
  .${scopeClass} main .text-slate-600,
  .${scopeClass} main .text-slate-700,
  .${scopeClass} main .text-slate-800,
  .${scopeClass} main .text-slate-900 {
    color: var(--hms-text) !important;
  }

  /* Border colors in main */
  .${scopeClass} main .border-\\[\\#29323a\\],
  .${scopeClass} main .border-slate-100,
  .${scopeClass} main .border-slate-200,
  .${scopeClass} main .border-slate-300 {
    border-color: var(--hms-border) !important;
  }

  /* Tables */
  .${scopeClass} table thead tr,
  .${scopeClass} table thead {
    background-color: var(--hms-surface) !important;
  }
  .${scopeClass} table thead th {
    color: var(--hms-muted) !important;
    border-color: var(--hms-border) !important;
  }
  .${scopeClass} table tbody tr {
    border-color: var(--hms-border) !important;
  }
  .${scopeClass} table tbody tr:hover {
    background-color: var(--hms-row-hover) !important;
  }
  .${scopeClass} table tbody td {
    color: var(--hms-text) !important;
  }

  /* Inputs / textareas / selects */
  .${scopeClass} input,
  .${scopeClass} textarea,
  .${scopeClass} select {
    background-color: var(--hms-input-bg) !important;
    color: var(--hms-text) !important;
    border-color: var(--hms-border) !important;
  }
  .${scopeClass} input::placeholder,
  .${scopeClass} textarea::placeholder {
    color: var(--hms-muted) !important;
  }

  /* Dividers */
  .${scopeClass} hr {
    border-color: var(--hms-border) !important;
  }

  /* Divide utilities */
  .${scopeClass} .divide-slate-100 > * + *,
  .${scopeClass} .divide-slate-200 > * + *,
  .${scopeClass} .divide-\\[\\#29323a\\] > * + * {
    border-color: var(--hms-border) !important;
  }
`;

// ─── Context ──────────────────────────────────────────────────────────────────
const ThemeContext = createContext({ theme: "system", cycleTheme: () => {} });

/**
 * PageThemeProvider — scoped per page.
 *
 * @param {string} pageKey   Short identifier e.g. "doctor", "ward", "pharmacy"
 *                           Used as the localStorage key suffix and CSS scope class.
 * @param {string} scopeClass  The className on the page's root <div> (default: "hms-page")
 */
export function PageThemeProvider({ pageKey, scopeClass = "hms-page", children }) {
  const storageKey = `hms-theme-${pageKey}`;
  const styleId    = `hms-theme-style-${pageKey}`;

  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem(storageKey);
    // Default is "light" (white) — only use stored value if it's a valid mode
    return MODES.includes(stored) ? stored : "light";
  });

  // Apply CSS vars and scoped override sheet whenever theme changes
  useEffect(() => {
    const vars = THEME_VARS[theme] ?? THEME_VARS.system;

    // Inject / update scoped <style> tag
    let styleTag = document.getElementById(styleId);
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    // Build CSS: set vars on .scopeClass, then all scoped overrides
    const varBlock = Object.entries(vars)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join("\n");

    styleTag.textContent =
      `.${scopeClass} {\n${varBlock}\n}\n` +
      buildOverrideCSS(scopeClass);

    localStorage.setItem(storageKey, theme);

    // Cleanup: remove style tag when this page unmounts
    return () => {
      const tag = document.getElementById(styleId);
      if (tag) tag.remove();
    };
  }, [theme, scopeClass, styleId, storageKey]);

  const cycleTheme = () =>
    setTheme((prev) => MODES[(MODES.indexOf(prev) + 1) % MODES.length]);

  return (
    <ThemeContext.Provider value={{ theme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Keep the old ThemeProvider name as an alias for backwards compat
export function ThemeProvider({ children }) {
  return <PageThemeProvider pageKey="global">{children}</PageThemeProvider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
