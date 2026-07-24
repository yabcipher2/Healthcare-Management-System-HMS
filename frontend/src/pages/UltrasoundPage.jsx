import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  LayoutDashboard,
  Search,
  LogOut,
  ShieldAlert,
  Activity,
  User,
  Layers,
  Database,
  FileText,
  Image,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Plus,
  X,
  Menu,
} from "lucide-react";
import {
  logAudit,
  fetchAuditLogs,
  fetchAuditAlertsCount,
} from "../utils/audit";
import NotificationBell from "../components/NotificationBell";

export default function UltrasoundPage({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const hospitalLogo = "/mesra icon.png";
  const token = localStorage.getItem("token");
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [auditAlertsCount, setAuditAlertsCount] = useState(0);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditLogsError, setAuditLogsError] = useState("");
  const [submittingResults, setSubmittingResults] = useState(false);

  const [resultsForm, setResultsForm] = useState({
    reportText: "",
    imageUrls: [], // In a real app, this would handle file uploads
  });

  const getAuthHeaders = useCallback((isJson = true) => {
    const storedToken = localStorage.getItem("token");
    const headers = {};
    if (isJson) headers["Content-Type"] = "application/json";
    if (storedToken) headers["Authorization"] = `Bearer ${storedToken}`;
    return headers;
  }, []);

  const loadAuditAlertsCount = useCallback(async () => {
    try {
      const data = await fetchAuditAlertsCount("Ultrasound"); // Filter for Ultrasound module
      setAuditAlertsCount(data);
    } catch {
      // Silently fail
    }
  }, []);

  const loadAuditLogs = useCallback(async () => {
    setAuditLogsLoading(true);
    setAuditLogsError("");
    try {
      const result = await fetchAuditLogs({
        page: 1,
        limit: 20,
        module: "Ultrasound",
      });
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

  const fetchPendingRequests = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/ultrasound/pending`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`,
        },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.message ||
            `Imaging node unreachable (HTTP ${response.status})`,
        );
      }

      const data = await response.json();
      setPendingRequests(data.data || []);
      setError(null);
    } catch (err) {
      console.error("Network synchronization error:", err);
      if (err.name === "TypeError" && err.message === "Failed to fetch") {
        setError(
          `NETWORK_ERROR: Unable to reach the API server at ${API_URL}. Please ensure the backend service is running.`,
        );
      } else {
        setError(
          err.message ||
            "Critical Synchronization Failure: Imaging unit is offline.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchPendingRequests();
    const interval = setInterval(fetchPendingRequests, 5000); // Poll for new requests
    return () => clearInterval(interval);
  }, [fetchPendingRequests]);

  const handleSelectRequest = (request) => {
    setSelectedRequest(request);
    setResultsForm({
      reportText: request.radiology?.reportText || "",
      imageUrls: request.radiology?.imageUrls || [],
    });
  };

  const handleFileSelection = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Convert selected files to Base64 strings for storage and preview
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setResultsForm((prev) => ({
          ...prev,
          imageUrls: [...prev.imageUrls, reader.result],
        }));
      };
      reader.readAsDataURL(file);
    });
    // Clear input so the same file can be selected again if removed
    e.target.value = null;
  };

  const handleResultsSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setSubmittingResults(true);
    try {
      // Assuming a backend endpoint to update the PatientRecord with ultrasound results
      const response = await fetch(
        `${API_URL}/api/ultrasound/${selectedRequest._id}/results`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            reportText: resultsForm.reportText,
            imageUrls: resultsForm.imageUrls, // In a real app, this would be actual URLs from a file upload service
          }),
        },
      );

      if (!response.ok) {
        let errMsg = "Failed to submit results.";
        try {
          const errorData = await response.json();
          errMsg = errorData.message || errMsg;
        } catch (e) {
          errMsg = `Server Error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errMsg);
      }

      await logAudit({
        action: "UPDATE",
        module: "Ultrasound",
        details: `Ultrasound results submitted for patient: ${selectedRequest.patientName} (${selectedRequest.cardId})`,
        targetId: selectedRequest._id,
        targetType: "PatientRecord",
      });
      loadAuditAlertsCount();

      alert("Results submitted successfully to Doctor EMR.");
      setSelectedRequest(null);
      setResultsForm({ reportText: "", imageUrls: [] });
      fetchPendingRequests(); // Refresh the list
      setActiveTab("dashboard"); // Go back to dashboard after submission
    } catch (err) {
      alert(`Error: ${err.message}`);
      console.error("Error submitting results:", err);
    } finally {
      setSubmittingResults(false);
    }
  };

  const filteredRequests = pendingRequests.filter(
    (req) =>
      req.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.cardId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.radiology?.requestedModality
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex min-h-screen bg-[#050B09] text-white font-sans antialiased text-[10px] selection:bg-[#10B981]/30 selection:text-[#10B981]">
      {/* CORPORATE SIDEBAR NAVIGATION - BLUE BLACK THEME */}
      <aside
        className={`${sidebarOpen ? "w-56" : "w-16"} bg-[#0E1B17] text-slate-300 flex flex-col justify-between shrink-0 sticky top-0 h-screen overflow-hidden z-30 font-mono border-r border-[#0E1B17] transition-all duration-300`}
      >
        <div>
          <div
            className={`p-4 border-b border-[#29323a] flex items-center ${sidebarOpen ? "gap-2.5" : "justify-center"} bg-[#0E1B17]`}
          >
            <div className="w-8 h-8 rounded-lg bg-[#10B981] flex items-center justify-center border border-[#10B981]/20 shadow-md shrink-0">
              <img
                src={hospitalLogo}
                alt="Mesra Logo"
                className="w-full h-full object-contain"
              />
            </div>
            {sidebarOpen && (
              <div>
                <h3 className="font-black tracking-wider text-[12px] text-white leading-none">
                  MESRA<span className="text-[#10B981]">DIGITAL</span>
                </h3>
                <span className="text-[8px] text-[#94A3B8] font-bold tracking-widest block mt-0.5 uppercase">
                  Ultrasound Imaging
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

          <nav className="p-3 space-y-1">
            <div className="text-[8px] font-black uppercase text-[#94A3B8] px-3 py-2 tracking-widest">
              Interface Channels
            </div>

            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center justify-center ${sidebarOpen ? "px-3" : "px-2"} py-2.5 rounded-lg font-bold uppercase tracking-wider transition ${activeTab === "dashboard" ? "bg-[#10B981] text-white shadow-md font-black" : "text-[#94A3B8] hover:bg-[#0E1B17] hover:text-white"}`}
            >
              <LayoutDashboard size={14} />
              {sidebarOpen && <span className="ml-2.5">Dashboard Overview</span>}
            </button>

            <button
              onClick={() => setActiveTab("pendingRequests")}
              className={`w-full flex items-center justify-between ${sidebarOpen ? "px-3" : "px-2"} py-2.5 rounded-lg font-bold uppercase tracking-wider transition ${activeTab === "pendingRequests" ? "bg-[#10B981] text-white shadow-md font-black" : "text-[#94A3B8] hover:bg-[#0E1B17] hover:text-white"}`}
            >
              <div className="flex items-center">
                <Activity size={14} />
                {sidebarOpen && <span className="ml-2.5">Pending Requests</span>}
              </div>
              {sidebarOpen && (
                <span className="bg-[#0E1B17] text-[#10B981] border border-[#10B981]/20 px-2 py-0.5 rounded text-[8px] font-bold font-mono">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("ultrasoundAudit");
                loadAuditLogs();
              }}
              className={`w-full flex items-center justify-between ${sidebarOpen ? "px-3" : "px-2"} py-2.5 rounded-lg font-bold uppercase tracking-wider transition ${activeTab === "ultrasoundAudit" ? "bg-amber-600 text-white shadow-md font-black" : "text-[#94A3B8] hover:bg-[#0E1B17] hover:text-white"}`}
            >
              <div className="flex items-center">
                <ShieldAlert size={14} />
                {sidebarOpen && <span className="ml-2.5">Security Trails</span>}
              </div>
              {sidebarOpen && (
                <span className="bg-[#0E1B17] text-amber-300 px-2 py-0.5 rounded text-[8px] font-bold">
                  {auditAlertsCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-[#29323a] bg-[#0E1B17] space-y-4">
          <div className="bg-[#0E1B17] rounded-lg p-2.5 border border-[#0E1B17] text-[10px]">
            <div className="flex items-center gap-1.5 text-[#10B981] font-bold uppercase tracking-wide mb-1">
              <User size={12} /> {sidebarOpen && <span>Operator Account</span>}
            </div>
            <p className="text-white truncate font-bold text-[10px]">
              Ultrasound Tech
            </p>
            <p className="text-[#94A3B8] truncate text-[9px] mt-0.5">
              {sidebarOpen ? "Imaging Specialist" : ""}
            </p>
          </div>

          {selectedRequest && sidebarOpen && (
            <div className="bg-[#0E1B17] rounded-lg p-2.5 border border-[#0E1B17] text-[9px] animate-fadeIn">
              <div className="text-[#10B981] font-bold uppercase tracking-wide flex items-center gap-1 mb-1">
                <Layers size={11} /> <span>Locked Patient Node</span>
              </div>
              <p className="text-white font-black text-[10px] truncate">
                {selectedRequest.patientName}
              </p>
              <div className="mt-1 flex items-center justify-between text-[9px] text-[#94A3B8] font-mono">
                <span>MRN Token:</span>
                <span className="text-[#10B981] font-black">
                  {selectedRequest.cardId}
                </span>
              </div>
            </div>
          )}

          <div>
            <button
              onClick={onLogout}
              className="w-full py-2 bg-[#EF4444]/40 hover:bg-[#b91c1c] border border-[#EF4444]/30 text-[#EF4444] font-bold uppercase text-[8px] tracking-wider rounded-lg transition flex items-center justify-center gap-1.5"
            >
              <LogOut size={13} /> {sidebarOpen && "Terminate Token Session"}
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT FRAME */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-[#0E1B17] border-b border-white/20 sticky top-0 px-6 py-4 z-20 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-2">
            <Database size={15} className="text-[#94A3B8]" />
            <h1 className="text-[11px] font-black tracking-widest text-white uppercase font-mono">
              {activeTab === "dashboard" && "Ultrasound Imaging Dashboard"}
              {activeTab === "pendingRequests" &&
                (selectedRequest
                  ? "Process Imaging Request"
                  : "Incoming Ultrasound Requests")}
              {activeTab === "ultrasoundAudit" && "Security Operations Records"}
            </h1>
          </div>
          <div className="flex items-center gap-3 font-mono text-[9px]">
            <NotificationBell role="Ultrasound" />
            <div className="bg-[#0E1B17] text-[#10B981] border border-white/20 px-3 py-1 rounded-md font-bold uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-ping"></span>
              Network State: Live
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {error && activeTab !== "ultrasoundAudit" && (
            <div className="p-4 mb-6 bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 rounded-xl text-[11px] font-bold flex justify-between items-center animate-pulse">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
              <button
                onClick={() => {
                  setLoading(true);
                  fetchPendingRequests();
                }}
                className="bg-[#EF4444] text-white px-3 py-1 rounded-lg hover:bg-[#b91c1c] transition flex items-center gap-1.5"
              >
                <RefreshCw
                  size={12}
                  className={loading ? "animate-spin" : ""}
                />
                Retry Connection
              </button>
            </div>
          )}

          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[
                  {
                    label: "Pending Scans",
                    value: pendingRequests.length,
                    desc: "Requests awaiting imaging and reporting.",
                    color: "border-l-4 border-slate-800",
                  },
                  {
                    label: "Completed Today",
                    value: "0 Scans", // Placeholder, implement actual count
                    desc: "Imaging reports dispatched to physicians.",
                    color: "border-l-4 border-emerald-600",
                  },
                  {
                    label: "Critical Urgency",
                    value: pendingRequests.filter(
                      (r) => r.radiology?.urgencyLevel === "STAT",
                    ).length,
                    desc: "High priority requests requiring immediate attention.",
                    color: "border-l-4 border-[#EF4444]",
                  },
                ].map((stat, index) => (
                  <div
                    key={index}
                    className={`bg-[#0E1B17] border border-white/20 p-5 rounded-xl shadow-sm ${stat.color}`}
                  >
                    <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest block font-mono">
                      {stat.label}
                    </span>
                    <span className="text-2xl font-black text-white mt-1 block font-mono tracking-tight">
                      {stat.value}
                    </span>
                    <p className="text-[11px] text-[#94A3B8] mt-1.5 leading-relaxed">
                      {stat.desc}
                    </p>
                  </div>
                ))}
              </div>
              <div className="bg-[#0E1B17] rounded-xl border border-white/20 p-5 shadow-sm">
                <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider mb-2 font-mono text-[11px]">
                  <AlertCircle size={15} className="text-[#10B981]" />
                  <span>Imaging Protocol Guidelines</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  Ensure all imaging requests are processed according to the
                  requested modality and clinical indication. Accurate reporting
                  and timely dispatch to the physician EMR are critical for
                  patient care.
                </p>
              </div>
            </div>
          )}

          {activeTab === "pendingRequests" && !selectedRequest && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#0E1B17] border border-white/20 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
                <span className="font-mono text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
                  Available Ultrasound Request Queue
                </span>
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter requests by patient name or ID..."
                    className="w-full pl-10 pr-4 py-1.5 bg-[#0E1B17] border border-white/20 rounded-lg text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="bg-[#0E1B17] border border-white/20 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0E1B17] border-b border-white/20 text-[11px] font-bold uppercase text-[#94A3B8] font-mono">
                      <th className="p-4 px-6">Patient Name</th>
                      <th className="p-4 px-6">MRN Token</th>
                      <th className="p-4 px-6">Requested Modality</th>
                      <th className="p-4 px-6">Urgency</th>
                      <th className="p-4 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-200">
                    {loading ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="p-8 text-center text-[#94A3B8] font-mono"
                        >
                          Loading pending requests...
                        </td>
                      </tr>
                    ) : filteredRequests.length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="p-8 text-center text-[#94A3B8] font-mono"
                        >
                          No pending ultrasound requests.
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map((req) => (
                        <tr
                          key={req._id}
                          className="hover:bg-[#0E1B17]/60 transition"
                        >
                          <td className="p-4 px-6 font-bold text-white text-sm">
                            {req.patientName}
                          </td>
                          <td className="p-4 px-6 font-mono text-[#10B981] font-bold">
                            {req.cardId}
                          </td>
                          <td className="p-4 px-6 text-slate-300">
                            {req.radiology?.requestedModality}
                          </td>
                          <td className="p-4 px-6">
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                                req.radiology?.urgencyLevel === "STAT"
                                  ? "bg-[#EF4444]/10 text-[#EF4444] border-rose-100"
                                  : req.radiology?.urgencyLevel === "Urgent"
                                    ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                                    : "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20"
                              }`}
                            >
                              {req.radiology?.urgencyLevel}
                            </span>
                          </td>
                          <td className="p-4 px-6 text-right">
                            <button
                              type="button"
                              onClick={() => handleSelectRequest(req)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#10B981] text-white text-[11px] font-black uppercase tracking-wider rounded-xl hover:bg-[#0D9668] transition shadow-sm"
                            >
                              Process Scan <ChevronRight size={12} />
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

          {activeTab === "pendingRequests" && selectedRequest && (
            <div className="max-w-4xl mx-auto bg-[#0E1B17] border border-white/20 rounded-3xl shadow-xl overflow-hidden animate-fadeIn text-white">
              <div className="p-6 bg-[#050B09] text-white flex justify-between items-center">
                <div>
                  <h2 className="text-base font-black uppercase tracking-wider">
                    Process Ultrasound for {selectedRequest.patientName}
                  </h2>
                  <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
                    MRN: {selectedRequest.cardId} | Modality:{" "}
                    {selectedRequest.radiology?.requestedModality}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-xs bg-[#0E1B17] text-[#94A3B8] px-3 py-1.5 rounded-lg hover:text-white"
                >
                  Back to Queue
                </button>
              </div>

              <form onSubmit={handleResultsSubmit} className="p-8 space-y-6">
                <div className="p-4 bg-[#10B981]/10 border border-white/20 rounded-xl text-xs text-[#0D9668]">
                  <strong>Clinical Indication:</strong>{" "}
                  {selectedRequest.radiology?.clinicalIndication}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-wider block">
                    Ultrasound Report Text
                  </label>
                  <textarea
                    value={resultsForm.reportText}
                    onChange={(e) =>
                      setResultsForm((prev) => ({
                        ...prev,
                        reportText: e.target.value,
                      }))
                    }
                    rows="8"
                    placeholder="Enter detailed ultrasound findings and diagnostic conclusions..."
                    className="w-full px-4 py-2.5 bg-[#0E1B17] border border-white/20 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                {/* Image Upload Placeholder */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-wider block">
                      Clinical Imaging Attachments
                    </label>
                    <span className="text-[9px] font-mono text-[#94A3B8] bg-[#0E1B17] px-1.5 py-0.5 rounded">
                      {resultsForm.imageUrls.length} File(s)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                    {resultsForm.imageUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative group aspect-square rounded-xl overflow-hidden border border-white/20 shadow-sm bg-[#0E1B17]"
                      >
                        <img
                          src={url}
                          alt={`Scan ${idx}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setResultsForm((p) => ({
                              ...p,
                              imageUrls: p.imageUrls.filter(
                                (_, i) => i !== idx,
                              ),
                            }))
                          }
                          className="absolute top-1 right-1 p-1 bg-[#EF4444] text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-2 text-[#94A3B8] hover:text-[#10B981] hover:border-emerald-500 hover:bg-[#10B981]/10/30 transition-all group"
                    >
                      <Plus
                        size={20}
                        className="group-hover:scale-110 transition-transform"
                      />
                      <span className="text-[10px] font-black uppercase tracking-tight">
                        Add Scan File
                      </span>
                    </button>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelection}
                    className="hidden"
                    multiple
                    accept="image/*"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setSelectedRequest(null)}
                    className="px-5 py-2.5 border border-white/20 hover:bg-[#0E1B17] text-xs font-bold uppercase tracking-wider rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingResults}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#10B981] hover:bg-[#0D9668] text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg shadow-[#10B981]/20"
                  >
                    <CheckCircle size={14} />{" "}
                    {submittingResults
                      ? "Submitting..."
                      : "Submit Results to Doctor"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "ultrasoundAudit" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#0E1B17] rounded-xl border border-white/20 shadow-sm p-6">
                <h3 className="font-bold text-sm text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ShieldAlert className="text-amber-300" size={16} /> Imaging
                  Unit Security & Modification Logs
                </h3>

                <div className="relative mb-6">
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                  <input
                    type="text"
                    placeholder="Search security trails by patient name, action, or operator ID..."
                    value={searchQuery} // Reusing searchQuery for audit search
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#0E1B17] border border-white/20 rounded-xl text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-white"
                  />
                </div>

                {auditLogsError && (
                  <p className="text-xs text-[#EF4444] font-bold mb-4">
                    {auditLogsError}
                  </p>
                )}
                {auditLogsLoading ? (
                  <p className="text-xs text-[#94A3B8] font-mono">
                    Streaming system access records...
                  </p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {auditLogs.map((log, index) => (
                      <div
                        key={log._id || index}
                        className="py-2 flex justify-between items-start gap-4"
                      >
                        <div>
                          <span className="text-[#94A3B8]">
                            [
                            {new Date(
                              log.createdAt || log.timestamp,
                            ).toLocaleTimeString()}
                            ]
                          </span>{" "}
                          <span className="text-[#10B981] font-bold">
                            {log.action}
                          </span>{" "}
                          -{" "}
                          <span className="text-slate-300">{log.details}</span>
                        </div>
                        <span className="text-[#94A3B8] uppercase font-bold text-[9px] bg-[#0E1B17] px-1.5 py-0.5 rounded">
                          {log.userName || log.operatorId || "System Agent"}
                        </span>
                      </div>
                    ))}
                    {auditLogs.length === 0 && (
                      <p className="text-[#94A3B8] py-4">
                        No audit events generated over this session timeline
                        boundary.
                      </p>
                    )}
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
