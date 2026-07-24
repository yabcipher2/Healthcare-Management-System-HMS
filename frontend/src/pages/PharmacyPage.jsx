import React, { useState, useEffect, useCallback } from "react";
import {
  Pill,
  Activity,
  LayoutDashboard,
  ClipboardList,
  Package,
  Search,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  Clock,
  TrendingUp,
  User,
  LogOut,
  Plus,
  ChevronRight,
  ArrowUpRight,
  Filter,
  Info,
  ShieldAlert,
  X,
  FileText,
  Menu,
} from "lucide-react";
import {
  logAudit,
  fetchAuditLogs,
  fetchAuditAlertsCount,
} from "../utils/audit";
import NotificationBell from "../components/NotificationBell";

export default function PharmacyPage({ onLogout }) {
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, prescriptions, inventory, pharmacyAudit
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const hospitalLogo = "/mesra icon.png";
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  // Medicine Stock Database
  const [inventory, setInventory] = useState([]);

  // Prescription Orders Queue
  const [orders, setOrders] = useState([]);
  const [todayDispensedCount, setTodayDispensedCount] = useState(0);
  const [loading, setLoading] = useState(true);
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

  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [inventoryRes, ordersRes] = await Promise.all([
        fetch(`${API_URL}/api/pharmacy/inventory`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/pharmacy/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!inventoryRes.ok || !ordersRes.ok)
        throw new Error("Failed to fetch data");
      const invData = await inventoryRes.json();
      const ordersData = await ordersRes.json();

      setInventory(invData.data || []);
      // Only display orders that are not yet dispensed in the active queue
      const activeOrders = (ordersData.data || []).filter(
        (order) =>
          order.status !== "Dispensed" && order.dispenseStatus !== "Dispensed",
      );
      setOrders(activeOrders);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching pharmacy data:", err);
    } finally {
      setLoading(false);
    }
  }, [API_URL, token]);

  // Fetch inventory and orders on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Calculate today's dispensed count whenever orders change
  useEffect(() => {
    if (orders.length === 0) {
      setTodayDispensedCount(0);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = orders.filter((order) => {
      const isDispensed =
        order.status === "Dispensed" || order.dispenseStatus === "Dispensed";
      if (!isDispensed) return false;

      const orderDate = new Date(order.timestamp);
      return orderDate >= today;
    }).length;

    setTodayDispensedCount(count);
  }, [orders]);

  // Handle Dispatch/Dispense Verification (only after payment confirmed)
  const handleDispenseSubmit = async (orderId) => {
    try {
      // Verify payment status first
      const paymentRes = await fetch(
        `${API_URL}/api/cashier/pharmacy/status/${orderId}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const paymentData = await paymentRes.json();
      if (!paymentData.isPaid) {
        alert(
          "Payment not yet confirmed. Please wait for cashier to process payment.",
        );
        return;
      }

      const response = await fetch(
        `${API_URL}/api/pharmacy/orders/${orderId}/dispense`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to dispense prescription");

      alert(
        `E-Prescription ${orderId} successfully logged, structural barcodes validated, and dispensed to patient.`,
      );

      // Optimistically remove from active queue immediately
      setOrders((prevOrders) =>
        prevOrders.filter((o) => o._id !== orderId && o.id !== orderId),
      );
      setSelectedOrder(null);
      loadAuditLogs();
    } catch (err) {
      alert(`Error: ${err.message}`);
      console.error("Error dispensing prescription:", err);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0E1B17] text-white font-sans antialiased">
      {/* SIDEBAR NAVIGATION PANEL (Pharmacy) */}
      <aside className={`${sidebarOpen ? "w-64" : "w-16"} bg-[#0E1B17] text-slate-300 flex flex-col justify-between shrink-0 sticky top-0 h-screen overflow-hidden z-30 font-mono border-r border-[#151a1e] transition-all duration-300`}>
        <div>
          <div className={`p-4 border-b border-[#29323a] flex items-center ${sidebarOpen ? "gap-2.5" : "justify-center"} bg-[#0E1B17]`}>
            <div className="w-8 h-8 rounded-lg bg-[#10B981] flex items-center justify-center border border-[#10B981]/20 shadow-md shrink-0">
              <LayoutDashboard size={16} className="text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h3 className="font-black tracking-wider text-[13px] text-white leading-none">
                  PULSE<span className="text-[#10B981]">TECHS</span>
                </h3>
                <span className="text-[9px] text-[#94A3B8] font-bold tracking-widest block mt-0.5 uppercase">
                  Pharmacy Terminal
                </span>
              </div>
            )}
          </div>

          {/* Sidebar Toggle Button */}
          <div className="p-2 border-b border-[#29323a]">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-full p-2 rounded-lg hover:bg-[#0E1B17] transition flex items-center justify-center gap-2 text-[#94A3B8] hover:text-white"
            >
              <Menu size={14} />
              {sidebarOpen && (
                <span className="text-[10px] font-bold">Toggle Menu</span>
              )}
            </button>
          </div>

          {/* Nav Stack */}
          <div className="p-3 space-y-1">
            {sidebarOpen && (
              <div className="text-[9px] font-black uppercase text-[#94A3B8] px-3 py-2 tracking-widest">
                Interface Channels
              </div>
            )}

            <button
              onClick={() => {
                setActiveTab("dashboard");
                setSelectedOrder(null);
              }}
              className={`w-full flex items-center justify-center ${sidebarOpen ? "px-3" : "px-2"} py-2.5 rounded-lg font-bold uppercase tracking-wider transition ${activeTab === "dashboard" ? "bg-[#10B981] text-white shadow-md font-black" : "text-[#94A3B8] hover:bg-[#0E1B17] hover:text-white"}`}
            >
              <LayoutDashboard size={14} /> {sidebarOpen && <span className="ml-2.5">System Dashboard</span>}
            </button>

            <button
              onClick={() => {
                setActiveTab("prescriptions");
                setSelectedOrder(null);
              }}
              className={`w-full flex items-center justify-between ${sidebarOpen ? "px-3" : "px-2"} py-2.5 rounded-lg font-bold uppercase tracking-wider transition ${activeTab === "prescriptions" ? "bg-[#10B981] text-white shadow-md font-black" : "text-[#94A3B8] hover:bg-[#0E1B17] hover:text-white"}`}
            >
              <div className="flex items-center">
                <ClipboardList size={14} /> {sidebarOpen && <span className="ml-2.5">Prescriptions Queue</span>}
              </div>
              {sidebarOpen && (
                <span className="bg-[#0E1B17] text-[#10B981] border border-[#10B981]/20 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                  {orders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("pharmacyAudit")}
              className={`w-full flex items-center justify-between ${sidebarOpen ? "px-3" : "px-2"} py-2.5 rounded-lg font-bold uppercase tracking-wider transition ${activeTab === "pharmacyAudit" ? "bg-amber-600 text-white shadow-md font-black" : "text-[#94A3B8] hover:bg-[#0E1B17] hover:text-white"}`}
            >
              <div className="flex items-center">
                <ShieldAlert size={14} /> {sidebarOpen && <span className="ml-2.5">Security Trails</span>}
              </div>
              {sidebarOpen && (
                <span className="bg-[#0E1B17] text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">
                  {auditAlertsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Profile and Token Destruct Triggers */}
        <div className="p-4 border-t border-[#29323a] bg-[#0E1B17] space-y-3">
          {sidebarOpen && (
            <div className="bg-[#0E1B17] rounded-lg p-2.5 border border-[#0E1B17] text-[10px]">
              <div className="flex items-center gap-1.5 text-[#10B981] font-bold uppercase tracking-wide mb-1">
                <User size={12} /> <span>Pharmacist Account</span>
              </div>
              <p className="text-white truncate font-bold text-[11px]">
                {"Pharmacist"}
              </p>
              <p className="text-[#94A3B8] truncate text-[9px] mt-0.5">
                Pharmacy Module
              </p>
            </div>
          )}
          <button
            onClick={onLogout}
            className="w-full py-2 bg-[#EF4444]/40 hover:bg-[#b91c1c] border border-[#EF4444]/30 text-[#EF4444] font-bold uppercase text-[10px] tracking-wider rounded-lg transition flex items-center justify-center gap-1.5"
          >
            <LogOut size={13} /> {sidebarOpen && "Terminate Session"}
          </button>
        </div>
      </aside>

      {/* CORE WORKSPACE AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-[#0E1B17] border-b border-white/20/80 sticky top-0 px-8 py-5 z-20 flex justify-between items-center">
          <h1 className="text-sm font-black tracking-widest text-white uppercase font-mono">
            {activeTab === "dashboard" && "Pharmacy Velocity & Flow Operations"}
            {activeTab === "prescriptions" &&
              (selectedOrder
                ? "Electronic Prescription Validation"
                : "Active Medical Routing Stream")}
            {activeTab === "inventory" && "Real-Time Central Stock Manifest"}
            {activeTab === "pharmacyAudit" && "Security Auditing Protocols"}
          </h1>
          <div className="flex items-center gap-3">
            <NotificationBell role="Pharmacy" />
            <div className="flex items-center gap-2 font-mono text-xs text-[#94A3B8] bg-[#0E1B17] px-3 py-1.5 rounded-lg border border-white/20/40">
              <Clock size={12} className="text-[#10B981]" /> Active System Sync:{" "}
              <span className="font-bold text-white">11:02 PM</span>
            </div>
          </div>
        </header>

        {/* WORKSPACE VIEWS WRAPPED PROPERLY INSIDE MAIN SCROLL CONTAINER */}
        <main className="flex-1 p-8 overflow-y-auto">
          {/* DYNAMIC PHARMACY OPERATIONAL DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 tracking-normal">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    label: "Pending Dispenses",
                    value: orders.length,
                    icon: <ClipboardList size={18} />,
                    bg: "bg-[#10B981] text-white",
                  },
                  {
                    label: "Out of Stock Alerts",
                    value:
                      inventory.filter((i) => i.status === "Out of Stock")
                        .length + " Items",
                    icon: <AlertTriangle size={18} />,
                    bg: "bg-[#EF4444]/10 text-[#EF4444] border border-rose-100",
                  },
                  {
                    label: "Low Stocks Flagged",
                    value:
                      inventory.filter((i) => i.status === "Low Stock").length +
                      " SKUs",
                    icon: <Info size={18} />,
                    bg: "bg-amber-500/10 text-amber-300 border border-amber-500/30",
                  },
                  {
                    label: "Total Dispensed Today",
                    value: `${todayDispensedCount} Orders`,
                    icon: <TrendingUp size={18} />,
                    bg: "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="p-5 rounded-2xl flex items-center justify-between shadow-sm bg-[#0E1B17] border border-white/20/60"
                  >
                    <div>
                      <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider block">
                        {stat.label}
                      </span>
                      <span className="text-2xl font-black text-white mt-1 block font-mono">
                        {stat.value}
                      </span>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bg}`}>
                      {stat.icon}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-[#0E1B17] rounded-2xl border border-white/20 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">
                    Critical Inventory Action Needed
                  </h4>
                  <p className="text-xs text-[#94A3B8]">
                    Certain formulations have dipped below minimal structural
                    stock safety parameters due to heavy prescription processing
                    cycles.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("inventory")}
                  className="px-4 py-2 bg-[#050B09] hover:bg-[#0E1B17] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm shrink-0"
                >
                  Review Low Stock Items
                </button>
              </div>
            </div>
          )}

          {/* PRESCRIPTIONS QUEUE STREAM */}
          {activeTab === "prescriptions" && !selectedOrder && (
            <div className="space-y-6">
              <div className="bg-[#0E1B17] border border-white/20 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0E1B17] border-b border-white/20 text-[11px] font-bold uppercase text-[#94A3B8] font-mono">
                      <th className="p-4 px-6">Order ID</th>
                      <th className="p-4 px-6">Patient Identifier (Card ID)</th>
                      <th className="p-4 px-6">Prescribed By</th>
                      <th className="p-4 px-6">Time Received</th>
                      <th className="p-4 px-6">Payment</th>
                      <th className="p-4 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-200">
                    {orders.length === 0 ? (
                      <tr>
                        <td
                          colSpan="7"
                          className="p-8 text-center text-[#94A3B8] font-mono"
                        >
                          No pending electronic prescription orders routed to
                          this station.
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => {
                        const oId = order._id || order.id;
                        const isPaid = order.cashierStatus === "PAID";
                        return (
                          <tr
                            key={order._id}
                            className="hover:bg-[#0E1B17]/60 transition-all"
                          >
                            <td className="p-4 px-6 font-mono text-[#10B981] font-bold">
                              {order.orderId}
                            </td>
                            <td className="p-4 px-6 text-white font-black font-mono text-[10px]">
                              REQ_TOKEN:{" "}
                              {order.patientCardId || order.mrn || "ANONYMIZED"}
                            </td>
                            <td className="p-4 px-6 text-slate-300">
                              {order.doctorName}
                            </td>
                            <td className="p-4 px-6 text-[#94A3B8] font-mono">
                              {order.timestamp}
                            </td>
                            <td className="p-4 px-6">
                              {isPaid ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 text-[10px] font-black uppercase rounded-md">
                                  ✓ Paid
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/50 text-[10px] font-black uppercase rounded-md">
                                  Awaiting Payment
                                </span>
                              )}
                            </td>
                            <td className="p-4 px-6 text-right">
                              <button
                                onClick={() => {
                                  if (!isPaid) {
                                    alert(
                                      "Payment not yet confirmed by cashier. Please wait for cashier to process payment.",
                                    );
                                    return;
                                  }
                                  setSelectedOrder(order);
                                }}
                                className={`inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm ${
                                  isPaid
                                    ? "bg-[#10B981] hover:bg-[#0D9668] text-white cursor-pointer"
                                    : "bg-[#0E1B17] text-[#94A3B8] cursor-not-allowed"
                                }`}
                              >
                                {isPaid ? "Proceed" : "Locked"}{" "}
                                <ChevronRight size={12} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PRESCRIPTION DISPENSING WORKSPACE */}
          {activeTab === "prescriptions" && selectedOrder && (
            <div className="max-w-4xl mx-auto bg-[#0E1B17] border border-white/20 rounded-3xl shadow-xl overflow-hidden text-white">
              <div className="p-6 bg-[#050B09] text-white flex justify-between items-center">
                <div>
                  <h2 className="text-base font-black uppercase tracking-wider">
                    Prescription Verification Terminal
                  </h2>
                  <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
                    MRN Sequence:{" "}
                    {selectedOrder.mrn || selectedOrder.patientCardId} | Order
                    Dispatch: {selectedOrder.orderId}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-xs bg-[#0E1B17] text-[#94A3B8] px-3 py-1.5 rounded-lg hover:text-white transition-all"
                >
                  Back to List
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="bg-[#0E1B17] border border-white/20 p-4 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <strong>Prescribed By:</strong> {selectedOrder.doctorName}
                  </div>
                  <div className="font-mono text-[#94A3B8]">
                    Routed timestamp: {selectedOrder.timestamp}
                  </div>
                </div>

                <h3 className="text-xs font-black text-[#94A3B8] uppercase tracking-widest block pt-2">
                  Authorized Medication Lines
                </h3>

                <div className="space-y-4">
                  {selectedOrder.medications &&
                    selectedOrder.medications.map((med, index) => {
                      const medKey = `${selectedOrder.orderId}-med-${index}`;
                      const invItem =
                        inventory.find((i) => i.name === med.name) || {};
                      return (
                        <div
                          key={medKey}
                          className="p-5 border border-white/20 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0E1B17] hover:bg-[#0E1B17]/50"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-white">
                                {med.name} {med.strength}
                              </h4>
                              <span className="bg-[#0E1B17] text-slate-300 font-mono text-[10px] px-2 py-0.5 rounded-md">
                                {med.formulation}
                              </span>
                            </div>
                            <p className="text-xs text-[#94A3B8] font-medium">
                              {med.dosage} —{" "}
                              <span className="text-[#10B981] font-bold">
                                {med.frequency}
                              </span>{" "}
                              for {med.duration}
                            </p>
                          </div>
                          <div className="text-left sm:text-right font-mono text-xs">
                            <span className="block text-[#94A3B8] text-[10px] font-bold uppercase tracking-wider">
                              Required Qty
                            </span>
                            <span className="text-sm font-black text-white">
                              {med.quantityRequired} Units
                            </span>
                            <span className="block text-[#10B981] text-[10px] font-bold mt-1 bg-[#10B981]/10 px-2 py-0.5 rounded-md">
                              {invItem.shelf || "N/A Shelf"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div className="flex gap-3 justify-end pt-6 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="px-5 py-2.5 bg-[#0E1B17] hover:bg-[#0a1f19] text-slate-300 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                  >
                    Postpone Verification
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDispenseSubmit(selectedOrder._id)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#10B981] hover:bg-[#0D9668] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#10B981]/20"
                  >
                    <ShieldCheck size={14} /> Authorize & Dispense Formula
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MASTER FORMULARY INVENTORY MANIFEST */}
          {activeTab === "inventory" && (
            <div className="space-y-6">
              <div className="bg-[#0E1B17] border border-white/20 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
                <div className="relative w-full sm:w-80">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                    size={14}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search stock by generic name, formulation..."
                    className="w-full pl-9 pr-4 py-2 bg-[#0E1B17] border border-white/20 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="bg-[#0E1B17] border border-white/20 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0E1B17] border-b border-white/20 text-[11px] font-bold uppercase text-[#94A3B8] font-mono">
                      <th className="p-4 px-6">SKU Code</th>
                      <th className="p-4 px-6">Generic Description</th>
                      <th className="p-4 px-6">Strength & Batch</th>
                      <th className="p-4 px-6">Active Stock Balance</th>
                      <th className="p-4 px-6">Storage Shelf</th>
                      <th className="p-4 px-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-200">
                    {inventory
                      .filter((i) =>
                        i.name
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()),
                      )
                      .map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-[#0E1B17]/60 transition-all"
                        >
                          <td className="p-4 px-6 font-mono text-[#94A3B8] text-xs">
                            {item.id}
                          </td>
                          <td className="p-4 px-6">
                            <span className="text-white font-bold text-sm block">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-[#94A3B8] font-mono font-bold block mt-0.5 uppercase tracking-wide">
                              {item.formulation}
                            </span>
                          </td>
                          <td className="p-4 px-6">
                            <span className="text-slate-200 font-bold">
                              {item.strength}
                            </span>
                            <span className="block text-[10px] text-[#94A3B8] font-mono">
                              Lot: {item.batch}
                            </span>
                          </td>
                          <td className="p-4 px-6 font-mono">
                            <span
                              className={`text-sm font-black ${item.stock <= item.minLevel ? "text-amber-300" : "text-white"}`}
                            >
                              {item.stock}
                            </span>
                            <span className="block text-[9px] text-[#94A3B8] font-bold uppercase">
                              Min Limit: {item.minLevel}
                            </span>
                          </td>
                          <td className="p-4 px-6 text-slate-300 font-mono font-bold">
                            {item.shelf}
                          </td>
                          <td className="p-4 px-6 text-right">
                            <span
                              className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                                item.status === "In Stock"
                                  ? "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20"
                                  : item.status === "Low Stock"
                                    ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                                    : "bg-[#EF4444]/10 text-[#EF4444] border border-rose-100"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DEPARTMENT AUDIT LOGS */}
          {activeTab === "pharmacyAudit" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#0E1B17] rounded-3xl border border-white/20 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#0E1B17]/30">
                  <div>
                    <h4 className="text-xs font-black text-white truncate">
                      Pharmacist
                    </h4>
                    <p className="text-[10px] text-[#94A3B8] font-medium truncate">
                      Pharmacy Module
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-[#EF4444]/10 text-[#EF4444] border border-rose-100 px-3 py-1.5 rounded-lg uppercase">
                    Pharmacy Dept
                  </span>
                </div>
                {auditLogsError && (
                  <div className="mx-6 mt-6 p-4 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl text-xs font-bold text-[#EF4444]">
                    {auditLogsError}
                  </div>
                )}
                {auditLogsLoading ? (
                  <div className="p-10 text-center text-xs font-black text-[#94A3B8] uppercase tracking-wider">
                    Loading audit logs...
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="p-10 text-center text-xs font-black text-[#94A3B8] uppercase tracking-wider">
                    No audit logs found for your department
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <div
                        key={log._id || log.id}
                        className="p-5 flex items-start gap-4 hover:bg-[#0E1B17]/50 transition"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#0E1B17] flex items-center justify-center shrink-0 text-[#94A3B8]">
                          {log.action === "CREATE" && <Plus size={18} />}
                          {log.action === "UPDATE" && <FileText size={18} />}
                          {log.action === "DELETE" && <X size={18} />}
                          {[
                            "ACTIVATE",
                            "DEACTIVATE",
                            "RESTORE",
                            "ARCHIVE",
                          ].includes(log.action) && <Activity size={18} />}
                          {log.action === "LOGIN" && <LogOut size={18} />}
                          {![
                            "CREATE",
                            "UPDATE",
                            "DELETE",
                            "ACTIVATE",
                            "DEACTIVATE",
                            "RESTORE",
                            "ARCHIVE",
                            "LOGIN",
                          ].includes(log.action) && <ClipboardList size={18} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-white uppercase">
                              {log.module}
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-[#10B981]/10 text-[#10B981] px-2 py-0.5 rounded uppercase">
                              {log.action}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                            {log.details}
                          </p>
                          <p className="text-[10px] text-[#94A3B8] mt-1.5 font-mono">
                            {log.userName} • {log.userRole} • {log.department} •{" "}
                            {new Date(log.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
