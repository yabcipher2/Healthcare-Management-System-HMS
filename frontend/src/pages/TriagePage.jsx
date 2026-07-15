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
  LayoutDashboard,
  Search,
  ChevronRight,
  ShieldAlert,
  LogOut,
  ClipboardList,
} from "lucide-react";
import { fetchAuditLogs, fetchAuditAlertsCount } from "../utils/audit";

export default function TriagePage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [auditAlertsCount, setAuditAlertsCount] = useState(0);
  const [auditLogs, setAuditLogs] = useState([]);
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
      const data = await fetchAuditAlertsCount();
      setAuditAlertsCount(data);
    } catch {
      // Silently fail audit count fetch
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
      // FIXED: Removed illegal colon syntax variant
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

  // Fetch statistics
  useEffect(() => {
    const fetchStatistics = async () => {
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
    };
    fetchStatistics();
  }, [API_URL]);

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

      setDispatchStatus("success");
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

  const handleExit = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      {/* SIDEBAR NAVIGATION */}
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
                MESRA <span className="text-blue-600">TRIAGE</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono tracking-widest block mt-1 uppercase font-bold">
                Vital Screening
              </span>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab("dashboard");
                setSelectedPatient(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition ${activeTab === "dashboard" ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              <LayoutDashboard size={16} /> Dashboard Stats
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("waitingList");
                setSelectedPatient(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition ${activeTab === "waitingList" ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              <ClipboardList size={16} /> Patient Queue ({queue.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("triageAudit");
                loadAuditLogs();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition ${activeTab === "triageAudit" ? "bg-rose-50 text-rose-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              <ShieldAlert size={16} /> Audit Activity ({auditAlertsCount})
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3 text-[11px] font-mono text-slate-500 mb-3 border border-slate-200/60">
            <p className="font-bold text-blue-600">Station Node: TRIAGE-A</p>
            <p>Clerk ID: NURSE_REMA</p>
          </div>
          <button
            type="button"
            onClick={handleExit}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900 text-slate-400 hover:text-rose-400 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
          >
            <LogOut size={14} /> Exit Platform
          </button>
        </div>
      </aside>

      {/* WORKSPACE AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200/80 sticky top-0 px-8 py-5 z-20 flex justify-between items-center">
          <h1 className="text-sm font-black tracking-widest text-slate-900 uppercase font-mono">
            {activeTab === "dashboard" && "Emergency Traffic Control Overview"}
            {activeTab === "waitingList" &&
              (selectedPatient
                ? "Vital Entry Validation"
                : "Incoming Triage Registry")}
            {activeTab === "triageAudit" && "Security Integrity Logs"}
          </h1>
          <div className="flex items-center gap-2 font-mono text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/40">
            <Clock size={12} className="text-blue-600" /> System Status:{" "}
            <span className="font-bold text-emerald-600">Live</span>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          {error && (
            <div className="p-4 mb-6 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold">
              {error}
            </div>
          )}

          {/* TRIAGE DASHBOARD VIEW */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    label: "Active In-Queue",
                    value: queue.length,
                    icon: <Users size={18} />,
                    bg: "bg-blue-600 text-white",
                  },
                  {
                    label: "Red Criticals Today",
                    value: `${redCriticalsToday} Patients`,
                    icon: <ShieldAlert size={18} />,
                    bg: "bg-rose-50 text-rose-600 border border-rose-100",
                  },
                  {
                    label: "Avg Triage Clear Velocity",
                    value: "4.8 Min",
                    icon: <Clock size={18} />,
                    bg: "bg-emerald-50 text-emerald-600 border border-emerald-100",
                  },
                  {
                    label: "Total Assessed Today",
                    value: `${totalAssessedToday} Patients`,
                    icon: <CheckCircle size={18} />,
                    bg: "bg-slate-100 text-slate-700",
                  },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl flex items-center justify-between shadow-sm bg-white border border-slate-200/60"
                  >
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        {stat.label}
                      </span>
                      <span className="text-2xl font-black text-slate-900 mt-1 block">
                        {stat.value}
                      </span>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bg}`}>
                      {stat.icon}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <AlertTriangle className="text-amber-500" size={16} />{" "}
                  Automated Color Hierarchy Rules
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div className="p-3.5 bg-rose-50/60 border border-rose-100 rounded-xl">
                    <span className="font-bold text-rose-700 block mb-1">
                      RED LEVEL
                    </span>{" "}
                    SpO2 &lt; 90% | SBP &lt; 80 mmHg. Instantaneous Doctor
                    Dispatch.
                  </div>
                  <div className="p-3.5 bg-amber-50/60 border border-amber-100 rounded-xl">
                    <span className="font-bold text-amber-700 block mb-1">
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
                  <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                    <span className="font-bold text-emerald-700 block mb-1">
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
                    placeholder="Filter live queue by name or Card ID..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 font-mono">
                      <th className="p-4 px-6">Queue ID</th>
                      <th className="p-4 px-6">Full Name</th>
                      <th className="p-4 px-6">Demographics</th>
                      <th className="p-4 px-6">Arrival Time</th>
                      <th className="p-4 px-6">Presenting Complaint</th>
                      <th className="p-4 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
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
                          className="hover:bg-slate-50/60 transition"
                        >
                          <td className="p-4 px-6 font-mono text-blue-600 font-bold">
                            {p.cardId}
                          </td>
                          <td className="p-4 px-6 text-slate-900 font-bold text-sm">
                            {p.patientName}
                          </td>
                          <td className="p-4 px-6">
                            {p.gender} ({p.age} Yrs)
                          </td>
                          <td className="p-4 px-6 font-mono text-slate-500">
                            {p.registrationTime || "Just now"}
                          </td>
                          <td className="p-4 px-6 max-w-xs truncate text-slate-500">
                            {p.chiefComplaint}
                          </td>
                          <td className="p-4 px-6 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedPatient(p)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-[11px] font-black uppercase tracking-wider rounded-xl hover:bg-blue-700 transition shadow-sm"
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
                          className="p-8 text-center text-slate-400 font-mono"
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
            <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden animate-fadeIn text-slate-800">
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold uppercase tracking-wider">
                    {selectedPatient.patientName}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Demographics: {selectedPatient.gender},{" "}
                    {selectedPatient.age} Yrs | Queue Token:{" "}
                    {selectedPatient.cardId}
                  </p>
                </div>
                <span className="bg-blue-600 text-white text-xs font-mono font-bold px-3 py-1 rounded-lg">
                  {dispatching
                    ? "DEPARTMENT DISPATCH ROUTING"
                    : "LIVE VITALS ACQUISITION"}
                </span>
              </div>

              {!dispatching ? (
                <form onSubmit={handleTriageSubmit} className="p-8 space-y-6">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                    <strong>Stated Complaint at Intake:</strong>{" "}
                    {selectedPatient.chiefComplaint}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Heart size={12} className="text-rose-500" /> SBP (mmHg)
                      </label>
                      <input
                        type="number"
                        name="bpSystolic"
                        value={vitals.bpSystolic}
                        onChange={handleVitalChange}
                        placeholder="e.g. 120"
                        required
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Heart size={12} className="text-rose-400" /> DBP (mmHg)
                      </label>
                      <input
                        type="number"
                        name="bpDiastolic"
                        value={vitals.bpDiastolic}
                        onChange={handleVitalChange}
                        placeholder="e.g. 80"
                        required
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Activity size={12} className="text-red-500" /> Pulse
                        (BPM)
                      </label>
                      <input
                        type="number"
                        name="heartRate"
                        value={vitals.heartRate}
                        onChange={handleVitalChange}
                        placeholder="e.g. 72"
                        required
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
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
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Wind size={12} className="text-cyan-500" /> SpO2 (%)
                      </label>
                      <input
                        type="number"
                        name="spo2"
                        value={vitals.spo2}
                        onChange={handleVitalChange}
                        placeholder="e.g. 98"
                        required
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                        Resp Rate (cpm)
                      </label>
                      <input
                        type="number"
                        name="respiratoryRate"
                        value={vitals.respiratoryRate}
                        onChange={handleVitalChange}
                        placeholder="e.g. 16"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        name="weight"
                        value={vitals.weight}
                        onChange={handleVitalChange}
                        placeholder="e.g. 70"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                        RBS (mg/dL)
                      </label>
                      <input
                        type="number"
                        name="randomBloodSugar"
                        value={vitals.randomBloodSugar}
                        onChange={handleVitalChange}
                        placeholder="e.g. 110"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-mono block font-bold">
                        Calculated Classification Hierarchy
                      </span>
                      <span className="text-sm font-black tracking-wide text-slate-900">
                        {vitals.triageCategory}
                      </span>
                    </div>
                    <span
                      className={`w-4 h-4 rounded-full ${vitals.triageCategory.includes("Red") ? "bg-rose-500 animate-pulse" : vitals.triageCategory.includes("Orange") ? "bg-amber-500" : vitals.triageCategory.includes("Yellow") ? "bg-yellow-400" : "bg-emerald-500"}`}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedPatient(null)}
                      className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider rounded-xl transition"
                    >
                      Cancel Entry
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-blue-600 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-blue-700 transition shadow-md"
                    >
                      Evaluate & Proceed
                    </button>
                  </div>
                </form>
              ) : (
                /* REDIRECT PANEL INTERFACE ONCE VITALS SUBMITTED */
                <div className="p-8 space-y-6">
                  <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 text-xs">
                    <p className="font-bold text-blue-800 uppercase tracking-wide">
                      Patient Parameters Locked
                    </p>
                    <p className="text-slate-600 mt-1">
                      Classification: <strong>{vitals.triageCategory}</strong>.
                      Choose clinical zone targets below.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                        Target Department
                      </label>
                      <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        disabled={departmentsLoading}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        <p className="text-[10px] text-rose-500">
                          {departmentsError}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                        Assign Consultant/Physician
                      </label>
                      <select
                        value={selectedDoctor}
                        onChange={(e) => setSelectedDoctor(e.target.value)}
                        disabled={doctorsLoading || !selectedDepartment}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setDispatching(false)}
                      className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider rounded-xl transition"
                    >
                      Back to Vitals
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDispatch}
                      className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-emerald-700 transition shadow-md"
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
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ShieldAlert className="text-rose-500" size={16} /> Real-time
                  Security & Modification Logs
                </h3>
                {auditLogsError && (
                  <p className="text-xs text-rose-500 font-bold mb-4">
                    {auditLogsError}
                  </p>
                )}
                {auditLogsLoading ? (
                  <p className="text-xs text-slate-400 font-mono">
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
                          <span className="text-slate-400">
                            [{new Date(log.timestamp).toLocaleTimeString()}]
                          </span>{" "}
                          <span className="text-blue-600 font-bold">
                            {log.action}
                          </span>{" "}
                          -{" "}
                          <span className="text-slate-600">{log.details}</span>
                        </div>
                        <span className="text-slate-400 uppercase font-bold text-[9px] bg-slate-100 px-1.5 py-0.5 rounded">
                          {log.operatorId || "System"}
                        </span>
                      </div>
                    ))}
                    {auditLogs.length === 0 && (
                      <p className="text-slate-400 py-4">
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
