import React, { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Hourglass,
  Wallet,
  Zap,
  Search,
  FlaskConical,
  ClipboardCheck,
  LogOut,
  User,
  FolderOpen,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import SidebarCollapseButton from "../components/SidebarCollapseButton";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Lab orders carry panel names but no tariff, so the cashier applies the
// hospital's standard panel price before taking payment.
const PANEL_PRICES = [
  { match: /cbc|complete blood/i, price: 250 },
  { match: /lft|liver/i, price: 580 },
  { match: /rbs|blood sugar|glucose/i, price: 120 },
  { match: /widal|weil/i, price: 300 },
  { match: /urin/i, price: 150 },
  { match: /creatinine|renal/i, price: 200 },
  { match: /lipid/i, price: 450 },
  { match: /hba1c|glycated/i, price: 350 },
  { match: /bun|urea/i, price: 200 },
  { match: /stool/i, price: 150 },
  { match: /esr|sedimentation/i, price: 150 },
  { match: /pylori/i, price: 320 },
  { match: /electrolyte/i, price: 260 },
  { match: /culture/i, price: 500 },
  { match: /tsh|thyroid/i, price: 400 },
];

const panelPrice = (name) =>
  PANEL_PRICES.find((entry) => entry.match.test(name || ""))?.price ?? 250;

// Map a laboratory order onto the billing queue card the cashier works with.
const mapOrder = (order) => {
  const panels = order.panels?.length ? order.panels : ["Laboratory Panel"];
  return {
    id: order._id,
    accessionId: order.accessionId,
    name: order.patientName || "Unknown Patient",
    cardId: order.patientCardId || "—",
    age: order.age,
    gender: order.gender,
    referredBy: order.requestedBy || "—",
    urgency: order.urgency || "Routine",
    date: order.timestamp || order.createdAt,
    tests: panels.map((panel, index) => ({
      id: `${order._id}-${index}`,
      name: panel,
      price: panelPrice(panel),
      checked: true,
    })),
  };
};

export default function LabCashierPage({ onLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Animation/notification feedback state
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const hospitalLogo = "/mesra icon.png";

  // Live billing queue: every lab order a doctor has dispatched that is still
  // unpaid, so patients waiting on payment show up here automatically.
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  const fetchPendingOrders = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/cashier/lab/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        onLogout?.();
        return;
      }
      if (!response.ok) {
        throw new Error(
          response.status === 403
            ? "This account is not cleared for the laboratory billing desk."
            : "Failed to load the laboratory billing queue.",
        );
      }
      const data = await response.json();
      const unpaid = (data.data || [])
        .filter(
          (order) =>
            order.status !== "Completed" &&
            order.cashierStatus !== "PAID" &&
            order.cashierStatus !== "BYPASSED_EMERGENCY",
        )
        .map(mapOrder);
      setPendingRequests(unpaid);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load the laboratory billing queue.");
    } finally {
      setLoading(false);
    }
  }, [token, onLogout]);

  useEffect(() => {
    fetchPendingOrders();
    const interval = setInterval(fetchPendingOrders, 15000);
    return () => clearInterval(interval);
  }, [fetchPendingOrders]);

  const handleSelectPatient = (patient) => {
    setPaymentSuccess(false);
    setSelectedPatient({ ...patient, tests: patient.tests.map(t => ({ ...t })) });
  };

  const toggleItem = (itemId) => {
    setSelectedPatient(prev => ({
      ...prev,
      tests: prev.tests.map(item =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      )
    }));
  };

  // Compute live billing metrics
  const totalItemsCount = selectedPatient ? selectedPatient.tests.filter(t => t.checked).length : 0;
  const totalPrice = selectedPatient ? selectedPatient.tests.reduce((acc, item) => item.checked ? acc + item.price : acc, 0) : 0;

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedPatient || submitting) return;

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(
        `${API_URL}/api/cashier/lab/${selectedPatient.id}/pay`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            paymentMethod,
            referenceNumber,
            amountPaid: totalPrice,
          }),
        },
      );
      if (response.status === 401) {
        onLogout?.();
        return;
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Payment could not be recorded.");
      }

      setPaymentSuccess(true);
      setTimeout(() => {
        setPendingRequests((prev) =>
          prev.filter((p) => p.id !== selectedPatient.id),
        );
        setSelectedPatient(null);
        setPaymentSuccess(false);
        setReferenceNumber("");
        setPaymentMethod("Cash");
        fetchPendingOrders();
      }, 1800);
    } catch (err) {
      setError(err.message || "Payment could not be recorded.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter queue by patient name or card ID
  const filteredRequests = pendingRequests.filter((p) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      p.name.toLowerCase().includes(query) ||
      String(p.cardId || "").toLowerCase().includes(query) ||
      String(p.accessionId || "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex min-h-screen bg-[#050B09] text-white font-sans antialiased text-[10px]">
      {/* SIDEBAR — LAB CASHIER NODE */}
      <aside
        className={`${isSidebarOpen ? "w-56" : "w-16"} bg-[#0E1B17] text-slate-300 flex flex-col justify-between shrink-0 sticky top-0 h-screen overflow-hidden z-30 font-mono border-r border-[#0E1B17] transition-all duration-300`}
      >
        <div>
          <div className={`p-4 border-b border-[#29323a] flex items-center ${isSidebarOpen ? "gap-2.5" : "justify-center"} bg-[#0E1B17]`}>
            <div className="w-8 h-8 rounded-lg bg-[#10B981] flex items-center justify-center border border-[#10B981]/20 shadow-md shrink-0">
              <img src={hospitalLogo} alt="Mesra Logo" className="w-full h-full object-contain" />
            </div>
            {isSidebarOpen && (
              <div>
                <h3 className="font-black tracking-wider text-[12px] text-white leading-none">
                  MESRA<span className="text-[#10B981]">DIGITAL</span>
                </h3>
                <span className="text-[8px] text-[#94A3B8] font-bold tracking-widest block mt-0.5 uppercase">
                  Lab Billing Node
                </span>
              </div>
            )}
          </div>

          {/* Sidebar Collapse Control */}
          <SidebarCollapseButton
            collapsed={!isSidebarOpen}
            onToggle={() => setIsSidebarOpen((open) => !open)}
            label="lab cashier sidebar"
          />

          <nav className="p-3 space-y-1">
            {isSidebarOpen && (
              <div className="text-[8px] font-black uppercase text-[#94A3B8] px-3 py-2 tracking-widest">
                Interface Channels
              </div>
            )}

            <button
              className="w-full flex items-center justify-center px-3 py-2.5 rounded-lg font-bold uppercase tracking-wider transition bg-[#10B981] text-white shadow-md font-black"
            >
              <CreditCard size={14} />
              {isSidebarOpen && <span className="ml-2.5">Lab Cashier Desk</span>}
            </button>

            <div className={`pt-3 space-y-1 ${isSidebarOpen ? "" : "hidden"}`}>
              <div className="text-[8px] font-black uppercase text-[#94A3B8] px-3 py-1 tracking-widest">
                Active Session Controls
              </div>
              <div className="px-3 py-2 rounded-lg bg-[#050B09] border border-[#29323a] text-[#94A3B8] flex items-center gap-2">
                <User size={12} className="text-[#10B981]" />
                <span className="truncate">Cashier Terminal #02</span>
              </div>
            </div>
          </nav>
        </div>

        <div className="p-3 border-t border-[#29323a] bg-[#0E1B17] space-y-2.5">
          {isSidebarOpen && (
            <div className="bg-[#0a1510] rounded-lg p-2 border border-[#29323a] text-[10px] leading-relaxed">
              <div className="flex items-center gap-1.5 text-[#10B981] font-bold uppercase tracking-wide mb-0.5">
                <User size={11} /> <span>Operator Account</span>
              </div>
              <p className="text-white truncate font-medium">Lab Cashier</p>
              <p className="text-[#94A3B8] truncate text-[9px]">Billing & Settlement</p>
            </div>
          )}
          <button
            onClick={onLogout}
            className="w-full py-1.5 bg-[#EF4444]/10 hover:bg-[#b91c1c]/40 border border-[#EF4444]/30 text-[#EF4444] font-bold uppercase text-[10px] tracking-widest rounded transition flex items-center justify-center gap-1.5"
          >
            <LogOut size={12} />
            {isSidebarOpen && "Terminate Token Session"}
          </button>
        </div>
      </aside>

      {/* CORE WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP HEADER */}
        <header className="bg-[#0E1B17] border-b border-[#29323a] sticky top-0 px-6 py-3 z-20 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-2">
            <FlaskConical size={14} className="text-[#94A3B8]" />
            <h1 className="text-[11px] font-black tracking-widest text-white uppercase font-mono">
              Laboratory Invoicing Ledger
            </h1>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px] text-[#94A3B8]">
            <span className="hidden sm:block">ADDIS ABABA, ET</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" title="System online sync" />
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto space-y-5">
          {/* METRICS BANNER */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0E1B17] border border-white/20 p-4 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#94A3B8]">
                  Total Unpaid Orders
                </p>
                <p className="text-xl font-black text-[#10B981] mt-1 font-mono">
                  {pendingRequests.length} Patients
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
                <Hourglass size={18} />
              </div>
            </div>

            <div className="bg-[#0E1B17] border border-white/20 p-4 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#94A3B8]">
                  Today's Currency System
                </p>
                <p className="text-xl font-black text-white mt-1 font-mono">
                  ETB <span className="text-[9px] text-[#94A3B8] font-bold">(Ethiopian Birr)</span>
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20">
                <Wallet size={18} />
              </div>
            </div>

            <div className="bg-[#0E1B17] border border-white/20 p-4 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#94A3B8]">
                  Payment Gateway Links
                </p>
                <p className="text-[10px] font-bold text-slate-200 mt-1 uppercase tracking-wide">
                  Telebirr / CBE Birr / Cash
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
                <Zap size={18} />
              </div>
            </div>
          </section>

          {error && (
            <div className="flex items-center gap-2 bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-wide">
              <AlertCircle size={13} /> {error}
            </div>
          )}

          {/* QUEUE + CHECKOUT GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* QUEUE CONTROL BOX */}
            <div className="bg-[#0E1B17] rounded-xl border border-white/20 p-4 flex flex-col h-[calc(100vh-290px)] min-h-[380px] shadow-sm">
              <div className="mb-3">
                <h2 className="font-black text-[11px] text-slate-500 uppercase tracking-widest mb-2">
                  Pending Laboratory Orders
                </h2>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name or phone..."
                    className="w-full bg-[#050B09] border border-[#29323a] rounded-lg py-2 pl-8 pr-3 text-[11px] text-white placeholder:text-slate-600 focus:outline-none focus:border-[#10B981] font-mono"
                  />
                  <Search size={12} className="absolute left-2.5 top-2.5 text-slate-500" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {loading ? (
                  <div className="text-center py-8 text-[10px] text-slate-600 uppercase font-mono animate-pulse">
                    Syncing laboratory billing queue...
                  </div>
                ) : filteredRequests.length > 0 ? (
                  filteredRequests.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPatient(p)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedPatient?.id === p.id
                          ? "bg-[#10B981]/10 border-[#10B981]/50"
                          : "bg-[#050B09] border-[#29323a] hover:border-[#10B981]/30"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-black text-white text-[11px] uppercase truncate">
                          {p.name}
                        </p>
                        <span
                          title={p.accessionId || p.id}
                          className="bg-[#0E1B17] text-[#10B981] border border-[#10B981]/20 text-[8px] font-bold font-mono px-2 py-0.5 rounded max-w-[110px] truncate shrink-0"
                        >
                          {p.accessionId || p.id}
                        </span>
                      </div>
                      <div className="flex justify-between text-[9px] text-[#94A3B8] font-mono">
                        <span className="truncate">{p.cardId}</span>
                        <span>{p.tests.length} Tests</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[9px] font-mono">
                        <span
                          className={
                            /urgent|stat|emergenc/i.test(p.urgency || "")
                              ? "text-[#EF4444] font-bold uppercase"
                              : "text-[#94A3B8]/70 uppercase"
                          }
                        >
                          {p.urgency}
                        </span>
                        <span className="text-[#10B981] font-bold">
                          {p.tests
                            .reduce((sum, t) => (t.checked ? sum + t.price : sum), 0)
                            .toFixed(2)}{" "}
                          ETB
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-[10px] text-slate-600 uppercase font-mono">
                    No matching orders found.
                  </div>
                )}
              </div>
            </div>

            {/* CHECKOUT SEGMENT */}
            <div className="lg:col-span-2 bg-[#0E1B17] rounded-xl border border-white/20 p-5 flex flex-col h-[calc(100vh-290px)] min-h-[380px] justify-between shadow-sm relative overflow-hidden">
              {paymentSuccess && (
                <div className="absolute inset-0 bg-[#050B09]/95 z-30 flex flex-col justify-center items-center text-center animate-fadeIn p-6">
                  <div className="w-14 h-14 bg-[#10B981]/10 text-[#10B981] rounded-full flex items-center justify-center border border-[#10B981]/30 mb-3">
                    <CheckCircle size={26} />
                  </div>
                  <h3 className="text-[12px] font-black text-white uppercase tracking-widest mb-1">
                    Payment Finalized Successfully
                  </h3>
                  <p className="text-[10px] text-[#94A3B8] max-w-sm font-mono">
                    Transaction receipt logged. Transmission signal successfully
                    broadcast to the Laboratory Diagnostics terminal module.
                  </p>
                </div>
              )}

              {selectedPatient ? (
                <form onSubmit={handleProcessPayment} className="h-full flex flex-col justify-between">
                  <div className="overflow-y-auto pr-1 space-y-4">
                    {/* Patient header */}
                    <div className="border-b border-[#29323a] pb-3 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                      <div>
                        <span className="text-[8px] font-bold tracking-widest text-[#10B981] uppercase font-mono">
                          Patient Profile
                        </span>
                        <h2 className="text-[13px] font-black text-white mt-0.5 uppercase">
                          {selectedPatient.name}
                        </h2>
                        <p className="text-[9px] text-[#94A3B8] font-mono mt-0.5">
                          {selectedPatient.cardId} · {selectedPatient.accessionId}
                        </p>
                        <p className="text-[10px] text-[#94A3B8] mt-0.5">
                          Referred by:{" "}
                          <span className="text-slate-200 font-bold">{selectedPatient.referredBy}</span>
                        </p>
                      </div>
                      <div className="flex gap-2 text-[9px] font-mono">
                        <span className="bg-[#050B09] border border-[#29323a] px-2.5 py-1.5 rounded-lg text-slate-300">
                          {selectedPatient.age}Y / {selectedPatient.gender}
                        </span>
                        <span className="bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg text-amber-300 font-bold uppercase">
                          Awaiting Payment
                        </span>
                      </div>
                    </div>

                    {/* Diagnostic checklist */}
                    <div>
                      <h3 className="text-[9px] font-black uppercase tracking-widest text-[#94A3B8] mb-2 flex items-center gap-1.5">
                        <ClipboardCheck size={12} /> Diagnostic Examination Checklist
                      </h3>
                      <div className="space-y-2">
                        {selectedPatient.tests.map((test) => (
                          <label
                            key={test.id}
                            className={`flex justify-between items-center p-2.5 rounded-lg border cursor-pointer transition-all ${
                              test.checked
                                ? "bg-[#050B09] border-[#10B981]/30 text-white"
                                : "bg-[#050B09]/50 border-[#29323a] text-slate-500"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={test.checked}
                                onChange={() => toggleItem(test.id)}
                                className="w-3.5 h-3.5 accent-[#10B981]"
                              />
                              <span className="text-[11px] font-bold">{test.name}</span>
                            </div>
                            <span className="font-mono font-bold text-slate-200 text-[11px]">
                              {test.price.toFixed(2)} ETB
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Payment inputs */}
                    <div className="bg-[#050B09] border border-[#29323a] p-3 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-[#94A3B8] mb-1.5">
                          Payment Method Portal
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full bg-[#0E1B17] border border-[#29323a] rounded-lg px-2.5 py-2 text-[11px] text-white focus:outline-none focus:border-[#10B981] font-mono"
                        >
                          <option>Cash</option>
                          <option>Telebirr</option>
                          <option>CBE Birr</option>
                          <option>Bank Transfer (CBE/Awash)</option>
                        </select>
                      </div>
                      {paymentMethod !== "Cash" && (
                        <div className="animate-fadeIn">
                          <label className="block text-[9px] font-bold uppercase text-[#94A3B8] mb-1.5">
                            Transaction Reference / Voucher ID
                          </label>
                          <input
                            type="text"
                            required
                            value={referenceNumber}
                            onChange={(e) => setReferenceNumber(e.target.value)}
                            placeholder="e.g. ABC123XYZ"
                            className="w-full bg-[#0E1B17] border border-[#29323a] rounded-lg px-2.5 py-2 text-[11px] text-white placeholder:text-slate-600 focus:outline-none focus:border-[#10B981] font-mono"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Invoice footer */}
                  <div className="border-t border-[#29323a] pt-3 mt-3">
                    <div className="flex justify-between items-center mb-3 px-1">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-[#94A3B8] tracking-widest">
                          Audited Invoiced Items
                        </span>
                        <p className="text-[10px] text-slate-300 font-bold">
                          {totalItemsCount} test entries selected
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-bold text-[#94A3B8] tracking-widest">
                          Total Invoice Amount
                        </span>
                        <p className="text-xl font-black text-[#10B981] font-mono tracking-tight">
                          {totalPrice.toFixed(2)} ETB
                        </p>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={totalPrice === 0 || submitting}
                      className="w-full bg-[#10B981] hover:bg-[#0f9d76] disabled:bg-[#29323a] disabled:text-slate-600 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest text-[10px] py-3 px-4 rounded-lg transition shadow-sm"
                    >
                      {submitting
                        ? "Recording Payment..."
                        : "Finalize Transaction & Release To Labs"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="h-full flex flex-col justify-center items-center text-center p-6 text-slate-500">
                  <FolderOpen size={34} className="mb-3 opacity-40" />
                  <p className="text-[10px] font-bold uppercase tracking-wider max-w-sm font-mono">
                    Select a patient entry queue sequence from the left dashboard
                    index panel to execute core payment metrics processing.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
