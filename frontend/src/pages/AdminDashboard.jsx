import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  logAudit,
  fetchAuditLogs,
  fetchAuditAlertsCount,
} from "../utils/audit";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import {
  Users,
  ShieldCheck,
  LayoutDashboard,
  Settings,
  Menu,
  UserCog,
  LogOut,
  Phone,
  MapPin,
  Search,
  Plus,
  Edit,
  Trash2,
  Shield,
  Database,
  Bell,
  Lock,
  Activity,
  ArrowRight,
  Beaker,
  ClipboardList,
  Calculator,
  Pill,
  Home,
  X,
  Radio,
  Stethoscope,
  Store,
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  Flame,
  HeartPulse,
  HardDriveDownload,
  RefreshCw,
  Mail,
  Server,
  UserCheck,
  Upload,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  Check,
} from "lucide-react";
import SidebarCollapseButton from "../components/SidebarCollapseButton";
import NotificationBell from "../components/NotificationBell";
import ThemeToggle from "../components/ThemeToggle";

// Palette for chart slices (reused cyclically for categories)
const COLORS = [
  "#10B981",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#F97316",
];

// Sparkline data for stat card background charts (simple daily counts)
const generateSparklineData = () => [
  { day: "Mon", count: 120 },
  { day: "Tue", count: 150 },
  { day: "Wed", count: 180 },
  { day: "Thu", count: 160 },
  { day: "Fri", count: 200 },
  { day: "Sat", count: 140 },
];

const AdminDashboard = ({
  onLogout,
  isMaintenanceMode,
  setIsMaintenanceMode,
  user,
  navigateTo,
}) => {
  const isAdmin = user?.role === "Administrator";
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [globalBannerMessage, setGlobalBannerMessage] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const fileInputRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

  const getAuthHeaders = (isJson = true) => {
    const token = localStorage.getItem("token")?.trim();
    const headers = {};
    if (isJson) headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  const triggerSystemBanner = useCallback((msg) => {
    setGlobalBannerMessage(msg);
    setTimeout(() => setGlobalBannerMessage(null), 3000);
  }, []);

  const statusInstructions = {
    open: {
      title: "Standard Operations",
      description:
        "Portal access is open to all staff. Continue normal workflows and routine care delivery.",
      style: "bg-[#10B981]/10 text-[#94A3B8]",
    },
    emergency: {
      title: "Emergency Protocol",
      description:
        "Emergency mode is active. Staff should focus on urgent cases only and defer non-critical tasks.",
      style: "bg-[#EF4444]/10 text-red-800",
    },
    closed: {
      title: "Maintenance Mode",
      description:
        "Maintenance is engaged. The system is accessible to admin only; staff should follow admin guidance and avoid standard portal use.",
      style: "bg-amber-500/10 text-amber-300",
    },
  };

  // --- CONFIG BRANDING STATES ---
  const [hospitalName, setHospitalName] = useState("Mesra Digital Health");
  const [hospitalEmail, setHospitalEmail] = useState("contact@mesra.com");
  const [hospitalLogo, setHospitalLogo] = useState("/mesra icon.png");
  const [locationName, setLocationName] = useState("Addis Ababa, Ethiopia");
  const [adminPhone, setAdminPhone] = useState("+251 90 007 1103");
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [systemStatus, setSystemStatus] = useState("open");

  const currentStatusInstruction =
    statusInstructions[systemStatus] || statusInstructions["open"];

  useEffect(() => {
    const syncStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/api/system/hospital-status`, {
          headers: getAuthHeaders(false),
        });
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data.status) {
            setSystemStatus(result.data.status);
            setIsMaintenanceMode(result.data.status === "closed");
          }
        }
      } catch (err) {
        console.error("Status sync error:", err);
      }
    };
    syncStatus();
  }, [API_URL, getAuthHeaders]);

  // --- METRICS (Dashboard Architecture) ---
  const [systemHealth, setSystemHealth] = useState("98.4%");
  const [auditAlertsCount, setAuditAlertsCount] = useState(0);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditLogsError, setAuditLogsError] = useState("");
  const [auditLogSearch, setAuditLogSearch] = useState("");
  const [auditLogModule, setAuditLogModule] = useState("");
  const [auditLogPage, setAuditLogPage] = useState(1);
  const [auditLogsMeta, setAuditLogsMeta] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });
  const [deptFilter, setDeptFilter] = useState("all");

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
      const result = await fetchAuditLogs({
        page: auditLogPage,
        limit: 20,
        module: auditLogModule || undefined,
        search: auditLogSearch || undefined,
      });
      setAuditLogs(result.data || []);
      setAuditLogsMeta(result.meta || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      setAuditLogsError(err.message || "Failed to load audit logs");
    } finally {
      setAuditLogsLoading(false);
    }
  }, [auditLogPage, auditLogModule, auditLogSearch]);

  useEffect(() => {
    let interval;
    if (activeTab === "overview") {
      interval = setInterval(loadAuditAlertsCount, 30000);
    }
    return () => clearInterval(interval);
  }, [activeTab, loadAuditAlertsCount]);

  useEffect(() => {
    if (activeTab === "audit") {
      loadAuditAlertsCount();
      loadAuditLogs();
    }
  }, [activeTab, loadAuditLogs, loadAuditAlertsCount]);

  // --- REFRESH UTILITY TIMESTAMPS ---
  const [lastSyncTime, setLastSyncTime] = useState(
    new Date().toLocaleTimeString(),
  );

  // --- PROFILE MANAGEMENT SCREEN SUBSYSTEMS ---
  const [isManagementActive, setIsManagementActive] = useState(false);
  const [managementTargetType, setManagementTargetType] = useState(null); // "staff" | "patient"
  const [selectedProfile, setSelectedProfile] = useState({});
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const [isAdminEditing, setIsAdminEditing] = useState(false);
  const [adminProfile, setAdminProfile] = useState({
    name: "Head Administrator",
    email: "admin@mesra.com",
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordChangeError, setPasswordChangeError] = useState("");
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState("");
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);

  // --- DEPARTMENTS LIST CONFIGURATION ---
  const departments = [
    {
      icon: <Beaker />,
      label: "Laboratory Dashboard",
      sub: "DAILY PATIENTS | PENDING TESTS | INVENTORY",
      color: "emerald",
      type: "clinical",
    },
    {
      icon: <ClipboardList />,
      label: "Ultrasound / Radiology Dashboard",
      sub: "DAILY PATIENTS | IMAGING PROGRESS | REPORTS",
      color: "amber",
      type: "clinical",
    },
    {
      icon: <Calculator />,
      label: "Cashier Dashboard",
      sub: "DAILY PATIENTS | PENDING INVOICES | TOTAL COLLECTION",
      color: "blue",
      type: "operational",
    },
    {
      icon: <Pill />,
      label: "Pharmacy Dashboard",
      sub: "DAILY PATIENTS | PRESCRIPTIONS TO FILL | STOCK ALERTS",
      color: "indigo",
      type: "clinical",
    },
    {
      icon: <Store />,
      label: "Store Dashboard",
      sub: "DAILY PATIENTS | TOTAL INVENTORY VALUE | LOW STOCK",
      color: "slate",
      type: "operational",
    },
    {
      icon: <Home />,
      label: "Ward Dashboard",
      sub: "DAILY PATIENTS | BED OCCUPANCY | ADMISSION FLOW",
      color: "rose",
      type: "clinical",
    },
    {
      icon: <Radio />,
      label: "Reception Dashboard",
      sub: "DAILY PATIENTS | WAITING LIST | QR CODE STATUS",
      color: "blue",
      type: "operational",
    },
    {
      icon: <Stethoscope />,
      label: "Doctor Dashboard",
      sub: "DAILY PATIENTS | PENDING CONSULTATIONS | REMINDERS",
      color: "indigo",
      type: "clinical",
    },
    {
      icon: <HeartPulse />,
      label: "Triage Dashboard",
      sub: "DAILY PATIENTS | QUEUED PATIENTS | WAIT TIMES",
      color: "emerald",
      type: "clinical",
    },
    {
      icon: <HardDriveDownload />,
      label: "Nurse Dashboard",
      sub: "DAILY PATIENTS | IN-PATIENT VITALS | MEDICATION SCHEDULES",
      color: "rose",
      type: "clinical",
    },
  ];

  const roleToDepartments = {
    Doctor: [
      "General Medicine",
      "Emergency",
      "Surgery",
      "Orthopedics",
      "Pediatrics",
      "Obstetrics & Gynecology",
      "ENT (Otolaryngology)",
      "Cardiology",
      "Neurology",
      "Psychiatry",
      "Dermatology",
      "Ophthalmology",
      "Urology",
      "Anesthesiology",
      "Pathology",
      "Radiology",
      "Physiotherapy",
      "Nutrition & Dietetics",
    ],
    Nurse: [
      "General Ward",
      "Emergency",
      "ICU",
      "Pediatrics",
      "Maternity",
      "Operating Room",
      "Outpatient Clinic",
      "Triage",
      "Ward / Inpatient",
    ],
    Triage: ["Triage"],
    Receptionist: ["Reception"],
    Pharmacist: ["Pharmacy"],
    "Pharmacy Cashier": ["Pharmacy"],
    Laboratory: ["Laboratory"],
    "Laboratory Cashier": ["Laboratory"],
    "Store Manager": ["Store / Logistics"],
    "Ward Manager": ["Ward / Inpatient"],
    Radiology: ["Radiology"],
    Administrator: ["Administration"],
  };

  // --- STAFF STATE (Staff_Directory & Professional Profiles) ---
  const [staffList, setStaffList] = useState([]);

  // --- PATIENTS STATE (Keep for profile management, not standalone registry) ---
  const [patientsList, setPatientsList] = useState([]);

  const [isLoading, setIsLoading] = useState(false);

  const normalizeStaff = (staff) => ({
    ...staff,
    id: staff.id || staff._id,
    avatarColor: staff.avatarColor || "bg-[#10B981]",
  });

  const normalizePatient = (patient) => ({
    ...patient,
    id: patient.id || patient._id,
    regDate:
      patient.regDate ||
      patient.createdAt?.slice(0, 10) ||
      new Date().toISOString().split("T")[0],
    contactInfo: patient.contactInfo || "",
    insuranceProvider: patient.insuranceProvider || "",
    policyNumber: patient.policyNumber || "",
    avatarColor: patient.avatarColor || "bg-[#10B981]",
  });

  const fetchStaffData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/staffs`, {
        headers: getAuthHeaders(false),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Unable to load staff data");
      setStaffList(result.data.map(normalizeStaff));
    } catch (error) {
      console.error("Staff fetch error:", error.message);
    } finally {
      setIsLoading(false);
    }
  }, [API_URL]);

  const fetchPatientData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")?.trim();
      if (!token) return;
      const response = await fetch(`${API_URL}/api/patients`, {
        headers: getAuthHeaders(false),
      });
      const result = await response.json();
      if (response.status === 401 || response.status === 403) return;
      if (!response.ok)
        throw new Error(result.message || "Unable to load patient data");
      setPatientsList(result.data.map(normalizePatient));
    } catch (error) {
      console.error("Patient fetch error:", error.message);
    }
  }, [API_URL]);

  // ── Drug interaction cache (safety engine observability) ──────────────
  const [interactionCache, setInteractionCache] = useState(null);
  const [cacheBusy, setCacheBusy] = useState(false);

  const loadInteractionCache = async () => {
    try {
      setCacheBusy(true);
      const response = await fetch(`${API_URL}/api/interactions/cache/stats`, {
        headers: getAuthHeaders(false),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to load cache stats");
      setInteractionCache(result.stats);
    } catch (error) {
      console.error("Interaction cache fetch error:", error.message);
    } finally {
      setCacheBusy(false);
    }
  };

  const clearInteractionCache = async () => {
    try {
      setCacheBusy(true);
      const response = await fetch(`${API_URL}/api/interactions/cache`, {
        method: "DELETE",
        headers: getAuthHeaders(false),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to clear cache");
      setInteractionCache(result.stats);
    } catch (error) {
      console.error("Interaction cache clear error:", error.message);
    } finally {
      setCacheBusy(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchStaffData();
    fetchPatientData();
    const interval = setInterval(fetchPatientData, 5000);
    return () => clearInterval(interval);
  }, [user, fetchStaffData, fetchPatientData]);

  const distributionDataComputed = React.useMemo(() => {
    const counts = {};
    patientsList.forEach((p) => {
      const key = p.admissionType || "OPD";
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [patientsList]);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // REGISTRATION STATE
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    password: "",
    dob: "",
    gender: "Male",
    nationalId: "",
    phone: "",
    emergencyContact: "",
    address: "",
    jobTitle: "Doctor",
    dept: "General Medicine",
    yearsExp: "",
    qualification: "",
    certNo: "",
    contractStatus: "Active",
  });

  const availableDepartments = roleToDepartments[newStaff.jobTitle] || [
    "General",
  ];

  // --- PROFILE MANAGEMENT LOGIC HUB ---
  const launchProfileManagement = (targetProfile, type) => {
    setSelectedProfile({ ...targetProfile });
    setManagementTargetType(type);
    setIsManagementActive(true);
    setIsInlineEditing(false);
  };

  const saveInlineProfileChanges = async () => {
    try {
      const endpoint =
        managementTargetType === "staff"
          ? `${API_URL}/api/staffs/${selectedProfile.id}`
          : `${API_URL}/api/patients/${selectedProfile.id}`;

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: getAuthHeaders(true),
        body: JSON.stringify(selectedProfile),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Unable to save profile");

      const updatedProfile =
        managementTargetType === "staff"
          ? normalizeStaff(result.data)
          : normalizePatient(result.data);

      if (managementTargetType === "staff") {
        setStaffList(
          staffList.map((s) =>
            s.id === updatedProfile.id ? updatedProfile : s,
          ),
        );
      } else {
        setPatientsList(
          patientsList.map((p) =>
            p.id === updatedProfile.id ? updatedProfile : p,
          ),
        );
      }

      setSelectedProfile(updatedProfile);
      setIsInlineEditing(false);
      triggerSystemBanner(
        "SUCCESS: Database Synced. Internal modifications committed permanently.",
      );

      await logAudit({
        action: "UPDATE",
        module: managementTargetType === "staff" ? "Staff" : "Patient",
        targetId: updatedProfile.id,
        targetType:
          managementTargetType === "staff" ? "StaffProfile" : "PatientRecord",
        details: `Updated profile for ${updatedProfile.name || updatedProfile.id}`,
      });
      loadAuditAlertsCount();
    } catch (error) {
      triggerSystemBanner(`ERROR: Save failed: ${error.message}`);
    }
  };

  const toggleStatusActivation = async () => {
    try {
      let targetNewStatus = "";
      let updatePayload = {};
      let auditAction = "";
      let auditModule = "";

      if (managementTargetType === "staff") {
        targetNewStatus =
          selectedProfile.contractStatus === "Active" ? "Inactive" : "Active";
        updatePayload = { contractStatus: targetNewStatus };
        auditAction = targetNewStatus === "Active" ? "ACTIVATE" : "DEACTIVATE";
        auditModule = "Staff";
      } else {
        targetNewStatus =
          selectedProfile.status === "Archived" ? "Admitted" : "Archived";
        updatePayload = { status: targetNewStatus };
        auditAction = targetNewStatus === "Admitted" ? "RESTORE" : "ARCHIVE";
        auditModule = "Patient";
      }

      const endpoint =
        managementTargetType === "staff"
          ? `${API_URL}/api/staffs/${selectedProfile.id}`
          : `${API_URL}/api/patients/${selectedProfile.id}`;

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: getAuthHeaders(true),
        body: JSON.stringify(updatePayload),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Unable to update status");

      const updated =
        managementTargetType === "staff"
          ? normalizeStaff(result.data)
          : normalizePatient(result.data);

      setSelectedProfile(updated);
      if (managementTargetType === "staff") {
        setStaffList(staffList.map((s) => (s.id === updated.id ? updated : s)));
      } else {
        setPatientsList(
          patientsList.map((p) => (p.id === updated.id ? updated : p)),
        );
      }

      await logAudit({
        action: auditAction,
        module: auditModule,
        targetId: updated.id,
        targetType:
          managementTargetType === "staff" ? "StaffProfile" : "PatientRecord",
        details: `Status changed to ${targetNewStatus} for ${updated.name || updated.id}`,
      });
      loadAuditAlertsCount();
    } catch (error) {
      triggerSystemBanner(`ERROR: Status update failed: ${error.message}`);
    }
  };

  const triggerTelemetryRefresh = () => {
    setLastSyncTime(new Date().toLocaleTimeString());
    setSystemHealth((95 + Math.random() * 5).toFixed(1) + "%");
    triggerSystemBanner("SUCCESS: System Core Sync Executed Successfully.");
  };

  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setHospitalLogo(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleStatusChange = async (status) => {
    setSystemStatus(status);
    setIsMaintenanceMode(status === "closed");

    try {
      const response = await fetch(`${API_URL}/api/system/hospital-status`, {
        method: "PUT",
        headers: getAuthHeaders(true),
        body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to update system status");
      }

      await logAudit({
        action: "UPDATE",
        module: "System",
        targetType: "HospitalStatus",
        details: `Hospital status changed to ${status}`,
      });
      loadAuditAlertsCount();
    } catch (err) {
      triggerSystemBanner(`ERROR: Status sync failed: ${err.message}`);
    }
  };

  const getRandomAvatarColor = () => {
    const colors = [
      "bg-[#10B981]",
      "bg-[#EF4444]",
      "bg-[#10B981]",
      "bg-[#10B981]",
      "bg-[#10B981]",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleRegisterSave = async (e) => {
    e.preventDefault();
    const dobYear = new Date(newStaff.dob).getFullYear();
    if (dobYear > 2005) {
      alert(
        "Validation Error: Staff members must have a birth year of 2005 or earlier.",
      );
      return;
    }

    const nextIdNumber = staffList.length + 101;
    const createdStaff = {
      id: `S-${nextIdNumber}`,
      staffId: `STAFF-${nextIdNumber}`,
      profileId: `P-${nextIdNumber + 400}`,
      name: newStaff.name,
      email: newStaff.email,
      password: newStaff.password,
      dob: newStaff.dob,
      gender: newStaff.gender,
      nationalId: newStaff.nationalId || `NID-${nextIdNumber}`,
      phone: newStaff.phone,
      emergencyContact: newStaff.emergencyContact,
      address: newStaff.address,
      jobTitle: newStaff.jobTitle,
      dept: newStaff.dept,
      yearsExp: newStaff.yearsExp,
      qualification: newStaff.qualification,
      certNo: newStaff.certNo,
      certificationNo: `CERT-${nextIdNumber}`,
      hireDate: new Date().toISOString().split("T")[0],
      contractStatus: newStaff.contractStatus,
      avatarColor: getRandomAvatarColor(),
    };

    try {
      const response = await fetch(`${API_URL}/api/staffs`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify(createdStaff),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Unable to create staff record");

      setStaffList([normalizeStaff(result.data), ...staffList]);
      setIsRegModalOpen(false);

      await logAudit({
        action: "CREATE",
        module: "Staff",
        targetId: result.data?.id || result.data?._id || "unknown",
        targetType: "StaffProfile",
        details: `New staff registered: ${createdStaff.name || "Unknown"}`,
      });

      setNewStaff({
        name: "",
        email: "",
        password: "",
        dob: "",
        gender: "Male",
        nationalId: "",
        phone: "",
        emergencyContact: "",
        address: "",
        jobTitle: "Doctor",
        dept: "General Medicine",
        yearsExp: "",
        qualification: "",
        certNo: "",
        contractStatus: "Active",
      });
      setCurrentPage(1);
    } catch (error) {
      triggerSystemBanner(`ERROR: Create staff failed: ${error.message}`);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordChangeError("");
    setPasswordChangeSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordChangeError("All password fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordChangeError("New password and confirmation do not match.");
      return;
    }

    setPasswordChangeLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Unable to update password.");
      }
      setPasswordChangeSuccess(
        result.message || "Password updated successfully.",
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordChangeError(error.message);
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const handleDeptToggle = () => {
    if (deptFilter === "all") setDeptFilter("clinical");
    else if (deptFilter === "clinical") setDeptFilter("operational");
    else setDeptFilter("all");
  };

  const handleDeptClick = (label) => {
    const routes = {
      "Laboratory Dashboard": "laboratory",
      "Ultrasound / Radiology Dashboard": "home",
      "Cashier Dashboard": "home",
      "Pharmacy Dashboard": "pharmacy",
      "Store Dashboard": "storemanagement",
      "Ward Dashboard": "ward",
      "Reception Dashboard": "reception",
      "Doctor Dashboard": "doctor",
      "Triage Dashboard": "triage",
      "Nurse Dashboard": "nurse",
    };
    const route = routes[label];
    if (route && navigateTo) {
      navigateTo(route);
    } else if (!route) {
      alert(`Dashboard route not configured for: ${label}`);
    }
  };

  const currentTabItems = () => {
    if (activeTab === "staff") {
      return staffList.filter(
        (s) =>
          (s.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.id || "").toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    return patientsList.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.id || "").toLowerCase().includes(searchTerm.toLowerCase()),
    );
  };

  const filteredDepts = departments.filter(
    (d) => deptFilter === "all" || d.type === deptFilter,
  );
  const currentFilteredList = currentTabItems();
  const totalPages = Math.ceil(currentFilteredList.length / itemsPerPage) || 1;
  const currentPaginatedItems = currentFilteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

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

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
      `}</style>

      {/* CORPORATE SIDEBAR NAVIGATION - BLUE BLACK THEME */}
      <aside
        className={`${isSidebarOpen ? "w-56" : "w-16 [&_span]:hidden [&_p]:hidden [&_h3]:hidden [&_button]:justify-center [&_button]:text-[0px]"} bg-[#0E1B17] text-slate-300 flex flex-col justify-between shrink-0 fixed top-0 h-screen overflow-hidden z-50 font-mono border-r border-[#0E1B17] transition-all duration-300`}
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
                Admin Master Node
              </span>
            </div>
          </div>

          {/* Sidebar Collapse Control */}
          <SidebarCollapseButton
            collapsed={!isSidebarOpen}
            onToggle={() => setIsSidebarOpen((open) => !open)}
            label="admin sidebar"
          />

          <nav className="p-3 space-y-1">
            <div className="text-[8px] font-black uppercase text-[#94A3B8] px-3 py-2 tracking-widest">
              Interface Channels
            </div>

            <NavItem
              icon={<LayoutDashboard size={18} />}
              label="Dashboard"
              active={activeTab === "overview" && !isManagementActive}
              onClick={() => {
                setActiveTab("overview");
                setIsManagementActive(false);
              }}
            />
            <NavItem
              icon={<Users size={18} />}
              label="Staff Directory"
              active={activeTab === "staff" && !isManagementActive}
              onClick={() => {
                setActiveTab("staff");
                setIsManagementActive(false);
                setSearchTerm("");
                setCurrentPage(1);
              }}
            />
            <NavItem
              icon={<UserCog size={18} />}
              label="Profile"
              active={activeTab === "profile" && !isManagementActive}
              onClick={() => {
                setActiveTab("profile");
                setIsManagementActive(false);
              }}
            />
            <NavItem
              icon={<ClipboardList size={18} />}
              label="Audit Logs"
              active={activeTab === "audit" && !isManagementActive}
              onClick={() => {
                setActiveTab("audit");
                setIsManagementActive(false);
              }}
            />
            <NavItem
              icon={<Settings size={18} />}
              label="Settings"
              active={activeTab === "settings" && !isManagementActive}
              onClick={() => {
                setActiveTab("settings");
                setIsManagementActive(false);
              }}
            />
          </nav>
        </div>

        <div className="p-4 border-t border-[#29323a] bg-[#0E1B17] space-y-4">
          <div className="bg-[#0E1B17] rounded-lg p-2.5 border border-[#0E1B17] text-[10px]">
            <div className="flex items-center gap-1.5 text-[#10B981] font-bold uppercase tracking-wide mb-1">
              <User size={12} /> <span>Operator Account</span>
            </div>
            <p className="text-white truncate font-bold text-[10px]">
              System Admin
            </p>
            <p className="text-[#94A3B8] truncate text-[9px] mt-0.5 uppercase">
              Authority Node
            </p>
          </div>

          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="w-full py-2 bg-[#0E1B17] hover:bg-[#0E1B17] border border-[#0E1B17] text-[#10B981] font-bold uppercase text-[8px] tracking-wider rounded-lg transition flex items-center justify-center gap-1.5"
          >
            <Activity size={13} /> Public Facing Site
          </button>

          <button
            onClick={onLogout}
            className="w-full py-2 bg-[#EF4444]/40 hover:bg-[#b91c1c] border border-[#EF4444]/30 text-[#EF4444] font-bold uppercase text-[8px] tracking-wider rounded-lg transition flex items-center justify-center gap-1.5"
          >
            <LogOut size={13} /> Logout
          </button>
        </div>
      </aside>

      <main
        className={`flex-1 ${isSidebarOpen ? "md:ml-56" : "md:ml-16"} p-4 transition-all duration-300`}
      >
        <header className="mb-4 flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 hover:bg-[#0E1B17] rounded-lg transition-colors text-[#94A3B8]"
          >
            <Menu size={18} />
          </button>
          <NotificationBell role="Admin" />
          <ThemeToggle />
        </header>

        {isManagementActive ? (
          <div className="animate-fade-in-up space-y-4 max-w-4xl mx-auto">
            {/* Nav Header Row */}
            <div className="flex flex-wrap justify-between items-center gap-3 border-b pb-3 border-white/10">
              <button
                onClick={() => setIsManagementActive(false)}
                className="flex items-center gap-2 text-[#94A3B8] hover:text-white font-black text-xs uppercase tracking-widest transition-colors cursor-pointer"
              >
                <ArrowLeft size={16} /> Back
              </button>
              <div className="flex flex-wrap gap-2">
                {isInlineEditing ? (
                  <button
                    onClick={saveInlineProfileChanges}
                    className="bg-[#10B981] text-white px-4 py-2 rounded-lg font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-[#0D9668] cursor-pointer shadow-md"
                  >
                    <Check size={12} /> Save
                  </button>
                ) : (
                  <button
                    onClick={() => setIsInlineEditing(true)}
                    className="bg-[#050B09] text-white px-4 py-2 rounded-lg font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-black cursor-pointer shadow-md"
                  >
                    <Edit size={12} /> Edit
                  </button>
                )}
                <button
                  onClick={toggleStatusActivation}
                  disabled={!selectedProfile}
                  className={`px-4 py-2 rounded-lg font-black text-[11px] uppercase tracking-widest shadow-md transition-all ${!selectedProfile ? "opacity-50 cursor-not-allowed bg-[#0E1B17] text-[#94A3B8]" : (managementTargetType === "staff" ? selectedProfile?.contractStatus === "Active" : selectedProfile?.status !== "Archived") ? "bg-[#EF4444]/10 text-[#EF4444] hover:bg-red-100" : "bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20"}`}
                >
                  {managementTargetType === "staff"
                    ? selectedProfile?.contractStatus === "Active"
                      ? "Inactivate"
                      : "Activate"
                    : selectedProfile?.status !== "Archived"
                      ? "Archive"
                      : "Restore"}
                </button>
              </div>
            </div>

            {/* Dossier Card Sheet Layout */}
            <div className="bg-[#0E1B17] rounded-2xl border border-white/10 p-4 shadow-sm grid md:grid-cols-3 gap-4">
              <div className="text-center md:border-r border-white/10 md:pr-6 flex flex-col justify-center">
                <div
                  className={`w-24 h-24 md:w-28 md:h-28 ${selectedProfile?.avatarColor || "bg-[#10B981]"} rounded-2xl flex items-center justify-center text-white text-4xl font-black mx-auto mb-3 shadow-lg border-4 border-white/20`}
                >
                  {selectedProfile?.name ? selectedProfile.name[0] : ""}
                </div>
                <h2 className="text-lg font-black text-white">
                  {selectedProfile?.name || "—"}
                </h2>
                <p className="text-[11px] font-bold text-[#10B981] uppercase mt-1 tracking-wider">
                  ID: {selectedProfile?.id || "—"}
                </p>
                <div className="mt-3">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${(managementTargetType === "staff" ? selectedProfile?.contractStatus === "Active" : selectedProfile?.status !== "Archived") ? "bg-[#10B981]/20 text-[#10B981]" : "bg-[#0E1B17] text-[#94A3B8]"}`}
                  >
                    {managementTargetType === "staff"
                      ? selectedProfile?.contractStatus || "—"
                      : selectedProfile?.status || "—"}
                  </span>
                </div>
              </div>

              <div className="md:col-span-2 space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#94A3B8] border-b pb-1">
                  Relational Database Metadata Dossier
                </h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <ManageFieldItem
                    label="Full Name"
                    value={selectedProfile?.name || ""}
                    isEdit={isInlineEditing}
                    onChange={(val) =>
                      setSelectedProfile({
                        ...(selectedProfile || {}),
                        name: val,
                      })
                    }
                  />
                  <ManageFieldItem
                    label="Date of Birth"
                    value={selectedProfile?.dob || ""}
                    isEdit={isInlineEditing}
                    onChange={(val) =>
                      setSelectedProfile({
                        ...(selectedProfile || {}),
                        dob: val,
                      })
                    }
                  />
                  <ManageFieldItem
                    label="Gender"
                    value={selectedProfile?.gender || ""}
                    isEdit={isInlineEditing}
                    onChange={(val) =>
                      setSelectedProfile({
                        ...(selectedProfile || {}),
                        gender: val,
                      })
                    }
                  />

                  {managementTargetType === "staff" ? (
                    <>
                      <ManageFieldItem
                        label="National ID Key"
                        value={selectedProfile?.nationalId || ""}
                        isEdit={isInlineEditing}
                        onChange={(val) =>
                          setSelectedProfile({
                            ...(selectedProfile || {}),
                            nationalId: val,
                          })
                        }
                      />
                      <ManageFieldItem
                        label="Contact Line"
                        value={selectedProfile?.phone || ""}
                        isEdit={isInlineEditing}
                        onChange={(val) =>
                          setSelectedProfile({
                            ...(selectedProfile || {}),
                            phone: val,
                          })
                        }
                      />
                      <ManageFieldItem
                        label="Emergency Backup Link"
                        value={selectedProfile?.emergencyContact || ""}
                        isEdit={isInlineEditing}
                        onChange={(val) =>
                          setSelectedProfile({
                            ...(selectedProfile || {}),
                            emergencyContact: val,
                          })
                        }
                      />
                      <ManageFieldItem
                        label="Assigned Title"
                        value={selectedProfile?.jobTitle || ""}
                        isEdit={isInlineEditing}
                        onChange={(val) =>
                          setSelectedProfile({
                            ...(selectedProfile || {}),
                            jobTitle: val,
                          })
                        }
                      />
                      <ManageFieldItem
                        label="Operational Department"
                        value={selectedProfile?.dept || ""}
                        isEdit={isInlineEditing}
                        onChange={(val) =>
                          setSelectedProfile({
                            ...(selectedProfile || {}),
                            dept: val,
                          })
                        }
                      />
                      <ManageFieldItem
                        label="Professional Qualification"
                        value={selectedProfile?.qualification || ""}
                        isEdit={isInlineEditing}
                        onChange={(val) =>
                          setSelectedProfile({
                            ...(selectedProfile || {}),
                            qualification: val,
                          })
                        }
                      />
                      <ManageFieldItem
                        label="MOH Certification Identity"
                        value={selectedProfile?.certNo || ""}
                        isEdit={isInlineEditing}
                        onChange={(val) =>
                          setSelectedProfile({
                            ...(selectedProfile || {}),
                            certNo: val,
                          })
                        }
                      />
                    </>
                  ) : (
                    <>
                      <ManageFieldItem
                        label="Contact Line"
                        value={selectedProfile?.contactInfo || ""}
                        isEdit={isInlineEditing}
                        onChange={(val) =>
                          setSelectedProfile({
                            ...(selectedProfile || {}),
                            contactInfo: val,
                          })
                        }
                      />
                      <ManageFieldItem
                        label="System Registration Timestamp"
                        value={selectedProfile?.regDate || ""}
                        isEdit={isInlineEditing}
                        onChange={(val) =>
                          setSelectedProfile({
                            ...(selectedProfile || {}),
                            regDate: val,
                          })
                        }
                      />
                      <ManageFieldItem
                        label="Insurance Policy Provider"
                        value={selectedProfile?.insuranceProvider || ""}
                        isEdit={isInlineEditing}
                        onChange={(val) =>
                          setSelectedProfile({
                            ...(selectedProfile || {}),
                            insuranceProvider: val,
                          })
                        }
                      />
                      <ManageFieldItem
                        label="Policy Claim Account No"
                        value={selectedProfile?.policyNumber || ""}
                        isEdit={isInlineEditing}
                        onChange={(val) =>
                          setSelectedProfile({
                            ...(selectedProfile || {}),
                            policyNumber: val,
                          })
                        }
                      />
                    </>
                  )}
                  <div className="col-span-2">
                    <ManageFieldItem
                      label="Home Residence Address"
                      value={selectedProfile.address || "Addis Ababa, Ethiopia"}
                      isEdit={isInlineEditing}
                      onChange={(val) =>
                        setSelectedProfile({
                          ...(selectedProfile || {}),
                          address: val,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* TAB 1: OVERVIEW HUB */}
            {activeTab === "overview" && (
              <div className="space-y-8 animate-fade-in-up">
                {systemStatus === "emergency" /* Emergency Banner */ && (
                  <div className="bg-[#EF4444] text-white font-black uppercase text-xs tracking-widest p-4 rounded-2xl flex items-center gap-3 animate-pulse">
                    <Flame size={14} /> Critical Alert: System running on
                    Emergency Protocol mode. High-Risk Triage routing active.
                  </div>
                )}

                {systemStatus === "closed" /* Maintenance Banner */ && (
                  <div className="bg-amber-500 text-white font-black uppercase text-xs tracking-widest p-4 rounded-2xl flex items-center gap-3">
                    <AlertCircle size={14} /> Notice: Infrastructure Maintenance
                    Window Engaged. Public portal lines disconnected.
                  </div>
                )}

                <header className="bg-[#0E1B17] p-5 rounded-[2.5rem] border border-white/10 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-[#10B981] rounded-3xl overflow-hidden flex items-center justify-center text-white text-3xl font-black">
                      {hospitalLogo === "/mesra icon.png" ? (
                        hospitalName[0]
                      ) : (
                        <img
                          src={hospitalLogo}
                          className="w-full h-full object-cover"
                          alt="Branding Hub"
                        />
                      )}
                    </div>
                    <div>
                      <h1 className="text-2xl font-black text-white">
                        {hospitalName}
                      </h1>
                      <div className="flex flex-wrap gap-3 mt-1 items-center text-[#94A3B8] text-[9px] font-bold">
                        <span className="bg-[#10B981]/10 px-3 py-1 rounded-lg text-[#10B981] uppercase">
                          Head Administrator
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone size={12} className="text-[#10B981]" />{" "}
                          {adminPhone}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-[#10B981]" />{" "}
                          {locationName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0E1B17] p-2.5 rounded-2xl border border-white/10 flex gap-1.5">
                    <StatusButton
                      current={systemStatus}
                      type="open"
                      onClick={() => handleStatusChange("open")}
                      label="Open"
                      activeColor="bg-[#10B981] text-white"
                      icon={<CheckCircle2 size={14} />}
                    />
                    <StatusButton
                      current={systemStatus}
                      type="emergency"
                      onClick={() => handleStatusChange("emergency")}
                      label="Emergency"
                      activeColor="bg-[#EF4444] text-white"
                      icon={<Flame size={14} />}
                    />
                    <StatusButton
                      current={systemStatus}
                      type="closed"
                      onClick={() => handleStatusChange("closed")}
                      label="Maintenance"
                      activeColor="bg-amber-500 text-white"
                      icon={<AlertCircle size={14} />}
                    />
                  </div>
                </header>

                <div
                  className={`bg-[#0E1B17] p-6 rounded-[2.5rem] border border-white/10 shadow-sm mt-6 ${currentStatusInstruction.style}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-black uppercase tracking-widest">
                      {currentStatusInstruction.title}
                    </span>
                  </div>
                  <p className="text-sm font-bold leading-6">
                    {currentStatusInstruction.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCardGraph
                    label="Total Staff"
                    value={staffList.length}
                    color="#3B82F6"
                    bgColor="bg-[#10B981]/10/50"
                    onAnchorAction={() => setActiveTab("staff")}
                  />
                  <StatCardGraph
                    label="System Health"
                    value={systemHealth}
                    color="#F59E0B"
                    bgColor="bg-amber-500/10"
                    onAnchorAction={() => setActiveTab("settings")}
                  />
                  <StatCardGraph
                    label="Audit Alerts"
                    value={auditAlertsCount}
                    color="#EF4444"
                    bgColor="bg-[#EF4444]/10/50"
                    onAnchorAction={() => setActiveTab("audit")}
                  />
                </div>

                {/* Drug interaction safety cache */}
                <div className="bg-[#0E1B17] p-6 rounded-[2.5rem] border border-white/10 shadow-sm mt-6">
                  <div className="flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck size={16} className="text-[#10B981]" />
                        Drug Interaction Cache
                      </h3>
                      <p className="text-[10px] text-[#94A3B8] font-bold mt-1">
                        Prescription safety checks are cached per drug set.
                        {interactionCache
                          ? ` ${interactionCache.size} entries · ${interactionCache.hits} hits / ${interactionCache.misses} misses · ${interactionCache.openfdaFailures} openFDA failures.`
                          : " Load the statistics to inspect the cache."}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={loadInteractionCache}
                        disabled={cacheBusy}
                        className="px-4 py-2 rounded-xl bg-[#0E1B17] border border-white/10 text-[#94A3B8] text-[10px] font-black uppercase tracking-wider hover:text-white disabled:opacity-50 cursor-pointer"
                      >
                        {cacheBusy ? "Working..." : "Cache statistics"}
                      </button>
                      <button
                        onClick={clearInteractionCache}
                        disabled={cacheBusy}
                        className="px-4 py-2 rounded-xl bg-[#EF4444]/20 border border-[#EF4444]/40 text-[#EF4444] text-[10px] font-black uppercase tracking-wider hover:bg-[#EF4444]/30 disabled:opacity-50 cursor-pointer"
                      >
                        Clear cache
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-[#0E1B17] p-10 rounded-[3rem] border border-white/10 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-black">
                        Department Dashboards
                      </h3>
                      <button
                        onClick={handleDeptToggle}
                        className="text-xs bg-[#0E1B17] px-4 py-2 rounded-xl text-[#94A3B8] font-black uppercase tracking-wider border border-white/10 cursor-pointer"
                      >
                        Toggle Filter
                      </button>
                    </div>
                    <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2 custom-scrollbar">
                      {filteredDepts.map((dept, idx) => (
                        <DeptCard
                          key={idx}
                          icon={dept.icon}
                          label={dept.label}
                          sub={dept.sub}
                          color={dept.color}
                          onClick={() => handleDeptClick(dept.label)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#0E1B17] p-10 rounded-[3rem] border border-white/10 shadow-sm flex flex-col justify-between items-center text-center h-full min-h-[400px]">
                    <h3 className="text-sm font-black uppercase text-[#94A3B8] tracking-widest w-full">
                      Patient Distribution
                    </h3>
                    <div className="h-64 w-full flex items-center justify-center">
                      {distributionDataComputed.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={distributionDataComputed}
                              innerRadius={65}
                              outerRadius={90}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {distributionDataComputed.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-sm text-[#94A3B8] font-bold">
                            No patient distribution data available
                          </div>
                        </div>
                      )}
                    </div>
                    {distributionDataComputed.length > 0 && (
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-left mt-6 w-full px-4 border-t pt-6 border-white/10">
                        {distributionDataComputed.map((d, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-xs font-bold text-slate-300"
                          >
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{
                                backgroundColor: COLORS[i % COLORS.length],
                              }}
                            />
                            <span>
                              {d.name}: {d.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: STAFF DIRECTORY */}
            {activeTab === "staff" && (
              <div className="animate-fade-in-up space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <h1 className="text-4xl font-black text-white italic">
                      Staff Management
                    </h1>
                    <p className="text-[#94A3B8] font-medium mt-1">
                      Total Profiles: {staffList.length}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsRegModalOpen(true)}
                    className="bg-[#10B981] text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-[#0D9668] cursor-pointer"
                  >
                    <Plus size={18} /> Register Profile
                  </button>
                </div>

                <div className="bg-[#0E1B17] rounded-xl border border-white/10 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-white/10 flex items-center gap-4 bg-[#0E1B17]/30">
                    <Search className="text-slate-300" size={20} />
                    <input
                      type="text"
                      placeholder="Search staff members..."
                      className="bg-transparent border-none outline-none font-bold text-sm w-full"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[1000px]">
                      <thead>
                        <tr className="text-[9px] font-black uppercase text-[#94A3B8] border-b tracking-widest bg-[#0E1B17]/50">
                          <th className="p-2 px-4">Staff Profile</th>
                          <th className="p-2 px-4">Title & Dept</th>
                          <th className="p-2 px-4">Contact Line</th>
                          <th className="p-2 px-4">Contract Status</th>
                          <th className="p-2 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm font-bold text-slate-300">
                        {currentPaginatedItems.map((staff) => (
                          <tr
                            key={staff.id}
                            className="border-b border-white/10 hover:bg-[#0E1B17]/50 transition-colors"
                          >
                            <td className="p-1 px-4 flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-xl ${staff.avatarColor} text-white font-black flex items-center justify-center text-xs shadow-sm`}
                              >
                                {staff.name[0]}
                              </div>
                              <div>
                                <span className="text-white block font-black">
                                  {staff.name}
                                </span>
                                <span className="text-[10px] text-[#10B981] font-bold uppercase tracking-wider">
                                  {staff.id}
                                </span>
                                {staff.staffId && (
                                  <span className="block text-[9px] text-[#94A3B8] font-mono font-normal">
                                    Staff ID: {staff.staffId}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-1 px-4">
                              <span className="text-white block text-xs uppercase">
                                {staff.jobTitle}
                              </span>
                              <span className="text-[9px] text-[#94A3B8] block font-normal">
                                {staff.dept}
                              </span>
                            </td>
                            <td className="p-1 px-4 font-mono text-xs text-[#94A3B8]">
                              {staff.phone}
                            </td>
                            <td className="p-1 px-4">
                              <span
                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${staff.contractStatus === "Active" ? "bg-[#10B981]/20 text-[#10B981]" : "bg-[#0E1B17] text-[#94A3B8]"}`}
                              >
                                {staff.contractStatus}
                              </span>
                            </td>
                            <td className="p-1 px-6 text-right">
                              <button
                                onClick={() =>
                                  launchProfileManagement(staff, "staff")
                                }
                                className="px-4 py-2 bg-[#0E1B17] border border-white/10 text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#10B981] hover:text-white ml-auto transition-all cursor-pointer shadow-sm"
                              >
                                <Eye size={12} /> Manage Profile
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <PaginationBar
                    current={currentPage}
                    total={totalPages}
                    onPrev={() => setCurrentPage((p) => p - 1)}
                    onNext={() => setCurrentPage((p) => p + 1)}
                  />
                </div>
              </div>
            )}

            {/* TAB 3: PATIENT REGISTRY */}
            {activeTab === "patients" && (
              <div className="animate-fade-in-up space-y-6">
                <div>
                  <h1 className="text-4xl font-black text-white italic">
                    Patient Registry
                  </h1>
                  <p className="text-[#94A3B8] font-medium mt-1">
                    Total Active Records: {patientsList.length}
                  </p>
                </div>

                <div className="bg-[#0E1B17] rounded-xl border border-white/10 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-white/10 flex items-center gap-4 bg-[#0E1B17]/30">
                    <Search className="text-slate-300" size={20} />
                    <input
                      type="text"
                      placeholder="Search records by Patient Name or ID..."
                      className="bg-transparent border-none outline-none font-bold text-sm w-full"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[1000px]">
                      <thead>
                        <tr className="text-[10px] font-black uppercase text-[#94A3B8] border-b tracking-widest">
                          <th className="p-6">Patient Profile</th>
                          <th className="p-6">Contact Line</th>
                          <th className="p-6">Registration Date</th>
                          <th className="p-6">Insurance Carrier</th>
                          <th className="p-6">Triage Status</th>
                          <th className="p-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm font-bold text-slate-300">
                        {currentPaginatedItems.map((patient) => (
                          <tr
                            key={patient.id}
                            className="border-b border-white/10 hover:bg-[#0E1B17]/50 transition-colors"
                          >
                            <td className="p-6 flex items-center gap-4">
                              <div
                                className={`w-10 h-10 rounded-xl ${patient.avatarColor} text-white font-black flex items-center justify-center text-xs shadow-sm`}
                              >
                                {patient.name[0]}
                              </div>
                              <div>
                                <span className="text-white block font-black">
                                  {patient.name}
                                </span>
                                <span className="text-[10px] text-[#10B981] font-bold uppercase tracking-wider">
                                  {patient.id}
                                </span>
                              </div>
                            </td>
                            <td className="p-6 font-mono text-xs text-[#94A3B8]">
                              {patient.contactInfo}
                            </td>
                            <td className="p-6 font-mono text-xs text-[#94A3B8]">
                              {patient.regDate}
                            </td>
                            <td className="p-6 text-xs uppercase opacity-80">
                              {patient.insuranceProvider}
                            </td>
                            <td className="p-6">
                              <span
                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${patient.status === "Admitted" ? "bg-[#10B981]/10 text-[#10B981]" : patient.status === "Triage Queue" ? "bg-amber-500/20 text-amber-300" : "bg-[#0E1B17] text-[#94A3B8]"}`}
                              >
                                {patient.status}
                              </span>
                            </td>
                            <td className="p-6 text-right">
                              <button
                                onClick={() =>
                                  launchProfileManagement(patient, "patient")
                                }
                                className="px-4 py-2 bg-[#0E1B17] border border-white/10 text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#10B981] hover:text-white ml-auto transition-all cursor-pointer shadow-sm"
                              >
                                <Eye size={12} /> Manage Dossier
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <PaginationBar
                    current={currentPage}
                    total={totalPages}
                    onPrev={() => setCurrentPage((p) => p - 1)}
                    onNext={() => setCurrentPage((p) => p + 1)}
                  />
                </div>
              </div>
            )}

            {/* TAB 4: PROFILE */}
            {activeTab === "profile" && (
              <div className="max-w-4xl mx-auto animate-fade-in-up">
                <h1 className="text-4xl font-black text-white italic mb-8">
                  Admin Identity
                </h1>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="bg-[#0E1B17] p-8 rounded-[3rem] border border-white/10 shadow-sm text-center">
                    <div className="w-32 h-32 bg-[#10B981] rounded-[2.5rem] flex items-center justify-center text-white text-5xl font-black mx-auto mb-6 shadow-xl shadow-[#10B981]/20">
                      M
                    </div>
                    <h3 className="text-xl font-black text-white">
                      Admin Account
                    </h3>
                    <p className="text-xs font-black text-[#10B981] uppercase tracking-widest mt-2">
                      Level 1 Authority
                    </p>
                  </div>
                  <div className="md:col-span-2 bg-[#0E1B17] p-10 rounded-[3rem] border border-white/10 shadow-sm space-y-6">
                    <ProfileField
                      label="Full Name"
                      value="Head Administrator"
                    />
                    <ProfileField
                      label="Identity/Email"
                      value="admin@mesra.com"
                    />
                    <ProfileField label="Assigned Phone" value={adminPhone} />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: AUDIT LOGS */}
            {activeTab === "audit" && (
              <div className="animate-fade-in-up space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <h1 className="text-4xl font-black text-white italic">
                      Audit Logs
                    </h1>
                    <p className="text-[#94A3B8] font-medium mt-1">
                      System-wide change history
                    </p>
                  </div>
                </div>

                <div className="bg-[#0E1B17] rounded-[2.5rem] border border-white/10 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-white/10 flex items-center gap-4 bg-[#0E1B17]/30">
                    <Search className="text-slate-300" size={20} />
                    <input
                      type="text"
                      placeholder="Search logs by user, action, or target..."
                      className="bg-transparent border-none outline-none font-bold text-sm w-full"
                      value={auditLogSearch}
                      onChange={(e) => {
                        setAuditLogSearch(e.target.value);
                        setAuditLogPage(1);
                      }}
                    />
                  </div>

                  {auditLogsLoading ? (
                    <div className="p-8 text-center text-xs font-black text-[#94A3B8] uppercase tracking-widest">
                      Loading audit logs...
                    </div>
                  ) : auditLogsError ? (
                    <div className="p-8 text-center text-xs font-black text-[#EF4444] uppercase tracking-widest">
                      {auditLogsError}
                    </div>
                  ) : auditLogs.length === 0 ? (
                    <div className="p-8 text-center text-xs font-black text-[#94A3B8] uppercase tracking-widest">
                      No audit logs found
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[1000px]">
                        <thead>
                          <tr className="text-[9px] font-black uppercase text-[#94A3B8] border-b tracking-widest bg-[#0E1B17]/50">
                            <th className="p-2 px-6">Action</th>
                            <th className="p-2 px-6">Module</th>
                            <th className="p-2 px-6">User</th>
                            <th className="p-2 px-6">Target</th>
                            <th className="p-2 px-6">Department</th>
                            <th className="p-2 px-6">Details</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm font-bold text-slate-300">
                          {auditLogs.map((log) => (
                            <tr
                              key={log._id}
                              className="border-b border-white/10 hover:bg-[#0E1B17]/50 transition-colors"
                            >
                              <td className="p-1 px-6">
                                <span className="text-white block font-black">
                                  {log.action}
                                </span>
                                <span className="text-[10px] text-[#94A3B8] font-mono block">
                                  {new Date(log.createdAt).toLocaleString()}
                                </span>
                              </td>
                              <td className="p-1 px-6 text-white text-[10px] uppercase">
                                {log.module}
                              </td>
                              <td className="p-1 px-6">
                                <span className="text-white block">
                                  {log.userName}
                                </span>
                                <span className="text-[9px] text-[#94A3B8] block font-normal">
                                  {log.userRole}
                                </span>
                              </td>
                              <td className="p-1 px-6 text-[#94A3B8] text-[10px] font-mono">
                                {log.targetId || "—"}
                              </td>
                              <td className="p-1 px-6 text-[#94A3B8] text-[10px] uppercase">
                                {log.department || "—"}
                              </td>
                              <td className="p-1 px-6 text-[#94A3B8] text-[10px] max-w-[320px] truncate">
                                {log.details || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="p-4 border-t border-white/10 flex justify-between items-center">
                    <span className="text-[10px] text-[#94A3B8] font-black uppercase tracking-wider">
                      Page {auditLogsMeta.page} of {auditLogsMeta.pages} • Total{" "}
                      {auditLogsMeta.total}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setAuditLogPage((p) => Math.max(1, p - 1))
                        }
                        disabled={auditLogsMeta.page <= 1}
                        className="px-4 py-2 bg-[#0E1B17] border border-white/10 text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#0E1B17] disabled:opacity-50"
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuditLogPage((p) => p + 1)}
                        disabled={auditLogsMeta.page >= auditLogsMeta.pages}
                        className="px-4 py-2 bg-[#050B09] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#0E1B17] disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: SETTINGS */}
            {activeTab === "settings" && (
              <div className="max-w-4xl mx-auto animate-fade-in-up space-y-8">
                <h1 className="text-4xl font-black text-white italic">
                  System Configuration
                </h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#0E1B17] p-8 rounded-[2.5rem] border border-white/10 shadow-sm space-y-4">
                    <h3 className="text-xs font-black uppercase text-[#94A3B8] tracking-widest flex items-center gap-2">
                      <RefreshCw size={14} className="text-[#10B981]" /> Hospital
                      Branding
                    </h3>
                    <div
                      onClick={() => fileInputRef.current.click()}
                      className="p-6 border-2 border-dashed border-white/20 rounded-[2rem] flex flex-col items-center gap-2 cursor-pointer hover:bg-[#0E1B17] hover:border-[#10B981] transition-all group"
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleLogoChange}
                      />
                      {hospitalLogo === "/mesra icon.png" ? (
                        <Upload
                          size={18}
                          className="text-[#94A3B8] group-hover:scale-110 transition-transform"
                        />
                      ) : (
                        <img
                          src={hospitalLogo}
                          className="w-10 h-10 object-contain rounded-lg shadow-sm"
                          alt="Logo"
                        />
                      )}
                      <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wide">
                        Change Active System Logo Asset
                      </p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-[#94A3B8] uppercase ml-1">
                        Entity Name
                      </label>
                      <input
                        type="text"
                        className="w-full p-3 bg-[#0E1B17] border border-white/10 rounded-xl font-bold mt-1 text-xs outline-none focus:border-[#10B981]"
                        value={hospitalName}
                        onChange={(e) => setHospitalName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-[#94A3B8] uppercase ml-1 flex items-center gap-1">
                        <Mail size={10} /> Central System Email
                      </label>
                      <input
                        type="email"
                        className="w-full p-3 bg-[#0E1B17] border border-white/10 rounded-xl font-bold mt-1 text-xs outline-none focus:border-[#10B981]"
                        value={hospitalEmail}
                        onChange={(e) => setHospitalEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-[#94A3B8] uppercase ml-1">
                        Regional Coordinates
                      </label>
                      <input
                        type="text"
                        className="w-full p-3 bg-[#0E1B17] border border-white/10 rounded-xl font-bold mt-1 text-xs outline-none focus:border-[#10B981]"
                        value={locationName}
                        onChange={(e) => setLocationName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-[#0E1B17] p-8 rounded-[2.5rem] border border-white/10 shadow-sm space-y-4">
                      <h3 className="text-xs font-black uppercase text-[#94A3B8] tracking-widest flex items-center gap-2">
                        <Server size={14} className="text-[#10B981]" /> Telemetry
                        Monitor & Health Logs
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#0E1B17] p-4 rounded-xl border border-white/10">
                          <span className="text-[10px] text-[#94A3B8] font-black uppercase block">
                            Live Node Health
                          </span>
                          <input
                            type="text"
                            className="text-lg font-black bg-transparent border-none outline-none mt-1 w-full text-[#10B981]"
                            value={systemHealth}
                            onChange={(e) => setSystemHealth(e.target.value)}
                          />
                        </div>
                        <div className="bg-[#0E1B17] p-4 rounded-xl border border-white/10">
                          <span className="text-[10px] text-[#94A3B8] font-black uppercase block">
                            Active Audit Faults
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg font-black text-[#EF4444]">
                              {auditAlertsCount}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={triggerTelemetryRefresh}
                        className="w-full py-3.5 bg-[#050B09] hover:bg-[#0E1B17] text-white font-black uppercase text-[10px] tracking-widest rounded-xl flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-md"
                      >
                        <RefreshCw size={12} /> Run Framework Cache Refresh
                      </button>
                      <p className="text-center text-[9px] text-[#94A3B8] font-bold uppercase tracking-wider">
                        Last Dashboard Synchronization: {lastSyncTime}
                      </p>
                    </div>

                    <div className="bg-[#0E1B17] p-8 rounded-[2.5rem] border border-white/10 shadow-sm space-y-4">
                      <h3 className="text-xs font-black uppercase text-[#94A3B8] tracking-widest flex items-center gap-2">
                        <Lock size={14} className="text-[#10B981]" /> Credential
                        Management
                      </h3>
                      <p className="text-sm text-[#94A3B8]">
                        Update your administrator password securely. Staff users
                        can also use the pharmacy dashboard to update their own
                        password.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsChangePasswordOpen(true)}
                        className="w-full py-4 rounded-2xl bg-[#10B981] text-white font-black uppercase tracking-widest hover:bg-[#0D9668] transition-all"
                      >
                        Change Password
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* PASSWORD CHANGE MODAL */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050B09]/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0E1B17] w-full max-w-2xl rounded-[2.5rem] p-8 animate-pop-in border border-white/10 shadow-2xl relative my-auto">
            <button
              onClick={() => setIsChangePasswordOpen(false)}
              className="absolute top-6 right-6 text-[#94A3B8] hover:text-[#EF4444]"
            >
              <X size={20} />
            </button>
            <h3 className="text-2xl font-black italic mb-2">Change Password</h3>
            <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wide mb-6">
              Use a secure, professional password for your account.
            </p>

            {passwordChangeError && (
              <div className="mb-4 rounded-3xl border border-red-100 bg-[#EF4444]/10 p-4 text-sm text-[#EF4444]">
                {passwordChangeError}
              </div>
            )}
            {passwordChangeSuccess && (
              <div className="mb-4 rounded-3xl border border-[#10B981]/20 bg-[#10B981]/10 p-4 text-sm text-[#10B981]">
                {passwordChangeSuccess}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-[#94A3B8] uppercase ml-1">
                  Current Password
                </label>
                <input
                  type="password"
                  className="w-full p-3 bg-[#0E1B17] border border-white/10 rounded-xl font-bold mt-1 text-xs outline-none"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-[#94A3B8] uppercase ml-1">
                  New Password
                </label>
                <input
                  type="password"
                  className="w-full p-3 bg-[#0E1B17] border border-white/10 rounded-xl font-bold mt-1 text-xs outline-none"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-[#94A3B8] uppercase ml-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className="w-full p-3 bg-[#0E1B17] border border-white/10 rounded-xl font-bold mt-1 text-xs outline-none"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="flex-1 py-4 bg-[#0E1B17] text-[#94A3B8] rounded-2xl font-black uppercase text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordChangeLoading}
                  className="flex-1 py-4 bg-[#10B981] text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-[#10B981]/20 disabled:opacity-60"
                >
                  {passwordChangeLoading ? "Saving..." : "Save Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTRATION MODAL */}
      {isRegModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050B09]/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0E1B17] w-full max-w-2xl rounded-[2.5rem] p-8 animate-pop-in border border-white/10 shadow-2xl relative my-auto">
            <button
              onClick={() => setIsRegModalOpen(false)}
              className="absolute top-6 right-6 text-[#94A3B8] hover:text-[#EF4444]"
            >
              <X size={20} />
            </button>
            <h3 className="text-2xl font-black italic mb-2">
              Register Professional Profile
            </h3>
            <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wide mb-6">
              Staff Directory & Operational Profiles Link
            </p>

            <form onSubmit={handleRegisterSave} className="space-y-4">
              <p className="text-[10px] font-black text-[#10B981] uppercase tracking-widest border-b pb-1">
                1. Demographics & Contact (Staff_Directory)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-[#94A3B8] uppercase ml-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 bg-[#0E1B17] border border-white/10 rounded-xl font-bold mt-1 text-xs outline-none"
                    value={newStaff.name}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-[#94A3B8] uppercase ml-1">
                    National ID
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 bg-[#0E1B17] border border-white/10 rounded-xl font-bold mt-1 text-xs outline-none"
                    value={newStaff.nationalId}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, nationalId: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-[#94A3B8] uppercase ml-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    className="w-full p-3 bg-[#0E1B17] border border-white/10 rounded-xl font-bold mt-1 text-xs outline-none"
                    value={newStaff.dob}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, dob: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-[#94A3B8] uppercase ml-1">
                    Gender
                  </label>
                  <select
                    className="w-full p-3 bg-[#0E1B17] border border-white/10 rounded-xl font-bold mt-1 text-xs outline-none"
                    value={newStaff.gender}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, gender: e.target.value })
                    }
                  >
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-[#94A3B8] uppercase ml-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 bg-[#0E1B17] border border-white/10 rounded-xl font-bold mt-1 text-xs outline-none"
                    value={newStaff.phone}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, phone: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-[#94A3B8] uppercase ml-1">
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 bg-[#0E1B17] border border-white/10 rounded-xl font-bold mt-1 text-xs outline-none"
                    value={newStaff.emergencyContact}
                    onChange={(e) =>
                      setNewStaff({
                        ...newStaff,
                        emergencyContact: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-[#94A3B8] uppercase ml-1">
                  Home Address
                </label>
                <input
                  type="text"
                  className="w-full p-3 bg-[#0E1B17] border border-white/10 rounded-xl font-bold mt-1 text-xs outline-none"
                  value={newStaff.address}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, address: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-[#94A3B8] uppercase ml-1">
                    Login Email
                  </label>
                  <input
                    type="email"
                    className="w-full p-3 bg-[#0E1B17] border border-white/10 rounded-xl font-bold mt-1 text-xs outline-none"
                    value={newStaff.email}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="relative">
                  <label className="text-[10px] font-black text-[#94A3B8] uppercase ml-1">
                    Login Password
                  </label>
                  <input
                    type={showRegPassword ? "text" : "password"}
                    className="w-full p-3 pr-12 bg-[#0E1B17] border border-white/10 rounded-xl font-bold mt-1 text-xs outline-none"
                    value={newStaff.password}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, password: e.target.value })
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword((prev) => !prev)}
                    className="absolute right-3 top-[38px] text-[#94A3B8] hover:text-white transition-colors"
                    aria-label={
                      showRegPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <p className="text-[10px] font-black text-[#10B981] uppercase tracking-widest border-b pb-1 pt-2">
                2. Credentials & Job Data (Professional_Profiles)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-[#94A3B8] uppercase ml-1">
                    Job Title / Role
                  </label>
                  <select
                    className="w-full p-3 bg-[#0E1B17] border border-white/10 rounded-xl font-bold mt-1 text-xs outline-none"
                    value={newStaff.jobTitle}
                    onChange={(e) => {
                      const role = e.target.value;
                      const depts = roleToDepartments[role] || ["General"];
                      setNewStaff({
                        ...newStaff,
                        jobTitle: role,
                        dept: depts[0],
                      });
                    }}
                  >
                    <option>Administrator</option>
                    <option>Doctor</option>
                    <option>Nurse</option>
                    <option>Triage</option>
                    <option>Receptionist</option>
                    <option>Pharmacist</option>
                    <option>Pharmacy Cashier</option>
                    <option>Laboratory</option>
                    <option>Laboratory Cashier</option>
                    <option>Store Manager</option>
                    <option>Ward Manager</option>
                    <option>Radiology</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-[#94A3B8] uppercase ml-1">
                    Department
                  </label>
                  <select
                    className="w-full p-3 bg-[#0E1B17] border border-white/10 rounded-xl font-bold mt-1 text-xs outline-none"
                    value={newStaff.dept}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, dept: e.target.value })
                    }
                    required
                  >
                    {availableDepartments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-[#94A3B8] uppercase ml-1">
                    Qualification
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 bg-[#0E1B17] border border-white/10 rounded-xl font-bold mt-1 text-xs outline-none"
                    value={newStaff.qualification}
                    onChange={(e) =>
                      setNewStaff({
                        ...newStaff,
                        qualification: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-[#94A3B8] uppercase ml-1">
                    Certification No
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 bg-[#0E1B17] border border-white/10 rounded-xl font-bold mt-1 text-xs outline-none"
                    value={newStaff.certNo}
                    onChange={(e) =>
                      setNewStaff({
                        ...newStaff,
                        certNo: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-[#94A3B8] uppercase ml-1">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 bg-[#0E1B17] border border-white/10 rounded-xl font-bold mt-1 text-xs outline-none"
                    value={newStaff.yearsExp}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, yearsExp: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-[#94A3B8] uppercase ml-1">
                    Contract Status
                  </label>
                  <select
                    className="w-full p-3 bg-[#0E1B17] border border-white/10 rounded-xl font-bold mt-1 text-xs outline-none"
                    value={newStaff.contractStatus}
                    onChange={(e) =>
                      setNewStaff({
                        ...newStaff,
                        contractStatus: e.target.value,
                      })
                    }
                  >
                    <option>Active</option>
                    <option>On Leave</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsRegModalOpen(false)}
                  className="flex-1 py-4 bg-[#0E1B17] text-[#94A3B8] rounded-2xl font-black uppercase text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-[#10B981] text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-[#10B981]/20"
                >
                  Commit to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- BASE SUB-COMPONENTS ---
const NavItem = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-2.5 rounded-lg font-bold uppercase tracking-wider transition ${active ? "bg-[#10B981] text-white shadow-md font-black" : "text-[#94A3B8] hover:bg-[#0E1B17] hover:text-white"}`}
  >
    {React.cloneElement(icon, { size: 16 })}{" "}
    <span className="text-[11px]">{label}</span>
  </button>
);

const StatusButton = ({ current, type, onClick, label, activeColor, icon }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all duration-300 cursor-pointer ${current === type ? activeColor + " text-white shadow-md shadow-slate-200" : "text-[#94A3B8] hover:bg-[#0E1B17]"}`}
  >
    {icon} <span>{label}</span>
  </button>
);

const StatCardGraph = ({ label, value, color, bgColor, onAnchorAction }) => (
  <div
    className={`${bgColor} p-8 rounded-[2.5rem] border border-white/20 shadow-sm relative overflow-hidden group`}
  >
    <div className="relative z-10">
      <p className="text-[#94A3B8] text-[10px] font-black uppercase tracking-widest">
        {label}
      </p>
      <h2 className="text-4xl font-black mt-2">{value}</h2>
      <button
        type="button"
        onClick={onAnchorAction}
        className="text-[9px] font-black text-[#10B981] mt-4 uppercase hover:underline cursor-pointer"
      >
        View All →
      </button>
    </div>
    <div className="absolute inset-0 top-12 h-28 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={generateSparklineData()}>
          <Line
            type="monotone"
            dataKey="count"
            stroke={color}
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const DeptCard = ({ icon, label, sub, color, onClick }) => {
  const colorMap = {
    emerald: "bg-[#10B981]/10/60 text-[#10B981]",
    blue: "bg-[#10B981]/10/60 text-[#10B981]",
    indigo: "bg-[#10B981]/10/60 text-[#10B981]",
    rose: "bg-[#EF4444]/10/60 text-[#EF4444]",
    amber: "bg-amber-500/10 text-amber-300",
    slate: "bg-[#0E1B17] text-slate-300",
  };
  return (
    <div
      onClick={onClick}
      className={`${colorMap[color]} p-5 rounded-2xl flex items-center justify-between group border border-white/20 hover:bg-[#0E1B17] hover:shadow-md transition-all cursor-pointer active:scale-95`}
    >
      <div className="flex items-center gap-4">
        <div className="bg-[#0E1B17] p-3 rounded-xl shadow-sm text-white">
          {icon}
        </div>
        <div>
          <h4 className="font-black text-white text-sm">{label}</h4>
          <p className="text-[9px] font-black opacity-50 uppercase mt-0.5">
            {sub}
          </p>
        </div>
      </div>
      <ArrowRight
        size={16}
        className="opacity-0 group-hover:opacity-100 transition-all text-[#94A3B8]"
      />
    </div>
  );
};

const PaginationBar = ({ current, total, onPrev, onNext }) => (
  <div className="p-6 bg-[#0E1B17]/50 border-t border-white/10 flex items-center justify-between">
    <p className="text-xs font-black text-[#94A3B8] uppercase tracking-widest">
      Page {current} of {total}
    </p>
    <div className="flex gap-2">
      <button
        disabled={current === 1}
        onClick={onPrev}
        className="px-4 py-2 bg-[#0E1B17] border border-white/20 rounded-xl text-xs font-black disabled:opacity-30 transition-all cursor-pointer"
      >
        Previous
      </button>
      <button
        disabled={current === total}
        onClick={onNext}
        className="px-4 py-2 bg-[#0E1B17] border border-white/20 rounded-xl text-xs font-black disabled:opacity-30 transition-all cursor-pointer"
      >
        Next
      </button>
    </div>
  </div>
);

const ProfileField = ({ label, value }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] ml-1">
      {label}
    </label>
    <div className="bg-[#0E1B17] p-4 rounded-xl border border-white/10 font-bold text-white">
      {value}
    </div>
  </div>
);

const SettingsCard = ({ icon, title, desc }) => (
  <div className="bg-[#0E1B17] p-8 rounded-[2.5rem] border border-white/10 shadow-sm hover:shadow-md transition-all group cursor-pointer">
    <div className="bg-[#0E1B17] w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-lg font-black text-white mb-2">{title}</h3>
    <p className="text-xs text-[#94A3B8] font-medium leading-relaxed">{desc}</p>
  </div>
);

const ManageFieldItem = ({ label, value, isEdit, onChange }) => (
  <div className="space-y-1 bg-[#0E1B17]/50 p-3 rounded-2xl border border-white/10">
    <label className="text-[9px] font-black text-[#94A3B8] uppercase tracking-wider block ml-1">
      {label}
    </label>
    {isEdit ? (
      <input
        type="text"
        className="w-full p-2 bg-[#0E1B17] border border-white/20 rounded-xl font-bold text-xs text-white outline-none focus:border-[#10B981]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    ) : (
      <span className="text-xs font-bold text-slate-200 block px-2 py-1">
        {value || "Unassigned"}
      </span>
    )}
  </div>
);

export default AdminDashboard;
