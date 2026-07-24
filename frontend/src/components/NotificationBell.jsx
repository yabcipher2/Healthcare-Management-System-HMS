import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bell, X, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { fetchNotifications, buildNotifications } from "../utils/notifications";

const typeColors = {
  patient:    "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30",
  assignment: "bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30",
  lab:        "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30",
  triage:     "bg-amber-100 text-amber-300 border-amber-500/30",
  pharmacy:   "bg-orange-100 text-orange-700 border-orange-200",
  cashier:    "bg-cyan-100 text-cyan-700 border-cyan-200",
  ward:       "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30",
  reception:  "bg-teal-100 text-teal-700 border-teal-200",
  ultrasound: "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30",
  store:      "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30",
  audit:      "bg-[#0E1B17] text-slate-200 border-white/20",
  labcashier: "bg-cyan-100 text-cyan-700 border-cyan-200",
};

export default function NotificationBell({ role, pollingInterval = 15000 }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await fetchNotifications(role);
      const built = buildNotifications(role, raw);
      setNotifications(built);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    load();
    const interval = setInterval(load, pollingInterval);
    return () => clearInterval(interval);
  }, [load, pollingInterval]);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const visible = notifications.filter((n) => !dismissed.has(n.id));
  const urgentCount = visible.filter((n) => n.urgent).length;
  const totalCount = visible.length;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg hover:bg-[#0E1B17] transition text-[#94A3B8] hover:text-white"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {totalCount > 0 && (
          <span
            className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[9px] font-black text-white px-1 ${
              urgentCount > 0 ? "bg-[#EF4444] animate-pulse" : "bg-[#10B981]"
            }`}
          >
            {totalCount > 9 ? "9+" : totalCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-10 w-80 bg-[#0E1B17] border border-white/20 rounded-2xl shadow-2xl z-[200] overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-[#0E1B17]">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-[#94A3B8]" />
              <span className="text-[11px] font-black text-slate-200 uppercase tracking-wider">
                Notifications
              </span>
              {totalCount > 0 && (
                <span className="bg-[#10B981] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                  {totalCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {totalCount > 0 && (
                <button
                  onClick={() => setDismissed(new Set(notifications.map((n) => n.id)))}
                  className="text-[10px] text-[#94A3B8] hover:text-slate-300 font-bold uppercase tracking-wider transition"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-[#94A3B8] hover:text-slate-300 transition"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {loading && visible.length === 0 ? (
              <div className="p-6 text-center text-[11px] text-[#94A3B8] font-mono animate-pulse">
                Loading notifications...
              </div>
            ) : visible.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle size={24} className="text-[#10B981] mx-auto" />
                <p className="text-[11px] font-black text-[#94A3B8] uppercase tracking-wider">
                  All clear — no new alerts
                </p>
              </div>
            ) : (
              visible.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 flex items-start gap-3 hover:bg-[#0E1B17] transition ${
                    n.urgent ? "bg-[#EF4444]/10/60" : ""
                  }`}
                >
                  <div
                    className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border text-[10px] font-black ${
                      typeColors[n.type] || "bg-[#0E1B17] text-slate-300 border-white/20"
                    }`}
                  >
                    {n.urgent ? (
                      <AlertTriangle size={13} />
                    ) : (
                      <Bell size={13} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] font-black truncate ${n.urgent ? "text-[#EF4444]" : "text-white"}`}>
                      {n.title}
                    </p>
                    <p className="text-[10px] text-[#94A3B8] mt-0.5 leading-relaxed line-clamp-2">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock size={9} className="text-slate-300" />
                      <span className="text-[9px] text-[#94A3B8] font-mono">{n.time}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setDismissed((prev) => new Set([...prev, n.id]))}
                    className="text-slate-300 hover:text-[#94A3B8] transition shrink-0 mt-0.5"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-white/10 bg-[#0E1B17]/50">
            <button
              onClick={load}
              className="w-full text-[10px] font-bold text-[#94A3B8] hover:text-slate-300 uppercase tracking-wider transition"
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
