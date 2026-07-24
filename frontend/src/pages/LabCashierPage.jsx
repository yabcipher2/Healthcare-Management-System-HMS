import React, { useState, useEffect, useCallback } from "react";
import { LogOut, CreditCard, Search, Menu } from "lucide-react";
import NotificationBell from "../components/NotificationBell";

export default function LabCashierPage({ onLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const hospitalLogo = "/mesra icon.png";
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const fetchLabOrders = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/cashier/lab/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch lab orders");
      const data = await response.json();
      const orders = (data.data || [])
        .filter((o) => o.cashierStatus !== "PAID")
        .map((order) => ({
          id: order._id,
          name: order.patientName,
          phone: "N/A",
          age: order.age || "N/A",
          gender: order.gender || "N/A",
          referredBy: order.requestedBy || "N/A",
          date: order.timestamp
            ? new Date(order.timestamp).toLocaleDateString()
            : "N/A",
          tests: (order.panels || []).map((panel, idx) => ({
            id: `T${idx}`,
            name: panel,
            price: 250,
            checked: true,
          })),
          cashierStatus: order.cashierStatus,
          accessionId: order.accessionId,
          patientCardId: order.patientCardId,
        }));
      setPendingRequests(orders);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_URL, token]);

  useEffect(() => {
    fetchLabOrders();
    const interval = setInterval(fetchLabOrders, 3000);
    return () => clearInterval(interval);
  }, [fetchLabOrders]);

  const handleSelectPatient = (patient) => {
    setPaymentSuccess(false);
    setSelectedPatient({
      ...patient,
      tests: patient.tests.map((t) => ({ ...t })),
    });
  };

  const toggleItem = (itemId) => {
    setSelectedPatient((prev) => ({
      ...prev,
      tests: prev.tests.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item,
      ),
    }));
  };

  const totalItemsCount = selectedPatient
    ? selectedPatient.tests.filter((t) => t.checked).length
    : 0;
  const totalPrice = selectedPatient
    ? selectedPatient.tests.reduce(
        (acc, item) => (item.checked ? acc + item.price : acc),
        0,
      )
    : 0;

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;

    setProcessing(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/cashier/lab/${selectedPatient.id}/pay`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            paymentMethod,
            referenceNumber,
            amountPaid: totalPrice,
          }),
        },
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Payment processing failed");
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
        setProcessing(false);
        fetchLabOrders();
      }, 1500);
    } catch (err) {
      setError(err.message || "Payment processing failed");
      setProcessing(false);
    }
  };

  const filteredRequests = pendingRequests.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery),
  );

  const isPaid = selectedPatient?.cashierStatus === "PAID";

  return (
    <div className="min-h-screen bg-[#050B09] text-white font-sans antialiased text-[10px] selection:bg-[#10B981]/20 selection:text-[#10B981] flex">
      {/* SIDEBAR - COMPACT */}
      <aside
        className={`bg-[#0E1B17] text-slate-300 flex flex-col justify-between shrink-0 sticky top-0 h-screen overflow-hidden z-30 font-mono border-r border-[#0E1B17] transition-all duration-300 ${isSidebarOpen ? "w-56" : "w-16"}`}
      >
        <div>
          {/* Brand Panel - Compact */}
          <div className="p-3 border-b border-[#29323a] flex items-center gap-2 bg-[#0E1B17]">
            <img
              src={hospitalLogo}
              alt="Mesra Logo"
              className="w-7 h-7 object-contain rounded-lg"
            />
            {isSidebarOpen && (
              <div>
                <h3 className="font-black text-[11px] text-white leading-none">
                  MESRA DIGITAL
                </h3>
                <span className="text-[9px] text-[#94A3B8] font-bold tracking-wider block mt-0.5">
                  Lab Cashier
                </span>
              </div>
            )}
          </div>

          {/* Sidebar Toggle Button */}
          <div className="p-2 border-b border-[#29323a]">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-full p-2 rounded-lg hover:bg-[#0E1B17] transition flex items-center justify-center gap-2 text-[#94A3B8] hover:text-white"
            >
              <Menu size={14} />
              {isSidebarOpen && (
                <span className="text-[10px] font-bold">Toggle Menu</span>
              )}
            </button>
          </div>

          {/* Nav Stack - Compact */}
          <nav className="p-2 space-y-1">
            <div className="text-[9px] font-black uppercase text-[#94A3B8] px-2 py-1.5 tracking-widest">
              Cashier Terminal
            </div>
            <button className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md bg-[#10B981] text-white font-bold text-[11px] uppercase tracking-wider transition">
              <CreditCard size={14} />
              {isSidebarOpen && <span>Lab Cashier Desk</span>}
            </button>
            <div className="px-2.5 py-1.5 text-[10px] font-mono bg-[#0E1B17]/60 border border-slate-700 rounded-md text-[#94A3B8] mt-1.5">
              Terminal #02
            </div>
          </nav>
        </div>

        {/* Logout */}
        <div className="p-2 border-t border-[#29323a] bg-[#0E1B17]">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-2.5 py-2 text-red-400 hover:bg-red-950/40 rounded-md transition font-bold text-[11px] uppercase tracking-wider"
          >
            <LogOut size={14} />
            {isSidebarOpen && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER */}
        <header className="bg-[#0E1B17] border-b border-white/20 h-14 px-5 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-[#94A3B8] hover:text-white p-1 hover:bg-[#0E1B17] rounded-md transition"
            >
              ☰
            </button>
            <h1 className="text-[13px] font-black text-white uppercase tracking-wider">
              Laboratory Invoicing Ledger
            </h1>
          </div>
          <NotificationBell role="LabCashier" />
        </header>

        {error && (
          <div className="mx-5 mt-4 p-2.5 bg-[#EF4444]/10 border border-[#EF4444]/50 rounded-lg text-[#EF4444] text-xs font-mono">
            {error}
          </div>
        )}

        {/* QUEUE + CHECKOUT */}
        <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1">
          {/* QUEUE - COMPACT */}
          <div className="bg-[#0E1B17] rounded-xl border border-white/20 p-4 flex flex-col h-[calc(100vh-180px)] shadow-sm">
            <h2 className="font-bold text-slate-200 tracking-wide mb-2 text-[11px] uppercase">
              Pending Laboratory Orders
            </h2>
            <div className="relative mb-2.5">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name..."
                className="w-full bg-[#0E1B17] border border-white/20 rounded-lg py-1.5 px-3 pl-8 text-[11px] focus:outline-none focus:border-slate-400 text-white placeholder-slate-400"
              />
              <Search
                size={12}
                className="absolute left-2.5 top-2 text-[#94A3B8]"
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {loading ? (
                <div className="text-center py-6 text-xs text-[#94A3B8]">
                  Loading...
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#94A3B8]">
                  No pending orders found.
                </div>
              ) : (
                filteredRequests.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPatient(p)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedPatient?.id === p.id
                        ? "bg-[#10B981]/10 border-emerald-300 shadow-sm"
                        : "bg-[#0E1B17] border-white/20 hover:border-white/20 hover:bg-[#0E1B17]"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-0.5">
                      <p className="font-semibold text-slate-200 text-[11px]">
                        {p.name}
                      </p>
                      <span className="bg-[#0E1B17] text-[#94A3B8] text-[9px] font-mono px-1.5 py-0.5 rounded border border-white/20">
                        {p.accessionId?.slice(-6) || p.id.slice(-6)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-[#94A3B8]">
                      <span>{p.tests.length} Tests</span>
                      <span>
                        {p.tests
                          .reduce((sum, t) => sum + t.price, 0)
                          .toFixed(2)}{" "}
                        ETB
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CHECKOUT - COMPACT */}
          <div className="lg:col-span-2 bg-[#0E1B17] rounded-xl border border-white/20 p-4 flex flex-col h-[calc(100vh-180px)] justify-between shadow-sm relative">
            {paymentSuccess && (
              <div className="absolute inset-0 bg-[#0E1B17]/95 z-30 rounded-xl flex flex-col justify-center items-center text-center animate-fadeIn p-4">
                <div className="w-12 h-12 bg-[#10B981]/20 text-[#10B981] rounded-full flex items-center justify-center text-2xl border border-emerald-300 mb-3">
                  ✓
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  Payment Finalized Successfully!
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Transaction logged. Signal sent to Laboratory Diagnostics.
                </p>
              </div>
            )}

            {selectedPatient ? (
              <form
                onSubmit={handleProcessPayment}
                className="h-full flex flex-col justify-between"
              >
                <div className="overflow-y-auto pr-1 space-y-4">
                  <div className="border-b border-white/20 pb-3 flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                    <div>
                      <span className="text-[9px] font-bold tracking-widest text-[#94A3B8] uppercase">
                        Patient Profile
                      </span>
                      <h2 className="text-base font-bold text-white mt-0.5">
                        {selectedPatient.name}
                      </h2>
                      <p className="text-[10px] text-[#94A3B8] mt-0.5">
                        Referred by:{" "}
                        <span className="text-slate-300 font-medium">
                          {selectedPatient.referredBy}
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-1.5 text-[10px] font-mono">
                      <span className="bg-[#0E1B17] border border-white/20 px-2 py-0.5 rounded text-slate-300">
                        Age: {selectedPatient.age} ({selectedPatient.gender})
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-semibold ${isPaid ? "bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981]" : "bg-amber-500/10 border border-amber-500/30 text-amber-300"}`}
                      >
                        {isPaid ? "✓ Paid" : "Awaiting Payment"}
                      </span>
                    </div>
                  </div>

                  {!isPaid && (
                    <>
                      <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-2">
                          Diagnostic Examination Checklist
                        </h3>
                        <div className="space-y-1.5">
                          {selectedPatient.tests.map((test) => (
                            <label
                              key={test.id}
                              className={`flex justify-between items-center p-2 rounded-lg border cursor-pointer transition-all text-[11px] ${test.checked ? "bg-[#0E1B17] border-white/20 text-white" : "bg-[#0E1B17]/50 border-white/10 text-[#94A3B8]"}`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={test.checked}
                                  onChange={() => toggleItem(test.id)}
                                  className="w-3.5 h-3.5 rounded text-[#10B981] bg-[#0E1B17] border-white/20"
                                />
                                <span className="font-medium">{test.name}</span>
                              </div>
                              <span className="font-mono font-bold text-[#10B981]">
                                {test.price.toFixed(2)} ETB
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="bg-[#0E1B17] border border-white/20 p-3 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-[#94A3B8] mb-1">
                            Payment Method
                          </label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full bg-[#0E1B17] border border-white/20 rounded-lg py-1.5 px-2.5 text-[11px] focus:outline-none focus:border-slate-400 text-white"
                          >
                            <option>Cash</option>
                            <option>Telebirr</option>
                            <option>CBE Birr</option>
                            <option>Bank Transfer (CBE/Awash)</option>
                          </select>
                        </div>
                        {paymentMethod !== "Cash" && (
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-[#94A3B8] mb-1">
                              Reference / Transaction ID
                            </label>
                            <input
                              type="text"
                              required
                              value={referenceNumber}
                              onChange={(e) =>
                                setReferenceNumber(e.target.value)
                              }
                              placeholder="e.g. TXN123"
                              className="w-full bg-[#0E1B17] border border-white/20 rounded-lg py-1.5 px-2.5 text-[11px] focus:outline-none focus:border-slate-400 placeholder-slate-400 font-mono"
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {isPaid && (
                    <div className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-lg p-3 text-center">
                      <p className="text-[#10B981] font-bold text-[11px]">
                        ✓ Payment Already Processed
                      </p>
                      <p className="text-[10px] text-[#94A3B8] mt-0.5">
                        This order has been cleared. Proceeding to lab
                        processing.
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/20 pt-3 mt-3 bg-[#0E1B17]">
                  <div className="flex justify-between items-center mb-3 px-1">
                    <div>
                      <span className="text-[10px] font-medium text-[#94A3B8]">
                        Invoiced Items
                      </span>
                      <p className="text-[10px] text-slate-300 font-semibold">
                        {totalItemsCount} tests selected
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-medium text-[#94A3B8]">
                        Total Amount
                      </span>
                      <p className="text-xl font-black text-[#10B981] font-mono">
                        {totalPrice.toFixed(2)} ETB
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={totalPrice === 0 || processing}
                    className={`w-full font-bold py-2.5 px-4 rounded-lg shadow-md transition-all transform active:scale-[0.99] text-[11px] uppercase tracking-wider ${
                      isPaid
                        ? "bg-[#10B981] hover:bg-[#0D9668] text-white"
                        : "bg-[#EF4444] hover:bg-[#b91c1c] text-white"
                    }`}
                  >
                    {processing
                      ? "Processing..."
                      : isPaid
                        ? "✓ Payment Completed"
                        : "Finalize Transaction & Release To Labs"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="h-full flex flex-col justify-center items-center text-center p-4 text-[#94A3B8]">
                <span className="text-3xl mb-2">🗂️</span>
                <p className="text-[11px] font-medium">
                  Select a patient from the queue to process payment.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
