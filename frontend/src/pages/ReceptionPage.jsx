import React, { useState, useEffect, useCallback } from "react";
import {
  UserPlus,
  Search,
  Users,
  Calendar,
  User,
  MapPin,
  ShieldAlert,
  Heart,
  AlertCircle,
  Edit2,
  Activity,
  FileText,
  ChevronRight,
  Menu,
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Clock,
  LogOut,
  Plus,
  X,
  ClipboardList,
} from "lucide-react";
import {
  logAudit,
  fetchAuditLogs,
  fetchAuditAlertsCount,
} from "../utils/audit";

export default function PatientManagementSystem() {
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, patientsList, registerPatient, receptionAudit
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [auditAlertsCount, setAuditAlertsCount] = useState(0);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditLogsError, setAuditLogsError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState([]);

  const initialFormState = {
    cardId: "",
    firstName: "",
    middleName: "",
    lastName: "",
    age: "",
    ageUnit: "Years",
    gender: "",
    bloodGroup: "",
    maritalStatus: "",
    subCity: "",
    woreda: "",
    houseNumber: "",
    nationality: "Ethiopian",
    phoneNumber: "",
    alternativePhone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    guardianFullName: "",
    guardianRelationship: "",
    guardianPhone: "",
    chiefComplaint: "",
    admissionType: "OPD",
    paymentType: "Cash",
    companyName: "",
    referredFrom: "Self-Referral",
    registrationTime: "",
  };

  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const hospitalLogo = "/mesra icon.png";

  const token = localStorage.getItem("token");

  const getAuthHeaders = (isJson = true) => {
    const headers = {};
    if (isJson) headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  const handleAuthError = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/login";
  };

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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

  // Fetch patients from backend on mount and poll for updates
  useEffect(() => {
    if (!token) {
      handleAuthError();
      return;
    }
    const fetchPatients = async () => {
      try {
        const response = await fetch(`${API_URL}/api/patients`, {
          headers: getAuthHeaders(),
        });
        if (response.status === 401 || response.status === 403) {
          handleAuthError();
          return;
        }
        if (!response.ok) throw new Error("Failed to fetch patients");
        const data = await response.json();
        const normalizedPatients = (data.data || []).map((patient) => ({
          ...patient,
          phoneNumber: patient.phoneNumber || patient.contactNumber || "",
          admissionType: patient.admissionType || "OPD",
        }));
        setPatients(normalizedPatients);
        setError("");
      } catch (err) {
        console.error("Error fetching patients:", err);
        setError("Failed to load patients");
      }
    };
    fetchPatients();
    const interval = setInterval(fetchPatients, 5000);
    return () => clearInterval(interval);
  }, [API_URL, token]);

  // Handle standard registration timestamping
  useEffect(() => {
    if (activeTab === "registerPatient" && !isEditing) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");

      const currentDateTimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`;
      setFormData((prev) => ({
        ...prev,
        registrationTime: currentDateTimeLocal,
      }));
    }
  }, [activeTab, isEditing]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const resetToEmptyRegistration = () => {
    setFormData(initialFormState);
    setIsEditing(false);
    setFormErrors({});
    setActiveTab("registerPatient");
  };

  const triggerEditMode = (patient) => {
    let editTime = patient.registrationTime;
    if (editTime && !editTime.includes("T")) {
      const parsed = new Date(editTime);
      if (!isNaN(parsed.getTime())) {
        editTime = parsed.toISOString().slice(0, 16);
      }
    }
    setFormData({ ...patient, registrationTime: editTime });
    setIsEditing(true);
    setFormErrors({});
    setActiveTab("registerPatient");
  };

  const validateForm = () => {
    const errors = {};
    const requiredFields = [
      "firstName",
      "middleName",
      "lastName",
      "age",
      "gender",
      "subCity",
      "woreda",
      "phoneNumber",
      "emergencyContactName",
      "emergencyContactPhone",
      "chiefComplaint",
      "registrationTime",
    ];

    requiredFields.forEach((field) => {
      if (!formData[field] || formData[field].toString().trim() === "") {
        errors[field] = "Field is strictly required";
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);

      if (isEditing) {
        const { _id, ...updatePayload } = formData;
        const response = await fetch(`${API_URL}/api/patients/${_id}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(updatePayload),
        });
        if (response.status === 401 || response.status === 403) {
          handleAuthError();
          return;
        }
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || "Failed to update patient");
        }
        const data = await response.json();
        setPatients((prev) =>
          prev.map((p) => (p._id === data.data._id ? data.data : p)),
        );
        setSelectedPatient(data.data);
        setIsEditing(false);
      } else {
        const response = await fetch(`${API_URL}/api/patients`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(formData),
        });
        if (response.status === 401 || response.status === 403) {
          handleAuthError();
          return;
        }
        if (!response.ok) throw new Error("Failed to register patient");
        const data = await response.json();
        setPatients((prev) => [data.data, ...prev]);
      }

      setFormData(initialFormState);
      setActiveTab("patientsList");
      setError("");
    } catch (err) {
      console.error("Error submitting form:", err);
      setError(err.message || "Failed to save patient");
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter((patient) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    let targetPhoneQuery = query;
    if (query.startsWith("09")) {
      targetPhoneQuery = query.substring(1);
    } else if (query.startsWith("+2519")) {
      targetPhoneQuery = query.substring(5);
    }

    const fullName =
      `${patient.firstName} ${patient.middleName} ${patient.lastName}`.toLowerCase();
    const cleanPhone = (
      patient.phoneNumber ||
      patient.contactNumber ||
      ""
    ).replace(/[\s+-]/g, "");
    const cleanEmergencyPhone = patient.emergencyContactPhone
      ? patient.emergencyContactPhone.replace(/[\s+-]/g, "")
      : "";

    return (
      patient.cardId.toLowerCase().includes(query) ||
      fullName.includes(query) ||
      patient.firstName.toLowerCase().includes(query) ||
      patient.lastName.toLowerCase().includes(query) ||
      cleanPhone.includes(targetPhoneQuery) ||
      cleanEmergencyPhone.includes(targetPhoneQuery)
    );
  });

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* LEFT ADMINISTRATIVE SIDEBAR */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 z-30">
        <div>
          <div className="p-6 border-b border-slate-200 flex items-center gap-3.5">
            <img
              src={hospitalLogo}
              alt="Mesra Logo"
              className="w-10 h-10 object-contain rounded-xl"
            />
            <div>
              <div className="flex items-center gap-1">
                <span className="font-black text-lg tracking-wider text-slate-900">
                  MESRA
                </span>
                <span className="font-bold text-[10px] uppercase tracking-widest bg-blue-600 px-1.5 py-0.5 rounded text-white font-mono">
                  DIGITAL
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono tracking-tight">
                Enterprise Health Platform
              </p>
            </div>
          </div>

          <nav className="p-4 space-y-1.5 pt-6">
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setSelectedPatient(null);
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "dashboard" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-400 hover:bg-slate-900 hover:text-white"}`}
            >
              <LayoutDashboard size={16} /> Dashboard Analytics
            </button>

            <button
              onClick={() => {
                setActiveTab("patientsList");
                setSelectedPatient(null);
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "patientsList" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-400 hover:bg-slate-900 hover:text-white"}`}
            >
              <Users size={16} /> Patient Registry Ledger
            </button>

            <button
              onClick={resetToEmptyRegistration}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "registerPatient" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-400 hover:bg-slate-900 hover:text-white"}`}
            >
              <UserPlus size={16} /> Intake Registration
            </button>

            <button
              onClick={() => {
                setActiveTab("receptionAudit");
                loadAuditLogs();
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "receptionAudit" ? "bg-rose-50 text-rose-600 shadow-sm" : "text-slate-400 hover:bg-slate-900 hover:text-white"}`}
            >
              <ShieldAlert size={16} /> Audit Activity ({auditAlertsCount})
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 text-[10px] font-mono text-slate-400 space-y-1">
            <p className="text-emerald-400 font-bold">Node Status: Live</p>
            <p>IP: 10.100.10.4</p>
            <p>Role: Admissions Clerk</p>
          </div>
          <button
            onClick={handleAuthError}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-rose-950/45 border border-slate-800 hover:border-rose-900 text-slate-400 hover:text-rose-400 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
          >
            <LogOut size={14} /> Exit Platform
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 px-8 py-4 z-20 flex justify-between items-center">
          <div>
            <h1 className="text-sm font-black tracking-wider text-slate-900 uppercase font-mono">
              {activeTab === "dashboard" && "System Analytics Dashboard"}
              {activeTab === "patientsList" &&
                (selectedPatient
                  ? "Patient Dossier Breakdown"
                  : "Active Registry Files")}
              {activeTab === "registerPatient" &&
                (isEditing
                  ? "Modify Patient Profile"
                  : "Universal Intake Documentation")}
              {activeTab === "receptionAudit" &&
                "Internal Security Ledger Logs"}
            </h1>
          </div>
          <div className="text-right font-mono text-[11px] text-slate-500">
            Platform Track:{" "}
            <span className="text-blue-600 font-bold">Live Stream Mode</span>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-700 text-xs rounded-r-xl flex items-center gap-3">
              <AlertCircle size={16} />{" "}
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* VIEWPORT 0: DASHBOARD ANALYTICS */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    label: "Total Registered Cards",
                    value: patients.length,
                    color: "border-l-blue-500",
                  },
                  {
                    label: "Active Outpatient (OPD)",
                    value: patients.filter((p) => p.admissionType === "OPD")
                      .length,
                    color: "border-l-cyan-500",
                  },
                  {
                    label: "Active Inpatient (IPD)",
                    value: patients.filter((p) => p.admissionType === "IPD")
                      .length,
                    color: "border-l-amber-500",
                  },
                  {
                    label: "Emergency Admissions",
                    value: patients.filter(
                      (p) => p.admissionType === "Emergency",
                    ).length,
                    color: "border-l-rose-500",
                  },
                ].map((card, idx) => (
                  <div
                    key={idx}
                    className={`bg-white border border-slate-200 p-5 rounded-2xl border-l-4 ${card.color} flex flex-col justify-between shadow-sm`}
                  >
                    <span className="text-[10px] font-black text-slate-500 tracking-wider uppercase">
                      {card.label}
                    </span>
                    <div className="flex items-baseline justify-between mt-3">
                      <span className="text-3xl font-black tracking-tight text-slate-900 font-mono">
                        {card.value}
                      </span>
                      <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-0.5">
                        <TrendingUp size={12} /> Live
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xs text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                      <BarChart3 size={15} className="text-blue-500" /> Hourly
                      Registration Flux
                    </h3>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-mono">
                      Sync: Realtime
                    </span>
                  </div>

                  <div className="h-56 flex items-end gap-3.5 pt-6 border-b border-slate-200 px-2">
                    {[35, 65, 45, 90, 75, 55, 100].map((height, idx) => (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
                      >
                        <div className="w-full flex gap-1 items-end h-full">
                          <div
                            style={{ height: `${height}%` }}
                            className="w-1/2 bg-blue-600 rounded-t-sm group-hover:bg-blue-500 transition-all duration-300"
                          ></div>
                          <div
                            style={{ height: `${Math.max(height - 20, 10)}%` }}
                            className="w-1/2 bg-cyan-400 rounded-t-sm group-hover:bg-cyan-300 transition-all duration-300"
                          ></div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 mt-1">
                          {
                            [
                              "08:00",
                              "10:00",
                              "12:00",
                              "14:00",
                              "16:00",
                              "18:00",
                              "20:00",
                            ][idx]
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center gap-6 mt-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-blue-600 rounded-sm"></span>{" "}
                      Cash Walk-ins
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-cyan-400 rounded-sm"></span>{" "}
                      Corporate Credit
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-2">
                      Regional Station Triage Status
                    </h3>
                    <p className="text-[11px] text-slate-500 mb-6">
                      Current allocation distribution metrics inside active
                      triage units.
                    </p>
                  </div>
                  <div className="space-y-4">
                    {[
                      {
                        name: "Outpatient Department",
                        count: `${patients.filter((p) => p.admissionType === "OPD").length} Profiled`,
                        pct: `${patients.length ? (patients.filter((p) => p.admissionType === "OPD").length / patients.length) * 100 : 0}%`,
                        color: "bg-blue-500",
                      },
                      {
                        name: "Adult Emergency Clinic",
                        count: `${patients.filter((p) => p.admissionType === "Emergency").length} Profiled`,
                        pct: `${patients.length ? (patients.filter((p) => p.admissionType === "Emergency").length / patients.length) * 100 : 0}%`,
                        color: "bg-rose-500",
                      },
                      {
                        name: "Inpatient Ward Admissions",
                        count: `${patients.filter((p) => p.admissionType === "IPD").length} Profiled`,
                        pct: `${patients.length ? (patients.filter((p) => p.admissionType === "IPD").length / patients.length) * 100 : 0}%`,
                        color: "bg-amber-500",
                      },
                    ].map((triage, index) => (
                      <div key={index} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-700 font-medium">
                            {triage.name}
                          </span>
                          <span className="text-slate-500 font-mono text-[11px]">
                            {triage.count}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: triage.pct }}
                            className={`h-full ${triage.color}`}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEWPORT 1: PATIENT REGISTRY LIST */}
          {activeTab === "patientsList" && !selectedPatient && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white rounded-3xl p-6 text-slate-900 border-b-4 border-blue-600 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-base font-black uppercase tracking-widest text-slate-900">
                    Active Admission Case Files
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Search, evaluate, filter and manage patient electronic
                    medical cards instantaneously.
                  </p>
                </div>
                <div className="w-full md:w-96 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Name, Card ID, Phone..."
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 text-[11px] font-black uppercase tracking-wider border-b border-slate-200">
                        <th className="py-4 px-6">Patient Identifier Card</th>
                        <th className="py-4 px-6">Patient Full Medical Name</th>
                        <th className="py-4 px-6">Age / Sex Metrics</th>
                        <th className="py-4 px-6">Primary Phone Contact</th>
                        <th className="py-4 px-6">Sub-City Location</th>
                        <th className="py-4 px-6 text-right">
                          Action Execution
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium">
                      {filteredPatients.length > 0 ? (
                        filteredPatients.map((patient) => (
                          <tr
                            key={patient.cardId}
                            className="hover:bg-slate-50/80 transition-colors group"
                          >
                            <td className="py-4 px-6 font-mono font-bold text-blue-600">
                              {patient.cardId}
                            </td>
                            <td className="py-4 px-6">
                              <span className="font-bold text-slate-900 text-sm">
                                {patient.firstName} {patient.middleName}{" "}
                                {patient.lastName}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-700">
                              <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-800 font-bold mr-1.5">
                                {patient.age} {patient.ageUnit}
                              </span>
                              <span
                                className={`px-2 py-1 rounded-md font-bold ${patient.gender === "Male" ? "bg-blue-50 text-blue-700" : "bg-rose-50 text-rose-700"}`}
                              >
                                {patient.gender}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-mono text-slate-600">
                              {patient.phoneNumber}
                            </td>
                            <td className="py-4 px-6">
                              <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-700 font-bold">
                                {patient.subCity}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => setSelectedPatient(patient)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm hover:bg-blue-700"
                              >
                                Manage <ChevronRight size={12} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="6"
                            className="py-12 text-center text-slate-400 font-medium bg-slate-50/50"
                          >
                            <AlertCircle className="mx-auto h-8 w-8 text-slate-300 mb-2" />{" "}
                            No matching patient records discovered inside local
                            database index.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEWPORT 2: REPAIRED & COMPLETE DETAILED PATIENT DOSSIER CARD */}
          {selectedPatient && activeTab === "patientsList" && (
            <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-fadeIn">
               <div className="p-6 bg-white text-slate-900 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <div className="flex items-center gap-3.5">
                   <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
                     <User className="h-6 w-6 text-blue-600" />
                   </div>
                   <div>
                     <h2 className="text-lg font-black tracking-wide text-slate-900">
                       {selectedPatient.firstName} {selectedPatient.middleName}{" "}
                       {selectedPatient.lastName}
                    </h2>
                    <p className="text-xs font-mono text-blue-600 mt-0.5">
                      Card Identity Token:{" "}
                      <span className="font-bold">
                        {selectedPatient.cardId}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => triggerEditMode(selectedPatient)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                  >
                    <Edit2 size={13} /> Edit Record
                  </button>
                  <button
                    onClick={() => setSelectedPatient(null)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-8">
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200/60 text-slate-700">
                  <Clock size={14} className="text-blue-600" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    System Log Registration Timestamp Track:
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900 ml-auto">
                    {selectedPatient.registrationTime || "Not Logged"}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Patient Age Span
                    </span>
                    <p className="text-sm font-black text-slate-800 mt-1">
                      {selectedPatient.age} {selectedPatient.ageUnit}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Assigned Gender
                    </span>
                    <p className="text-sm font-black text-slate-800 mt-1">
                      {selectedPatient.gender}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Blood Component
                    </span>
                    <p className="text-sm font-black text-slate-800 mt-1">
                      {selectedPatient.bloodGroup || "Not Typed"}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Track Channel
                    </span>
                    <p className="text-sm font-black text-blue-600 mt-1">
                      {selectedPatient.admissionType}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Activity size={14} className="text-blue-500" /> Core
                    Clinical Intake Complaint
                  </h3>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-xs leading-relaxed font-medium text-slate-700">
                    {selectedPatient.chiefComplaint ||
                      "No primary record notes added for intake track profile."}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <MapPin size={13} /> Local Address Matrix
                    </h4>
                    <ul className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 text-xs font-medium text-slate-700">
                      <li className="flex justify-between">
                        <span>Sub-City Zone:</span>{" "}
                        <span className="font-bold text-slate-900">
                          {selectedPatient.subCity}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span>Woreda Sector:</span>{" "}
                        <span className="font-bold text-slate-900">
                          {selectedPatient.woreda}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span>House Allocation:</span>{" "}
                        <span className="font-bold text-slate-900">
                          {selectedPatient.houseNumber || "N/A"}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span>Nationality Status:</span>{" "}
                        <span className="font-bold text-slate-900">
                          {selectedPatient.nationality}
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Heart size={13} /> Emergency Verification Units
                    </h4>
                    <ul className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 text-xs font-medium text-slate-700">
                      <li className="flex justify-between">
                        <span>Contact Liaison:</span>{" "}
                        <span className="font-bold text-slate-900">
                          {selectedPatient.emergencyContactName}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span>Primary Phone Line:</span>{" "}
                        <span className="font-bold text-slate-900 font-mono">
                          {selectedPatient.emergencyContactPhone}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span>Financial Modality:</span>{" "}
                        <span className="font-bold text-emerald-600">
                          {selectedPatient.paymentType}
                        </span>
                      </li>
                      {selectedPatient.companyName && (
                        <li className="flex justify-between">
                          <span>Corporate Attachment:</span>{" "}
                          <span className="font-bold text-slate-900">
                            {selectedPatient.companyName}
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEWPORT 3: UNIVERSAL INTAKE REGISTRATION FORM */}
          {activeTab === "registerPatient" && (
            <form
              onSubmit={handleFormSubmit}
              className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-fadeIn"
            >
              <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                    {isEditing
                      ? "Modify Extant Profile Metadata"
                      : "Universal Client Documentation Entry"}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Ensure strict legal data binding parameters before
                    dispatching transaction nodes to state database storage
                    models.
                  </p>
                </div>
                <span className="text-[10px] bg-blue-50 text-blue-600 px-2.5 py-1 rounded-md font-mono font-bold tracking-wider uppercase">
                  Clerical Track
                </span>
              </div>

              <div className="p-8 space-y-8">
                {/* Section 1: Demographics */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                    1. Demographic Profile Matrix
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                        First Legal Name *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full px-3.5 py-2 bg-slate-50 border ${formErrors.firstName ? "border-rose-400 focus:ring-rose-200" : "border-slate-200 focus:ring-blue-100"} rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-4 font-medium`}
                      />
                      {formErrors.firstName && (
                        <p className="text-[10px] text-rose-600 font-semibold mt-1">
                          {formErrors.firstName}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                        Middle Patronymic Name *
                      </label>
                      <input
                        type="text"
                        name="middleName"
                        value={formData.middleName}
                        onChange={handleInputChange}
                        className={`w-full px-3.5 py-2 bg-slate-50 border ${formErrors.middleName ? "border-rose-400 focus:ring-rose-200" : "border-slate-200 focus:ring-blue-100"} rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-4 font-medium`}
                      />
                      {formErrors.middleName && (
                        <p className="text-[10px] text-rose-600 font-semibold mt-1">
                          {formErrors.middleName}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                        Last Family Name *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`w-full px-3.5 py-2 bg-slate-50 border ${formErrors.lastName ? "border-rose-400 focus:ring-rose-200" : "border-slate-200 focus:ring-blue-100"} rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-4 font-medium`}
                      />
                      {formErrors.lastName && (
                        <p className="text-[10px] text-rose-600 font-semibold mt-1">
                          {formErrors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                        Age Matrix Span *
                      </label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                      />
                      {formErrors.age && (
                        <p className="text-[10px] text-rose-600 font-semibold mt-1">
                          {formErrors.age}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                        Age Dynamic Unit
                      </label>
                      <select
                        name="ageUnit"
                        value={formData.ageUnit}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                      >
                        <option>Years</option>
                        <option>Months</option>
                        <option>Days</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                        Biological Gender *
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                      >
                        <option value="">Select Gender</option>
                        <option>Male</option>
                        <option>Female</option>
                      </select>
                      {formErrors.gender && (
                        <p className="text-[10px] text-rose-600 font-semibold mt-1">
                          {formErrors.gender}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                        Blood Classification Group
                      </label>
                      <select
                        name="bloodGroup"
                        value={formData.bloodGroup}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                      >
                        <option value="">A/B/O Track</option>
                        <option>A+</option>
                        <option>A-</option>
                        <option>B+</option>
                        <option>B-</option>
                        <option>AB+</option>
                        <option>AB-</option>
                        <option>O+</option>
                        <option>O-</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Contact & Location */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                    2. Communication & Structural Coordinates
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                        Primary Phone Contact *
                      </label>
                      <input
                        type="text"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="e.g. 0911..."
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                      />
                      {formErrors.phoneNumber && (
                        <p className="text-[10px] text-rose-600 font-semibold mt-1">
                          {formErrors.phoneNumber}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                        Sub-City Region Zone *
                      </label>
                      <input
                        type="text"
                        name="subCity"
                        value={formData.subCity}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                      />
                      {formErrors.subCity && (
                        <p className="text-[10px] text-rose-600 font-semibold mt-1">
                          {formErrors.subCity}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                        Woreda Distribution Sector *
                      </label>
                      <input
                        type="text"
                        name="woreda"
                        value={formData.woreda}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                      />
                      {formErrors.woreda && (
                        <p className="text-[10px] text-rose-600 font-semibold mt-1">
                          {formErrors.woreda}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 3: Administrative & Complaint */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                    3. Institutional Tracking Logic & Complaints
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                        Emergency Contact Full Name *
                      </label>
                      <input
                        type="text"
                        name="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                      />
                      {formErrors.emergencyContactName && (
                        <p className="text-[10px] text-rose-600 font-semibold mt-1">
                          {formErrors.emergencyContactName}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                        Emergency Liaison Phone *
                      </label>
                      <input
                        type="text"
                        name="emergencyContactPhone"
                        value={formData.emergencyContactPhone}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                      />
                      {formErrors.emergencyContactPhone && (
                        <p className="text-[10px] text-rose-600 font-semibold mt-1">
                          {formErrors.emergencyContactPhone}
                        </p>
                      )}
                    </div>
                     <div>
                       <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                         Admission Station Route Channel
                       </label>
                       <select
                         name="admissionType"
                         value={formData.admissionType}
                         onChange={handleInputChange}
                         className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                       >
                         <option>OPD</option>
                         <option>IPD</option>
                         <option>Emergency</option>
                       </select>
                     </div>
                     <div>
                       <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                         Emergency Liaison Relationship with Guidance
                       </label>
                       <input
                         type="text"
                         name="guardianRelationship"
                         value={formData.guardianRelationship}
                         onChange={handleInputChange}
                         placeholder="e.g. Legal Guardian / Parent / Next of Kin"
                         className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                       />
                       {formErrors.guardianRelationship && (
                         <p className="text-[10px] text-rose-600 font-semibold mt-1">
                           {formErrors.guardianRelationship}
                         </p>
                       )}
                     </div>
                   </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                        Financial Mode Status
                      </label>
                      <select
                        name="paymentType"
                        value={formData.paymentType}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                      >
                        <option>Cash</option>
                        <option>Credit/Insurance</option>
                        <option>Free Service</option>
                      </select>
                      {formData.paymentType === "Credit/Insurance" && (
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                              Insurance / Credit Company
                            </label>
                            <input
                              type="text"
                              name="companyName"
                              value={formData.companyName}
                              onChange={handleInputChange}
                              placeholder="Enter insurance or credit company name"
                              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                              Insurance / Credit Number
                            </label>
                            <input
                              type="text"
                              name="policyNumber"
                              value={formData.policyNumber || ""}
                              onChange={handleInputChange}
                              placeholder="Enter insurance or policy number"
                              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                        System Entry Dynamic Date/Time *
                      </label>
                      <input
                        type="datetime-local"
                        name="registrationTime"
                        value={formData.registrationTime}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                      Primary Chief Complaint Track Summary *
                    </label>
                    <textarea
                      name="chiefComplaint"
                      rows="3"
                      value={formData.chiefComplaint}
                      onChange={handleInputChange}
                      placeholder="Log physiological presentation signs, triage symptoms and critical case history..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium leading-relaxed"
                    ></textarea>
                    {formErrors.chiefComplaint && (
                      <p className="text-[10px] text-rose-600 font-semibold mt-1">
                        {formErrors.chiefComplaint}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab("patientsList")}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                  >
                    Cancel Track
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-600/10 disabled:opacity-50"
                  >
                    {loading
                      ? "Processing Block Transaction..."
                      : isEditing
                        ? "Push Updated State Block"
                        : "Commit New Electronic Registry"}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* VIEWPORT 4: AUDIT ACTIVITY LOG LEDGERS */}
          {activeTab === "receptionAudit" && (
            <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
              <div className="bg-white rounded-3xl p-6 border-b-4 border-rose-500 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-base font-black uppercase tracking-widest text-slate-900">
                    Security Access & Cryptographic Registry Auditor
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Immutable execution monitoring logs recording admissions
                    activity metrics across localized platform node tracks.
                  </p>
                </div>
                <button
                  onClick={loadAuditLogs}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl tracking-wider uppercase transition-all"
                >
                  Force Reset Sync
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 text-[11px] font-black uppercase tracking-wider border-b border-slate-200">
                        <th className="py-4 px-6">Event Timestamp</th>
                        <th className="py-4 px-6">Operator Node Account</th>
                        <th className="py-4 px-6">Operational Action Event</th>
                        <th className="py-4 px-6">Data Scope Vector Target</th>
                        <th className="py-4 px-6">Network Point Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-mono font-medium text-slate-600">
                      {auditLogsLoading ? (
                        <tr>
                          <td
                            colSpan="5"
                            className="py-12 text-center text-slate-400 font-sans"
                          >
                            Syncing security tracking parameters from
                            infrastructure database engine...
                          </td>
                        </tr>
                      ) : auditLogsError ? (
                        <tr>
                          <td
                            colSpan="5"
                            className="py-12 text-center text-rose-500 font-sans font-bold"
                          >
                            {auditLogsError}
                          </td>
                        </tr>
                      ) : auditLogs.length > 0 ? (
                        auditLogs.map((log, index) => (
                          <tr
                            key={index}
                            className="hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="py-4 px-6 text-slate-900 font-bold">
                              {new Date(
                                log.timestamp || log.createdAt,
                              ).toLocaleString()}
                            </td>
                            <td className="py-4 px-6 text-blue-600 font-semibold">
                              {log.operatorEmail ||
                                log.user ||
                                "system-admissions"}
                            </td>
                            <td className="py-4 px-6">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.action?.includes("PUT") || log.action?.includes("UPDATE") ? "bg-amber-50 text-amber-700 border border-amber-200" : log.action?.includes("POST") || log.action?.includes("CREATE") ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-700"}`}
                              >
                                {log.action || "API_TRANSACT"}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-700 font-sans">
                              {log.details ||
                                log.description ||
                                "No target telemetry metadata description tracked."}
                            </td>
                            <td className="py-4 px-6 font-bold text-slate-400">
                              {log.ipAddress || "127.0.0.1"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="5"
                            className="py-12 text-center text-slate-400 font-sans"
                          >
                            No anomalies or historical event nodes logged in the
                            current verification interval frame.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
