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
  Plus,
  X,
  ClipboardList,
} from "lucide-react";
import {
  logAudit,
  fetchAuditLogs,
  fetchAuditAlertsCount,
} from "../utils/audit";

export default function NursePage({ onLogout }) {
  const [activeTab, setActiveTab] = useState("assigned"); // 🚀 FIXED: Added missing activeTab state hook
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Core data structure tracking active care assignments
  const [assignedPatients, setAssignedPatients] = useState([]);
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

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const hospitalLogo = "/mesra icon.png";
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  // Form handling state for treatment delivery execution updates
  const [treatmentLog, setTreatmentLog] = useState({
    medicationAdministered: false,
    nurseNotes: "",
    careStatusUpdate: "In Progress",
  });

  useEffect(() => {
    const fetchAssignments = async () => {
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
        }));
        setAssignedPatients(mapped);
        setError("");
      } catch (err) {
        console.error("Error fetching nurse assignments:", err);
        setError("Failed to load assignments");
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, [API_URL, token]);

  // Sync form state when a new patient is selected
  useEffect(() => {
    if (selectedPatient) {
      setTreatmentLog({
        medicationAdministered: selectedPatient.medicationAdministered || false,
        nurseNotes: selectedPatient.nurseNotes || "",
        careStatusUpdate: selectedPatient.status || "In Progress",
      });
    }
  }, [selectedPatient]);

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
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
            nurseNotes: treatmentLog.nurseNotes,
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
      setSelectedPatient(null);
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
      setAssignedPatients((prev) =>
        prev.map((p) =>
          p.id === selectedPatient.id
            ? { ...p, status: treatmentLog.careStatusUpdate }
            : p,
        ),
      );
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
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* LEFT SIDEBAR NAVIGATION PANEL */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 z-30">
        <div>
          <div className="p-6 border-b border-slate-200 flex items-center gap-3.5">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md">
              M
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-black text-lg tracking-wider text-slate-900">
                  MESRA
                </span>
                <span className="font-bold text-[10px] uppercase tracking-widest bg-indigo-600 px-1.5 py-0.5 rounded text-white font-mono">
                  NURSE
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono tracking-tight">
                Clinical Care Station
              </p>
            </div>
          </div>

          <nav className="p-4 space-y-1.5 pt-6">
            <button
              onClick={() => setActiveTab("assigned")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "assigned"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Sliders size={16} />
              Assigned Patients
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="bg-slate-100 rounded-xl p-3 border border-slate-200 text-[10px] font-mono text-slate-600 space-y-1">
            <p className="text-indigo-600 font-bold">Station ID: NS-Alpha</p>
            <p>Role: Clinical / Ward Nurse</p>
          </div>

          <button
            onClick={() => {
              setActiveTab("nurseAudit");
              loadAuditLogs();
            }}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 border text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
              activeTab === "nurseAudit"
                ? "bg-rose-50 border-rose-200 text-rose-600"
                : "bg-white border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
            }`}
          >
            <ShieldAlert size={14} /> Audit Activity ({auditAlertsCount})
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-rose-950 text-slate-300 hover:text-rose-400 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
          >
            <LogOut size={14} /> Exit Platform
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT FRAME */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-8 py-4 z-20 flex justify-between items-center shadow-sm">
          <h1 className="text-base font-bold tracking-wider text-slate-800 uppercase font-mono">
            {activeTab === "assigned"
              ? "Active Nursing Care Delivery Deck"
              : "Department Audit Workspace"}
          </h1>
          <div className="text-right font-mono text-[11px] text-slate-400">
            Status Monitoring:{" "}
            <span className="text-indigo-500 font-bold">Ward Synchronized</span>
          </div>
        </header>

        {/* 🚀 FIXED HTML MARKUP STRUCTURE HERE */}
        <main className="flex-1 p-8 overflow-y-auto">
          {activeTab === "assigned" && (
            <div className="grid lg:grid-cols-12 gap-8 animate-fadeIn">
              {/* LEFT CONTAINER: ASSIGNED PATIENT TRACKER LIST */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <h3 className="font-black text-xs uppercase tracking-wider text-slate-400 mb-3">
                    Lookup Ward Registry
                  </h3>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter assigned patients..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {loading ? (
                    <p className="text-xs text-slate-400 text-center py-8">
                      Loading assignments...
                    </p>
                  ) : error ? (
                    <p className="text-xs text-red-400 text-center py-8">
                      {error}
                    </p>
                  ) : filteredPatients.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-8">
                      No assigned patients found.
                    </p>
                  ) : (
                    filteredPatients.map((patient) => (
                      <div
                        key={patient.id}
                        onClick={() => handleSelectPatient(patient)}
                        className={`p-5 bg-white border rounded-2xl cursor-pointer transition-all ${
                          selectedPatient?.id === patient.id
                            ? "border-indigo-500 ring-2 ring-indigo-500/10 shadow-md"
                            : "border-slate-200 shadow-sm hover:border-slate-300"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-indigo-600 block">
                              {patient.id}
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                              {patient.name}
                            </h4>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                              patient.status.includes("Pending")
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {patient.status}
                          </span>
                        </div>
                        <div className="mt-3 space-y-1 text-xs text-slate-500 font-medium">
                          <p>
                            <span className="text-slate-400">Location:</span>{" "}
                            {patient.bedAllocation}
                          </p>
                          <p>
                            <span className="text-slate-400">Doctor:</span>{" "}
                            {patient.assignedDoctor}
                          </p>
                        </div>
                        <div className="border-t border-slate-100 mt-3 pt-2 text-[11px] font-mono text-slate-400 flex items-center gap-1">
                          <Activity size={12} className="text-indigo-500" />{" "}
                          {patient.vitalsSummary}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* RIGHT CONTAINER: TREATMENT FLOW & MEDICATION LOGGING WORKSPACE */}
              <div className="lg:col-span-7">
                {selectedPatient ? (
                  <form
                    onSubmit={handleUpdateCarePlan}
                    className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden"
                  >
                    <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                      <div>
                        <span className="text-xs font-mono text-indigo-400 font-bold uppercase">
                          Assigned Treatment Log & Report Terminal
                        </span>
                        <h2 className="text-base font-black tracking-wide text-white mt-0.5">
                          {selectedPatient.name}
                        </h2>
                      </div>
                      <p className="text-right font-mono text-xs text-slate-400">
                        {selectedPatient.gender} • Age {selectedPatient.age}
                      </p>
                    </div>

                    <div className="bg-rose-50/70 border-b border-rose-100 px-6 py-3 text-xs text-rose-800 flex items-center gap-2 font-medium">
                      <AlertCircle
                        size={15}
                        className="text-rose-600 shrink-0"
                      />
                      <p>
                        <strong>Allergy Alerts:</strong>{" "}
                        {selectedPatient.allergies}
                      </p>
                    </div>

                    <div className="p-8 space-y-6">
                      <div className="bg-indigo-50/40 border border-indigo-100/60 rounded-2xl p-5 space-y-2">
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                          <FileText size={14} /> Incoming Physician Instructions
                          ({selectedPatient.assignedDoctor})
                        </h4>
                        <p className="text-xs text-indigo-950 font-medium leading-relaxed bg-white/80 p-3 rounded-xl border border-indigo-100">
                          {selectedPatient.carePlan}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                          Care Execution Check
                        </label>
                        <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={treatmentLog.medicationAdministered}
                            onChange={(e) =>
                              setTreatmentLog((prev) => ({
                                ...prev,
                                medicationAdministered: e.target.checked,
                              }))
                            }
                            className="mt-0.5 h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                              <HeartPulse
                                size={13}
                                className="text-amber-500"
                              />
                              Verify Orders and Confirm Administration
                            </span>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Check this off only if prescribed medications or
                              interventions ordered by the doctor above have
                              been completely executed.
                            </p>
                          </div>
                        </label>
                      </div>

                      <div className="space-y-3 border-t border-slate-100 pt-4">
                        <div className="flex justify-between items-center">
                          <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                            Nurse-to-Doctor Shift Report & Escalation
                          </label>
                          <span className="text-[9px] uppercase font-mono bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                            Direct Pipeline Link
                          </span>
                        </div>

                        <textarea
                          rows="3"
                          value={treatmentLog.nurseNotes}
                          onChange={(e) =>
                            setTreatmentLog((prev) => ({
                              ...prev,
                              nurseNotes: e.target.value,
                            }))
                          }
                          placeholder="Type your clinical update or status report here..."
                          className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
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
                          className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
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
                          className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <CheckCircle2 size={14} /> Update Status
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <CheckCircle2 size={16} /> Save & Broadcast Report to
                        Doctor
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="h-96 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col justify-center items-center text-slate-400 bg-white shadow-sm">
                    <Clock size={36} className="text-slate-300 mb-2" />
                    <p className="text-xs font-bold uppercase tracking-wider">
                      Select an active ward allocation to handle execution
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "nurseAudit" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900">
                      Department Audit Logs
                    </h1>
                    <p className="text-slate-400 font-medium mt-1">
                      Your recent activity and department changes
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-rose-50 text-rose-600 border border-rose-100 px-3 py-1.5 rounded-lg uppercase">
                    My Department
                  </span>
                </div>

                {auditLogsError && (
                  <div className="mx-6 mt-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
                    {auditLogsError}
                  </div>
                )}

                {auditLogsLoading ? (
                  <div className="p-10 text-center text-xs font-black text-slate-400 uppercase tracking-wider">
                    Loading audit logs...
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="p-10 text-center text-xs font-black text-slate-400 uppercase tracking-wider">
                    No audit logs found for your department
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <div
                        key={log._id || log.id}
                        className="p-5 flex items-start gap-4 hover:bg-slate-50/50 transition"
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
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
                            <span className="text-xs font-black text-slate-900 uppercase">
                              {log.module}
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase">
                              {log.action}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {log.details}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1.5 font-mono">
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
