import React, { useState, useEffect, useCallback } from "react";
import {
  Boxes,
  Search,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  FolderSync,
  PlusCircle,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  Heart,
  FileText,
} from "lucide-react";
import { logAudit, fetchAuditLogs, fetchAuditAlertsCount } from "../utils/audit";

export default function StoreManagementPage({ onLogout }) {
  const [activeTab, setActiveTab] = useState("medicines");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [restockAmount, setRestockAmount] = useState("");
  const hospitalLogo = "/mesra icon.png";
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");
  const [auditAlertsCount, setAuditAlertsCount] = useState(0);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditLogsError, setAuditLogsError] = useState("");

  const loadAuditAlertsCount = useCallback(async () => {
    try {
      const data = await fetchAuditAlertsCount();
      setAuditAlertsCount(data);
    } catch {
      // Silently fail audit count fetch - non-critical
    }
  }, []);

  const loadAuditLogs = useCallback(async () => {
    setAuditLogsLoading(true);
    setAuditLogsError("");
    try {
      const result = await fetchAuditLogs({ page: 1, limit: 20 });
      setAuditLogs(result.data || []);
    } catch (err) {
      setAuditLogsError(err.message || "Failed to load audit logs");
    } finally {
      setAuditLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuditAlertsCount();
    loadAuditLogs();
  }, [loadAuditAlertsCount, loadAuditLogs]);

  useEffect(() => {
    const interval = setInterval(() => loadAuditAlertsCount(), 30000);
    return () => clearInterval(interval);
  }, [loadAuditAlertsCount]);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/store`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch inventory");
        const data = await response.json();
        const mapped = (data.data || []).map((item) => ({
          id: item.itemId,
          name: item.name,
          type: item.type,
          stock: item.stock,
          unit: item.unit,
          minThreshold: item.minThreshold,
          shelfLocation: item.shelfLocation,
          status: item.status,
        }));
        setInventory(mapped);
        setError("");
      } catch (err) {
        console.error("Error fetching inventory:", err);
        setError("Failed to load inventory");
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, [API_URL, token]);

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    const parsedAmount = parseInt(restockAmount);
    if (!parsedAmount || parsedAmount <= 0) return;
    try {
      setSaving(true);
      const newStock = selectedItem.stock + parsedAmount;
      const newStatus = newStock > selectedItem.minThreshold ? "In Stock" : "Low Stock";
      const response = await fetch(`${API_URL}/api/store/${selectedItem.id}/stock`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stock: newStock, status: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update stock");
      const result = await response.json();
      setInventory((prev) =>
        prev.map((item) => (item.id === selectedItem.id ? result.data : item))
      );
      setSelectedItem(null);
      setRestockAmount("");
      alert(`Restock successful. Added ${parsedAmount} units to ${selectedItem.name}.`);
    } catch (err) {
      alert(`Restock failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Filter Inventory based on Active Classification Tab and Search Query
  const filteredItems = inventory.filter(
    (item) =>
      item.type === activeTab &&
      (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  // Quick Logistics Counter Metrics
  const activeClassItems = inventory.filter((item) => item.type === activeTab);
  const lowStockCount = activeClassItems.filter(
    (item) => item.stock <= item.minThreshold,
  ).length;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 z-30">
        <div>
          <div className="p-6 border-b border-slate-200 flex items-center gap-3.5">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md">
              <Boxes size={20} />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-black text-lg tracking-wider text-slate-900">
                  MESRA
                </span>
                <span className="font-bold text-[10px] uppercase tracking-widest bg-blue-600 px-1.5 py-0.5 rounded text-white font-mono">
                  STORE
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono tracking-tight">
                Pharmacy Supply Logistics
              </p>
            </div>
          </div>

          {/* CLASSIFICATION SWITCHERS */}
          <nav className="p-4 space-y-1.5 pt-6">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-4 mb-2">
              Inventory Classes
            </p>

            <button
              onClick={() => {
                setActiveTab("medicines");
                setSelectedItem(null);
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "medicines" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-600 hover:bg-slate-100"}`}
            >
               <Heart size={16} />
               Medicines (Pharma)
            </button>

            <button
              onClick={() => {
                setActiveTab("non-medicines");
                setSelectedItem(null);
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "non-medicines" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-600 hover:bg-slate-100"}`}
            >
               <FolderSync size={16} />
               Non-Medicines (Consumables)
            </button>
            <button
              onClick={() => {
                setActiveTab("storeAudit");
                loadAuditLogs();
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "storeAudit" ? "bg-rose-50 text-rose-600" : "text-slate-600 hover:bg-slate-100"}`}
            >
               <ShieldAlert size={16} />
               Audit Activity ({auditAlertsCount})
            </button>
          </nav>
        </div>

        {/* LOGOUT SECURED FOOTER BOUNDARY */}
        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="bg-slate-100 rounded-xl p-3 border border-slate-200 text-[10px] font-mono text-slate-600 space-y-1">
            <p className="text-blue-600 font-bold">Depot Location: Main Wing</p>
            <p>Role: Store Logistics Manager</p>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-rose-950 text-slate-300 hover:text-rose-400 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
          >
            <LogOut size={14} /> Exit Platform
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT PANEL */}
      <StatusBanner />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-8 py-4 z-20 flex justify-between items-center shadow-sm">
          <h1 className="text-base font-bold tracking-wider text-slate-800 uppercase font-mono flex items-center gap-2">
            Supply Ledger Terminal:{" "}
            <span className="text-blue-600">
              {activeTab === "medicines" ? "Medicines" : "Non-Medicines"}
            </span>
          </h1>
          <div className="text-right font-mono text-[11px] text-slate-400">
            Audit Track:{" "}
            <span className="text-blue-500 font-bold">Live Asset Count</span>
          </div>
        </header>

        {/* LOGISTICS ANALYTICS COUNTERS */}
        <div className="px-8 pt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                Monitored Items (
                {activeTab === "medicines" ? "Pharma" : "Consumables"})
              </p>
              <h3 className="text-xl font-black text-slate-800 mt-1">
                {activeClassItems.length} Batch Profiles
              </h3>
            </div>
            <Boxes className="text-slate-300" size={24} />
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono font-bold text-rose-500 uppercase tracking-wider">
                Critical Threshold Breaches
              </p>
              <h3 className="text-xl font-black text-slate-800 mt-1">
                {lowStockCount} Profiles Low
              </h3>
            </div>
            <TrendingDown
              className={
                lowStockCount > 0
                  ? "text-rose-500 animate-bounce"
                  : "text-slate-300"
              }
              size={24}
            />
          </div>
        </div>

        <main className="flex-1 p-8 overflow-y-auto grid lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: STOCK PROFILES VIEW LIST */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-400 mb-3">
                Query Depot Records
              </h3>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Search by asset name or code identifier...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* ITEM LIST ROWS */}
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-5 bg-white border rounded-2xl cursor-pointer transition-all flex justify-between items-center ${selectedItem?.id === item.id ? "border-blue-600 ring-2 ring-blue-600/10 shadow-md" : "border-slate-200 shadow-sm hover:border-slate-300"}`}
                >
                  <div>
                    <span className="text-[10px] font-mono font-bold text-blue-600 block">
                      {item.id}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-1">
                      Location Assignment:{" "}
                      <span className="font-medium text-slate-600">
                        {item.shelfLocation}
                      </span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-black text-slate-800 font-mono">
                      {item.stock}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono ml-1">
                      {item.unit}
                    </span>
                    <span
                      className={`block px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider mt-1.5 ${item.status === "Low Stock" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: REPLENISHMENT CONTROL PANEL */}
          <div className="lg:col-span-5">
            {selectedItem ? (
              <form
                onSubmit={handleRestockSubmit}
                className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden"
              >
                <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                  <div>
                    <span className="text-xs font-mono text-blue-400 font-bold uppercase">
                      Asset Ingestion Matrix
                    </span>
                    <h2 className="text-base font-black tracking-wide text-white mt-0.5 truncate max-w-[200px]">
                      {selectedItem.name}
                    </h2>
                  </div>
                  <span className="text-xs font-mono font-bold bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-300 uppercase">
                    {selectedItem.id}
                  </span>
                </div>

                {selectedItem.status === "Low Stock" && (
                  <div className="bg-rose-50 border-b border-rose-100 px-6 py-3.5 text-xs text-rose-800 flex items-center gap-2 font-medium">
                    <AlertTriangle
                      size={15}
                      className="text-rose-600 shrink-0"
                    />
                    <p>
                      Item stock level has dropped below safety margin minimum (
                      {selectedItem.minThreshold} {selectedItem.unit}).
                    </p>
                  </div>
                )}

                <div className="p-8 space-y-6">
                  {/* Detailed Spec Block */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl font-mono text-xs text-slate-600">
                    <div>
                      <p className="text-slate-400 text-[10px] uppercase font-bold">
                        Current Reserve
                      </p>
                      <p className="text-sm font-black text-slate-800 mt-0.5">
                        {selectedItem.stock} {selectedItem.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px] uppercase font-bold">
                        Warehouse Slot
                      </p>
                      <p className="text-sm font-black text-slate-800 mt-0.5">
                        {selectedItem.shelfLocation}
                      </p>
                    </div>
                  </div>

                  {/* Restock Input Field */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                      Quantity Adjustment Influx ({selectedItem.unit})
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder={`Number of ${selectedItem.unit} to add...`}
                      value={restockAmount}
                      onChange={(e) => setRestockAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <PlusCircle size={15} /> Record Supply Entry Intake
                  </button>
                </div>
              </form>
            ) : (
              <div className="h-96 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col justify-center items-center text-slate-400 bg-white shadow-sm">
                <ShieldAlert size={36} className="text-slate-300 mb-2" />
                <p className="text-xs font-bold uppercase tracking-wider">
                  Select an asset batch row to run adjustment logs
                </p>
              </div>
            )}
          </div>
        </main>

        {activeTab === "storeAudit" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <div>
                  <h1 className="text-2xl font-black text-slate-900">Department Audit Logs</h1>
                  <p className="text-slate-400 font-medium mt-1">Your recent activity and department changes</p>
                </div>
                <span className="text-xs font-mono font-bold bg-rose-50 text-rose-600 border border-rose-100 px-3 py-1.5 rounded-lg uppercase">My Department</span>
              </div>
              {auditLogsError && (
                <div className="mx-6 mt-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">{auditLogsError}</div>
              )}
              {auditLogsLoading ? (
                <div className="p-10 text-center text-xs font-black text-slate-400 uppercase tracking-wider">Loading audit logs...</div>
              ) : auditLogs.length === 0 ? (
                <div className="p-10 text-center text-xs font-black text-slate-400 uppercase tracking-wider">No audit logs found for your department</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <div key={log._id || log.id} className="p-5 flex items-start gap-4 hover:bg-slate-50/50 transition">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
                        {log.action === "CREATE" && <PlusCircle size={18} />}
                        {log.action === "UPDATE" && <FileText size={18} />}
                        {log.action === "DELETE" && <X size={18} />}
                        {["ACTIVATE","DEACTIVATE","RESTORE","ARCHIVE"].includes(log.action) && <Activity size={18} />}
                        {log.action === "LOGIN" && <LogOut size={18} />}
                        {!["CREATE","UPDATE","DELETE","ACTIVATE","DEACTIVATE","RESTORE","ARCHIVE","LOGIN"].includes(log.action) && <ClipboardList size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-slate-900 uppercase">{log.module}</span>
                          <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase">{log.action}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{log.details}</p>
                        <p className="text-[10px] text-slate-400 mt-1.5 font-mono">{log.userName} • {log.userRole} • {log.department || '—'} • {new Date(log.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
