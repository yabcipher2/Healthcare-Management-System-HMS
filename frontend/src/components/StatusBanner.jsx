import { useEffect } from "react";
import { useHospitalStatus } from "../context/HospitalStatusContext";
import { AlertTriangle, WifiOff } from "lucide-react";

export const StatusBanner = () => {
  const { isEmergency, isMaintenance, status, refreshStatus } =
    useHospitalStatus();

  useEffect(() => {
    refreshStatus();
  }, []);

  if (status === "open" || !status) {
    return null;
  }

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === "Administrator";

  if (isMaintenance) {
    if (isAdmin) {
      return (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white z-[9999] shadow-lg">
          <div className="flex items-center justify-center gap-3 p-3 px-6">
            <WifiOff size={18} className="shrink-0" />
            <span className="font-black text-xs uppercase tracking-[0.2em]">
              MAINTENANCE MODE — System is in maintenance. Non-admin staff are locked out. You have full access as Administrator.
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-slate-900/95 z-[9999] flex flex-col items-center justify-center text-white p-6">
        <div className="bg-red-600/20 p-6 rounded-3xl mb-6 border border-red-500/30">
          <WifiOff size={64} strokeWidth={2.5} className="text-red-400" />
        </div>
        <h1 className="text-4xl font-black uppercase tracking-wider mb-4 text-white">
          System Under Maintenance
        </h1>
        <p className="text-lg text-slate-300 font-medium max-w-md text-center mb-8">
          The HMS platform is currently offline for scheduled maintenance. All
          operational dashboards are suspended.
        </p>
        <div className="bg-white/10 backdrop-blur px-6 py-3 rounded-2xl mb-6">
          <p className="text-sm text-slate-400 font-mono">
            Status: <span className="text-red-400 font-bold">{status}</span>
          </p>
        </div>
        <button
          onClick={() => {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = "/login";
          }}
          className="px-6 py-3 bg-white text-slate-900 font-black text-sm uppercase tracking-wider rounded-xl hover:bg-slate-200 transition-colors"
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (isEmergency) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-red-600 text-white z-[9999] shadow-2xl animate-pulse">
        <div className="flex items-center justify-center gap-3 p-3 px-6">
          <AlertTriangle size={22} className="shrink-0" />
          <span className="font-black text-sm uppercase tracking-[0.2em]">
            Emergency Protocol Active — All staff attend to urgent triage routing
            only
          </span>
        </div>
      </div>
    );
  }

  return null;
};
