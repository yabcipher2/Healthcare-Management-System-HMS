import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Layers,
  Search,
  LogOut,
  Bed,
  Users,
  AlertCircle,
  AlertTriangle,
  Clock,
  DoorOpen,
  CheckCircle,
  ArrowDownToLine,
  Activity,
  Hospital,
  ShieldAlert,
  Plus,
  X,
  FileText,
  User,
  Database,
  ClipboardList,
  ArrowUpRight,
  UserPlus,
  Menu,
} from "lucide-react";
import SidebarCollapseButton from "../components/SidebarCollapseButton";
import {
  logAudit,
  fetchAuditLogs,
  fetchAuditAlertsCount,
} from "../utils/audit";
import NotificationBell from "../components/NotificationBell";

export default function WardPage({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("bedMatrix");
  const [searchQuery, setSearchQuery] = useState("");
  const [auditSearchQuery, setAuditSearchQuery] = useState("");
  const [selectedBed, setSelectedBed] = useState(null);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [admissionRequests, setAdmissionRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const [auditAlertsCount, setAuditAlertsCount] = useState(0);
  const [auditAlertsError, setAuditAlertsError] = useState("");
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditLogsError, setAuditLogsError] = useState("");
  const [error, setError] = useState("");
  const [discharging, setDischarging] = useState(false);
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [admitBed, setAdmitBed] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [admitForm, setAdmitForm] = useState({
    patientId: "",
    patientName: "",
    cardId: "",
    admissionDate: "",
    attendingDoctor: "",
    severity: "Routine",
    medicationIntake: "",
    dischargeDate: "",
  });

  const hospitalLogo = "/mesra icon.png";
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // --- AUTHENTICATION HELPERS ---
  const getAuthHeaders = useCallback((isJson = true) => {
    const storedToken = localStorage.getItem("token");
    const headers = {};
    if (isJson) headers["Content-Type"] = "application/json";
    if (storedToken) headers["Authorization"] = `Bearer ${storedToken}`;
    return headers;
  }, []);

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/login";
  }, []);

  const totalBeds = beds.length;
  const occupiedCount = beds.filter((b) => b.status === "Occupied").length;
  const availableCount = totalBeds - occupiedCount;

  const loadAuditAlertsCount = useCallback(async () => {
    try {
      const data = await fetchAuditAlertsCount();
      setAuditAlertsCount(data);
      setAuditAlertsError("");
    } catch (err) {
      console.warn("Audit alerts count fetch failed:", err);
      setAuditAlertsError(err.message || "Failed to load audit alert count");
    }
  }, []);

  const getUserDepartment = useCallback(() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.department || parsed?.departmentName || null;
    } catch {
      return null;
    }
  }, []);

  const loadAuditLogs = useCallback(
    async (overrideModule) => {
      setAuditLogsLoading(true);
      setAuditLogsError("");
      try {
        const baseParams = {
          page: 1,
          limit: 20,
          search: auditSearchQuery,
        };
        const moduleToUse =
          overrideModule !== undefined
            ? overrideModule
            : getUserDepartment() || "Ward-Management";
        const result = await fetchAuditLogs({
          ...baseParams,
          module: moduleToUse,
        });
        let logs = result.data || [];
        // Fallback: if the module-scoped query returns nothing, retry without the filter
        if (logs.length === 0 && overrideModule === undefined) {
          const fallback = await fetchAuditLogs(baseParams);
          logs = fallback.data || [];
        }
        setAuditLogs(logs);
      } catch (err) {
        setAuditLogsError(err.message || "Failed to load audit logs");
      } finally {
        setAuditLogsLoading(false);
      }
    },
    [auditSearchQuery, getUserDepartment],
  );

  useEffect(() => {
    loadAuditAlertsCount();
    loadAuditLogs();
  }, [loadAuditAlertsCount, loadAuditLogs]);

  useEffect(() => {
    const interval = setInterval(() => loadAuditAlertsCount(), 30000);
    return () => clearInterval(interval);
  }, [loadAuditAlertsCount]);

  // Debounced audit log search: only refetch after the user stops typing for 350ms
  useEffect(() => {
    const handle = setTimeout(() => {
      loadAuditLogs();
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditSearchQuery]);

  const fetchBeds = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/ward`, {
        headers: getAuthHeaders(),
      });

      if (response.status === 401) {
        return handleAuthError();
      }

      if (!response.ok) throw new Error("Infrastructure sync failed."); // No mock data fallback here.

      const data = await response.json();
      const mapped = (data.data || []).map((b) => ({
        ...b,
        admissionDate:
          b.admissionDate || b.admissionTime
            ? new Date(b.admissionDate || b.admissionTime).toLocaleDateString()
            : "",
        dischargeDate:
          b.dischargeDate || b.dischargeTime
            ? new Date(b.dischargeDate || b.dischargeTime).toLocaleDateString()
            : "",
        medicationIntake: b.medicationIntake || "",
        attendingDoctor: b.attendingDoctor || "",
        severity: b.severity || "",
        patientName: b.patientName || "",
      }));
      setBeds(mapped);
      setError("");
    } catch (err) {
      console.error("Error fetching beds:", err);
      setError(
        err.message || "An unexpected error occurred while fetching ward data.",
      );
    } finally {
      setLoading(false);
    }
  }, [API_URL, getAuthHeaders, handleAuthError]);

  const fetchAdmissionRequests = useCallback(async () => {
    try {
      setRequestLoading(true);
      const response = await fetch(`${API_URL}/api/ward/admission-requests`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setAdmissionRequests(data.data || []);
      } else if (response.status === 401) {
        handleAuthError();
      } else {
        console.warn("Failed to fetch incoming requests", response.status);
      }
    } catch (err) {
      console.warn("Error fetching admission requests:", err);
    } finally {
      setRequestLoading(false);
    }
  }, [API_URL, getAuthHeaders, handleAuthError]);

  useEffect(() => {
    fetchBeds();
    if (activeTab === "admissionHub") fetchAdmissionRequests();
  }, [fetchBeds, fetchAdmissionRequests, activeTab]);

  const handleAssignBed = async () => {
    if (!selectedRequest || !selectedBed) return;
    if (selectedBed.status === "Occupied") {
      alert("Target asset is already occupied.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/ward/assign-bed`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          bedId: selectedBed.bedId,
          patientId: selectedRequest.patientId,
          admissionRequestId: selectedRequest._id,
          admissionDate: selectedRequest.admissionDate,
          dischargeDate: selectedRequest.dischargeDate,
          medicationIntake: selectedRequest.medicationIntake,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Bed assignment failed.");
      }

      await logAudit({
        action: "UPDATE",
        module: "Ward-Management",
        details: `Assigned bed ${selectedBed.bedId} to patient ${selectedRequest.patientName}`,
        targetId: selectedRequest.patientId,
        targetType: "BedAllocation",
      });

      // Refresh local states
      setSelectedRequest(null);
      setSelectedBed(null);
      fetchBeds();
      fetchAdmissionRequests();
      setActiveTab("bedMatrix");
      alert("Patient successfully assigned to bed asset.");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDischargePatient = async (bedId) => {
    try {
      setDischarging(true);

      const bedToDischarge = beds.find((b) => b.bedId === bedId);

      const response = await fetch(`${API_URL}/api/ward/${bedId}/discharge`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to discharge bed");
      }

      await logAudit({
        action: "UPDATE",
        module: "Ward",
        details: `Discharged patient ${
          bedToDischarge?.patientName || "Unknown"
        } from bed ${bedId}`,
        targetId: bedId,
        targetType: "BedDischarge",
      });

      setBeds((prev) =>
        prev.map((b) =>
          b.bedId === bedId
            ? {
                ...b,
                status: "Available",
                patientName: "",
                admissionTime: "",
                attendingDoctor: "",
                severity: "",
                patientCardId: "",
              }
            : b,
        ),
      );

      setSelectedBed(null);

      loadAuditLogs();
      loadAuditAlertsCount();
    } catch (err) {
      alert(`Discharge failed: ${err.message}`);
    } finally {
      setDischarging(false);
    }
  };

  const handleDirectAdmit = async () => {
    if (!admitBed) return;
    try {
      setSubmitting(true);
      const response = await fetch(`${API_URL}/api/ward/${admitBed.bedId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: "Occupied",
          patientId: admitForm.patientId || undefined,
          patientName: admitForm.patientName,
          admissionTime: admitForm.admissionDate || new Date().toISOString(),
          attendingDoctor: admitForm.attendingDoctor,
          severity: admitForm.severity,
          medicationIntake: admitForm.medicationIntake,
          dischargeDate: admitForm.dischargeDate,
          patientCardId: admitForm.cardId,
        }),
      });
      if (response.status === 401) return handleAuthError();
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Direct admission failed.");
      }
      await logAudit({
        action: "CREATE",
        module: "Ward-Management",
        details: `Direct admission: ${admitForm.patientName || "Unknown"} assigned to bed ${admitBed.bedId}`,
        targetId: admitBed.bedId,
        targetType: "BedAllocation",
      });
      setShowAdmitModal(false);
      setAdmitBed(null);
      setAdmitForm({
        patientId: "",
        patientName: "",
        cardId: "",
        admissionDate: "",
        attendingDoctor: "",
        severity: "Routine",
        medicationIntake: "",
        dischargeDate: "",
      });
      fetchBeds();
      loadAuditLogs();
      loadAuditAlertsCount();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Shared filter helper: matches a haystack string against the active search query
  const matchesQuery = useCallback((value, query) => {
    if (!query) return true;
    if (value === undefined || value === null) return false;
    return String(value).toLowerCase().includes(query);
  }, []);

  const filteredBeds = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return beds.filter(
      (bed) =>
        matchesQuery(bed.bedId, query) ||
        matchesQuery(bed.room, query) ||
        matchesQuery(bed.patientName, query) ||
        matchesQuery(bed.attendingDoctor, query) ||
        matchesQuery(bed.ward, query) ||
        matchesQuery(bed.severity, query),
    );
  }, [beds, searchQuery, matchesQuery]);

  const filteredAdmissionRequests = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return admissionRequests.filter(
      (req) =>
        matchesQuery(req.patientName, query) ||
        matchesQuery(req.bedId, query) ||
        matchesQuery(req.room, query) ||
        matchesQuery(req.ward, query) ||
        matchesQuery(req.doctorName, query) ||
        matchesQuery(req.admissionUrgency, query) ||
        matchesQuery(req.status, query),
    );
  }, [admissionRequests, searchQuery, matchesQuery]);
  return (
    <div className="flex min-h-screen bg-[#050B09] text-white font-sans antialiased text-[10px] selection:bg-[#10B981]/30 selection:text-[#10B981]">
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside
        className={`${sidebarOpen ? "w-56" : "w-16"} bg-[#0E1B17] text-slate-300 flex flex-col justify-between shrink-0 sticky top-0 h-screen overflow-hidden z-30 font-mono border-r border-[#0E1B17] transition-all duration-300`}
      >
        <div>
          <div
            className={`p-4 border-b border-[#29323a] flex items-center ${sidebarOpen ? "gap-2.5" : "justify-center"} bg-[#0E1B17]`}
          >
            <div className="w-8 h-8 rounded-lg bg-[#10B981] flex items-center justify-center border border-[#10B981]/20 shadow-md shrink-0">
              {hospitalLogo ? (
                <img
                  src={hospitalLogo}
                  className="w-5 h-5 object-contain"
                  alt="Logo"
                />
              ) : (
                <Hospital size={16} className="text-white" />
              )}
            </div>
            {sidebarOpen && (
              <div>
                <h3 className="font-black tracking-wider text-[12px] text-white leading-none">
                  MESRA<span className="text-[#10B981]">DIGITAL</span>
                </h3>
                <span className="text-[8px] text-[#94A3B8] font-bold tracking-widest block mt-0.5 uppercase">
                  Inpatient Ward Node
                </span>
              </div>
            )}
          </div>

          {/* Sidebar Collapse Control */}
          <SidebarCollapseButton
            collapsed={!sidebarOpen}
            onToggle={() => setSidebarOpen((open) => !open)}
            label="ward sidebar"
          />

          <nav className="p-3 space-y-1">
            <div className="text-[8px] font-black uppercase text-[#94A3B8] px-3 py-2 tracking-widest">
              Interface Channels
            </div>
            <button
              onClick={() => setActiveTab("bedMatrix")}
              className={`w-full flex items-center justify-center ${sidebarOpen ? "px-3" : "px-2"} py-2.5 rounded-lg font-bold uppercase tracking-wider transition ${activeTab === "bedMatrix" ? "bg-[#10B981] text-white shadow-md font-black" : "text-[#94A3B8] hover:bg-[#0E1B17] hover:text-white"}`}
            >
              <Layers size={14} />
              {sidebarOpen && (
                <span className="ml-2.5">Bed Control Matrix</span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("admissionHub")}
              className={`w-full flex items-center justify-between ${sidebarOpen ? "px-3" : "px-2"} py-2.5 rounded-lg font-bold uppercase tracking-wider transition ${activeTab === "admissionHub" ? "bg-[#10B981] text-white shadow-md font-black" : "text-[#94A3B8] hover:bg-[#0E1B17] hover:text-white"}`}
            >
              <div className="flex items-center">
                <UserPlus size={14} />
                {sidebarOpen && <span className="ml-2.5">Admission Hub</span>}
              </div>
              {sidebarOpen && (
                <span className="bg-[#0E1B17] text-[#10B981] px-2 py-0.5 rounded text-[8px] font-bold">
                  {admissionRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("wardAudit");
                loadAuditLogs();
              }}
              className={`w-full flex items-center justify-between ${sidebarOpen ? "px-3" : "px-2"} py-2.5 rounded-lg font-bold uppercase tracking-wider transition ${activeTab === "wardAudit" ? "bg-amber-600 text-white shadow-md font-black" : "text-[#94A3B8] hover:bg-[#0E1B17] hover:text-white"}`}
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
              <User size={12} /> {sidebarOpen && <span>Clinical Station</span>}
            </div>
            <p className="text-white truncate font-bold text-[10px]">
              NS-Alpha Unit
            </p>
            <p className="text-[#94A3B8] truncate text-[9px] mt-0.5">
              {sidebarOpen ? "Ward Nursing Node" : ""}
            </p>
          </div>

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

      {/* MAIN CONTENT FRAMEWORK */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-[#0E1B17] border-b border-white/20 sticky top-0 px-6 py-4 z-20 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-2">
            <Database size={15} className="text-[#94A3B8]" />
            <h1 className="text-[11px] font-black tracking-widest text-white uppercase font-mono">
              Inpatient Bed Occupancy & Chronology Monitor
            </h1>
          </div>
          <div className="flex items-center gap-3 font-mono text-[9px]">
            <div className="bg-[#0E1B17] text-[#10B981] border border-white/20 px-3 py-1 rounded-md font-bold uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-ping" />
              Network State: Live
            </div>
            <NotificationBell role="Ward" />
          </div>
        </header>

        {/* METRICS DASHBOARD RIBBON */}
        <div className="px-6 pt-6">
          {error && (
            <div className="mb-4 bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] px-4 py-3 rounded-xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2 font-black uppercase tracking-wider text-[9px]">
                <ShieldAlert size={14} className="text-[#EF4444]" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => setError("")}
                className="text-[#EF4444] hover:text-[#EF4444] transition"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {activeTab === "bedMatrix" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeIn">
              <div className="bg-[#0E1B17] p-4 rounded-xl border border-white/20 shadow-sm flex items-center justify-between border-l-4 border-l-slate-800">
                <div>
                  <p className="text-[10px] font-mono font-bold text-[#94A3B8] uppercase tracking-wider">
                    Total Grid Capacitance
                  </p>
                  <h3 className="text-lg font-black text-white mt-1">
                    {totalBeds} Bed Units
                  </h3>
                </div>
                <Bed className="text-slate-300" size={22} />
              </div>
              <div className="bg-[#0E1B17] p-4 rounded-xl border border-white/20 shadow-sm flex items-center justify-between border-l-4 border-l-amber-500">
                <div>
                  <p className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                    Active Occupancies
                  </p>
                  <h3 className="text-lg font-black text-white mt-1">
                    {occupiedCount} Assigned
                  </h3>
                </div>
                <Users className="text-amber-300" size={22} />
              </div>
              <div className="bg-[#0E1B17] p-4 rounded-xl border border-white/20 shadow-sm flex items-center justify-between border-l-4 border-l-emerald-600">
                <div>
                  <p className="text-[10px] font-mono font-bold text-[#10B981] uppercase tracking-wider">
                    Vacant & Prepared
                  </p>
                  <h3 className="text-lg font-black text-white mt-1">
                    {availableCount} Vacant
                  </h3>
                </div>
                <DoorOpen className="text-[#10B981]" size={22} />
              </div>
            </div>
          )}
        </div>

        {/* CONTENT TABS ROUTING */}
        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === "bedMatrix" && (
            <div className="grid grid-cols-1 gap-6 animate-fadeIn">
              {/* LEFT AREA: GRID MAP SCREEN */}
              <div className="space-y-4">
                <div className="bg-[#0E1B17] rounded-xl p-4 border border-white/20 shadow-sm">
                  <h3 className="font-black text-[11px] uppercase tracking-wider text-[#94A3B8] mb-2">
                    Query Ward Grid Allocation
                  </h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                    <input
                      type="text"
                      placeholder="Filter by bed tag, room module, or inpatient name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-[#0E1B17] border border-white/20 rounded-lg text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* WARD INTERACTIVE MATRIX TABLE */}
                <div className="overflow-x-auto border border-white/20 rounded-xl bg-[#0E1B17]">
                  <table className="min-w-full text-[11px] font-mono">
                    <thead className="bg-[#0E1B17] text-[#94A3B8] uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-3 py-2 text-left font-bold">Bed</th>
                        <th className="px-3 py-2 text-left font-bold">Ward</th>
                        <th className="px-3 py-2 text-left font-bold">
                          Status
                        </th>
                        <th className="px-3 py-2 text-left font-bold">
                          Patient
                        </th>
                        <th className="px-3 py-2 text-left font-bold">
                          Attending Doctor
                        </th>
                        <th className="px-3 py-2 text-left font-bold">
                          Severity
                        </th>
                        <th className="px-3 py-2 text-left font-bold">
                          Admission Date
                        </th>
                        <th className="px-3 py-2 text-left font-bold">
                          Release Date
                        </th>
                        <th className="px-3 py-2 text-left font-bold">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBeds.length === 0 ? (
                        <tr>
                          <td
                            colSpan={9}
                            className="px-3 py-6 text-center text-[#94A3B8] italic font-medium"
                          >
                            No beds match the current filters.
                          </td>
                        </tr>
                      ) : (
                        filteredBeds.map((bed) => (
                          <tr
                            key={bed.bedId}
                            onClick={() => setSelectedBed(bed)}
                            className={`cursor-pointer transition-colors ${
                              selectedBed?.bedId === bed.bedId
                                ? "bg-teal-50/60"
                                : "hover:bg-[#0E1B17]"
                            }`}
                          >
                            <td className="px-3 py-2 font-black text-white">
                              <div className="flex items-center gap-1.5">
                                <Bed
                                  size={14}
                                  className={
                                    bed.status === "Occupied"
                                      ? "text-amber-300"
                                      : "text-[#10B981]"
                                  }
                                />
                                {bed.bedId}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-slate-300 uppercase tracking-wider">
                              {bed.room || "—"}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                                  bed.status === "Occupied"
                                    ? "bg-amber-500/20 text-amber-300"
                                    : "bg-[#10B981]/20 text-[#94A3B8]"
                                }`}
                              >
                                {bed.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-bold text-white">
                              {bed.patientName || (
                                <span className="text-[#94A3B8] italic font-medium">
                                  Unassigned
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-slate-300">
                              {bed.attendingDoctor || (
                                <span className="text-[#94A3B8] italic">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-slate-300">
                              {bed.severity || (
                                <span className="text-[#94A3B8] italic">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-[#94A3B8]">
                              {bed.admissionDate || (
                                <span className="text-[#94A3B8] italic">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-[#94A3B8]">
                              {(() => {
                                const raw =
                                  bed.dischargeDate || bed.dischargeTime;
                                if (!raw) {
                                  return (
                                    <span className="text-[#94A3B8] italic">
                                      —
                                    </span>
                                  );
                                }
                                const out = new Date(raw);
                                if (isNaN(out.getTime())) {
                                  return (
                                    <span className="text-[#94A3B8] italic">
                                      —
                                    </span>
                                  );
                                }
                                const now = new Date();
                                const diffMs = out.getTime() - now.getTime();
                                const diffHrs = diffMs / (1000 * 60 * 60);
                                const label = out.toLocaleDateString();
                                if (diffMs <= 0) {
                                  return (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-[#EF4444]/10 text-[#EF4444] border border-rose-300">
                                      <AlertTriangle size={10} /> {label} ·
                                      Expired
                                    </span>
                                  );
                                }
                                if (diffHrs <= 24) {
                                  return (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-300">
                                      <AlertTriangle size={10} /> {label} · Soon
                                    </span>
                                  );
                                }
                                return (
                                  <span className="inline-flex items-center gap-1 text-slate-200">
                                    <Clock
                                      size={10}
                                      className="text-[#94A3B8]"
                                    />
                                    {label}
                                  </span>
                                );
                              })()}
                            </td>
                            <td
                              className="px-3 py-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {bed.status === "Occupied" ? (
                                <button
                                  onClick={async () => {
                                    setSelectedBed(bed);
                                    try {
                                      setDischarging(true);
                                      const res = await fetch(
                                        `${API_URL}/api/ward/${bed.bedId}/discharge`,
                                        {
                                          method: "POST",
                                          headers: getAuthHeaders(),
                                        },
                                      );
                                      if (res.status === 401) {
                                        return handleAuthError();
                                      }
                                      if (!res.ok)
                                        throw new Error("Discharge failed");
                                      await fetchBeds();
                                      setSelectedBed(null);
                                    } catch (err) {
                                      console.error(err);
                                    } finally {
                                      setDischarging(false);
                                    }
                                  }}
                                  disabled={discharging}
                                  className="px-2 py-1 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 disabled:opacity-50"
                                >
                                  Discharge
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setAdmitBed(bed);
                                    setAdmitForm({
                                      patientId: "",
                                      patientName: "",
                                      cardId: "",
                                      admissionDate: new Date()
                                        .toISOString()
                                        .split("T")[0],
                                      attendingDoctor: "",
                                      severity: "Routine",
                                      medicationIntake: "",
                                      dischargeDate: "",
                                    });
                                    setShowAdmitModal(true);
                                  }}
                                  className="px-2 py-1 rounded text-[10px] font-bold bg-[#10B981]/20 text-[#94A3B8] hover:bg-[#10B981]/20"
                                >
                                  Admit
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "admissionHub" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#0E1B17] rounded-xl border border-white/20 shadow-sm overflow-hidden">
                <div className="p-4 bg-[#050B09] text-[#94A3B8] font-mono text-[9px] uppercase tracking-widest flex justify-between items-center">
                  <span>Incoming Admission Requests Pipeline</span>
                  {requestLoading && (
                    <span className="animate-pulse">Streaming Nodes...</span>
                  )}
                </div>
                <div className="overflow-x-auto min-h-[200px]">
                  <table className="min-w-full text-[11px] font-mono">
                    <thead className="bg-[#0E1B17] text-[#94A3B8] uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-3 py-2 text-left font-bold">
                          Patient
                        </th>
                        <th className="px-3 py-2 text-left font-bold">
                          Requested Bed / Ward
                        </th>
                        <th className="px-3 py-2 text-left font-bold">
                          Priority
                        </th>
                        <th className="px-3 py-2 text-left font-bold">
                          Requested By
                        </th>
                        <th className="px-3 py-2 text-left font-bold">Time</th>
                        <th className="px-3 py-2 text-left font-bold">
                          Status
                        </th>
                        <th className="px-3 py-2 text-left font-bold">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {admissionRequests.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-3 py-10 text-center text-[#94A3B8] font-mono text-[10px] uppercase"
                          >
                            No pending admission requests detected in the
                            buffer.
                          </td>
                        </tr>
                      ) : (
                        admissionRequests.map((req) => (
                          <tr
                            key={req._id}
                            onClick={() => setSelectedRequest(req)}
                            className={`cursor-pointer transition-colors ${
                              selectedRequest?._id === req._id
                                ? "bg-[#10B981]/10"
                                : "hover:bg-[#0E1B17]"
                            }`}
                          >
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[11px] ${
                                    req.admissionUrgency === "Emergent"
                                      ? "bg-[#EF4444]/10 text-[#EF4444]"
                                      : "bg-[#0E1B17] text-slate-300"
                                  }`}
                                >
                                  {req.admissionUrgency?.[0] || "?"}
                                </div>
                                <div>
                                  <p className="font-black text-white text-[11px] uppercase">
                                    {req.patientName}
                                  </p>
                                  <p className="text-[9px] text-[#94A3B8]">
                                    {req.cardId} | {req.age}Y | {req.gender}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-slate-200">
                              <div className="flex flex-col">
                                <span className="font-bold">
                                  {req.bedId ? `Bed ${req.bedId}` : "—"}
                                </span>
                                <span className="text-[9px] text-[#94A3B8] uppercase">
                                  {req.room || req.ward || "Unassigned"}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  req.admissionUrgency === "Emergent"
                                    ? "bg-[#EF4444]/10 text-[#EF4444]"
                                    : "bg-[#10B981]/10 text-[#10B981]"
                                }`}
                              >
                                {req.admissionUrgency || "Routine"}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-slate-200">
                              {req.doctorName || (
                                <span className="text-[#94A3B8] italic">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-[#94A3B8]">
                              {req.createdAt
                                ? new Date(req.createdAt).toLocaleString()
                                : req.admissionDate || (
                                    <span className="text-[#94A3B8] italic">
                                      —
                                    </span>
                                  )}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  req.status === "Assigned"
                                    ? "bg-[#10B981]/20 text-[#10B981]"
                                    : req.status === "Cancelled"
                                      ? "bg-[#EF4444]/10 text-[#EF4444]"
                                      : "bg-amber-500/20 text-amber-300"
                                }`}
                              >
                                {req.status || "Pending"}
                              </span>
                            </td>
                            <td
                              className="px-3 py-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedRequest(req);
                                    setActiveTab("bedMatrix");
                                  }}
                                  disabled={req.status === "Assigned" || req.status === "Cancelled"}
                                  className="px-2 py-1 rounded text-[10px] font-bold bg-[#10B981]/20 text-[#94A3B8] hover:bg-[#10B981]/20 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={async () => {
                                    if (
                                      !window.confirm(
                                        `Reject admission request for ${req.patientName}?`,
                                      )
                                    )
                                      return;
                                    try {
                                      const res = await fetch(
                                        `${API_URL}/api/ward/admission-requests/${req._id}/reject`,
                                        {
                                          method: "POST",
                                          headers: getAuthHeaders(),
                                        },
                                      );
                                      if (res.status === 401) {
                                        return handleAuthError();
                                      }
                                      if (!res.ok) {
                                        const errData = await res
                                          .json()
                                          .catch(() => ({}));
                                        throw new Error(
                                          errData.message || "Reject failed",
                                        );
                                      }
                                      await logAudit({
                                        action: "UPDATE",
                                        module: "Ward-Management",
                                        details: `Rejected admission request for ${req.patientName}`,
                                        targetId: req.patientId,
                                        targetType: "AdmissionRequest",
                                      });
                                      await fetchAdmissionRequests();
                                      if (selectedRequest?._id === req._id) {
                                        setSelectedRequest(null);
                                      }
                                    } catch (err) {
                                      alert(err.message);
                                    }
                                  }}
                                  disabled={req.status === "Cancelled" || req.status === "Assigned"}
                                  className="px-2 py-1 rounded text-[10px] font-bold bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/30 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* WARD AUDIT LOGS SECTION */}
          {activeTab === "wardAudit" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-[#0E1B17] rounded-2xl border border-white/20 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#0E1B17]/30">
                  <div>
                    <h1 className="text-md font-black text-white uppercase tracking-tight">
                      Department Audit Logs
                    </h1>
                    <p className="text-[#94A3B8] font-bold mt-0.5 text-[10px] uppercase tracking-wide">
                      Your recent activity and department changes
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-[#EF4444]/10 text-[#EF4444] border border-rose-100 px-2 py-1 rounded uppercase">
                    My Department
                  </span>
                </div>
                <div className="p-5 border-b border-white/10">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                    <input
                      type="text"
                      placeholder="Search security trails by patient name, action, or operator ID..."
                      value={auditSearchQuery}
                      onChange={(e) => setAuditSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-[#0E1B17] border border-white/20 rounded-xl text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-white"
                    />
                  </div>
                </div>
                {auditLogsError && (
                  <div className="mx-4 mt-4 p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg text-[11px] font-bold text-[#EF4444]">
                    {auditLogsError}
                  </div>
                )}
                {auditLogsLoading ? (
                  <div className="p-8 text-center text-[11px] font-black text-[#94A3B8] uppercase tracking-wider">
                    Loading audit logs...
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="p-8 text-center text-[11px] font-black text-[#94A3B8] uppercase tracking-wider">
                    No audit logs found for your department
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <div
                        key={log._id || log.id}
                        className="px-3 py-2 flex items-start gap-3 hover:bg-[#0E1B17]/50 transition"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#0E1B17] flex items-center justify-center shrink-0 text-[#94A3B8]">
                          {log.action === "CREATE" && <Plus size={16} />}
                          {log.action === "UPDATE" && <FileText size={16} />}
                          {log.action === "DELETE" && <X size={16} />}
                          {[
                            "ACTIVATE",
                            "DEACTIVATE",
                            "RESTORE",
                            "ARCHIVE",
                          ].includes(log.action) && <Activity size={16} />}
                          {log.action === "LOGIN" && <LogOut size={16} />}
                          {![
                            "CREATE",
                            "UPDATE",
                            "DELETE",
                            "ACTIVATE",
                            "DEACTIVATE",
                            "RESTORE",
                            "ARCHIVE",
                            "LOGIN",
                          ].includes(log.action) && <ClipboardList size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-black text-white uppercase">
                              {log.module}
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-[#10B981]/10 text-[#10B981] px-2 py-0.5 rounded uppercase">
                              {log.action}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                            {log.details}
                          </p>
                          <p className="text-[10px] text-[#94A3B8] mt-1 font-mono">
                            {log.userName} • {log.userRole} • {log.department} •{" "}
                            {new Date(log.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ADMIT PATIENT MODAL */}
              {showAdmitModal && admitBed && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050B09]/70 backdrop-blur-sm animate-fadeIn"
                  onClick={() => {
                    setShowAdmitModal(false);
                    setAdmitBed(null);
                  }}
                >
                  <div
                    className="bg-[#0E1B17] rounded-2xl border border-white/20 shadow-2xl w-full max-w-lg overflow-hidden animate-slideUp"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-4 bg-[#050B09] text-white flex justify-between items-center">
                      <div>
                        <span className="text-[11px] font-mono text-[#10B981] font-bold uppercase">
                          {admitBed.room}
                        </span>
                        <h2 className="text-[13px] font-black tracking-wide text-white mt-0.5">
                          Direct Admission — Bed {admitBed.bedId}
                        </h2>
                      </div>
                      <button
                        onClick={() => {
                          setShowAdmitModal(false);
                          setAdmitBed(null);
                        }}
                        className="text-slate-300 hover:text-white transition p-1 rounded hover:bg-[#0E1B17]"
                        aria-label="Close modal"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-black text-[#94A3B8] uppercase tracking-wider mb-1">
                            Patient Name{" "}
                            <span className="text-[#EF4444]">*</span>
                          </label>
                          <input
                            type="text"
                            value={admitForm.patientName}
                            onChange={(e) =>
                              setAdmitForm((f) => ({
                                ...f,
                                patientName: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 bg-[#0E1B17] border border-white/20 rounded-lg text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Enter patient name"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-[#94A3B8] uppercase tracking-wider mb-1">
                            Card / ID
                          </label>
                          <input
                            type="text"
                            value={admitForm.cardId}
                            onChange={(e) =>
                              setAdmitForm((f) => ({
                                ...f,
                                cardId: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 bg-[#0E1B17] border border-white/20 rounded-lg text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="e.g. PT-001"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-black text-[#94A3B8] uppercase tracking-wider mb-1">
                            Admission Date{" "}
                            <span className="text-[#EF4444]">*</span>
                          </label>
                          <input
                            type="date"
                            value={admitForm.admissionDate}
                            onChange={(e) =>
                              setAdmitForm((f) => ({
                                ...f,
                                admissionDate: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 bg-[#0E1B17] border border-white/20 rounded-lg text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-[#94A3B8] uppercase tracking-wider mb-1">
                            Discharge Date
                          </label>
                          <input
                            type="date"
                            value={admitForm.dischargeDate}
                            onChange={(e) =>
                              setAdmitForm((f) => ({
                                ...f,
                                dischargeDate: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 bg-[#0E1B17] border border-white/20 rounded-lg text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-black text-[#94A3B8] uppercase tracking-wider mb-1">
                            Attending Doctor
                          </label>
                          <input
                            type="text"
                            value={admitForm.attendingDoctor}
                            onChange={(e) =>
                              setAdmitForm((f) => ({
                                ...f,
                                attendingDoctor: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 bg-[#0E1B17] border border-white/20 rounded-lg text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Dr. Name"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-[#94A3B8] uppercase tracking-wider mb-1">
                            Severity
                          </label>
                          <select
                            value={admitForm.severity}
                            onChange={(e) =>
                              setAdmitForm((f) => ({
                                ...f,
                                severity: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 bg-[#0E1B17] border border-white/20 rounded-lg text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="Routine">Routine</option>
                            <option value="Urgent">Urgent</option>
                            <option value="Emergent">Emergent</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-[#94A3B8] uppercase tracking-wider mb-1">
                          Medication Intake
                        </label>
                        <textarea
                          value={admitForm.medicationIntake}
                          onChange={(e) =>
                            setAdmitForm((f) => ({
                              ...f,
                              medicationIntake: e.target.value,
                            }))
                          }
                          rows="2"
                          className="w-full px-3 py-2 bg-[#0E1B17] border border-white/20 rounded-lg text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                          placeholder="List current medications..."
                        />
                      </div>
                      <button
                        onClick={handleDirectAdmit}
                        disabled={submitting || !admitForm.patientName.trim()}
                        className="w-full py-3 bg-[#10B981] hover:bg-[#0D9668] text-white font-black uppercase tracking-widest text-[10px] rounded-lg transition-all shadow-lg disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {submitting ? (
                          "Processing..."
                        ) : (
                          <>
                            <UserPlus size={14} /> Confirm Direct Admission
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {selectedRequest && selectedBed && (
          <div className="px-6 pb-6 animate-fadeIn">
            <div className="bg-[#0E1B17] rounded-xl p-5 border border-[#10B981]/30 shadow-sm space-y-4">
              <h3 className="font-black text-[11px] uppercase tracking-wider text-[#94A3B8] flex items-center gap-2">
                <FileText size={14} /> Admission Context
              </h3>
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-[#10B981]/10 rounded-lg border border-[#10B981]/20 text-[11px] text-[#10B981] leading-relaxed font-medium">
                    <strong className="block mb-1 uppercase text-[9px] opacity-60">
                      Clinical Reason:
                    </strong>
                    {selectedRequest.clinicalReason}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-[#0E1B17] rounded-lg border border-white/10">
                      <strong className="block mb-1 uppercase text-[9px] opacity-60">
                        In Date:
                      </strong>
                      <span className="text-[10px] font-mono">
                        {selectedRequest.admissionDate || "N/A"}
                      </span>
                    </div>
                    <div className="p-3 bg-[#0E1B17] rounded-lg border border-white/10">
                      <strong className="block mb-1 uppercase text-[9px] opacity-60">
                        Out Date:
                      </strong>
                      <span className="text-[10px] font-mono">
                        {selectedRequest.dischargeDate || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 bg-[#10B981]/10 rounded-lg border border-white/10 text-[11px] text-[#0D9668] leading-relaxed font-medium">
                    <strong className="block mb-1 uppercase text-[9px] opacity-60">
                      Patient Medicines:
                    </strong>
                    {selectedRequest.medicationIntake ||
                      "No medications specified."}
                  </div>
                </div>
                <div className="bg-[#0E1B17] rounded-xl p-5 border border-white/20 shadow-sm space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-black text-[11px] uppercase tracking-wider text-[#94A3B8] mb-4">
                      Assignment Configuration
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-mono border-b pb-2">
                        <span className="text-[#94A3B8] uppercase">
                          Selected Patient:
                        </span>
                        <span className="text-white font-black uppercase">
                          {selectedRequest.patientName}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono border-b pb-2">
                        <span className="text-[#94A3B8] uppercase">
                          Target Bed Slot:
                        </span>
                        <span
                          className={`font-black uppercase ${selectedBed ? "text-[#10B981]" : "text-[#EF4444] italic"}`}
                        >
                          {selectedBed
                            ? `Bed ${selectedBed.bedId} (${selectedBed.room})`
                            : "No Bed Selected - Pick from Grid"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    disabled={!selectedBed}
                    onClick={handleAssignBed}
                    className="w-full py-3 bg-[#050B09] hover:bg-[#10B981] text-white font-black uppercase tracking-widest text-[10px] rounded-lg transition-all shadow-lg disabled:opacity-30 disabled:hover:bg-[#050B09]"
                  >
                    Finalize Bed Allocation Asset
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BED DETAIL MODAL — only opens when NOT in assignment mode */}
      {selectedBed && !showAdmitModal && !selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050B09]/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedBed(null)}
        >
          <div
            className="bg-[#0E1B17] rounded-2xl border border-white/20 shadow-2xl w-full max-w-lg overflow-hidden animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-[#050B09] text-white flex justify-between items-center">
              <div>
                <span className="text-[11px] font-mono text-teal-400 font-bold uppercase">
                  {selectedBed.room}
                </span>
                <h2 className="text-[13px] font-black tracking-wide text-white mt-0.5">
                  Bed Asset {selectedBed.bedId || selectedBed.id}
                </h2>
              </div>
              <button
                onClick={() => setSelectedBed(null)}
                className="text-slate-300 hover:text-white transition p-1 rounded hover:bg-[#0E1B17]"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {selectedBed.status === "Occupied" ? (
                <>
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-1.5 text-[11px] text-amber-300">
                    <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-amber-300">
                      <Activity size={12} /> Active Ward Occupancy Dossier
                    </div>
                    <div className="space-y-0.5 mt-1 font-medium">
                      <p>
                        <span className="text-amber-300/80">
                          Inpatient Name:
                        </span>{" "}
                        {selectedBed.patientName}
                      </p>
                      <p>
                        <span className="text-amber-300/80">
                          Attending Physician:
                        </span>{" "}
                        {selectedBed.attendingDoctor}
                      </p>
                      <p>
                        <span className="text-amber-300/80">
                          Severity Assignment:
                        </span>{" "}
                        {selectedBed.severity}
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-amber-500/30/50 space-y-2">
                      <p>
                        <span className="text-amber-300/80 uppercase text-[9px] font-bold">
                          Out Date:
                        </span>{" "}
                        {selectedBed.dischargeDate || "N/A"}
                      </p>
                      {(() => {
                        const raw =
                          selectedBed.dischargeDate ||
                          selectedBed.dischargeTime;
                        if (!raw) return null;
                        const out = new Date(raw);
                        if (isNaN(out.getTime())) return null;
                        const now = new Date();
                        const diffMs = out.getTime() - now.getTime();
                        const diffHrs = diffMs / (1000 * 60 * 60);
                        if (diffMs <= 0) {
                          return (
                            <div className="p-2.5 bg-[#EF4444]/10 border-2 border-[#EF4444] rounded-lg flex items-start gap-2 text-[11px] font-bold text-[#EF4444] animate-pulse">
                              <AlertTriangle
                                size={14}
                                className="text-[#EF4444] shrink-0 mt-0.5"
                              />
                              <div>
                                <p className="uppercase tracking-wider text-[10px] text-[#EF4444]">
                                  ⚠ Time Expired
                                </p>
                                <p className="font-medium text-[#EF4444]">
                                  The scheduled discharge time has passed.
                                  Finalize inpatient exit immediately.
                                </p>
                              </div>
                            </div>
                          );
                        }
                        if (diffHrs <= 24) {
                          const hrs = Math.floor(diffHrs);
                          const mins = Math.floor((diffHrs - hrs) * 60);
                          return (
                            <div className="p-2.5 bg-amber-500/20 border-2 border-amber-400 rounded-lg flex items-start gap-2 text-[11px] font-bold text-amber-300">
                              <AlertTriangle
                                size={14}
                                className="text-amber-300 shrink-0 mt-0.5"
                              />
                              <div>
                                <p className="uppercase tracking-wider text-[10px] text-amber-300">
                                  ⏰ Discharge Soon
                                </p>
                                <p className="font-medium text-amber-300">
                                  {hrs}h {mins}m remaining — prepare for
                                  release.
                                </p>
                              </div>
                            </div>
                          );
                        }
                        const days = Math.floor(diffHrs / 24);
                        return (
                          <div className="p-2 bg-[#10B981]/10 border border-[#10B981]/30 rounded text-[10px] font-bold text-[#94A3B8] flex items-center gap-1.5">
                            <Clock size={12} className="text-[#10B981]" />
                            {days} day{days !== 1 ? "s" : ""} until scheduled
                            discharge.
                          </div>
                        );
                      })()}
                      <div className="p-2 bg-[#0E1B17]/70 rounded border border-amber-500/30 mt-1">
                        <span className="text-amber-300/80 uppercase text-[9px] font-bold block mb-1">
                          Medicines Intake:
                        </span>
                        {selectedBed.medicationIntake || "No intake records."}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wider block">
                      Admission Chronology Timeline
                    </span>
                    <div className="p-3 bg-[#0E1B17] border border-white/20 rounded-lg flex items-center gap-2 text-[11px] font-medium text-slate-200">
                      <Clock size={13} className="text-teal-500" /> Patient
                      checked into asset structure{" "}
                      <strong>{selectedBed.admissionDate}</strong>.
                    </div>
                  </div>
                  {(() => {
                    const raw =
                      selectedBed.dischargeDate || selectedBed.dischargeTime;
                    const isCritical =
                      raw &&
                      !isNaN(new Date(raw).getTime()) &&
                      new Date(raw).getTime() - Date.now() <=
                        24 * 60 * 60 * 1000;
                    return (
                      <button
                        onClick={() =>
                          handleDischargePatient(selectedBed.bedId)
                        }
                        disabled={discharging}
                        className={`w-full py-2.5 border font-black uppercase tracking-widest text-[11px] rounded-lg transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 ${
                          isCritical
                            ? "bg-[#EF4444] hover:bg-[#b91c1c] border-rose-700 text-white animate-pulse"
                            : "bg-[#050B09] hover:bg-rose-950 border-white/10 text-slate-300 hover:text-[#EF4444]"
                        }`}
                      >
                        <AlertTriangle
                          size={14}
                          className={isCritical ? "text-white" : "hidden"}
                        />
                        <ArrowDownToLine size={14} />{" "}
                        {discharging
                          ? "Processing..."
                          : isCritical
                            ? "⚠ Urgent: Finalize Exit Now"
                            : "Finalize Inpatient Exit & Release Bed"}
                      </button>
                    );
                  })()}
                </>
              ) : (
                <div className="py-8 text-center space-y-3">
                  <div className="w-10 h-10 bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 rounded-xl flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[12px] font-black text-white uppercase tracking-wide">
                      Bed Unit Asset Vacant
                    </h4>
                    <p className="text-[11px] text-[#94A3B8] max-w-xs mx-auto leading-relaxed">
                      This allocation asset slot is fully sterilized,
                      configured, and waiting for an incoming patient dispatch
                      request.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setAdmitBed(selectedBed);
                      setAdmitForm({
                        patientId: "",
                        patientName: "",
                        cardId: "",
                        admissionDate: new Date().toISOString().split("T")[0],
                        attendingDoctor: "",
                        severity: "Routine",
                        medicationIntake: "",
                        dischargeDate: "",
                      });
                      setShowAdmitModal(true);
                    }}
                    className="mt-4 px-6 py-2.5 bg-[#10B981] hover:bg-[#0D9668] text-white font-black uppercase tracking-widest text-[10px] rounded-lg transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <UserPlus size={14} /> Admit Patient
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
