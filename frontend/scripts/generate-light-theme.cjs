/**
 * Generates src/light-theme.css — the light-mode overrides for the HMS
 * dashboards. The dashboards are written with hard-coded dark tokens
 * (bg-[#0E1B17], text-white, ...), so light mode is produced by remapping
 * that palette to light equivalents, scoped to `[data-theme="light"] .hms-dash`.
 *
 * Run after introducing new hard-coded colours in a dashboard:
 *   node scripts/generate-light-theme.cjs
 */
const fs = require("fs");
const path = require("path");

const SRC = path.resolve(__dirname, "..", "src");
const OUT = path.join(SRC, "light-theme.css");
const SCOPE = '[data-theme="light"] .hms-dash';

const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules") walk(full);
    } else if (/\.jsx?$/.test(entry.name)) {
      files.push(full);
    }
  }
})(SRC);

// ── palette: dark token → light equivalent ────────────────────────────────
const BG_MAP = {
  "#050b09": "#f2f6f4", // page background
  "#0e1b17": "#ffffff", // panels, cards, sidebar, header
  "#0a1510": "#f7faf8",
  "#0a1f19": "#eff6f2",
  "#0c1f17": "#eff6f2",
  "#12241f": "#e9f2ed",
  "#13241e": "#e9f2ed",
  "#152318": "#e9f2ed",
  "#1e3a26": "#d9ebe1",
  "#163f24": "#c9e4d6",
  "#0f1729": "#edf2f6",
  "#29323a": "#e9efeb",
  "#151a1e": "#e1e9e4",
};
// Hover/focus/active states become subtle tints instead of white.
const BG_HOVER_MAP = {
  "#050b09": "#e7ede9",
  "#0e1b17": "#eef3f0",
  "#0a1510": "#eef3f0",
  "#0a1f19": "#e9f2ed",
  "#0c1f17": "#e9f2ed",
  "#12241f": "#e4ece7",
  "#13241e": "#e4ece7",
  "#152318": "#e4ece7",
  "#1e3a26": "#d2e7dc",
  "#163f24": "#c2e2d2",
  "#0f1729": "#e6edf3",
  "#29323a": "#e4ece7",
  "#151a1e": "#e1e9e4",
};
const TEXT_MAP = {
  "#ffffff": "#0b1f1a",
  "#94a3b8": "#5c6b76",
  "#93c5fd": "#1d4ed8",
  "#fca5a5": "#b91c1c",
  "#a7f3d0": "#047857",
};
const BORDER_MAP = {
  "#29323a": "#e1e9e4",
  "#0e1b17": "#e1e9e4",
  "#151a1e": "#e1e9e4",
  "#94a3b8": "#cbd5e1",
};
const SLATE_TEXT = {
  "slate-100": "#2b3d36",
  "slate-200": "#33463f",
  "slate-300": "#3d5149",
  "slate-400": "#5c6b76",
  "slate-500": "#64748b",
  "slate-600": "#24352f",
  "slate-700": "#1b2a25",
  "slate-800": "#12211c",
  "slate-900": "#0b1f1a",
};
const SLATE_BG = {
  "slate-50": "#f1f5f4",
  "slate-100": "#edf2ef",
  "slate-200": "#e6ece8",
  "slate-300": "#dde5e0",
  "slate-700": "#e6ece8",
  "slate-800": "#dfe7e2",
  "slate-900": "#eef3f0",
};
const SLATE_BORDER = {
  "slate-50": "#eef2f0",
  "slate-100": "#e1e9e4",
  "slate-200": "#e1e9e4",
  "slate-300": "#dbe4df",
  "slate-400": "#cbd5e1",
  "slate-700": "#dbe4df",
  "slate-800": "#dbe4df",
  "slate-900": "#dbe4df",
};
// Surfaces painted with a brand colour keep white ink in light mode.
const BRAND_BG = [
  "#10b981",
  "#0d9668",
  "#0d9a6e",
  "#0f9d76",
  "#0f9f6e",
  "#ef4444",
  "#b91c1c",
  "#1e3a8a",
  "#1d4ed8",
  "#3b82f6",
  "#2563eb",
  "#163f24",
];

const hexToRgb = (hex) => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
};
const rgba = (hex, a) => `rgba(${hexToRgb(hex).join(", ")}, ${+a.toFixed(2)})`;

// `/50` in Tailwind means 50%, `/0.5` means 0.5.
const normalizeAlpha = (raw) => {
  const n = parseFloat(raw);
  return n > 1 ? n / 100 : n;
};

const esc = (s) => s.replace(/[:/[\]\]#.,%()!]/g, (c) => "\\" + c);

const PSEUDO = {
  hover: ":hover",
  focus: ":focus",
  "focus-within": ":focus-within",
  active: ":active",
  disabled: ":disabled",
  selection: "::selection",
  placeholder: "::placeholder",
};

function buildSelector(token) {
  const parts = token.split(":");
  const base = parts[parts.length - 1];
  const variants = parts.slice(0, -1);
  const cls = `.${esc(base)}`;
  if (variants.length === 0) return `${SCOPE} ${cls}`;
  if (variants[0] === "group-hover") return `${SCOPE} .group:hover ${cls}`;
  const pseudos = variants.map((v) => PSEUDO[v]);
  if (pseudos.some((p) => !p)) return null; // responsive / unsupported variant
  return `${SCOPE} ${cls}${pseudos.join("")}`;
}

const tokenRe =
  /[A-Za-z0-9_:/[\]#%,-]*(?:bg|text|border|divide|ring|from|via|to|fill|stroke|placeholder|shadow)-(?:\[#[0-9A-Fa-f]{3,8}\]\/[0-9.]+|\[#[0-9A-Fa-f]{3,8}\]|(?:white|black|slate-\d{2,3})(?:\/[0-9.]+)?)/g;

const tokens = new Map();
for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  let match;
  while ((match = tokenRe.exec(text))) {
    tokens.set(match[0], (tokens.get(match[0]) || 0) + 1);
  }
}

const rules = [];
const unsupported = [];

for (const token of tokens.keys()) {
  if (/\/\d+\/\d+/.test(token)) continue; // malformed double-alpha class

  const variants = token.split(":").slice(0, -1);
  const base = token.split(":").pop();
  const isStateful = /hover|focus|active|checked|disabled/.test(variants.join(":"));
  const selector = buildSelector(token);
  if (!selector) {
    unsupported.push(token);
    continue;
  }

  const parsed = base.match(/^(bg|text|border|divide|ring|placeholder)-(.+)$/);
  if (!parsed) {
    unsupported.push(token);
    continue;
  }
  const [, prop, value] = parsed;

  const hexValue = value.match(/^\[(#[0-9A-Fa-f]{3,8})\](?:\/([0-9.]+))?$/);
  const namedValue = value.match(/^(white|black|slate-\d{2,3})(?:\/([0-9.]+))?$/);

  let decl = null;

  if (hexValue) {
    const hex = hexValue[1].toLowerCase();
    const alpha = hexValue[2] ? normalizeAlpha(hexValue[2]) : null;

    if (prop === "bg") {
      const light = (isStateful ? BG_HOVER_MAP : BG_MAP)[hex];
      if (light) {
        decl = `background-color: ${alpha !== null ? rgba(light, alpha) : light} !important;`;
      }
    } else if (prop === "text") {
      const light = TEXT_MAP[hex];
      if (light) {
        decl = `color: ${alpha !== null ? rgba(light, Math.min(1, alpha + 0.2)) : light} !important;`;
      }
    } else if (prop === "border" || prop === "divide") {
      const light = BORDER_MAP[hex];
      if (light) {
        decl = `border-color: ${alpha !== null ? rgba(light, Math.min(1, alpha * 3)) : light} !important;`;
      }
    } else if (prop === "ring") {
      const light = BORDER_MAP[hex];
      if (light) decl = `--tw-ring-color: ${light} !important;`;
    } else if (prop === "placeholder") {
      const light = TEXT_MAP[hex];
      if (light) decl = `color: ${light} !important;`;
    }
  } else if (namedValue) {
    const [, name, alphaRaw] = namedValue;
    const alpha = alphaRaw ? normalizeAlpha(alphaRaw) : null;

    if (name === "white") {
      if (prop === "bg") {
        decl = `background-color: ${alpha !== null ? rgba("#0b1f1a", Math.min(0.16, alpha * 0.8)) : "#ffffff"} !important;`;
      } else if (prop === "text") {
        decl = `color: ${alpha !== null ? rgba("#0b1f1a", Math.min(1, alpha + 0.15)) : "#0b1f1a"} !important;`;
      } else if (prop === "border" || prop === "divide") {
        decl = `border-color: ${rgba("#0b1f1a", Math.min(0.22, alpha !== null ? alpha * 0.8 : 0.16))} !important;`;
      } else if (prop === "ring") {
        decl = `--tw-ring-color: ${rgba("#0b1f1a", Math.min(0.2, alpha !== null ? alpha : 0.12))} !important;`;
      } else if (prop === "placeholder") {
        decl = `color: #94a3b8 !important;`;
      }
    } else if (name === "black") {
      continue; // modal scrims stay dark
    } else if (name.startsWith("slate-")) {
      if (prop === "bg" && SLATE_BG[name] && alpha === null && token.includes(`-${name}`)) {
        decl = `background-color: ${SLATE_BG[name]} !important;`;
      } else if (prop === "text" && SLATE_TEXT[name]) {
        decl = `color: ${SLATE_TEXT[name]} !important;`;
      } else if ((prop === "border" || prop === "divide") && SLATE_BORDER[name]) {
        decl = `border-color: ${SLATE_BORDER[name]} !important;`;
      } else if (prop === "placeholder") {
        decl = `color: #64748b !important;`;
      }
    }
  }

  if (decl) rules.push(`${selector} { ${decl} }`);
  else unsupported.push(token);
}

// Brand-class names are taken from the sources verbatim: Tailwind class
// selectors are case-sensitive, and the codebase mixes #10B981 / #10b981.
const brandClasses = new Set();
for (const token of tokens.keys()) {
  const base = token.split(":").pop();
  const match = base.match(/^bg-\[(#[0-9A-Fa-f]{3,8})\]$/);
  if (!match) continue;
  if (BRAND_BG.includes(match[1].toLowerCase())) brandClasses.add(base);
}
const brandSelectors = [...brandClasses]
  .sort()
  .map((cls) => `${SCOPE} .${esc(cls)}`);
const brandRule = brandSelectors
  .map((s) => `${s} {\n  color: #ffffff !important;\n}\n${s} * {\n  color: #ffffff !important;\n}`)
  .join("\n");

const css = `/* ─────────────────────────────────────────────────────────────────────────
   Light theme overrides for the dark-first HMS dashboards.
   Scope: [data-theme="light"] .hms-dash — dark mode and the public pages are
   untouched. Generated by scripts/generate-light-theme.js; re-run it after
   adding new hard-coded colours to a dashboard.
   ───────────────────────────────────────────────────────────────────────── */

${rules.join("\n")}

/* Surfaces painted with a brand colour keep white ink. */
${brandRule}

/* Native controls and selection follow the light scheme. */
${SCOPE} {
  color-scheme: light;
}
${SCOPE} input,
${SCOPE} textarea,
${SCOPE} select {
  color-scheme: light;
}
${SCOPE} input::placeholder,
${SCOPE} textarea::placeholder {
  color: #94a3b8 !important;
}
${SCOPE} ::selection {
  background-color: rgba(16, 185, 129, 0.25);
  color: #0b1f1a;
}
${SCOPE} * {
  scrollbar-color: #cbd5cd transparent;
}
`;

fs.writeFileSync(OUT, css, "utf8");
console.log(`wrote ${OUT}\nrules: ${rules.length} | unmapped tokens: ${unsupported.length}`);
if (unsupported.length) console.log(`unmapped: ${unsupported.join(", ")}`);
