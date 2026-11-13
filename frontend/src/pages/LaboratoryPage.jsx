import React, { useState, useEffect, useCallback } from "react";
import {
  FlaskConical,
  Activity,
  LayoutDashboard,
  TestTube,
  ClipboardCheck,
  Search,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Beaker,
  User,
  LogOut,
  Zap,
} from "lucide-react";
import SidebarCollapseButton from "../components/SidebarCollapseButton";
import {
  logAudit,
  fetchAuditLogs,
  fetchAuditAlertsCount,
} from "../utils/audit";
import NotificationBell from "../components/NotificationBell";

export default function LaboratoryPage({ onLogout }) {
  const [activeTab, setActiveTab] = useState("activeOrders");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const hospitalLogo = "/mesra icon.png";
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  const [labPanels, setLabPanels] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auditAlertsCount, setAuditAlertsCount] = useState(0);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditLogsError, setAuditLogsError] = useState("");
  const [error, setError] = useState("");

  const labTechProfile = {
    name: "Abebe Kebede (BSc)",
    role: "Senior Laboratory Technologist",
    department: "Advanced Diagnostics Unit",
  };

  const loadAuditAlertsCount = useCallback(async () => {
    try {
      const data = await fetchAuditAlertsCount();
      setAuditAlertsCount(data);
    } catch {
      // Silently fail
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

  const fetchLaboratoryData = useCallback(async () => {
    try {
      setLoading(true);
      const [panelsRes, ordersRes] = await Promise.all([
        fetch(`${API_URL}/api/lab/panels`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/lab/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!panelsRes.ok || !ordersRes.ok)
        throw new Error("Failed to fetch laboratory data");
      const panelsData = await panelsRes.json();
      const ordersData = await ordersRes.json();

      setLabPanels(panelsData.data || []);
      // Only display orders that are not yet completed in the active queue
      const activeOrders = (ordersData.data || []).filter(
        (order) =>
          order.status !== "Completed" && order.labStatus !== "Completed",
      );
      setOrders(activeOrders);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching laboratory data:", err);
    } finally {
      setLoading(false);
    }
  }, [API_URL, token]);

  useEffect(() => {
    fetchLaboratoryData();
    const interval = setInterval(fetchLaboratoryData, 5000);
    return () => clearInterval(interval);
  }, [fetchLaboratoryData]);

  const handleResultChange = (panelKey, value) => {
    setSelectedOrder((prev) => ({
      ...prev,
      resultsLogged: {
        ...(prev.resultsLogged || {}),
        [panelKey]: value,
      },
    }));
  };

  const handleReportChange = (value) => {
    setSelectedOrder((prev) => ({
      ...prev,
      diagnosisReport: value,
    }));
  };

  // Submit individual examination results back to Doctor EMR
  const handleVerifyAndSubmit = async (e) => {
    e.preventDefault();
    const orderId = selectedOrder._id || selectedOrder.id;
    const isEmergencyBypass = selectedOrder.cashierStatus === "BYPASSED_EMERGENCY";
    const isEmergency =
      selectedOrder.triageCategory === "Red / Immediate" ||
      selectedOrder.triageCategory === "Emergency" ||
      isEmergencyBypass;

    // A doctor can dispatch a panel straight from the EMR, so those orders have no
    // cashier decision yet. Only hold results back when the cashier has actually
    // marked the order as unpaid.
    if (
      !isEmergency &&
      selectedOrder.cashierStatus &&
      selectedOrder.cashierStatus !== "PAID"
    ) {
      alert(
        "Payment confirmation required from cashier before results can be released to Doctor EMR.",
      );
      return;
    }

    if (isEmergency && !isEmergencyBypass) {
      await logAudit({
        action: "EMERGENCY_BYPASS",
        module: "Laboratory",
        details: `EMERGENCY BYPASS ACTIVATED: Lab results for ${selectedOrder.patientName} (${selectedOrder.patientCardId || selectedOrder.cardId}) released without cashier payment — triage category: ${selectedOrder.triageCategory}. Billing deferred to post-treatment settlement queue.`,
        targetId: orderId,
        targetType: "LabOrder",
      });
    }

    try {
      // Update LabOrder record with results
      const response = await fetch(
        `${API_URL}/api/lab/orders/${orderId}/result`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            results: selectedOrder.resultsLogged || {},
            diagnosisReport: selectedOrder.diagnosisReport || "",
          }),
        },
      );

      if (!response.ok) {
        // A gateway/404 page is HTML, not JSON, so never parse blindly.
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.message || `Failed to update lab order results (${response.status})`,
        );
      }

      // Submit results back to doctor EMR
      const doctorResponse = await fetch(`${API_URL}/api/doctor/lab-results`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cardId: selectedOrder.patientCardId || selectedOrder.cardId,
          patientName: selectedOrder.patientName,
          linkedPatient: selectedOrder.linkedPatient,
          resultsLogged: selectedOrder.resultsLogged || {},
          diagnosisReport: selectedOrder.diagnosisReport || "",
          timestamp: new Date().toISOString(),
        }),
      });

      if (!doctorResponse.ok) {
        const errData = await doctorResponse.json().catch(() => ({}));
        throw new Error(
          errData.message ||
            `Failed to send results to doctor (${doctorResponse.status})`,
        );
      }

      await logAudit({
        userId: localStorage.getItem("userId") || "unknown",
        userName: labTechProfile.name,
        userRole: labTechProfile.role,
        department: labTechProfile.department,
        module: "LABORATORY_UNIT",
        action: "SUBMIT_RESULTS",
        details: `Diagnostic results for ${selectedOrder.patientName} (${selectedOrder.patientCardId || selectedOrder.cardId}) finalized and released to Physician EMR.`,
      });

      alert(
        `Laboratory Analysis Token ${orderId} successfully authenticated, signed by Lab Tech, and released to Doctor EMR timeline.`,
      );

      // Optimistically remove the record from the local queue state immediately
      setOrders((prev) =>
        prev.filter((o) => o._id !== orderId && o.id !== orderId),
      );
      setSelectedOrder(null);
      loadAuditLogs();
      setActiveTab("activeOrders");
    } catch (err) {
      alert(`Error submitting lab results: ${err.message}`);
    }
  };

  const loggedResults = selectedOrder?.resultsLogged || {};

  return (
    <div className="flex min-h-screen bg-[#0E1B17] text-white font-sans antialiased">
      {/* SIDEBAR - COMPACT (Laboratory) */}
      <aside className={`${sidebarOpen ? "w-56" : "w-16 [&_span]:hidden [&_p]:hidden [&_h3]:hidden [&_button]:justify-center [&_button]:text-[0px]"} bg-[#0E1B17] text-slate-300 flex flex-col justify-between shrink-0 sticky top-0 h-screen overflow-hidden z-30 font-mono border-r border-[#0E1B17] transition-all duration-300`}>
        <div>
          {/* Brand Panel - Compact */}
          <div className="p-3 border-b border-[#29323a] flex items-center gap-2 bg-[#0E1B17]">
            <img
              src={hospitalLogo}
              alt="Mesra Logo"
              className="w-7 h-7 object-contain rounded-lg"
            />
            <div>
              <h3 className="font-black text-[11px] text-white leading-none">
                MESRA DIGITAL
              </h3>
              <span className="text-[9px] text-[#94A3B8] font-bold tracking-wider block mt-0.5">
                Lab Diagnostics
              </span>
            </div>
          </div>

          {/* Sidebar Collapse Control */}
          <SidebarCollapseButton
            collapsed={!sidebarOpen}
            onToggle={() => setSidebarOpen((open) => !open)}
            label="laboratory sidebar"
          />

          {/* Nav Stack - Compact */}
          <nav className="p-2 space-y-1">
            <div className="text-[9px] font-black uppercase text-[#94A3B8] px-2 py-1.5 tracking-widest">
              Interface Channels
            </div>
            <button
              onClick={() => { setActiveTab("dashboard"); setSelectedOrder(null); }}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition ${
                activeTab === "dashboard" ? "bg-[#10B981] text-white shadow-md font-black" : "text-[#94A3B8] hover:bg-[#0E1B17] hover:text-white"
              }`}
            >
              <LayoutDashboard size={14} /> <span>Lab Dashboard</span>
            </button>

            {/* EMERGENCY HUB */}
            {(() => {
              const emergencyCount = orders.filter(
                (o) => o.triageCategory === "Red / Immediate" || o.triageCategory === "Emergency" || o.cashierStatus === "BYPASSED_EMERGENCY"
              ).length;
              return (
                <button
                  onClick={() => { setActiveTab("emergencyHub"); setSelectedOrder(null); }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition ${
                    activeTab === "emergencyHub"
                      ? "bg-[#EF4444] text-white shadow-md font-black"
                      : "text-[#94A3B8] hover:bg-[#b91c1c]/40 hover:text-[#EF4444]/80"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Zap size={14} /> <span>Emergency Hub</span>
                  </div>
                  {emergencyCount > 0 && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-[#EF4444]/20 text-[#EF4444]/80 ${activeTab !== "emergencyHub" ? "animate-pulse" : ""}`}>
                      {emergencyCount}
                    </span>
                  )}
                </button>
              );
            })()}

            <button
              onClick={() => { setActiveTab("activeOrders"); setSelectedOrder(null); }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition ${
                activeTab === "activeOrders" ? "bg-[#10B981] text-white shadow-md font-black" : "text-[#94A3B8] hover:bg-[#0E1B17] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <TestTube size={14} /> <span>Doctor Request Queue</span>
              </div>
              {orders.length > 0 && (
                <span className="bg-[#0E1B17] text-[#10B981] border border-[#10B981]/20 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                  {orders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("labAudit")}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition ${
                activeTab === "labAudit" ? "bg-amber-600 text-white shadow-md font-black" : "text-[#94A3B8] hover:bg-[#0E1B17] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldAlert size={14} /> <span>Lab Audit Tracks</span>
              </div>
              {auditAlertsCount > 0 && (
                <span className="bg-[#0E1B17] text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">
                  {auditAlertsCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        <div className="p-3 border-t border-[#29323a] bg-[#0E1B17] space-y-3">
          <div className="bg-[#0E1B17] rounded-lg p-2.5 border border-[#0E1B17] text-[10px]">
            <div className="flex items-center gap-1.5 text-[#10B981] font-bold uppercase tracking-wide mb-1">
              <User size={12} /> <span>Operator Account</span>
            </div>
            <p className="text-white truncate font-bold text-[11px]">
              {labTechProfile.name}
            </p>
            <p className="text-[#94A3B8] truncate text-[9px] mt-0.5">
              {labTechProfile.role}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="w-full py-2 bg-[#EF4444]/40 hover:bg-[#b91c1c] border border-[#EF4444]/30 text-[#EF4444] font-bold uppercase text-[10px] tracking-wider rounded-lg transition flex items-center justify-center gap-1.5"
          >
            <LogOut size={13} /> Terminate Session
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <div className="bg-[#0E1B17] border-b border-white/20 px-6 py-3 flex justify-between items-center shadow-sm">
          <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest font-mono">Lab Diagnostics Terminal</span>
          <NotificationBell role="Laboratory" />
        </div>
        <main className="flex-1 p-8 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-[#EF4444]/10 border border-[#EF4444]/50 rounded-xl text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="bg-[#0E1B17] border border-white/20/60 p-6 rounded-2xl shadow-sm">
                <h1 className="text-xl font-black text-white tracking-tight">
                  Diagnostics Control Dashboard
                </h1>
                <p className="text-[#94A3B8] text-xs mt-1">
                  Laboratory workflow registry and automated payment clearance
                  monitoring systems.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#0E1B17] border border-white/20/60 p-5 rounded-2xl shadow-sm">
                  <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider block">
                    Pending Analysis Matrix
                  </span>
                  <p className="text-2xl font-black text-white mt-2">
                    {orders.length}
                  </p>
                </div>
                <div className="bg-[#0E1B17] border border-white/20/60 p-5 rounded-2xl shadow-sm">
                  <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider block">
                    Security Alerts Managed
                  </span>
                  <p className="text-2xl font-black text-white mt-2">
                    {auditAlertsCount}
                  </p>
                </div>
                <div className="bg-[#0E1B17] border border-white/20/60 p-5 rounded-2xl shadow-sm">
                  <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider block">
                    Department Module
                  </span>
                  <p className="text-sm font-black text-[#10B981] mt-2 font-mono uppercase">
                    {labTechProfile.department}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* EMERGENCY HUB TAB */}
          {activeTab === "emergencyHub" && (() => {
            const emergencyOrders = orders.filter(
              (o) => o.triageCategory === "Red / Immediate" || o.triageCategory === "Emergency" || o.cashierStatus === "BYPASSED_EMERGENCY"
            );
            return (
              <div className="space-y-4">
                <div className="bg-[#EF4444] text-white p-5 rounded-2xl flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-3">
                    <Zap size={22} className="animate-pulse" />
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-widest">Emergency Lab Queue</h2>
                      <p className="text-[#EF4444]/80 text-xs mt-0.5">Cashier bypass active — results release is immediate for all critical cases.</p>
                    </div>
                  </div>
                  <span className="text-4xl font-black">{emergencyOrders.length}</span>
                </div>

                {emergencyOrders.length === 0 ? (
                  <div className="bg-[#0E1B17] border border-white/20 rounded-2xl p-12 text-center">
                    <CheckCircle size={32} className="text-[#10B981] mx-auto mb-3" />
                    <p className="text-sm font-black text-[#94A3B8] uppercase tracking-wider">No active emergency cases in queue</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {emergencyOrders.map((order) => (
                      <div key={order._id} className="bg-[#0E1B17] border-2 border-rose-400 rounded-2xl overflow-hidden shadow-md">
                        <div className="bg-[#EF4444] px-4 py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Zap size={13} className="text-white animate-pulse" />
                            <span className="text-white font-black text-[11px] uppercase tracking-wider">{order.patientName}</span>
                            <span className="text-[#EF4444]/80 text-[10px] font-mono">| {order.patientCardId || order.cardId}</span>
                          </div>
                          <span className="bg-[#0E1B17] text-[#EF4444] text-[9px] font-black px-2 py-0.5 rounded uppercase">
                            {order.triageCategory || "EMERGENCY"}
                          </span>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-3 text-[11px]">
                          <div>
                            <span className="text-[#94A3B8] font-bold block uppercase text-[9px] mb-1">Tests Ordered</span>
                            <span className="font-mono text-slate-200">
                              {(order.dispatchedTests || order.panels || []).join(", ") || "General Chemistry Suite"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#94A3B8] font-bold block uppercase text-[9px] mb-1">Billing Status</span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#EF4444]/10 text-[#EF4444] border border-rose-300 text-[10px] font-black uppercase rounded">
                              ⚡ BYPASSED — Post-Treatment Settlement
                            </span>
                          </div>
                          <div>
                            <span className="text-[#94A3B8] font-bold block uppercase text-[9px] mb-1">Age / Gender</span>
                            <span className="font-mono text-slate-200">{order.age || "N/A"} yrs / {order.gender || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-[#94A3B8] font-bold block uppercase text-[9px] mb-1">Authorizing Doctor</span>
                            <span className="font-mono text-slate-200">{order.authorizingPhysician || order.requestedBy || "—"}</span>
                          </div>
                        </div>
                        <div className="px-4 pb-4">
                          <button
                            onClick={() => { setSelectedOrder(order); setActiveTab("activeOrders"); }}
                            className="w-full py-2.5 bg-[#EF4444] hover:bg-[#b91c1c] text-white font-black uppercase tracking-widest text-[10px] rounded-lg transition flex items-center justify-center gap-2"
                          >
                            <Zap size={13} /> Process Emergency Results Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {activeTab === "activeOrders" && !selectedOrder && (
            <div className="bg-[#0E1B17] border border-white/20/60 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-white/10 bg-[#0E1B17]/50 flex justify-between items-center">
                <div>
                  <h2 className="text-md font-black text-white tracking-tight">
                    Physician Dispatched Examination Queue
                  </h2>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Select a paid order to enter individual examination results.
                    Paid orders are clickable.
                  </p>
                </div>
                <button
                  onClick={fetchLaboratoryData}
                  className="px-3 py-1.5 bg-[#0E1B17] border border-white/20 text-slate-300 text-xs font-bold rounded-xl shadow-sm hover:bg-[#0E1B17] transition"
                >
                  Sync Orders
                </button>
              </div>

              {loading ? (
                <div className="py-20 text-center text-xs text-[#94A3B8] font-medium">
                  Loading examination queue...
                </div>
              ) : orders.length === 0 ? (
                <div className="py-24 text-center text-xs text-[#94A3B8] font-medium font-sans">
                  No incoming examination requests at this time.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#0E1B17] border-b border-white/10 text-[#94A3B8] text-[10px] font-black uppercase tracking-wider font-mono">
                        <th className="py-4 px-6">Patient</th>
                        <th className="py-4 px-6">Card Token</th>
                        <th className="py-4 px-6">Examinations Requested</th>
                        <th className="py-4 px-6">Payment Status</th>
                        <th className="py-4 px-6 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {orders.map((order) => {
                        const isPaid = order.cashierStatus === "PAID";
                        const isEmergency =
                          order.triageCategory === "Red / Immediate" ||
                          order.triageCategory === "Emergency" ||
                          order.cashierStatus === "BYPASSED_EMERGENCY";
                        const canProcess = isPaid || isEmergency;
                        return (
                          <tr
                            key={order._id}
                            className={`hover:bg-[#0E1B17] transition py-1 ${
                              isEmergency
                                ? "border-l-4 border-l-rose-600 bg-[#EF4444]/10/40"
                                : ""
                            }`}
                          >
                            <td className="py-2 px-4">
                              <div className="flex items-center gap-2">
                                {isEmergency && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#EF4444] text-white text-[9px] font-black uppercase rounded animate-pulse">
                                    ⚡ EMERGENCY
                                  </span>
                                )}
                                <div className="font-bold text-white">
                                  {order.patientName || "Walk-In Patient"}
                                </div>
                              </div>
                              <div className="text-[10px] text-[#94A3B8]">
                                Age: {order.age || "N/A"} | Gender:{" "}
                                {order.gender || "N/A"}
                              </div>
                            </td>
                            <td className="py-2 px-4 font-mono text-[#94A3B8] text-[10px]">
                              {order.patientCardId || order.cardId || "N/A"}
                            </td>
                            <td className="py-2 px-4 font-mono font-bold text-slate-300">
                              {order.dispatchedTests?.length
                                ? order.dispatchedTests.join(", ")
                                : order.panels?.length
                                  ? order.panels.join(", ")
                                  : "General Chemistry Suite"}
                            </td>
                            <td className="py-2 px-4">
                              {isEmergency ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#EF4444]/10 text-[#EF4444] border border-rose-300 text-[10px] font-black uppercase rounded-md">
                                  ⚡ BYPASSED
                                </span>
                              ) : isPaid ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 text-[10px] font-black uppercase rounded-md">
                                  ✓ Paid
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase rounded-md">
                                  ⏳ Awaiting Payment
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-4 text-right">
                              <button
                                onClick={() => setSelectedOrder(order)}
                                disabled={!canProcess}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition ${
                                  isEmergency
                                    ? "bg-[#EF4444] hover:bg-[#b91c1c] text-white animate-pulse"
                                    : isPaid
                                      ? "bg-[#10B981] hover:bg-[#0D9668] text-white"
                                      : "bg-[#0E1B17] text-[#94A3B8] cursor-not-allowed"
                                }`}
                              >
                                {isEmergency ? "⚡ Process Now" : isPaid ? "Send Results" : "Locked"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "activeOrders" && selectedOrder && (
            <div className="space-y-6">
              <div className="bg-[#0E1B17] border border-white/20/60 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-md font-black text-white tracking-tight">
                    Individual Examination Result Entry:{" "}
                    {selectedOrder.patientName}
                  </h2>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Enter precise evaluation values for each requested
                    diagnostic panel. Results will be transmitted directly to
                    the assigned Physician EMR.
                  </p>
                  <div className="mt-2 flex gap-3 text-[10px] font-mono text-[#94A3B8]">
                    <span>
                      Card:{" "}
                      {selectedOrder.patientCardId ||
                        selectedOrder.cardId ||
                        "N/A"}
                    </span>
                    <span>|</span>
                    <span>Age: {selectedOrder.age || "N/A"}</span>
                    <span>|</span>
                    <span>Gender: {selectedOrder.gender || "N/A"}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-3 py-1.5 bg-[#0E1B17] border border-white/20 text-slate-300 text-xs font-bold rounded-xl shadow-sm hover:bg-[#0E1B17] transition"
                >
                  Return to Queue
                </button>
              </div>

              <div className="bg-[#0E1B17] border border-white/20/60 p-6 rounded-2xl shadow-sm">
                <form onSubmit={handleVerifyAndSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(
                      selectedOrder.dispatchedTests ||
                      selectedOrder.panels ||
                      []
                    ).map((testKey) => (
                      <div
                        key={testKey}
                        className="p-4 bg-[#0E1B17] border border-white/20/60 rounded-xl"
                      >
                        <label className="block text-xs font-black text-white uppercase tracking-wider mb-2 font-mono">
                          {testKey} — Result Value
                        </label>
                        <input
                          type="text"
                          required
                          value={loggedResults[testKey] || ""}
                          onChange={(e) =>
                            handleResultChange(testKey, e.target.value)
                          }
                          className="w-full text-xs border border-white/20 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium bg-[#0E1B17]"
                          placeholder="Enter analyzed result value..."
                        />
                      </div>
                    ))}
                    {(!selectedOrder.dispatchedTests ||
                      selectedOrder.dispatchedTests.length === 0) &&
                      (!selectedOrder.panels ||
                        selectedOrder.panels.length === 0) && (
                        <div className="col-span-2 text-center text-xs text-[#94A3B8] py-8">
                          No specific examination panels dispatched. General
                          result entry mode active.
                        </div>
                      )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-black text-white uppercase tracking-wider font-mono">
                      Clinical Diagnostic Summary / Laboratory Report
                    </label>
                    <textarea
                      required
                      value={selectedOrder.diagnosisReport || ""}
                      onChange={(e) => handleReportChange(e.target.value)}
                      rows={4}
                      className="w-full text-xs border border-white/20 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium bg-[#0E1B17]"
                      placeholder="Document comprehensive diagnostic findings, microscopic observations, and clinical correlations..."
                    />
                  </div>

                  <div className="border-t border-white/10 pt-4 flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-6 py-3 bg-[#10B981] hover:bg-[#0D9668] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                    >
                      <ClipboardCheck size={14} /> Send Results to Physician EMR
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === "labAudit" && (
            <div className="space-y-4">
              <div className="bg-[#0E1B17] border border-white/20/60 p-6 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
                  <div>
                    <h2 className="text-md font-black text-white tracking-tight">
                      Diagnostics Facility Operational Audit Tracks
                    </h2>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      Cryptographic log node validation monitoring technician
                      profiles and data transactions.
                    </p>
                  </div>
                  <button
                    onClick={loadAuditLogs}
                    className="px-3 py-1.5 bg-[#0E1B17] border border-white/20 text-slate-300 text-xs font-bold rounded-xl shadow-sm hover:bg-[#0E1B17] transition"
                  >
                    Sync Trails
                  </button>
                </div>

                {auditLogsLoading ? (
                  <p className="text-xs text-[#94A3B8] animate-pulse py-4 font-medium">
                    Retrieving security data packets...
                  </p>
                ) : auditLogsError ? (
                  <p className="text-[11px] font-mono text-[#EF4444]">
                    {auditLogsError}
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                    {auditLogs.map((log, index) => (
                      <div
                        key={log._id || index}
                        className="p-3 bg-[#0E1B17] border border-white/20/60 rounded-lg font-mono text-[11px] text-slate-300 flex justify-between items-center hover:bg-[#0E1B17]/80 transition shadow-sm"
                      >
                        <div className="flex items-center gap-3 truncate">
                          <span className="text-[#94A3B8] text-[10px]">
                            [
                            {log.timestamp
                              ? new Date(log.timestamp).toLocaleString()
                              : "RECENT"}
                            ]
                          </span>
                          <span className="text-[#10B981] font-black text-[9px] bg-[#10B981]/10 px-1.5 py-0.5 rounded border border-[#10B981]/20 uppercase">
                            {log.action || "LAB_TRANSACT"}
                          </span>
                          <span className="truncate text-[#94A3B8] font-sans">
                            Staff Operator:{" "}
                            <strong>
                              {log.userName || "Senior Lab Technologist"}
                            </strong>{" "}
                            ({log.userRole || "Lab Staff"})
                          </span>
                        </div>
                        <span className="text-slate-200 font-medium font-sans truncate max-w-xs">
                          {log.details || "No telemetry details."}
                        </span>
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
