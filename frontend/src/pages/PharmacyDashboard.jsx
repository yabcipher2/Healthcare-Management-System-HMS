import React from "react";
import { LogOut, Pill, ShoppingBag, ClipboardList } from "lucide-react";

const PharmacyDashboard = ({ onLogout, user }) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
              Pharmacy Dashboard
            </p>
            <h1 className="text-4xl font-black text-slate-900 mt-4">
              Welcome back, {user?.name || "Pharmacist"}
            </h1>
            <p className="mt-3 text-slate-500 text-sm max-w-xl">
              Access medication workflows, prescription queues, and inventory
              alerts tailored for pharmacy staff.
            </p>
          </div>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-black uppercase tracking-widest text-slate-700 hover:bg-slate-100 transition-all"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-400">
                  Prescriptions Today
                </p>
                <h2 className="text-4xl font-black text-slate-900 mt-4">128</h2>
              </div>
              <div className="w-14 h-14 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Pill size={24} />
              </div>
            </div>
            <p className="text-sm text-slate-500">
              Review pending prescriptions and dispense medicines with priority
              scheduling.
            </p>
          </div>
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-400">
                  Inventory Alerts
                </p>
                <h2 className="text-4xl font-black text-slate-900 mt-4">5</h2>
              </div>
              <div className="w-14 h-14 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShoppingBag size={24} />
              </div>
            </div>
            <p className="text-sm text-slate-500">
              Low-stock medicines are highlighted for restocking and urgent
              pharmacy triage.
            </p>
          </div>
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-400">
                  Active Workflows
                </p>
                <h2 className="text-4xl font-black text-slate-900 mt-4">14</h2>
              </div>
              <div className="w-14 h-14 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ClipboardList size={24} />
              </div>
            </div>
            <p className="text-sm text-slate-500">
              Manage prescription checks, medication verification, and pharmacy
              handoffs from one place.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyDashboard;
