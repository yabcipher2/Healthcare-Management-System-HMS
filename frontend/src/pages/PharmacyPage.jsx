import React, { useState, useEffect } from "react";
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
  Users,
  LogOut,
  Plus,
  ArrowUpRight,
  Filter,
  Info,
} from "lucide-react";

export default function PharmacyPage({ onLogout }) {
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, prescriptions, inventory
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const hospitalLogo = "/mesra icon.png";
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  // Medicine Stock Database
  const [inventory, setInventory] = useState([]);

  // Prescription Orders Queue
  const [orders, setOrders] = useState([]);
  const [todayDispensedCount, setTodayDispensedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Doctor Dispatch State
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [doctorsByDepartment, setDoctorsByDepartment] = useState([]);
  const [dispatchingDoctor, setDispatchingDoctor] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState(null); // null, 'success', 'error'

  // Fetch inventory and orders on component mount
  useEffect(() => {
    const fetchData = async () => {
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
        setOrders(ordersData.data || []);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching pharmacy data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_URL, token]);

  // Calculate today's dispensed count whenever orders change
  useEffect(() => {
    if (orders.length === 0) {
      setTodayDispensedCount(0);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = orders.filter((order) => {
      // Check if order is dispensed (either status or dispenseStatus)
      const isDispensed =
        order.status === "Dispensed" || order.dispenseStatus === "Dispensed";
      if (!isDispensed) return false;

      // Check if order was created today (timestamp is stored as ISO string)
      const orderDate = new Date(order.timestamp);
      return orderDate >= today;
    }).length;

    setTodayDispensedCount(count);
  }, [orders]);

  // Handle Dispatch/Dispense Verification
  const handleDispenseSubmit = async (orderId) => {
    try {
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

      // Remove from active queue
      setOrders((prevOrders) => prevOrders.filter((o) => o._id !== orderId));
      setSelectedOrder(null);

      // Refresh inventory
      const invResponse = await fetch(`${API_URL}/api/pharmacy/inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const invData = await invResponse.json();
      setInventory(invData.data || []);

      alert(
        `E-Prescription ${orderId} successfully logged, structural barcodes validated, and dispensed to patient.`,
      );
    } catch (err) {
      alert(`Error: ${err.message}`);
      console.error("Error dispensing prescription:", err);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      {/* SIDEBAR NAVIGATION PANEL */}
      <aside className="w-68 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 z-30">
        <div>
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <img
              src={hospitalLogo}
              alt="Mesra Logo"
              className="w-10 h-10 object-contain rounded-xl"
            />
            <div>
              <h3 className="font-black text-slate-900 tracking-tight text-md leading-none">
                MESRA <span className="text-blue-600">PHARMACY</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono tracking-widest block mt-1 uppercase font-bold">
                Dispensing System
              </span>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setSelectedOrder(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "dashboard" ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              <LayoutDashboard size={16} /> Dashboard Stats
            </button>
            <button
              onClick={() => {
                setActiveTab("prescriptions");
                setSelectedOrder(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "prescriptions" ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              <ClipboardList size={16} /> Live Rx Requests ({orders.length})
            </button>
            <button
              onClick={() => {
                setActiveTab("inventory");
                setSelectedOrder(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "inventory" ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              <Package size={16} /> Master Formulary Stock
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3 text-[11px] font-mono text-slate-500 mb-3 border border-slate-200/60">
            <p className="font-bold text-blue-600">Dispensing Terminal</p>
            <p>Node ID: PHAR-MAIN-02</p>
            <p>Pharmacist: R. Tadesse</p>
          </div>
          <button
            onClick={() => {
              // 1. Session Cleansing Sequence
              localStorage.clear(); // Flush application state & tokens from local cache
              sessionStorage.clear(); // Purge temporary runtime session values

              // 2. Client Routing Redirection
              window.location.href = "/login";
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900 text-slate-400 hover:text-rose-400 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
          >
            <LogOut size={14} /> Exit Platform
          </button>
        </div>
      </aside>

      {/* CORE WORKSPACE AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200/80 sticky top-0 px-8 py-5 z-20 flex justify-between items-center">
          <h1 className="text-sm font-black tracking-widest text-slate-900 uppercase font-mono">
            {activeTab === "dashboard" && "Pharmacy Velocity & Flow Operations"}
            {activeTab === "prescriptions" &&
              (selectedOrder
                ? "Electronic Prescription Validation"
                : "Active Medical Routing Stream")}
            {activeTab === "inventory" && "Real-Time Central Stock Manifest"}
          </h1>
          <div className="flex items-center gap-2 font-mono text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/40">
            <Clock size={12} className="text-blue-600" /> Active System Sync:{" "}
            <span className="font-bold text-slate-800">11:02 PM</span>
          </div>
        </header>

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
                    bg: "bg-blue-600 text-white",
                  },
                  {
                    label: "Out of Stock Alerts",
                    value:
                      inventory.filter((i) => i.status === "Out of Stock")
                        .length + " Items",
                    icon: <AlertTriangle size={18} />,
                    bg: "bg-rose-50 text-rose-600 border border-rose-100",
                  },
                  {
                    label: "Low Stocks Flagged",
                    value:
                      inventory.filter((i) => i.status === "Low Stock").length +
                      " SKUs",
                    icon: <Info size={18} />,
                    bg: "bg-amber-50 text-amber-600 border border-amber-100",
                  },
                  {
                    label: "Total Dispensed Today",
                    value: `${todayDispensedCount} Orders`,
                    icon: <TrendingUp size={18} />,
                    bg: "bg-emerald-50 text-emerald-600 border border-emerald-100",
                  },
                ].map((stat, idx) => (
                  <div
                    key={stat.label}
                    className="p-5 rounded-2xl flex items-center justify-between shadow-sm bg-white border border-slate-200/60"
                  >
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        {stat.label}
                      </span>
                      <span className="text-2xl font-black text-slate-900 mt-1 block font-mono">
                        {stat.value}
                      </span>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bg}`}>
                      {stat.icon}
                    </div>
                  </div>
                ))}
              </div>

              {/* Warnings and Quick Navigation Callout */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Critical Inventory Action Needed
                  </h4>
                  <p className="text-xs text-slate-500">
                    Certain formulations have dipped below minimal structural
                    stock safety parameters due to heavy prescription processing
                    cycles.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("inventory")}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm shrink-0"
                >
                  Review Low Stock Items
                </button>
              </div>
            </div>
          )}

          {/* PRESCRIPTIONS QUEUE STREAM */}
          {activeTab === "prescriptions" && !selectedOrder && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 font-mono">
                      <th className="p-4 px-6">Order ID</th>
                      <th className="p-4 px-6">Patient Name</th>
                      <th className="p-4 px-6">MRN Token</th>
                      <th className="p-4 px-6">Prescribed By</th>
                      <th className="p-4 px-6">Time Received</th>
                      <th className="p-4 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {orders.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="p-8 text-center text-slate-400 font-mono"
                        >
                          No pending electronic prescription orders routed to
                          this station.
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr
                          key={order._id}
                          className="hover:bg-slate-50/60 transition-all"
                        >
                          <td className="p-4 px-6 font-mono text-blue-600 font-bold">
                            {order.orderId}
                          </td>
                          <td className="p-4 px-6 text-slate-900 font-bold text-sm">
                            {order.patientName}{" "}
                            <span className="text-xs text-slate-400 font-normal">
                              ({order.age} Yrs)
                            </span>
                          </td>
                          <td className="p-4 px-6 font-mono text-slate-500">
                            {order.mrn}
                          </td>
                          <td className="p-4 px-6 text-slate-600">
                            {order.doctorName}
                          </td>
                          <td className="p-4 px-6 text-slate-400 font-mono">
                            {order.timestamp}
                          </td>
                          <td className="p-4 px-6 text-right">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-[11px] font-black uppercase tracking-wider rounded-xl hover:bg-blue-700 transition-all shadow-sm"
                            >
                              Process Rx
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PRESCRIPTION DISPENSING WORKSPACE */}
          {activeTab === "prescriptions" && selectedOrder && (
            <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden text-slate-800">
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold uppercase tracking-wider">
                    {selectedOrder.patientName}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    MRN ID: {selectedOrder.mrn} | Order Node:{" "}
                    {selectedOrder.orderId}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-xs bg-slate-800 text-slate-400 px-3 py-1.5 rounded-lg hover:text-white transition-all"
                >
                  Back to List
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <strong>Prescribed By:</strong> {selectedOrder.doctorName}
                  </div>
                  <div className="font-mono text-slate-400">
                    Routed timestamp: {selectedOrder.timestamp}
                  </div>
                </div>

                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest block pt-2">
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
                          className="p-5 border border-slate-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white hover:bg-slate-50/50"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-slate-900">
                                {med.name} {med.strength}
                              </h4>
                              <span className="bg-slate-100 text-slate-600 font-mono text-[10px] px-2 py-0.5 rounded-md">
                                {med.formulation}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                              {med.dosage} —{" "}
                              <span className="text-blue-600 font-bold">
                                {med.frequency}
                              </span>{" "}
                              for {med.duration}
                            </p>
                          </div>
                          <div className="text-left sm:text-right font-mono text-xs">
                            <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                              Required Qty
                            </span>
                            <span className="text-sm font-black text-slate-900">
                              {med.quantityRequired} Units
                            </span>
                            <span className="block text-blue-600 text-[10px] font-bold mt-1 bg-blue-50 px-2 py-0.5 rounded-md">
                              {invItem.shelf || "N/A Shelf"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div className="flex gap-3 justify-end pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                  >
                    Postpone Verification
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDispenseSubmit(selectedOrder._id)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-blue-200"
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
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
                <div className="relative w-full sm:w-80">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={14}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search stock by generic name, formulation..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 font-mono">
                      <th className="p-4 px-6">SKU Code</th>
                      <th className="p-4 px-6">Generic Description</th>
                      <th className="p-4 px-6">Strength & Batch</th>
                      <th className="p-4 px-6">Active Stock Balance</th>
                      <th className="p-4 px-6">Storage Shelf</th>
                      <th className="p-4 px-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {inventory
                      .filter((i) =>
                        i.name
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()),
                      )
                      .map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/60 transition-all"
                        >
                          <td className="p-4 px-6 font-mono text-slate-500 text-xs">
                            {item.id}
                          </td>
                          <td className="p-4 px-6">
                            <span className="text-slate-900 font-bold text-sm block">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono font-bold block mt-0.5 uppercase tracking-wide">
                              {item.formulation}
                            </span>
                          </td>
                          <td className="p-4 px-6">
                            <span className="text-slate-700 font-bold">
                              {item.strength}
                            </span>
                            <span className="block text-[10px] text-slate-400 font-mono">
                              Lot: {item.batch}
                            </span>
                          </td>
                          <td className="p-4 px-6 font-mono">
                            <span
                              className={`text-sm font-black ${item.stock <= item.minLevel ? "text-amber-600" : "text-slate-900"}`}
                            >
                              {item.stock}
                            </span>
                            <span className="block text-[9px] text-slate-400 font-bold uppercase">
                              Min Limit: {item.minLevel}
                            </span>
                          </td>
                          <td className="p-4 px-6 text-slate-600 font-mono font-bold">
                            {item.shelf}
                          </td>
                          <td className="p-4 px-6 text-right">
                            <span
                              className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                                item.status === "In Stock"
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                  : item.status === "Low Stock"
                                    ? "bg-amber-50 text-amber-600 border border-amber-100"
                                    : "bg-rose-50 text-rose-600 border border-rose-100"
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
        </main>
      </div>
    </div>
  );
}
