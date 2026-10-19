import React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

// Cycle: light → system → dark → light
const CONFIG = {
  light: {
    icon: <Sun size={13} />,
    label: "Light",
    title: "Light mode — click for System (dark green)",
    cls: "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100",
  },
  system: {
    icon: <Monitor size={13} />,
    label: "System",
    title: "System mode (dark green) — click for Dark",
    cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25",
  },
  dark: {
    icon: <Moon size={13} />,
    label: "Dark",
    title: "Dark mode — click for Light",
    cls: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/25",
  },
};

const CYCLE = ["light", "system", "dark"];

export default function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();
  const cfg = CONFIG[theme] ?? CONFIG.light;

  return (
    <button
      onClick={cycleTheme}
      title={cfg.title}
      aria-label={cfg.title}
      className={`
        flex items-center gap-1.5 px-2.5 py-1 shrink-0 select-none
        rounded-full border font-mono font-bold text-[10px] uppercase tracking-widest
        transition-all duration-150 ${cfg.cls}
      `}
    >
      {cfg.icon}
      <span>{cfg.label}</span>
    </button>
  );
}
