import { ChevronLeft, ChevronRight } from "lucide-react";

// Shared collapse control for every dashboard sidebar. The chevron points left
// while the panel is open and right once it is collapsed, and it stays visible
// in the narrow rail so the sidebar can always be opened again.
const SidebarCollapseButton = ({
  collapsed,
  onToggle,
  variant = "dark",
  label = "sidebar",
}) => {
  const wrap =
    variant === "light"
      ? "p-2 border-b border-slate-100"
      : "p-2 border-b border-[#29323a]";
  const button =
    variant === "light"
      ? "border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
      : "border-[#29323a] text-[#94A3B8] hover:text-white hover:bg-[#10B981]/15";

  return (
    <div className={wrap}>
      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? `Open ${label}` : `Collapse ${label}`}
        aria-expanded={!collapsed}
        title={collapsed ? "Open sidebar" : "Collapse sidebar"}
        className={`w-full h-7 flex items-center justify-center rounded-md border transition ${button}`}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </div>
  );
};

export default SidebarCollapseButton;
