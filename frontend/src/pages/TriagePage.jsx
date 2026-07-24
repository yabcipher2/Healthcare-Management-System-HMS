import React, { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Heart,
  Thermometer,
  Wind,
  AlertTriangle,
  Users,
  CheckCircle,
  Clock,
  Menu,
  LayoutDashboard,
  Search,
  ChevronRight,
  ShieldAlert,
  X,
  LogOut,
  ClipboardList,
  Database,
  Layers,
  User,
} from "lucide-react";
import {
  logAudit,
  fetchAuditLogs,
  fetchAuditAlertsCount,
} from "../utils/audit";
import NotificationBell from "../components/NotificationBell";

export default function TriagePage({ onLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [globalBannerMessage, setGlobalBannerMessage] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [auditAlertsCount, setAuditAlertsCount] = useState(0);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditSearchQuery, setAuditSearchQuery] = useState("");
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditLogsError, setAuditLogsError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [redCriticalsToday, setRedCriticalsToday] = useState(0);
  const [totalAssessedToday, setTotalAssessedToday] = useState(0);

  const [vitals, setVitals] = useState({
    bpSystolic: "",
    bpDiastolic: "",
    heartRate: "",
    temperature: "",
    spo2: "",
    respiratoryRate: "",
    weight: "",
    randomBloodSugar: "",
    triageCategory: "Green (Non-Urgent)",
    secondaryUrgencyNotes: "",
  });

  // Dispatch state
  const [dispatching, setDispatching] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState(null); // null, 'success', 'error'
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [doctorsByDepartment, setDoctorsByDepartment] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentsError, setDepartmentsError] = useState("");
  const [doctorsLoading, setDoctorsLoading] = useState(false); // FIXED: Added missing hook reference

  const hospitalLogo = "/mesra icon.png";
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  const triggerSystemBanner = useCallback((msg) => {
    setGlobalBannerMessage(msg);
    setTimeout(() => setGlobalBannerMessage(null), 3000);
  }, []);

  const getAuthHeaders = (isJson = true) => {
    const headers = {};
    if (isJson) headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  // Waiting Queue State
  const [queue, setQueue] = useState([]);

  const loadAuditAlertsCount = useCallback(async () => {
    try {
      const data = await fetchAuditAlertsCount("Triage");
      setAuditAlertsCount(data);
    } catch {
      // Silently fail audit count fetch
    }
  }, []);

  const loadAuditLogs = useCallback(async () => {
    setAuditLogsLoading(true);
    setAuditLogsError("");
    try {
      const result = await fetchAuditLogs({
        page: 1,
        limit: 20,
        module: "Triage",
        search: auditSearchQuery,
      });
      setAuditLogs(result.data || []);
    } catch (err) {
      setAuditLogsError(err.message || "Failed to load audit logs");
    } finally {
      // FIXED: Removed illegal colon syntax variant
      setAuditLogsLoading(false);
    }
  }, [auditSearchQuery]);

  useEffect(() => {
    loadAuditAlertsCount();
    loadAuditLogs();
  }, [loadAuditAlertsCount, loadAuditLogs]);

  useEffect(() => {
    const interval = setInterval(() => loadAuditAlertsCount(), 30000);
    return () => clearInterval(interval);
  }, [loadAuditAlertsCount]);

  // Fetch queue from backend
  useEffect(() => {
    const fetchQueue = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/triage/queue`, {
          headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error("Failed to fetch queue");
        const data = await response.json();
        setQueue(data.data || []);
        setError("");
      } catch (err) {
        console.error("Error fetching queue:", err);
        setError("Failed to load queue");
      } finally {
        setLoading(false);
      }
    };
    fetchQueue();
  }, [API_URL]);

  const fetchStatistics = useCallback(async () => {
    try {
      const redCriticalsResponse = await fetch(
        `${API_URL}/api/triage/red-criticals-today`,
        {
          headers: getAuthHeaders(),
        },
      );
      if (redCriticalsResponse.ok) {
        const redCriticalsData = await redCriticalsResponse.json();
        setRedCriticalsToday(redCriticalsData.count || 0);
      }

      const totalAssessedResponse = await fetch(
        `${API_URL}/api/triage/total-assessed-today`,
        {
          headers: getAuthHeaders(),
        },
      );
      if (totalAssessedResponse.ok) {
        const totalAssessedData = await totalAssessedResponse.json();
        setTotalAssessedToday(totalAssessedData.count || 0);
      }
    } catch (err) {
      console.error("Error fetching triage statistics:", err);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setDepartmentsLoading(true);
        const response = await fetch(`${API_URL}/api/doctor/departments`, {
          headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error("Failed to fetch departments");
        const data = await response.json();
        if (data.success) {
          setDepartments(data.data || []);
        } else {
          setDepartmentsError(data.message || "Failed to fetch departments");
        }
      } catch (err) {
        console.error("Error fetching departments:", err);
        setDepartmentsError(err.message);
      } finally {
        setDepartmentsLoading(false);
      }
    };
    fetchDepartments();
  }, [API_URL]);

  // Fetch doctors when department changes
  useEffect(() => {
    if (!selectedDepartment) {
      setDoctorsByDepartment([]);
      setSelectedDoctor("");
      return;
    }

    const fetchDoctorsByDepartment = async () => {
      try {
        setDoctorsLoading(true);
        const response = await fetch(
          `${API_URL}/api/doctor/doctors/department/${selectedDepartment}`,
          { headers: getAuthHeaders() },
        );
        if (!response.ok) {
          setDoctorsByDepartment([]);
          setSelectedDoctor("");
          return;
        }
        const data = await response.json();
        if (data.success) {
          setDoctorsByDepartment(data.data || []);
          if (data.data && data.data.length > 0) {
            setSelectedDoctor(data.data[0]._id);
          } else {
            setSelectedDoctor("");
          }
        }
      } catch (err) {
        console.error("Error fetching doctors by department:", err);
        setDoctorsByDepartment([]);
        setSelectedDoctor("");
      } finally {
        setDoctorsLoading(false);
      }
    };

    fetchDoctorsByDepartment();
  }, [selectedDepartment, API_URL]);

  // Dynamic Triage Color Calculator
  useEffect(() => {
    const sys = parseInt(vitals.bpSystolic);
    const pulse = parseInt(vitals.heartRate);
    const temp = parseFloat(vitals.temperature);
    const ox = parseInt(vitals.spo2);

    if (!sys && !pulse && !temp && !ox) return;

    if ((ox && ox < 90) || (sys && sys < 80) || (pulse && pulse > 130)) {
      setVitals((prev) => ({ ...prev, triageCategory: "Red (Resuscitation)" }));
    } else if (
      (ox && ox >= 90 && ox < 94) ||
      (sys && sys >= 160) ||
      (temp && temp > 39)
    ) {
      setVitals((prev) => ({ ...prev, triageCategory: "Orange (Emergent)" }));
    } else if ((temp && temp >= 38) || (pulse && pulse > 100)) {
      setVitals((prev) => ({ ...prev, triageCategory: "Yellow (Urgent)" }));
    } else {
      setVitals((prev) => ({ ...prev, triageCategory: "Green (Non-Urgent)" }));
    }
  }, [vitals.bpSystolic, vitals.heartRate, vitals.temperature, vitals.spo2]);

  const handleVitalChange = (e) => {
    const { name, value } = e.target;
    setVitals((prev) => ({ ...prev, [name]: value }));
  };

  const handleTriageSubmit = (e) => {
    e.preventDefault();
    setDispatching(true);
  };

  const handleConfirmDispatch = async () => {
    if (!selectedDepartment || !selectedDoctor) {
      alert("Please select both department and doctor.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/triage/${selectedPatient._id}/dispatch`,
        {
          method: "PUT",
          headers: getAuthHeaders(true),
          body: JSON.stringify({
            ...vitals,
            department: selectedDepartment,
            doctorId: selectedDoctor,
            dispatchedBy: "Triage Officer",
            dispatchedAt: new Date().toISOString(),
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to dispatch patient");
      }

      triggerSystemBanner(
        "SUCCESS: Vitals recorded and patient dispatched successfully.",
      );

      // Log the clinical dispatch event including patient metadata
      await logAudit({
        action: "UPDATE",
        module: "Triage",
        details: `Vitals recorded and patient dispatched to ${selectedDepartment}: ${selectedPatient.patientName} (${selectedPatient.cardId})`,
        targetId: selectedPatient._id,
        targetType: "PatientRecord",
      });

      loadAuditAlertsCount();
      fetchStatistics();

      setQueue((prev) => prev.filter((p) => p._id !== selectedPatient._id));
      setSelectedPatient(null);
      setVitals({
        bpSystolic: "",
        bpDiastolic: "",
        heartRate: "",
        temperature: "",
        spo2: "",
        respiratoryRate: "",
        weight: "",
        randomBloodSugar: "",
        triageCategory: "Green (Non-Urgent)",
        secondaryUrgencyNotes: "",
      });
      setSelectedDepartment("");
      setDoctorsByDepartment([]);
      setSelectedDoctor("");
      setDispatching(false);

      setTimeout(() => setDispatchStatus(null), 3000);
      setActiveTab("dashboard");
    } catch (err) {
      setDispatchStatus("error");
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050B09] text-white font-sans antialiased text-[10px] selection:bg-[#10B981]/20 selection:text-[#10B981]">
      {globalBannerMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] w-11/12 max-w-2xl bg-[#0E1B17] border-l-4 border-emerald-500 text-[#10B981] px-4 py-2.5 rounded-lg shadow-2xl font-mono flex items-center justify-between animate-slideDown">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
            <CheckCircle size={14} className="shrink-0 text-[#10B981]" />
            <span>{globalBannerMessage}</span>
          </div>
          <button
            onClick={() => setGlobalBannerMessage(null)}
            className="hover:text-white transition p-0.5"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* CORPORATE SIDEBAR NAVIGATION - BLUE BLACK THEME */}
      <aside
        className={`${isSidebarOpen ? "w-56" : "w-16"} bg-[#0E1B17] text-slate-300 flex flex-col justify-between shrink-0 sticky top-0 h-screen overflow-hidden z-30 font-mono border-r border-[#0E1B17] transition-all duration-300`}
      >
        <div>
          <div className="p-4 border-b border-[#29323a] flex items-center gap-2.5 bg-[#0E1B17]">
            <div className="w-8 h-8 rounded-lg bg-[#10B981] flex items-center justify-center border border-[#10B981]/20 shadow-md">
              <img
                src={hospitalLogo}
                alt="Mesra Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h3 className="font-black tracking-wider text-[12px] text-white leading-none">
                MESRA<span className="text-[#10B981]">DIGITAL</span>
              </h3>
              <span className="text-[8px] text-[#94A3B8] font-bold tracking-widest block mt-0.5 uppercase">
                Clinical Triage Node
              </span>
            </div>
          </div>

          <nav className="p-3 space-y-1">
            <div className="text-[8px] font-black uppercase text-[#94A3B8] px-3 py-2 tracking-widest">
              Interface Channels
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveTab("dashboard");
                setSelectedPatient(null);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold uppercase tracking-wider transition ${
                activeTab === "dashboard"
                  ? "bg-[#10B981] text-white shadow-md font-black"
                  : "text-[#94A3B8] hover:bg-[#0E1B17] hover:text-white"
              }`}
            >
              <LayoutDashboard size={14} />
              <span>Dashboard Stats</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("waitingList");
                setSelectedPatient(null);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-bold uppercase tracking-wider transition ${
                activeTab === "waitingList"
                  ? "bg-[#10B981] text-white shadow-md font-black"
                  : "text-[#94A3B8] hover:bg-[#0E1B17] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <ClipboardList size={14} /> <span>Patient Queue</span>
              </div>
              <span className="bg-[#0E1B17] text-[#10B981] border border-[#10B981]/20 px-2 py-0.5 rounded text-[8px] font-bold font-mono">
                {queue.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("triageAudit");
                loadAuditLogs();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-bold uppercase tracking-wider transition ${
                activeTab === "triageAudit"
                  ? "bg-amber-600 text-white shadow-md font-black"
                  : "text-[#94A3B8] hover:bg-[#0E1B17] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldAlert size={14} /> <span>Security Trails</span>
              </div>
              <span className="bg-[#0E1B17] text-amber-300 px-2 py-0.5 rounded text-[8px] font-bold">
                {auditAlertsCount}
              </span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-[#29323a] bg-[#0E1B17] space-y-4">
          <div className="bg-[#0E1B17] rounded-lg p-2.5 border border-[#0E1B17] text-[10px]">
            <div className="flex items-center gap-1.5 text-[#10B981] font-bold uppercase tracking-wide mb-1">
              <User size={12} /> <span>Operator Account</span>
            </div>
            <p className="text-white truncate font-bold text-[10px]">
              TRIAGE-A Station
            </p>
            <p className="text-[#94A3B8] truncate text-[9px] mt-0.5">
              NURSE_REMA
            </p>
          </div>

          {selectedPatient && (
            <div className="bg-[#0E1B17] rounded-lg p-2.5 border border-[#0E1B17] text-[9px] animate-fadeIn">
              <div className="text-[#10B981] font-bold uppercase tracking-wide flex items-center gap-1 mb-1">
                <Layers size={11} /> <span>Locked Patient Node</span>
              </div>
              <p className="text-white font-black text-[10px] truncate">
                {selectedPatient.patientName}
              </p>
              <div className="mt-1 flex items-center justify-between text-[9px] text-[#94A3B8] font-mono">
                <span>MRN Token:</span>
                <span className="text-[#10B981] font-black">
                  {selectedPatient.cardId}
                </span>
              </div>
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={onLogout}
              className="w-full py-2 bg-[#EF4444]/40 hover:bg-[#b91c1c] border border-[#EF4444]/30 text-[#EF4444] font-bold uppercase text-[8px] tracking-wider rounded-lg transition flex items-center justify-center gap-1.5"
            >
              <LogOut size={13} /> Terminate Token Session
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT FRAME */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-[#0E1B17] border-b border-white/20 sticky top-0 px-6 py-4 z-20 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 hover:bg-[#0E1B17] rounded-lg transition-colors text-[#94A3B8]"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2">
              <Database size={15} className="text-[#94A3B8]" />
              <h1 className="text-[11px] font-black tracking-widest text-white uppercase font-mono">
                {activeTab === "dashboard" &&
                  "Emergency Traffic Control Overview"}
                {activeTab === "waitingList" &&
                  (selectedPatient
                    ? "Vital Entry Validation"
                    : "Incoming Triage Registry")}
                {activeTab === "triageAudit" && "Security Integrity Logs"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3 font-mono text-[9px]">
            <div className="bg-[#0E1B17] text-[#10B981] border border-white/20 px-3 py-1 rounded-md font-bold uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-ping" />
              Network State: Live
            </div>
            <NotificationBell role="Triage" />
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {error && (
            <div className="p-4 mb-6 bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 rounded-xl text-[11px] font-bold">
              {error}
            </div>
          )}

          {/* TRIAGE DASHBOARD VIEW */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: "Active In-Queue",
                    value: queue.length,
                    icon: <Users size={18} />,
                    bg: "bg-[#10B981] text-white",
                  },
                  {
                    label: "Red Criticals Today",
                    value: `${redCriticalsToday} Patients`,
                    icon: <ShieldAlert size={18} />,
                    bg: "bg-[#EF4444]/10 text-[#EF4444] border border-rose-100",
                  },
                  {
                    label: "Avg Triage Clear Velocity",
                    value: "4.8 Min",
                    icon: <Clock size={18} />,
                    bg: "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20",
                  },
                  {
                    label: "Total Assessed Today",
                    value: `${totalAssessedToday} Patients`,
                    icon: <CheckCircle size={18} />,
                    bg: "bg-[#0E1B17] text-slate-200",
                  },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-xl flex items-center justify-between shadow-sm bg-[#0E1B17] border border-white/20 border-l-4 border-l-slate-800"
                  >
                    <div>
                      <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest block font-mono">
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

              <div className="bg-[#0E1B17] rounded-xl border border-white/20 shadow-sm p-6">
                <h3 className="font-bold text-sm text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <AlertTriangle className="text-amber-300" size={16} />{" "}
                  Automated Color Hierarchy Rules
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div className="p-3.5 bg-[#EF4444]/10/60 border border-rose-100 rounded-xl">
                    <span className="font-bold text-[#EF4444] block mb-1">
                      RED LEVEL
                    </span>{" "}
                    SpO2 &lt; 90% | SBP &lt; 80 mmHg. Instantaneous Doctor
                    Dispatch.
                  </div>
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                    <span className="font-bold text-amber-300 block mb-1">
                      ORANGE LEVEL
                    </span>{" "}
                    SpO2 90-94% | SBP &gt; 160 mmHg. High priority review.
                  </div>
                  <div className="p-3.5 bg-yellow-50/60 border border-yellow-100 rounded-xl">
                    <span className="font-bold text-yellow-700 block mb-1">
                      YELLOW LEVEL
                    </span>{" "}
                    Temp &gt; 38°C | HR &gt; 100 bpm. Routine urgent sequence.
                  </div>
                  <div className="p-3.5 bg-[#10B981]/10/60 border border-[#10B981]/20 rounded-xl">
                    <span className="font-bold text-[#10B981] block mb-1">
                      GREEN LEVEL
                    </span>{" "}
                    Normal parameter boundaries. Stable clinical observation
                    track.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* WAITING QUEUE LIST */}
          {activeTab === "waitingList" && !selectedPatient && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#0E1B17] border border-white/20 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
                <span className="font-mono text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
                  Available Intake Queue Stack
                </span>
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter live queue by name or Card ID..."
                    className="w-full pl-10 pr-4 py-1.5 bg-[#0E1B17] border border-white/20 rounded-lg text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="bg-[#0E1B17] border border-white/20 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0E1B17] border-b border-white/20 text-[11px] font-bold uppercase text-[#94A3B8] font-mono">
                      <th className="p-4 px-6">Queue ID</th>
                      <th className="p-4 px-6">Full Name</th>
                      <th className="p-4 px-6">Demographics</th>
                      <th className="p-4 px-6">Arrival Time</th>
                      <th className="p-4 px-6">Presenting Complaint</th>
                      <th className="p-4 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-200">
                    {queue
                      .filter(
                        (p) =>
                          p.patientName
                            ?.toLowerCase()
                            .includes(searchQuery.toLowerCase()) ||
                          p.cardId
                            ?.toLowerCase()
                            .includes(searchQuery.toLowerCase()),
                      )
                      .map((p) => (
                        <tr
                          key={p._id}
                          className="hover:bg-[#0E1B17]/60 transition"
                        >
                          <td className="p-4 px-6 font-mono text-[#10B981] font-bold">
                            {p.cardId}
                          </td>
                          <td className="p-4 px-6 text-white font-bold text-sm">
                            {p.patientName}
                          </td>
                          <td className="p-4 px-6">
                            {p.gender} ({p.age} Yrs)
                          </td>
                          <td className="p-4 px-6 font-mono text-[#94A3B8]">
                            {p.registrationTime || "Just now"}
                          </td>
                          <td className="p-4 px-6 max-w-xs truncate text-[#94A3B8]">
                            {p.chiefComplaint}
                          </td>
                          <td className="p-4 px-6 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedPatient(p)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#10B981] text-white text-[11px] font-black uppercase tracking-wider rounded-xl hover:bg-[#0D9668] transition shadow-sm"
                            >
                              Screen Vitals <ChevronRight size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    {queue.length === 0 && (
                      <tr>
                        <td
                          colSpan="6"
                          className="p-8 text-center text-[#94A3B8] font-mono"
                        >
                          No patients waiting in queue intake.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VITALS ENTRY SCREEN & DISPATCH ROUTING INTERFACE */}
          {activeTab === "waitingList" && selectedPatient && (
            <div className="max-w-4xl mx-auto bg-[#0E1B17] border border-white/20 rounded-3xl shadow-xl overflow-hidden animate-fadeIn text-white">
              <div className="p-6 bg-[#050B09] text-white flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold uppercase tracking-wider">
                    {selectedPatient.patientName}
                  </h2>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Demographics: {selectedPatient.gender},{" "}
                    {selectedPatient.age} Yrs | Queue Token:{" "}
                    {selectedPatient.cardId}
                  </p>
                </div>
                <span className="bg-[#10B981] text-white text-xs font-mono font-bold px-3 py-1 rounded-lg">
                  {dispatching
                    ? "DEPARTMENT DISPATCH ROUTING"
                    : "LIVE VITALS ACQUISITION"}
                </span>
              </div>

              {!dispatching ? (
                <form onSubmit={handleTriageSubmit} className="p-8 space-y-6">
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300">
                    <strong>Stated Complaint at Intake:</strong>{" "}
                    {selectedPatient.chiefComplaint}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-wider flex items-center gap-1">
                        <Heart size={12} className="text-[#EF4444]" /> SBP (mmHg)
                      </label>
                      <input
                        type="number"
                        name="bpSystolic"
                        value={vitals.bpSystolic}
                        onChange={handleVitalChange}
                        placeholder="e.g. 120"
                        required
                        className="w-full px-4 py-2.5 bg-[#0E1B17] border border-white/20 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-wider flex items-center gap-1">
                        <Heart size={12} className="text-[#EF4444]" /> DBP (mmHg)
                      </label>
                      <input
                        type="number"
                        name="bpDiastolic"
                        value={vitals.bpDiastolic}
                        onChange={handleVitalChange}
                        placeholder="e.g. 80"
                        required
                        className="w-full px-4 py-2.5 bg-[#0E1B17] border border-white/20 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-wider flex items-center gap-1">
                        <Activity size={12} className="text-[#EF4444]" /> Pulse
                        (BPM)
                      </label>
                      <input
                        type="number"
                        name="heartRate"
                        value={vitals.heartRate}
                        onChange={handleVitalChange}
                        placeholder="e.g. 72"
                        required
                        className="w-full px-4 py-2.5 bg-[#0E1B17] border border-white/20 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-wider flex items-center gap-1">
                        <Thermometer size={12} className="text-orange-500" />{" "}
                        Temp (°C)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        name="temperature"
                        value={vitals.temperature}
                        onChange={handleVitalChange}
                        placeholder="e.g. 36.7"
                        required
                        className="w-full px-4 py-2.5 bg-[#0E1B17] border border-white/20 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-wider flex items-center gap-1">
                        <Wind size={12} className="text-cyan-500" /> SpO2 (%)
                      </label>
                      <input
                        type="number"
                        name="spo2"
                        value={vitals.spo2}
                        onChange={handleVitalChange}
                        placeholder="e.g. 98"
                        required
                        className="w-full px-4 py-2.5 bg-[#0E1B17] border border-white/20 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-wider block">
                        Resp Rate (cpm)
                      </label>
                      <input
                        type="number"
                        name="respiratoryRate"
                        value={vitals.respiratoryRate}
                        onChange={handleVitalChange}
                        placeholder="e.g. 16"
                        className="w-full px-4 py-2.5 bg-[#0E1B17] border border-white/20 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-wider block">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        name="weight"
                        value={vitals.weight}
                        onChange={handleVitalChange}
                        placeholder="e.g. 70"
                        className="w-full px-4 py-2.5 bg-[#0E1B17] border border-white/20 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-wider block">
                        RBS (mg/dL)
                      </label>
                      <input
                        type="number"
                        name="randomBloodSugar"
                        value={vitals.randomBloodSugar}
                        onChange={handleVitalChange}
                        placeholder="e.g. 110"
                        className="w-full px-4 py-2.5 bg-[#0E1B17] border border-white/20 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-[#0E1B17] border border-white/20 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase text-[#94A3B8] font-mono block font-bold">
                        Calculated Classification Hierarchy
                      </span>
                      <span className="text-sm font-black tracking-wide text-white">
                        {vitals.triageCategory}
                      </span>
                    </div>
                    <span
                      className={`w-4 h-4 rounded-full ${vitals.triageCategory.includes("Red") ? "bg-[#EF4444] animate-pulse" : vitals.triageCategory.includes("Orange") ? "bg-amber-500" : vitals.triageCategory.includes("Yellow") ? "bg-yellow-400" : "bg-[#10B981]"}`}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setSelectedPatient(null)}
                      className="px-5 py-2.5 border border-white/20 hover:bg-[#0E1B17] text-xs font-bold uppercase tracking-wider rounded-xl transition"
                    >
                      Cancel Entry
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#10B981] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-[#0D9668] transition shadow-md"
                    >
                      Evaluate & Proceed
                    </button>
                  </div>
                </form>
              ) : (
                /* REDIRECT PANEL INTERFACE ONCE VITALS SUBMITTED */
                <div className="p-8 space-y-6">
                  <div className="bg-[#10B981]/10/60 border border-white/10 rounded-xl p-4 text-xs">
                    <p className="font-bold text-[#0D9668] uppercase tracking-wide">
                      Patient Parameters Locked
                    </p>
                    <p className="text-slate-300 mt-1">
                      Classification: <strong>{vitals.triageCategory}</strong>.
                      Choose clinical zone targets below.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-wider block">
                        Target Department
                      </label>
                      <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        disabled={departmentsLoading}
                        className="w-full px-4 py-2.5 bg-[#0E1B17] border border-white/20 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">
                          -- Select Target Clinic / Unit --
                        </option>
                        {departments.map((dept, index) => (
                          <option key={index} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                      {departmentsError && (
                        <p className="text-[10px] text-[#EF4444]">
                          {departmentsError}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-wider block">
                        Assign Consultant/Physician
                      </label>
                      <select
                        value={selectedDoctor}
                        onChange={(e) => setSelectedDoctor(e.target.value)}
                        disabled={doctorsLoading || !selectedDepartment}
                        className="w-full px-4 py-2.5 bg-[#0E1B17] border border-white/20 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Select Target Physician --</option>
                        {doctorsByDepartment.map((doc) => (
                          <option key={doc._id} value={doc._id}>
                            {doc.name} (
                            {doc.specialization || "General Practitioner"})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setDispatching(false)}
                      className="px-5 py-2.5 border border-white/20 hover:bg-[#0E1B17] text-xs font-bold uppercase tracking-wider rounded-xl transition"
                    >
                      Back to Vitals
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDispatch}
                      className="px-6 py-2.5 bg-[#10B981] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-[#0D9668] transition shadow-md"
                    >
                      Confirm & Dispatch Patient
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AUDIT LOGS TRACKER VIEW */}
          {activeTab === "triageAudit" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#0E1B17] border border-white/20 rounded-2xl shadow-sm p-6">
                <h3 className="font-bold text-sm text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ShieldAlert className="text-[#EF4444]" size={16} /> Real-time
                  Security & Modification Logs
                </h3>

                <div className="relative mb-6">
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                  <input
                    type="text"
                    placeholder="Search security trails by patient name, action, or clerk ID..."
                    value={auditSearchQuery}
                    onChange={(e) => setAuditSearchQuery(e.target.value)}
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
                  <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-[11px] divide-y divide-slate-100">
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
