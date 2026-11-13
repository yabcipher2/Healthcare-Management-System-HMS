import React, { useState, useCallback, useEffect } from "react";
import {
  UserCheck,
  Search,
  Clock,
  LogOut,
  Sliders,
  FileText,
  CheckCircle2,
  AlertCircle,
  HeartPulse,
  Activity,
  ShieldAlert,
  X,
  ActivitySquare,
  Database,
  Layers,
  User,
  LayoutDashboard,
  Menu,
} from "lucide-react";
import SidebarCollapseButton from "../components/SidebarCollapseButton";
import {
  logAudit,
  fetchAuditLogs,
  fetchAuditAlertsCount,
} from "../utils/audit";
import NotificationBell from "../components/NotificationBell";

export default function NursePage({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Core data structure tracking active care assignments
  const [assignedPatients, setAssignedPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auditAlertsCount, setAuditAlertsCount] = useState(0);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditLogsError, setAuditLogsError] = useState("");

  const handleLogout = useCallback(async () => {
    try {
      await logAudit({
        action: "LOGIN",
        module: "Auth",
        details: "Nurse logged out of clinical station",
      });
    } catch {}
    onLogout();
  }, [onLogout]);

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

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const hospitalLogo = "/mesra icon.png";
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  // Form handling state for treatment delivery execution updates
  const [treatmentLog, setTreatmentLog] = useState({
    medicationAdministered: false,
    nurseNotes: "",
    nurseSummary: "",
    careStatusUpdate: "In Progress",
    doctorInstructions: "",
    nurseResponse: "",
    nurseAccepted: false,
  });

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/nurse`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch assignments");
      const data = await response.json();
      const mapped = (data.data || []).map((a) => ({
        id: a._id,
        name: a.patientName,
        age: a.age,
        gender: a.gender,
        bedAllocation: a.assignedStation,
        assignedDoctor: a.assignedDoctor,
        status: a.status,
        vitalsSummary: a.vitals
          ? `BP: ${a.vitals.bp || "N/A"} | PR: ${a.vitals.pr || "N/A"} | Temp: ${a.vitals.temp || "N/A"}°C | SpO2: ${a.vitals.spo2 || "N/A"}`
          : "Vitals not yet recorded",
        carePlan: a.carePlan,
        allergies: "None Reported",
        cardId: a.cardId,
        patientId: a.patientId,
        nurseNotes: a.nurseNotes,
        doctorInstructions: a.doctorInstructions,
        nurseAccepted: a.nurseAccepted,
        nurseResponse: a.nurseResponse,
      }));
      setAssignedPatients(mapped);
      setError("");
    } catch (err) {
      console.error("Error fetching nurse assignments:", err);
      setError("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  }, [API_URL, token]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
    const interval = setInterval(fetchAssignments, 30000);
    return () => clearInterval(interval);
  }, [fetchAssignments]);

  // Sync form state when a new patient is selected
  useEffect(() => {
    if (selectedPatient) {
      setTreatmentLog({
        medicationAdministered: selectedPatient.medicationAdministered || false,
        nurseNotes: selectedPatient.nurseNotes || "",
        nurseSummary: selectedPatient.nurseNotes || "",
        careStatusUpdate: selectedPatient.status || "In Progress",
        doctorInstructions: selectedPatient.doctorInstructions || "",
        nurseResponse: selectedPatient.nurseResponse || "",
        nurseAccepted: !!selectedPatient.nurseAccepted,
      });
    }
  }, [selectedPatient]);

  const handleAcceptInstructions = async () => {
    if (!selectedPatient) return;
    setSaving(true);
    try {
      const response = await fetch(
        `${API_URL}/api/nurse/${selectedPatient.id}/nurse-response`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ nurseAccepted: true }),
        },
      );
      if (!response.ok) throw new Error("Failed to accept");
      setAssignedPatients((prev) =>
        prev.map((p) =>
          p.id === selectedPatient.id ? { ...p, nurseAccepted: true } : p,
        ),
      );
      setSelectedPatient((prev) => ({ ...prev, nurseAccepted: true }));
      await logAudit({
        action: "UPDATE",
        module: "Nurse",
        details: `Nurse accepted clinical instructions for patient: ${selectedPatient.name} (${selectedPatient.cardId})`,
        targetId: selectedPatient.id,
        targetType: "PatientRecord",
      });
      loadAuditAlertsCount();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSendNurseResponse = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setSaving(true);
    try {
      const response = await fetch(
        `${API_URL}/api/nurse/${selectedPatient.id}/nurse-response`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nurseResponse: treatmentLog.nurseResponse,
            nurseAccepted: true,
            // Send the current care status along with the note so the doctor
            // receives the summary and the status as one update.
            careStatusUpdate: treatmentLog.careStatusUpdate,
          }),
        },
      );
      if (!response.ok) throw new Error("Failed to send response");
      setAssignedPatients((prev) =>
        prev.map((p) =>
          p.id === selectedPatient.id
            ? {
                ...p,
                nurseResponse: treatmentLog.nurseResponse,
                nurseAccepted: true,
              }
            : p,
        ),
      );
      setSelectedPatient((prev) => ({
        ...prev,
        nurseResponse: treatmentLog.nurseResponse,
        nurseAccepted: true,
      }));
      alert("Response sent to doctor.");
      await logAudit({
        action: "UPDATE",
        module: "Nurse",
        details: `Nurse sent clinical response to doctor for patient: ${selectedPatient.name} (${selectedPatient.cardId})`,
        targetId: selectedPatient.id,
        targetType: "PatientRecord",
      });
      loadAuditAlertsCount();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  const handleUpdateCarePlan = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      setSaving(true);
      const response = await fetch(
        `${API_URL}/api/nurse/${selectedPatient.id}/notes`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nurseNotes: treatmentLog.nurseSummary || treatmentLog.nurseNotes,
            medicationAdministered: treatmentLog.medicationAdministered,
          }),
        },
      );
      if (!response.ok) throw new Error("Failed to save notes");
      const result = await response.json();
      setAssignedPatients((prev) =>
        prev.map((p) =>
          p.id === selectedPatient.id
            ? {
                ...p,
                ...result.data,
                nurseNotes: treatmentLog.nurseNotes,
                medicationAdministered: treatmentLog.medicationAdministered,
              }
            : p,
        ),
      );
      alert(
        `Clinical updates recorded successfully for ${selectedPatient.name}.`,
      );
      // Remove from local queue so it "disappears" from the dashboard after sending
      setAssignedPatients((prev) =>
        prev.filter((p) => p.id !== selectedPatient.id),
      );
      await logAudit({
        action: "UPDATE",
        module: "Nurse",
        details: `Nurse recorded clinical updates/medication for patient: ${selectedPatient.name} (${selectedPatient.cardId})`,
        targetId: selectedPatient.id,
        targetType: "PatientRecord",
      });
      loadAuditAlertsCount();
      setSelectedPatient(null);
      setIsModalOpen(false);
    } catch (err) {
      alert(`Error saving: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedPatient) return;
    try {
      setSaving(true);
      const response = await fetch(
        `${API_URL}/api/nurse/${selectedPatient.id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            careStatusUpdate: treatmentLog.careStatusUpdate,
          }),
        },
      );
      if (!response.ok) throw new Error("Failed to update status");
      await response.json();
      // Remove from local queue once status is updated/actioned
      setAssignedPatients((prev) =>
        prev.filter((p) => p.id !== selectedPatient.id),
      );
      await logAudit({
        action: "UPDATE",
        module: "Nurse",
        details: `Nurse updated care status to '${treatmentLog.careStatusUpdate}' for patient: ${selectedPatient.name} (${selectedPatient.cardId})`,
        targetId: selectedPatient.id,
        targetType: "PatientRecord",
      });
      loadAuditAlertsCount();
      setSelectedPatient(null);
    } catch (err) {
      alert(`Error updating status: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const filteredPatients = assignedPatients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.includes(searchQuery),
  );

  return (
    <div className="flex min-h-screen bg-[#050B09] text-white font-sans antialiased text-[10px]">
      {/* CORPORATE SIDEBAR NAVIGATION - BLUE BLACK THEME (Nurse) */}
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
                  Nursing Station
                </span>
              </div>
            )}
          </div>

          {/* Sidebar Collapse Control */}
          <SidebarCollapseButton
            collapsed={!sidebarOpen}
            onToggle={() => setSidebarOpen((open) => !open)}
            label="nursing sidebar"
          />

          <nav className="p-3 space-y-1">
            <div className="text-[8px] font-black uppercase text-[#94A3B8] px-3 py-2 tracking-widest">
              Interface Channels
            </div>

            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center justify-center ${sidebarOpen ? "px-3" : "px-2"} py-2.5 rounded-lg font-bold uppercase tracking-wider transition ${activeTab === "dashboard" ? "bg-[#10B981] text-white shadow-md font-black" : "text-[#94A3B8] hover:bg-[#0E1B17] hover:text-white"}`}
            >
              <LayoutDashboard size={14} />
              {sidebarOpen && <span className="ml-2.5">Operational Overview</span>}
            </button>

            <button
              onClick={() => setActiveTab("assigned")}
              className={`w-full flex items-center justify-center ${sidebarOpen ? "px-3" : "px-2"} py-2.5 rounded-lg font-bold uppercase tracking-wider transition ${activeTab === "assigned" ? "bg-[#10B981] text-white shadow-md font-black" : "text-[#94A3B8] hover:bg-[#0E1B17] hover:text-white"}`}
            >
              <Sliders size={14} />
              {sidebarOpen && <span className="ml-2.5">Assigned Workload</span>}
            </button>

            <button
              onClick={() => {
                setActiveTab("nurseAudit");
                loadAuditLogs();
              }}
              className={`w-full flex items-center justify-between ${sidebarOpen ? "px-3" : "px-2"} py-2.5 rounded-lg font-bold uppercase tracking-wider transition ${activeTab === "nurseAudit" ? "bg-amber-600 text-white shadow-md font-black" : "text-[#94A3B8] hover:bg-[#0E1B17] hover:text-white"}`}
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
              {sidebarOpen ? "Clinical / Ward Nurse" : ""}
            </p>
          </div>

          {selectedPatient && sidebarOpen && (
            <div className="bg-[#0E1B17] rounded-lg p-2.5 border border-[#0E1B17] text-[9px] animate-fadeIn">
              <div className="text-[#10B981] font-bold uppercase tracking-wide flex items-center gap-1 mb-1">
                <Layers size={11} /> <span>Locked Patient Node</span>
              </div>
              <p className="text-white font-black text-[10px] truncate">
                {selectedPatient.name}
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
              onClick={handleLogout}
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
              {activeTab === "dashboard" && "Clinical Care Summary Dashboard"}
              {activeTab === "assigned" && "Clinical Nursing Workflow Console"}
              {activeTab === "nurseAudit" && "Safety Operations Records"}
            </h1>
          </div>
          {/* ... Header Status Badges ... */}
          <NotificationBell role="Nurse" />
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[
                  {
                    label: "Active Care Assignments",
                    value: assignedPatients.length,
                    desc: "Patients currently under station ward supervision.",
                    color: "border-l-4 border-slate-800",
                  },
                  {
                    label: "Escalated to Physician",
                    value: assignedPatients.filter((p) =>
                      p.status.includes("Escalated"),
                    ).length,
                    desc: "Cases requiring urgent medical re-evaluation.",
                    color: "border-l-4 border-[#EF4444]",
                  },
                  {
                    label: "System Safety Sync",
                    value: `${auditAlertsCount} Logs`,
                    desc: "Security audit trail entries for this station.",
                    color: "border-l-4 border-emerald-600",
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
                  <span>Station Operational Protocols</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  Ensure all medication administration checks are signed and
                  clinical responses are dispatched back to the physician loop
                  before a patient state is set to 'Stable'. Local station ID is
                  locked to NS-Alpha unit.
                </p>
              </div>
            </div>
          )}

          {activeTab === "assigned" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#0E1B17] rounded-3xl border border-white/20 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#0E1B17]/30">
                  <div>
                    <h1 className="text-2xl font-black text-white">
                      Assigned Workload
                    </h1>
                    <p className="text-[#94A3B8] font-medium mt-1">
                      Active patient assignments requiring nursing care
                    </p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                    <input
                      type="text"
                      placeholder="Filter patients..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64 pl-10 pr-4 py-1.5 bg-[#0E1B17] border border-white/20 rounded-lg text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="p-10 text-center text-xs font-black text-[#94A3B8] uppercase tracking-wider">
                    Syncing structural updates...
                  </div>
                ) : error ? (
                  <div className="mx-6 mt-6 p-4 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl text-xs font-bold text-[#EF4444]">
                    {error}
                  </div>
                ) : filteredPatients.length === 0 ? (
                  <div className="p-10 text-center text-xs font-black text-[#94A3B8] uppercase tracking-wider">
                    No active assignments detected.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-[#0E1B17]/50 border-b border-white/10">
                        <tr>
                          <th className="px-3 py-3 text-left text-[9px] font-black text-[#94A3B8] uppercase tracking-wider font-mono">
                            Patient
                          </th>
                          <th className="px-3 py-3 text-left text-[9px] font-black text-[#94A3B8] uppercase tracking-wider font-mono">
                            Token
                          </th>
                          <th className="px-3 py-3 text-left text-[9px] font-black text-[#94A3B8] uppercase tracking-wider font-mono">
                            Status
                          </th>
                          <th className="px-3 py-3 text-left text-[9px] font-black text-[#94A3B8] uppercase tracking-wider font-mono">
                            Station
                          </th>
                          <th className="px-3 py-3 text-left text-[9px] font-black text-[#94A3B8] uppercase tracking-wider font-mono">
                            Doctor
                          </th>
                          <th className="px-3 py-3 text-left text-[9px] font-black text-[#94A3B8] uppercase tracking-wider font-mono">
                            Vitals
                          </th>
                          <th className="px-3 py-3 text-center text-[9px] font-black text-[#94A3B8] uppercase tracking-wider font-mono">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {filteredPatients.map((patient) => (
                          <tr
                            key={patient.id}
                            className="hover:bg-[#0E1B17]/30 transition-colors h-[60px]"
                          >
                            <td className="px-3 py-3 whitespace-nowrap">
                              <div className="font-black text-white text-[11px] uppercase leading-tight">
                                {patient.name}
                              </div>
                              <div className="text-[9px] text-[#94A3B8] font-mono mt-0.5">
                                {patient.age}Y / {patient.gender?.substring(0, 1)}
                              </div>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <span className="text-[9px] font-mono font-bold text-[#10B981]">
                                {patient.cardId}
                              </span>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase whitespace-nowrap ${
                                  patient.status.includes("Pending")
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30"
                                }`}
                              >
                                {patient.status}
                              </span>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <span className="text-[10px] font-mono text-white">
                                {patient.bedAllocation}
                              </span>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <span className="text-[10px] font-mono text-white">
                                {patient.assignedDoctor}
                              </span>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <div className="text-[9px] font-mono text-[#10B981] font-bold">
                                {patient.vitalsSummary}
                              </div>
                            </td>
                            <td className="px-3 py-3 text-center whitespace-nowrap">
                              <button
                                onClick={() => handleSelectPatient(patient)}
                                className="px-3 py-1 bg-[#10B981] hover:bg-[#0D9668] text-white font-black uppercase tracking-widest text-[8px] rounded-md shadow-sm transition-all font-mono"
                              >
                                Bind
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PATIENT CARE MODAL */}
          {isModalOpen && selectedPatient && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
              <div className="bg-[#050B09] rounded-2xl border border-white/20 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleUpdateCarePlan}>
                  {/* Modal Header */}
                  <div className="sticky top-0 bg-[#0E1B17] p-4 text-white flex justify-between items-center border-b border-slate-700 z-10">
                    <div>
                      <span className="text-[9px] font-black tracking-widest text-[#10B981] block uppercase font-mono">
                        ACTIVE CLINICAL CONTEXT
                      </span>
                      <h2 className="text-[14px] font-black text-white mt-0.5 tracking-tight uppercase font-mono">
                        {selectedPatient.name}
                      </h2>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-[10px] text-[#94A3B8] font-mono">
                        <span>
                          Age/Sex:{" "}
                          <strong className="text-white">
                            {selectedPatient.age}Y/
                            {selectedPatient.gender?.substring(0, 1)}
                          </strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsModalOpen(false);
                          setSelectedPatient(null);
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <X size={18} className="text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Allergy Alert */}
                  <div className="bg-[#EF4444]/10 border-b border-[#EF4444]/20 px-6 py-3 text-xs text-[#EF4444] flex items-center gap-2 font-medium">
                    <AlertCircle
                      size={15}
                      className="text-[#EF4444] shrink-0"
                    />
                    <p>
                      <strong>Allergy Alerts:</strong>{" "}
                      {selectedPatient.allergies}
                    </p>
                  </div>

                  {/* Modal Body */}
                  <div className="p-8 space-y-6">
                    {selectedPatient.doctorInstructions && (
                      <div className="bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl p-5 space-y-3">
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-[#10B981] flex items-center gap-1.5">
                          <FileText size={14} /> Physician Observation Matrix
                        </h4>
                        <p className="text-[11px] text-[#10B981]/90 font-medium leading-relaxed bg-[#0E1B17]/90 p-3 rounded-lg border border-[#10B981]/20 italic font-mono">
                          {selectedPatient.doctorInstructions ||
                            "No instruction received yet."}
                        </p>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold uppercase text-[#10B981]">
                            Status:
                          </span>
                          <span
                            className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded ${
                              selectedPatient.nurseAccepted
                                ? "bg-[#10B981]/20 text-[#10B981]"
                                : "bg-amber-500/20 text-amber-300"
                            }`}
                          >
                            {selectedPatient.nurseAccepted
                              ? "ACCEPTED"
                              : "PENDING REVIEW"}
                          </span>
                        </div>
                        {!selectedPatient.nurseAccepted && (
                          <button
                            type="button"
                            onClick={handleAcceptInstructions}
                            disabled={saving}
                            className="px-4 py-2 bg-[#10B981] hover:bg-[#0D9668] text-white font-black uppercase tracking-widest text-[10px] rounded-lg shadow-sm disabled:opacity-50 transition-all font-mono"
                          >
                            Accept Instructions
                          </button>
                        )}
                        {selectedPatient.nurseAccepted && (
                            <div className="space-y-2">
                              <textarea
                                rows="2"
                                value={treatmentLog.nurseResponse || ""}
                                onChange={(e) =>
                                  setTreatmentLog((prev) => ({
                                    ...prev,
                                    nurseResponse: e.target.value,
                                  }))
                                }
                                placeholder="Write response/feedback for doctor..."
                                className="w-full bg-[#0E1B17] border border-[#10B981]/30 px-3 py-2 rounded-lg text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                              />
                              <button
                                type="button"
                                onClick={handleSendNurseResponse}
                                disabled={saving}
                                className="px-3 py-1.5 bg-[#0D9668] hover:bg-[#0D9668] text-white font-black uppercase tracking-widest text-[10px] rounded-lg shadow-sm disabled:opacity-50 font-mono"
                              >
                                {selectedPatient.nurseResponse
                                  ? "Update Response"
                                  : "Send Response"}
                              </button>
                            </div>
                          )}
                        {selectedPatient.nurseResponse && (
                          <div className="space-y-2">
                            <h5 className="text-[10px] font-bold uppercase text-[#10B981]">
                              Your Response to Doctor:
                            </h5>
                            <p className="text-[11px] text-slate-200 bg-[#0E1B17] p-3 rounded-lg border border-[#10B981]/20 leading-relaxed italic border-l-4 border-l-emerald-400 font-mono">
                              "{selectedPatient.nurseResponse}"
                            </p>
                            <span className="text-[8px] font-mono font-bold bg-[#10B981]/20 px-2 py-0.5 rounded text-[#94A3B8] uppercase">
                              Dispatched
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-wider text-[#94A3B8] block font-mono">
                        Care Execution Check
                      </label>
                      <label className="flex items-start gap-3 p-4 border border-white/20 rounded-xl bg-[#0E1B17]/50 hover:bg-[#0E1B17] cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={treatmentLog.medicationAdministered}
                          onChange={(e) =>
                            setTreatmentLog((prev) => ({
                              ...prev,
                              medicationAdministered: e.target.checked,
                            }))
                          }
                          className="mt-0.5 h-4 w-4 text-[#10B981] border-white/20 rounded focus:ring-emerald-500"
                        />
                        <div>
                          <span className="text-[11px] font-black text-white flex items-center gap-1 uppercase">
                            <HeartPulse
                              size={13}
                              className="text-amber-300"
                            />
                            Medication Administration Verify
                          </span>
                          <p className="text-[11px] text-[#94A3B8] mt-0.5">
                            Check this off only if prescribed medications or
                            interventions ordered by the doctor above have
                            been completely executed.
                          </p>
                        </div>
                      </label>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-[#94A3B8] block font-mono">
                        Nursing Care Summary
                      </label>
                      <textarea
                        rows="4"
                        value={treatmentLog.nurseSummary || ""}
                        onChange={(e) =>
                          setTreatmentLog((prev) => ({
                            ...prev,
                            nurseSummary: e.target.value,
                          }))
                        }
                        placeholder="Document patient observations, care activities, and clinical notes..."
                        className="w-full bg-[#0E1B17] border border-white/20 px-3 py-2.5 rounded-lg text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono leading-relaxed"
                      />
                      <p className="text-[9px] text-[#94A3B8] font-mono">
                        Record detailed nursing observations, interventions performed, patient response, and any concerns
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-[#94A3B8] block font-mono">
                        Update Patient Clinical Routing State
                      </label>
                      <select
                        value={treatmentLog.careStatusUpdate}
                        onChange={(e) =>
                          setTreatmentLog((prev) => ({
                            ...prev,
                            careStatusUpdate: e.target.value,
                          }))
                        }
                        className="w-full bg-[#0E1B17] border border-white/20 px-4 py-2.5 rounded-lg text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-black"
                      >
                        <option value="In Progress / Under Ward Care">
                          In Progress / Under Ward Care
                        </option>
                        <option value="Observations Complete / Stable">
                          Observations Complete / Stable
                        </option>
                        <option value="Escalated: Pending Doctor Re-evaluation">
                          Escalated: Pending Doctor Re-evaluation
                        </option>
                      </select>
                      <button
                        type="button"
                        onClick={handleStatusUpdate}
                        disabled={saving}
                        className="w-full mt-2 py-2.5 bg-[#0E1B17] hover:bg-[#050B09] text-white font-black uppercase tracking-widest text-[10px] rounded-lg transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 font-mono"
                      >
                        <CheckCircle2 size={14} /> Update Status
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full py-3.5 bg-[#10B981] hover:bg-[#0D9668] text-white font-black uppercase tracking-widest text-[11px] rounded-lg transition-all shadow-lg shadow-[#10B981]/10 flex items-center justify-center gap-2 disabled:opacity-50 font-mono"
                    >
                      <CheckCircle2 size={16} /> Save & Broadcast Results to
                      Doctor
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === "nurseAudit" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#0E1B17] rounded-3xl border border-white/20 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#0E1B17]/30">
                  <div>
                    <h1 className="text-2xl font-black text-white">
                      Department Audit Logs
                    </h1>
                    <p className="text-[#94A3B8] font-medium mt-1">
                      Your recent activity and department changes
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-[#EF4444]/10 text-[#EF4444] border border-rose-100 px-3 py-1.5 rounded-lg uppercase">
                    My Department
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
