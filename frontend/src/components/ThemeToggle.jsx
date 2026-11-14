import React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

/**
 * Three-way colour mode control used in every dashboard header:
 * Light · Dark · System (system follows the OS preference).
 */
const OPTIONS = [
  { id: "light", label: "Light", Icon: Sun, hint: "Light colour scheme" },
  { id: "dark", label: "Dark", Icon: Moon, hint: "Dark colour scheme" },
  {
    id: "system",
    label: "System",
    Icon: Monitor,
    hint: "Match the system colour scheme",
  },
];

export default function ThemeToggle({ className = "" }) {
  const { mode, setMode } = useTheme();

  return (
    <div
      role="group"
      aria-label="Colour theme"
      title="Colour theme"
      className={`flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/5 p-0.5 font-mono shrink-0 ${className}`}
    >
      {OPTIONS.map(({ id, label, Icon, hint }) => {
        const active = mode === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            aria-pressed={active}
            title={hint}
            className={`flex items-center gap-1 rounded-md px-1.5 sm:px-2 py-1 text-[9px] font-black uppercase tracking-wider transition-colors ${
              active
                ? "bg-[#10B981] text-white shadow-sm"
                : "text-[#94A3B8] hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon size={11} />
            <span className="hidden md:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
