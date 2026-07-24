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
  CheckCircle,
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
  Database,
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import {
  logAudit,
  fetchAuditLogs,
  fetchAuditAlertsCount,
} from "../utils/audit";
import NotificationBell from "../components/NotificationBell";

const CHART_COLORS = [
  "#10B981",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
];

export default function PatientManagementSystem({
  onLogout,
  onNavigateToTriage,
}) {
  // --- STATE MANAGEMENT ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [globalBannerMessage, setGlobalBannerMessage] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, patientsList, registerPatient, receptionAudit
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [auditAlertsCount, setAuditAlertsCount] = useState(0);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditLogsError, setAuditLogsError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState([]);

  // Pagination State for Patient Registry Table
  const [currentPage, setCurrentPage] = useState(1);
  const [patientsPerPage] = useState(10);

  // Triage state handling indicators
  const [triageLoading, setTriageLoading] = useState(false);

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

  const triggerSystemBanner = useCallback((msg) => {
    setGlobalBannerMessage(msg);
    setTimeout(() => setGlobalBannerMessage(null), 3000);
  }, []);

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
    const auditInterval = setInterval(loadAuditAlertsCount, 5000);
    return () => clearInterval(auditInterval);
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

  const distributionDataComputed = React.useMemo(() => {
    const counts = {};
    patients.forEach((p) => {
      const key = p.admissionType || "OPD";
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [patients]);

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

  // Reset page layout when querying
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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

  // Dispatch patient metadata into Triage processing lists
  const sendToTriage = async (patientId) => {
    if (!patientId || !selectedPatient) return;

    if (selectedPatient.currentStatus === "Triage") {
      const isConfirmed = window.confirm(
        "this patient is already sent to triage do u want to resend or other",
      );
      if (!isConfirmed) return;
    }

    try {
      setTriageLoading(true);
      const response = await fetch(`${API_URL}/api/patients/${patientId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ currentStatus: "Triage" }),
      });
      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(
          errData.message || "Failed pushing patient to triage line.",
        );
      }

      triggerSystemBanner(
        "SUCCESS: Patient successfully submitted into Triage Monitoring Page.",
      );
      setSelectedPatient(null);
      setActiveTab("patientsList");
    } catch (err) {
      console.error("Error sending to triage:", err);
      triggerSystemBanner(
        `ERROR: ${err.message || "Failed transmission to triage."}`,
      );
    } finally {
      setTriageLoading(false);
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
      patient.cardId?.toLowerCase().includes(query) ||
      fullName.includes(query) ||
      patient.firstName?.toLowerCase().includes(query) ||
      patient.lastName?.toLowerCase().includes(query) ||
      cleanPhone.includes(targetPhoneQuery) ||
      cleanEmergencyPhone.includes(targetPhoneQuery)
    );
  });

  // Calculate Data Pagination Nodes
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(
    indexOfFirstPatient,
    indexOfLastPatient,
  );
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="flex min-h-screen bg-[#050B09] text-white font-sans antialiased text-[10px] selection:bg-[#10B981]/30 selection:text-[#10B981]">
      {globalBannerMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] w-11/12 max-w-2xl bg-[#0E1B17] border-l-4 border-[#10B981] text-[#10B981] px-4 py-2.5 rounded-lg shadow-2xl font-mono flex items-center justify-between animate-slideDown">
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
                Reception Terminal
              </span>
            </div>
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

          <nav className="p-3 space-y-1">
            <div className="text-[8px] font-black uppercase text-[#94A3B8] px-3 py-2 tracking-widest">
              Interface Channels
            </div>

            <button
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
              <span>Dashboard Analytics</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("patientsList");
                setSelectedPatient(null);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold uppercase tracking-wider transition ${
                activeTab === "patientsList"
                  ? "bg-[#10B981] text-white shadow-md font-black"
                  : "text-[#94A3B8] hover:bg-[#0E1B17] hover:text-white"
              }`}
            >
              <Users size={14} />
              <span>Patient Registry Ledger</span>
            </button>

            <button
              onClick={resetToEmptyRegistration}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold uppercase tracking-wider transition ${
                activeTab === "registerPatient"
                  ? "bg-[#10B981] text-white shadow-md font-black"
                  : "text-[#94A3B8] hover:bg-[#0E1B17] hover:text-white"
              }`}
            >
              <UserPlus size={14} />
              <span>Admit New Patient</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("receptionAudit");
                setSelectedPatient(null);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-bold uppercase tracking-wider transition ${
                activeTab === "receptionAudit"
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
              Reception Desk
            </p>
            <p className="text-[#94A3B8] truncate text-[9px] mt-0.5">
              Front Desk Agent
            </p>
          </div>

          <div>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = "/login";
              }}
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
                {activeTab === "dashboard" && "Reception Overview Dashboard"}
                {activeTab === "patientsList" &&
                  "Patient Master Database Registry"}
                {activeTab === "registerPatient" &&
                  (isEditing
                    ? "Modify Patient Profile Details"
                    : "New Patient Intake Admission")}
                {activeTab === "receptionAudit" &&
                  "Internal Security Operations Ledger"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3 font-mono text-[9px]">
            <NotificationBell role="Reception" />
            <div className="bg-[#0E1B17] text-[#10B981] border border-white/20 px-3 py-1 rounded-md font-bold uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-ping" />
              Network State: Connected
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-4 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl flex items-center gap-3 text-[#EF4444] text-xs font-medium">
              <AlertCircle size={16} className="shrink-0 text-[#EF4444]" />
              {error}
            </div>
          )}

          {/* DASHBOARD TAB CONTROLLER VIEW */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0E1B17] border border-white/20 rounded-xl p-5 relative overflow-hidden shadow-sm border-l-4 border-slate-800">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8] font-mono">
                        Total Registered Patients
                      </p>
                      <h3 className="text-2xl font-black text-white mt-1 font-mono">
                        {patients.length}
                      </h3>
                    </div>
                    <div className="p-3 bg-[#0E1B17] text-slate-300 rounded-xl">
                      <Users size={18} />
                    </div>
                  </div>
                </div>

                <div className="bg-[#0E1B17] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                        Today's Intake Stream
                      </p>
                      <h3 className="text-3xl font-black text-white mt-2 font-mono">
                        {
                          patients.filter((p) => {
                            if (!p.registrationTime) return false;
                            const todayStr = new Date()
                              .toISOString()
                              .split("T")[0];
                            return p.registrationTime.startsWith(todayStr);
                          }).length
                        }
                      </h3>
                    </div>
                    <div className="p-3 bg-[#10B981]/10 text-[#10B981] rounded-xl">
                      <TrendingUp size={20} />
                    </div>
                  </div>
                </div>

                <div className="bg-[#0E1B17] border border-white/20 rounded-xl p-5 relative overflow-hidden shadow-sm border-l-4 border-[#EF4444]">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8] font-mono">
                        Emergency Admissions
                      </p>
                      <h3 className="text-2xl font-black text-[#EF4444] mt-1 font-mono">
                        {
                          patients.filter(
                            (p) => p.admissionType === "Emergency",
                          ).length
                        }
                      </h3>
                    </div>
                    <div className="p-3 bg-[#EF4444]/10 text-[#EF4444] rounded-xl shadow-sm">
                      <Heart size={18} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-[#0E1B17] border border-white/10 rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center">
                  <div className="w-full flex justify-between items-center mb-4">
                    <h4 className="font-black text-white uppercase tracking-widest text-xs">
                      Patient Distribution Intelligence
                    </h4>
                    <span className="text-[10px] font-mono font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-1 rounded">
                      Live Automated Sync
                    </span>
                  </div>
                  <div className="h-64 w-full">
                    {distributionDataComputed.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={distributionDataComputed}
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {distributionDataComputed.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-[#94A3B8] font-mono text-xs uppercase">
                        Awaiting intake data...
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full mt-4 pt-4 border-t border-white/10">
                    {distributionDataComputed.map((d, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase"
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              CHART_COLORS[i % CHART_COLORS.length],
                          }}
                        />
                        <span>
                          {d.name}: {d.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#0E1B17] border border-white/10 rounded-2xl p-6">
                  <h4 className="font-bold text-white mb-6">
                    Administrative Shortcuts
                  </h4>
                  <div className="space-y-3">
                    <button
                      onClick={resetToEmptyRegistration}
                      className="w-full flex items-center justify-between p-4 bg-[#0E1B17] hover:bg-[#10B981]/10 border border-white/10 rounded-xl transition text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#10B981]/10 text-[#10B981] rounded-lg group-hover:bg-[#0E1B17] transition-colors">
                          <UserPlus size={16} />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-white uppercase tracking-tight">
                            Launch Register Terminal
                          </p>
                          <p className="text-[10px] text-[#94A3B8] font-mono">
                            Create patient profile logs
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        size={14}
                        className="text-[#94A3B8] group-hover:translate-x-0.5 transition-transform"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PATIENT LIST VIEW - SINGLE LINE ENTRIES WITH CONTROLS AND PAGINATION */}
          {activeTab === "patientsList" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center bg-[#0E1B17] p-4 border border-white/20 rounded-xl shadow-sm">
                <div className="relative flex-1 max-w-md">
                  <Search
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Filter records via card tracking ID, full names, or phone nodes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-1.5 bg-[#0E1B17] text-white placeholder-slate-400 text-[11px] border border-white/20 rounded-lg focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-slate-300"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-[#0E1B17] border border-white/20 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                      <tr className="border-b border-white/10 bg-[#0E1B17]/70 text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                        <th className="py-3 px-4 w-32">Card ID</th>
                        <th className="py-3 px-4 w-48">Patient Name</th>
                        <th className="py-3 px-4 w-20">Age/Sex</th>
                        <th className="py-3 px-4 w-32">Phone Node</th>
                        <th className="py-3 px-4 w-24">Type</th>
                        <th className="py-3 px-4 w-32">Chief Complaint</th>
                        <th className="py-3 px-4 w-24 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs">
                      {currentPatients.length > 0 ? (
                        currentPatients.map((patient) => (
                          <tr
                            key={patient._id}
                            onClick={() => setSelectedPatient(patient)}
                            className={`hover:bg-[#0E1B17] transition-colors cursor-pointer h-10 ${
                              selectedPatient?._id === patient._id
                                ? "bg-[#10B981]/10/50"
                                : "bg-[#0E1B17]"
                            }`}
                          >
                            <td className="py-1 px-4 font-mono font-bold text-white truncate">
                              {patient.cardId || "N/A"}
                            </td>
                            <td className="py-1 px-4 font-semibold text-white truncate">
                              {patient.firstName} {patient.middleName}{" "}
                              {patient.lastName}
                            </td>
                            <td className="py-1 px-4 text-slate-300 truncate">
                              {patient.age} {patient.ageUnit?.charAt(0) || "Y"}{" "}
                              / {patient.gender}
                            </td>
                            <td className="py-1 px-4 text-slate-300 font-mono truncate">
                              {patient.phoneNumber || "None"}
                            </td>
                            <td className="py-1 px-4 truncate">
                              <span
                                className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                                  patient.admissionType === "Emergency"
                                    ? "bg-[#EF4444]/10 text-[#EF4444] border border-rose-100"
                                    : "bg-[#0E1B17] text-slate-200"
                                }`}
                              >
                                {patient.admissionType}
                              </span>
                            </td>
                            <td className="py-1 px-4 text-[#94A3B8] truncate">
                              {patient.chiefComplaint || "No Logged Records"}
                            </td>
                            <td
                              className="py-1 px-4 text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => setSelectedPatient(patient)}
                                className="px-2.5 py-1 text-[10px] font-black text-[#10B981] hover:bg-[#10B981]/10 rounded-lg transition uppercase tracking-widest font-mono"
                              >
                                Manage
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="7"
                            className="py-10 text-center text-[#94A3B8] font-sans"
                          >
                            No matching patient files found within the ledger
                            framework.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Patient Table Pagination Buttons Node */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 bg-[#0E1B17] border-t border-white/10 flex items-center justify-between">
                    <p className="text-xs text-[#94A3B8] font-sans">
                      Showing{" "}
                      <span className="font-bold text-slate-200">
                        {indexOfFirstPatient + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-bold text-slate-200">
                        {indexOfLastPatient > filteredPatients.length
                          ? filteredPatients.length
                          : indexOfLastPatient}
                      </span>{" "}
                      of{" "}
                      <span className="font-bold text-slate-200">
                        {filteredPatients.length}
                      </span>{" "}
                      entries
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 bg-[#0E1B17] text-slate-200 text-xs font-semibold border border-white/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0E1B17] transition"
                      >
                        Previous
                      </button>
                      {[...Array(totalPages)].map((_, index) => (
                        <button
                          key={index + 1}
                          onClick={() => paginate(index + 1)}
                          className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition ${
                            currentPage === index + 1
                              ? "bg-[#10B981] border-emerald-600 text-white"
                              : "bg-[#0E1B17] border-white/20 text-slate-200 hover:bg-[#0E1B17]"
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 bg-[#0E1B17] text-slate-200 text-xs font-semibold border border-white/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0E1B17] transition"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* DETAILED VIEW DRAWER WITH SEND TO TRIAGE TRIGGER BUTTON */}
              {selectedPatient && (
                <div
                  className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050B09]/40 backdrop-blur-sm p-4 overflow-y-auto"
                  onClick={() => setSelectedPatient(null)}
                >
                  <div
                    className="bg-[#0E1B17] border border-white/20 rounded-2xl p-8 relative shadow-2xl animate-pop-in max-w-2xl w-full my-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setSelectedPatient(null)}
                      className="absolute right-6 top-6 text-[#94A3B8] hover:text-[#EF4444] p-2 bg-[#0E1B17] border border-white/10 rounded-xl transition-all"
                    >
                      <X size={18} />
                    </button>

                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6 mb-8">
                      <div>
                        <div className="flex items-center gap-3 font-mono">
                          <h3 className="text-xl font-black text-white uppercase tracking-tight">
                            {selectedPatient.firstName}{" "}
                            {selectedPatient.middleName}{" "}
                            {selectedPatient.lastName}
                          </h3>
                          <span className="font-mono text-xs font-bold bg-[#10B981]/10 border border-[#10B981]/20 px-3 py-1 rounded-lg text-[#10B981]">
                            TOKEN ID: {selectedPatient.cardId || "N/A"}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-widest mt-2">
                          Demographic Matrix: {selectedPatient.age}{" "}
                          {selectedPatient.ageUnit} • {selectedPatient.gender} •{" "}
                          {selectedPatient.maritalStatus || "Unspecified"}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => triggerEditMode(selectedPatient)}
                          className="flex items-center gap-2 px-4 py-2 bg-[#0E1B17] hover:bg-[#0E1B17] border border-white/20 text-slate-200 text-[11px] font-black uppercase rounded-xl transition shadow-sm font-mono"
                        >
                          <Edit2 size={14} /> Modify File
                        </button>

                        <button
                          onClick={() => sendToTriage(selectedPatient._id)}
                          disabled={triageLoading}
                          className="flex items-center gap-2 px-6 py-2 bg-[#10B981] hover:bg-[#0D9668] disabled:opacity-50 text-white text-[11px] font-black uppercase tracking-[0.1em] rounded-xl transition shadow-lg shadow-[#10B981]/20 font-mono"
                        >
                          <Activity size={14} />
                          {triageLoading ? "Transmitting..." : "Send to Triage"}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-[11px] font-sans">
                      <div className="space-y-4">
                        <h5 className="font-black text-[#94A3B8] uppercase tracking-[0.2em] text-[10px] border-b border-white/10 pb-1">
                          Contact Metrics
                        </h5>
                        <div className="space-y-2">
                          <p className="text-white font-mono">
                            <strong className="text-[#94A3B8] uppercase text-[9px] mr-1">
                              Phone:
                            </strong>{" "}
                            {selectedPatient.phoneNumber || "N/A"}
                          </p>
                          <p className="text-white">
                            <strong className="text-[#94A3B8] uppercase text-[9px] mr-1">
                              SubCity/Woreda:
                            </strong>{" "}
                            {selectedPatient.subCity || "N/A"} /{" "}
                            {selectedPatient.woreda || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h5 className="font-black text-[#94A3B8] uppercase tracking-[0.2em] text-[10px] border-b border-white/10 pb-1">
                          Clinical Intake Baseline
                        </h5>
                        <div className="space-y-2">
                          <p className="text-white">
                            <strong className="text-[#94A3B8] uppercase text-[9px] mr-1">
                              Admission Class:
                            </strong>{" "}
                            {selectedPatient.admissionType}
                          </p>
                          <p className="text-white">
                            <strong className="text-[#94A3B8] uppercase text-[9px] mr-1">
                              Chief Complaint:
                            </strong>{" "}
                            {selectedPatient.chiefComplaint || "None"}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h5 className="font-black text-[#94A3B8] uppercase tracking-[0.2em] text-[10px] border-b border-white/10 pb-1">
                          Financials & Origins
                        </h5>
                        <div className="space-y-2">
                          <p className="text-white">
                            <strong className="text-[#94A3B8] uppercase text-[9px] mr-1">
                              Payment Type:
                            </strong>{" "}
                            {selectedPatient.paymentType}{" "}
                            {selectedPatient.companyName
                              ? `(${selectedPatient.companyName})`
                              : ""}
                          </p>
                          <p className="text-white">
                            <strong className="text-[#94A3B8] uppercase text-[9px] mr-1">
                              Reference Route:
                            </strong>{" "}
                            {selectedPatient.referredFrom}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* REGISTER PATIENT FORM CONTROL TAB */}
          {activeTab === "registerPatient" && (
            <form
              onSubmit={handleFormSubmit}
              className="space-y-8 max-w-5xl bg-[#0E1B17] p-8 border border-white/20 rounded-xl shadow-sm"
            >
              <div>
                <h3 className="text-[11px] font-black text-[#10B981] border-b border-[#10B981]/20 pb-2 mb-4 uppercase tracking-[0.2em] font-mono">
                  1. Clinical Identity Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                      Card Tracking ID
                    </label>
                    <input
                      type="text"
                      name="cardId"
                      value={formData.cardId}
                      onChange={handleInputChange}
                      placeholder="Automatic Generation Optional"
                      className="w-full p-2.5 bg-[#0E1B17] border border-white/20 rounded-lg text-[11px] focus:outline-none focus:border-emerald-500 font-mono font-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full p-2.5 bg-[#0E1B17] border rounded-lg text-[11px] focus:outline-none focus:border-emerald-500 font-black uppercase ${formErrors.firstName ? "border-rose-400" : "border-white/20"}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                      Middle Name *
                    </label>
                    <input
                      type="text"
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleInputChange}
                      className={`w-full p-2.5 bg-[#0E1B17] border rounded-lg text-[11px] focus:outline-none focus:border-emerald-500 font-black uppercase ${formErrors.middleName ? "border-rose-400" : "border-white/20"}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full p-2.5 bg-[#0E1B17] border rounded-lg text-[11px] focus:outline-none focus:border-emerald-500 font-black uppercase ${formErrors.lastName ? "border-rose-400" : "border-white/20"}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                        Age Matrix *
                      </label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        className={`w-full p-2.5 bg-[#0E1B17] border rounded-lg text-[11px] focus:outline-none focus:border-emerald-500 font-mono font-black ${formErrors.age ? "border-rose-400" : "border-white/20"}`}
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                        Scale Unit
                      </label>
                      <select
                        name="ageUnit"
                        value={formData.ageUnit}
                        onChange={handleInputChange}
                        className="w-full p-2.5 bg-[#0E1B17] border border-white/20 rounded-lg text-[11px] focus:outline-none focus:border-emerald-500 font-black font-mono"
                      >
                        <option>Years</option>
                        <option>Months</option>
                        <option>Days</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                      Gender Selection *
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className={`w-full p-2.5 bg-[#0E1B17] border rounded-lg text-[11px] focus:outline-none focus:border-emerald-500 font-black font-mono ${formErrors.gender ? "border-rose-400" : "border-white/20"}`}
                    >
                      <option value="">-- Choose --</option>
                      <option>Male</option>
                      <option>Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                      Blood Classification
                    </label>
                    <select
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleInputChange}
                      className="w-full p-2.5 bg-[#0E1B17] border border-white/20 rounded-lg text-[11px] focus:outline-none focus:border-emerald-500 font-mono font-black"
                    >
                      <option value="">Unknown</option>
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
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                      Marital Profiling
                    </label>
                    <select
                      name="maritalStatus"
                      value={formData.maritalStatus}
                      onChange={handleInputChange}
                      className="w-full p-2.5 bg-[#0E1B17] border border-white/20 rounded-lg text-[11px] focus:outline-none focus:border-emerald-500 font-black font-mono"
                    >
                      <option value="">-- Choose --</option>
                      <option>Single</option>
                      <option>Married</option>
                      <option>Divorced</option>
                      <option>Widowed</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-black text-[#10B981] border-b border-[#10B981]/20 pb-2 mb-4 uppercase tracking-[0.2em] font-mono">
                  2. Geo-Location & Contact Parameters
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                      Sub-City Matrix *
                    </label>
                    <input
                      type="text"
                      name="subCity"
                      value={formData.subCity}
                      onChange={handleInputChange}
                      className={`w-full p-2.5 bg-[#0E1B17] border rounded-lg text-[11px] focus:outline-none focus:border-emerald-500 font-black uppercase ${formErrors.subCity ? "border-rose-400" : "border-white/20"}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                      Woreda Allocation *
                    </label>
                    <input
                      type="text"
                      name="woreda"
                      value={formData.woreda}
                      onChange={handleInputChange}
                      className={`w-full p-2.5 bg-[#0E1B17] border rounded-lg text-[11px] focus:outline-none focus:border-emerald-500 font-mono font-black ${formErrors.woreda ? "border-rose-400" : "border-white/20"}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                      House Number
                    </label>
                    <input
                      type="text"
                      name="houseNumber"
                      value={formData.houseNumber}
                      onChange={handleInputChange}
                      className="w-full p-2.5 bg-[#0E1B17] border border-white/20 rounded-lg text-[11px] focus:outline-none focus:border-emerald-500 font-mono font-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                      Primary Phone Node *
                    </label>
                    <input
                      type="text"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="09..."
                      className={`w-full p-2.5 bg-[#0E1B17] border rounded-lg text-[11px] focus:outline-none focus:border-emerald-500 font-mono font-black ${formErrors.phoneNumber ? "border-rose-400" : "border-white/20"}`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-black text-[#10B981] border-b border-[#10B981]/20 pb-2 mb-4 uppercase tracking-[0.2em] font-mono">
                  3. Emergency Contact Node Declarations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                      Contact Full Name *
                    </label>
                    <input
                      type="text"
                      name="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={handleInputChange}
                      className={`w-full p-2.5 bg-[#0E1B17] border rounded-lg text-[11px] focus:outline-none focus:border-emerald-500 font-black uppercase ${formErrors.emergencyContactName ? "border-rose-400" : "border-white/20"}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                      Emergency Contact Phone *
                    </label>
                    <input
                      type="text"
                      name="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={handleInputChange}
                      className={`w-full p-2.5 bg-[#0E1B17] border rounded-lg text-[11px] focus:outline-none focus:border-emerald-500 font-mono font-black ${formErrors.emergencyContactPhone ? "border-rose-400" : "border-white/20"}`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-black text-[#10B981] border-b border-[#10B981]/20 pb-2 mb-4 uppercase tracking-[0.2em] font-mono">
                  4. Institutional Routing & Complaint Baseline
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                      Admission Classification
                    </label>
                    <select
                      name="admissionType"
                      value={formData.admissionType}
                      onChange={handleInputChange}
                      className="w-full p-2.5 bg-[#0E1B17] border border-white/20 rounded-lg text-[11px] focus:outline-none focus:border-emerald-500 font-black uppercase font-mono"
                    >
                      <option>OPD</option>
                      <option>Emergency</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                      Disbursement Layer
                    </label>
                    <select
                      name="paymentType"
                      value={formData.paymentType}
                      onChange={handleInputChange}
                      className="w-full p-2.5 bg-[#0E1B17] border border-white/20 rounded-lg text-[11px] focus:outline-none focus:border-emerald-500 font-black uppercase font-mono"
                    >
                      <option>Cash</option>
                      <option>Credit</option>
                      <option>Insurance Scheme</option>
                    </select>
                  </div>

                  {formData.paymentType !== "Cash" && (
                    <div className="space-y-1.5 animate-fadeIn">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                        Insurance / Company Name
                      </label>
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        placeholder="Payer title..."
                        className="w-full p-2.5 bg-[#0E1B17] border border-white/20 rounded-lg text-[11px] focus:outline-none focus:border-emerald-500 font-black uppercase font-mono"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                      Intake Registration Timestamp *
                    </label>
                    <input
                      type="datetime-local"
                      name="registrationTime"
                      value={formData.registrationTime}
                      onChange={handleInputChange}
                      className={`w-full p-2.5 bg-[#0E1B17] border rounded-lg text-[11px] focus:outline-none focus:border-emerald-500 font-mono font-black ${formErrors.registrationTime ? "border-rose-400" : "border-white/20"}`}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                    Chief Complaint Narrative *
                  </label>
                  <textarea
                    name="chiefComplaint"
                    value={formData.chiefComplaint}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Enter immediate symptoms or reason for visiting clinic..."
                    className={`w-full p-3 bg-[#0E1B17] border rounded-lg text-[11px] focus:outline-none focus:border-emerald-500 font-mono font-black placeholder:font-normal uppercase ${formErrors.chiefComplaint ? "border-rose-400" : "border-white/20"}`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/20">
                <button
                  type="button"
                  onClick={() => setActiveTab("patientsList")}
                  className="px-5 py-2 bg-[#0E1B17] hover:bg-[#0a1f19] text-slate-200 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-[#10B981] hover:bg-[#0D9668] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-lg shadow-md disabled:opacity-50 transition-all font-mono"
                >
                  {loading
                    ? "Processing..."
                    : isEditing
                      ? "Update File"
                      : "Confirm Intake Record"}
                </button>
              </div>
            </form>
          )}

          {/* INTERNAL AUDIT HISTORY VIEW */}
          {activeTab === "receptionAudit" && (
            <div className="space-y-6">
              <div className="bg-[#0E1B17] border border-white/10 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-white">
                    Security Transaction Nodes
                  </h4>
                  <button
                    onClick={loadAuditLogs}
                    disabled={auditLogsLoading}
                    className="p-2 text-[#94A3B8] hover:text-white disabled:opacity-40"
                  >
                    Refresh
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                      <tr className="border-b border-white/20 bg-[#0E1B17] text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                        <th className="py-3 px-6 w-48">Event Code Clock</th>
                        <th className="py-3 px-6 w-32">Identified Core User</th>
                        <th className="py-3 px-6 w-28">Action Verb</th>
                        <th className="py-3 px-6 w-64">
                          Telemetry Narrative Details
                        </th>
                        <th className="py-3 px-6 w-28">Network IP Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {auditLogsLoading ? (
                        <tr>
                          <td
                            colSpan="5"
                            className="py-8 text-center text-[#94A3B8] font-sans"
                          >
                            Extracting live encryption trail matrices...
                          </td>
                        </tr>
                      ) : auditLogsError ? (
                        <tr>
                          <td
                            colSpan="5"
                            className="py-8 text-center text-[#EF4444] font-mono"
                          >
                            {auditLogsError}
                          </td>
                        </tr>
                      ) : auditLogs.length > 0 ? (
                        auditLogs.map((log, idx) => (
                          <tr
                            key={log._id || idx}
                            className="hover:bg-[#0E1B17]/70 transition h-10"
                          >
                            <td className="py-1 px-6 text-[#94A3B8] font-mono truncate">
                              {log.timestamp
                                ? new Date(log.timestamp).toLocaleString()
                                : "RECENT_NODE"}
                            </td>
                            <td className="py-1 px-6 text-white font-semibold truncate">
                              {log.performedBy || "System Agent"}
                            </td>
                            <td className="py-1 px-6 truncate">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                  log.action?.includes("POST") ||
                                  log.action?.includes("CREATE")
                                    ? "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20"
                                    : "bg-[#0E1B17] text-slate-200"
                                }`}
                              >
                                {log.action || "API_TRANSACT"}
                              </span>
                            </td>
                            <td className="py-1 px-6 text-slate-300 truncate">
                              {log.details ||
                                log.description ||
                                "No target telemetry metadata description tracked."}
                            </td>
                            <td className="py-1 px-6 font-bold text-[#94A3B8] font-mono truncate">
                              {log.ipAddress || "127.0.0.1"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="5"
                            className="py-10 text-center text-[#94A3B8] font-sans"
                          >
                            No security verification intervals recorded.
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
