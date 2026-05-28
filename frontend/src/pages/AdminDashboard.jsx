import React, { useState, useRef, useEffect } from "react";
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

// Palette for chart slices (reused cyclically for categories)
const COLORS = [
  "#2563EB",
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
}) => {
  const isAdmin = user?.role === "Administrator";
  const [activeTab, setActiveTab] = useState("overview");
  const [systemStatus, setSystemStatus] = useState("open");
  const fileInputRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const statusInstructions = {
    open: {
      title: "Standard Operations",
      description:
        "Portal access is open to all staff. Continue normal workflows and routine care delivery.",
      style: "bg-emerald-50 text-emerald-800",
    },
    emergency: {
      title: "Emergency Protocol",
      description:
        "Emergency mode is active. Staff should focus on urgent cases only and defer non-critical tasks.",
      style: "bg-red-50 text-red-800",
    },
    closed: {
      title: "Maintenance Mode",
      description:
        "Maintenance is engaged. The system is accessible to admin only; staff should follow admin guidance and avoid standard portal use.",
      style: "bg-amber-50 text-amber-900",
    },
  };

  const currentStatusInstruction = statusInstructions[systemStatus];

  // --- CONFIG BRANDING STATES ---
  const [hospitalName, setHospitalName] = useState("Mesra Digital Health");
  const [hospitalEmail, setHospitalEmail] = useState("contact@mesra.com");
  const [hospitalLogo, setHospitalLogo] = useState("/mesra icon.png");
  const [locationName, setLocationName] = useState("Addis Ababa, Ethiopia");
  const [adminPhone, setAdminPhone] = useState("+251 90 007 1103");
  const [mfaEnabled, setMfaEnabled] = useState(true);

  // --- METRICS (Dashboard Architecture) ---
  const [systemHealth, setSystemHealth] = useState("98.4%");
  const [auditAlertsCount, setAuditAlertsCount] = useState(0);
  const [deptFilter, setDeptFilter] = useState("all");

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

  // --- STAFF STATE (Staff_Directory & Professional Profiles) ---
  const [staffList, setStaffList] = useState([]);

  // --- PATIENTS STATE (Patients Table Spec) ---
  const [patientsList, setPatientsList] = useState([]);

  const [isLoading, setIsLoading] = useState(false);

  const normalizeStaff = (staff) => ({
    ...staff,
    id: staff.id || staff._id,
    avatarColor: staff.avatarColor || "bg-slate-500",
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
    avatarColor: patient.avatarColor || "bg-slate-500",
  });

  const getAuthHeaders = (isJson = true) => {
    const token = localStorage.getItem("token")?.trim();
    const headers = {};
    if (isJson) headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  const fetchStaffData = async () => {
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
      alert(`Staff retrieval failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPatientData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/patients`, {
        headers: getAuthHeaders(false),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Unable to load patient data");
      setPatientsList(result.data.map(normalizePatient));
    } catch (error) {
      alert(`Patient retrieval failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
    fetchPatientData();
  }, []);

  const distributionDataComputed = React.useMemo(() => {
    const counts = {};
    patientsList.forEach((p) => {
      const key = p.status || "Unknown";
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
    dept: "General",
    yearsExp: "",
    qualification: "",
    certNo: "",
    contractStatus: "Active",
  });

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
      alert("Database Synced: Internal modifications committed permanently.");
    } catch (error) {
      alert(`Save failed: ${error.message}`);
    }
  };

  const toggleStatusActivation = async () => {
    try {
      let targetNewStatus = "";
      let updatePayload = {};

      if (managementTargetType === "staff") {
        targetNewStatus =
          selectedProfile.contractStatus === "Active" ? "Inactive" : "Active";
        updatePayload = { contractStatus: targetNewStatus };
      } else {
        targetNewStatus =
          selectedProfile.status === "Archived" ? "Admitted" : "Archived";
        updatePayload = { status: targetNewStatus };
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
    } catch (error) {
      alert(`Status update failed: ${error.message}`);
    }
  };

  const triggerTelemetryRefresh = () => {
    setLastSyncTime(new Date().toLocaleTimeString());
    setSystemHealth((95 + Math.random() * 5).toFixed(1) + "%");
    alert(`System Core Sync Executed Successfully.`);
  };

  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setHospitalLogo(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleStatusChange = (status) => {
    setSystemStatus(status);
    setIsMaintenanceMode(status === "closed");
  };

  const getRandomAvatarColor = () => {
    const colors = [
      "bg-blue-600",
      "bg-rose-500",
      "bg-emerald-600",
      "bg-purple-600",
      "bg-slate-500",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleRegisterSave = async (e) => {
    e.preventDefault();
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
        dept: "General",
        yearsExp: "",
        qualification: "",
        certNo: "",
        contractStatus: "Active",
      });
      setCurrentPage(1);
    } catch (error) {
      alert(`Create staff failed: ${error.message}`);
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

  const currentTabItems = () => {
    if (activeTab === "staff") {
      return staffList.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.id.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    return patientsList.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase()),
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
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
      `}</style>

      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col fixed h-full z-50">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <img
              src={hospitalLogo}
              alt="Mesra Logo"
              className="w-10 h-10 object-contain rounded-xl"
            />
            <span className="text-2xl font-black italic uppercase text-blue-600">
              Mesra
            </span>
          </div>
          <nav className="space-y-1">
            <NavItem
              icon={<LayoutDashboard />}
              label="Dashboard"
              active={activeTab === "overview" && !isManagementActive}
              onClick={() => {
                setActiveTab("overview");
                setIsManagementActive(false);
              }}
            />
            <NavItem
              icon={<Users />}
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
              icon={<UserCheck />}
              label="Patient Registry"
              active={activeTab === "patients" && !isManagementActive}
              onClick={() => {
                setActiveTab("patients");
                setIsManagementActive(false);
                setSearchTerm("");
                setCurrentPage(1);
              }}
            />
            <NavItem
              icon={<UserCog />}
              label="Profile"
              active={activeTab === "profile" && !isManagementActive}
              onClick={() => {
                setActiveTab("profile");
                setIsManagementActive(false);
              }}
            />
            <NavItem
              icon={<Settings />}
              label="Settings"
              active={activeTab === "settings" && !isManagementActive}
              onClick={() => {
                setActiveTab("settings");
                setIsManagementActive(false);
              }}
            />
          </nav>
        </div>
        <button
          onClick={() => {
            // If your dashboard has access to state routing, use that, or hard refresh to home:
            window.location.href = "/";
          }}
          className="w-full flex items-center justify-center gap-2 mb-2 px-4 py-2.5 bg-blue-600/10 hover:bg-blue-600 border border-blue-500/30 hover:border-blue-500 text-blue-400 hover:text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
        >
          <Activity size={14} /> View Public Site
        </button>
        <button
          onClick={onLogout}
          className="mt-auto m-8 flex items-center gap-3 p-4 text-red-500 font-black text-xs uppercase tracking-widest hover:bg-red-50 rounded-2xl transition-all cursor-pointer"
        >
          <LogOut size={18} /> Logout
        </button>
      </aside>
      <main className="flex-1 ml-72 p-8">
        {isManagementActive ? (
          <div className="animate-fade-in-up space-y-6 max-w-4xl mx-auto">
            {/* Nav Header Row */}
            <div className="flex justify-between items-center border-b pb-4 border-slate-100">
              <button
                onClick={() => setIsManagementActive(false)}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black text-xs uppercase tracking-widest transition-colors cursor-pointer"
              >
                <ArrowLeft size={16} /> Back to Directory
              </button>
              <div className="flex gap-2">
                {isInlineEditing ? (
                  <button
                    onClick={saveInlineProfileChanges}
                    className="bg-emerald-600 text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 cursor-pointer shadow-md"
                  >
                    <Check size={14} /> Save Changes
                  </button>
                ) : (
                  <button
                    onClick={() => setIsInlineEditing(true)}
                    className="bg-slate-900 text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-black cursor-pointer shadow-md"
                  >
                    <Edit size={14} /> Edit Profile
                  </button>
                )}
                <button
                  onClick={toggleStatusActivation}
                  disabled={!selectedProfile}
                  className={`px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-md transition-all ${!selectedProfile ? "opacity-50 cursor-not-allowed bg-slate-100 text-slate-400" : (managementTargetType === "staff" ? selectedProfile?.contractStatus === "Active" : selectedProfile?.status !== "Archived") ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}
                >
                  {managementTargetType === "staff"
                    ? selectedProfile?.contractStatus === "Active"
                      ? "Inactivate Account"
                      : "Activate Account"
                    : selectedProfile?.status !== "Archived"
                      ? "Archive Patient"
                      : "Restore Patient"}
                </button>
              </div>
            </div>

            {/* Dossier Card Sheet Layout */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm grid md:grid-cols-3 gap-8">
              <div className="text-center md:border-r border-slate-50 md:pr-8 flex flex-col justify-center">
                <div
                  className={`w-36 h-36 ${selectedProfile?.avatarColor || "bg-blue-600"} rounded-[2.5rem] flex items-center justify-center text-white text-5xl font-black mx-auto mb-4 shadow-xl border-4 border-white`}
                >
                  {selectedProfile?.name ? selectedProfile.name[0] : ""}
                </div>
                <h2 className="text-xl font-black text-slate-900">
                  {selectedProfile?.name || "—"}
                </h2>
                <p className="text-xs font-bold text-blue-500 uppercase mt-1 tracking-wider">
                  ID: {selectedProfile?.id || "—"}
                </p>
                <div className="mt-4">
                  <span
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${(managementTargetType === "staff" ? selectedProfile?.contractStatus === "Active" : selectedProfile?.status !== "Archived") ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}
                  >
                    {managementTargetType === "staff"
                      ? selectedProfile?.contractStatus || "—"
                      : selectedProfile?.status || "—"}
                  </span>
                </div>
              </div>

              <div className="md:col-span-2 space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b pb-1">
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
                {/* Banners */}
                {systemStatus === "emergency" && (
                  <div className="bg-red-500 text-white font-black uppercase text-xs tracking-widest p-4 rounded-2xl flex items-center gap-3 animate-pulse">
                    <Flame size={18} /> Critical Alert: System running on
                    Emergency Protocol mode. High-Risk Triage routing active.
                  </div>
                )}
                {systemStatus === "closed" && (
                  <div className="bg-amber-500 text-slate-900 font-black uppercase text-xs tracking-widest p-4 rounded-2xl flex items-center gap-3">
                    <AlertCircle size={18} /> Notice: Infrastructure Maintenance
                    Window Engaged. Public portal lines disconnected.
                  </div>
                )}

                <header className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-blue-600 rounded-3xl overflow-hidden flex items-center justify-center text-white text-3xl font-black">
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
                      <h1 className="text-3xl font-black text-slate-900">
                        {hospitalName}
                      </h1>
                      <div className="flex flex-wrap gap-4 mt-2 items-center text-slate-400 text-xs font-bold">
                        <span className="bg-blue-50 px-3 py-1 rounded-lg text-blue-600 uppercase">
                          Head Administrator
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone size={12} className="text-blue-500" />{" "}
                          {adminPhone}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-blue-500" />{" "}
                          {locationName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex gap-1.5">
                    <StatusButton
                      current={systemStatus}
                      type="open"
                      onClick={() => handleStatusChange("open")}
                      label="Open"
                      activeColor="bg-emerald-500 text-white"
                      icon={<CheckCircle2 size={14} />}
                    />
                    <StatusButton
                      current={systemStatus}
                      type="emergency"
                      onClick={() => handleStatusChange("emergency")}
                      label="Emergency"
                      activeColor="bg-red-500 text-white"
                      icon={<Flame size={14} />}
                    />
                    <StatusButton
                      current={systemStatus}
                      type="closed"
                      onClick={() => handleStatusChange("closed")}
                      label="Maintenance"
                      activeColor="bg-amber-500 text-slate-900"
                      icon={<AlertCircle size={14} />}
                    />
                  </div>
                </header>

                <div
                  className={`bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm mt-6 ${currentStatusInstruction.style}`}
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

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <StatCardGraph
                    label="Total Staff"
                    value={staffList.length}
                    color="#3B82F6"
                    bgColor="bg-blue-50/50"
                    onAnchorAction={() => setActiveTab("staff")}
                  />
                  <StatCardGraph
                    label="Total Patient Number"
                    value={patientsList.length}
                    color="#10B981"
                    bgColor="bg-emerald-50/50"
                    onAnchorAction={() => setActiveTab("patients")}
                  />
                  <StatCardGraph
                    label="System Health"
                    value={systemHealth}
                    color="#F59E0B"
                    bgColor="bg-amber-50/50"
                    onAnchorAction={() => setActiveTab("settings")}
                  />
                  <StatCardGraph
                    label="Audit Alerts"
                    value={auditAlertsCount}
                    color="#EF4444"
                    bgColor="bg-rose-50/50"
                    onAnchorAction={() => setActiveTab("settings")}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-black">
                        Department Dashboards
                      </h3>
                      <button
                        onClick={handleDeptToggle}
                        className="text-xs bg-slate-50 px-4 py-2 rounded-xl text-slate-500 font-black uppercase tracking-wider border border-slate-100 cursor-pointer"
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
                        />
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between items-center text-center h-full min-h-[400px]">
                    <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest w-full">
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
                          <div className="text-sm text-slate-400 font-bold">
                            No patient distribution data available
                          </div>
                        </div>
                      )}
                    </div>
                    {distributionDataComputed.length > 0 && (
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-left mt-6 w-full px-4 border-t pt-6 border-slate-50">
                        {distributionDataComputed.map((d, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-xs font-bold text-slate-600"
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
                    <h1 className="text-4xl font-black text-slate-900 italic">
                      Staff Management
                    </h1>
                    <p className="text-slate-400 font-medium mt-1">
                      Total Profiles: {staffList.length}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsRegModalOpen(true)}
                    className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-blue-700 cursor-pointer"
                  >
                    <Plus size={18} /> Register Profile
                  </button>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-50 flex items-center gap-4 bg-slate-50/30">
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
                        <tr className="text-[10px] font-black uppercase text-slate-400 border-b tracking-widest p-6">
                          <th className="p-6">Staff Profile</th>
                          <th className="p-6">Title & Dept</th>
                          <th className="p-6">Contact Line</th>
                          <th className="p-6">Contract Status</th>
                          <th className="p-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm font-bold text-slate-600">
                        {currentPaginatedItems.map((staff) => (
                          <tr
                            key={staff.id}
                            className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="p-6 flex items-center gap-4">
                              <div
                                className={`w-10 h-10 rounded-xl ${staff.avatarColor} text-white font-black flex items-center justify-center text-xs shadow-sm`}
                              >
                                {staff.name[0]}
                              </div>
                              <div>
                                <span className="text-slate-900 block font-black">
                                  {staff.name}
                                </span>
                                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                                  {staff.id}
                                </span>
                              </div>
                            </td>
                            <td className="p-6">
                              <span className="text-slate-800 block text-xs uppercase">
                                {staff.jobTitle}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-normal">
                                {staff.dept}
                              </span>
                            </td>
                            <td className="p-6 font-mono text-xs text-slate-500">
                              {staff.phone}
                            </td>
                            <td className="p-6">
                              <span
                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${staff.contractStatus === "Active" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}
                              >
                                {staff.contractStatus}
                              </span>
                            </td>
                            <td className="p-6 text-right">
                              <button
                                onClick={() =>
                                  launchProfileManagement(staff, "staff")
                                }
                                className="px-4 py-2 bg-slate-50 border border-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-blue-600 hover:text-white ml-auto transition-all cursor-pointer shadow-sm"
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
                  <h1 className="text-4xl font-black text-slate-900 italic">
                    Patient Registry
                  </h1>
                  <p className="text-slate-400 font-medium mt-1">
                    Total Active Records: {patientsList.length}
                  </p>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-50 flex items-center gap-4 bg-slate-50/30">
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
                        <tr className="text-[10px] font-black uppercase text-slate-400 border-b tracking-widest">
                          <th className="p-6">Patient Profile</th>
                          <th className="p-6">Contact Line</th>
                          <th className="p-6">Registration Date</th>
                          <th className="p-6">Insurance Carrier</th>
                          <th className="p-6">Triage Status</th>
                          <th className="p-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm font-bold text-slate-600">
                        {currentPaginatedItems.map((patient) => (
                          <tr
                            key={patient.id}
                            className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="p-6 flex items-center gap-4">
                              <div
                                className={`w-10 h-10 rounded-xl ${patient.avatarColor} text-white font-black flex items-center justify-center text-xs shadow-sm`}
                              >
                                {patient.name[0]}
                              </div>
                              <div>
                                <span className="text-slate-900 block font-black">
                                  {patient.name}
                                </span>
                                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                                  {patient.id}
                                </span>
                              </div>
                            </td>
                            <td className="p-6 font-mono text-xs text-slate-500">
                              {patient.contactInfo}
                            </td>
                            <td className="p-6 font-mono text-xs text-slate-400">
                              {patient.regDate}
                            </td>
                            <td className="p-6 text-xs uppercase opacity-80">
                              {patient.insuranceProvider}
                            </td>
                            <td className="p-6">
                              <span
                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${patient.status === "Admitted" ? "bg-blue-100 text-blue-600" : patient.status === "Triage Queue" ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"}`}
                              >
                                {patient.status}
                              </span>
                            </td>
                            <td className="p-6 text-right">
                              <button
                                onClick={() =>
                                  launchProfileManagement(patient, "patient")
                                }
                                className="px-4 py-2 bg-slate-50 border border-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-blue-600 hover:text-white ml-auto transition-all cursor-pointer shadow-sm"
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
                <h1 className="text-4xl font-black text-slate-900 italic mb-8">
                  Admin Identity
                </h1>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center">
                    <div className="w-32 h-32 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-white text-5xl font-black mx-auto mb-6 shadow-xl shadow-blue-100">
                      M
                    </div>
                    <h3 className="text-xl font-black text-slate-900">
                      Admin Account
                    </h3>
                    <p className="text-xs font-black text-blue-500 uppercase tracking-widest mt-2">
                      Level 1 Authority
                    </p>
                  </div>
                  <div className="md:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
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

            {/* TAB 5: SETTINGS */}
            {activeTab === "settings" && (
              <div className="max-w-4xl mx-auto animate-fade-in-up space-y-8">
                <h1 className="text-4xl font-black text-slate-900 italic">
                  System Configuration
                </h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                      <RefreshCw size={14} className="text-blue-500" /> Hospital
                      Branding
                    </h3>
                    <div
                      onClick={() => fileInputRef.current.click()}
                      className="p-6 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center gap-2 cursor-pointer hover:bg-slate-50 hover:border-blue-500 transition-all group"
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
                          className="text-slate-400 group-hover:scale-110 transition-transform"
                        />
                      ) : (
                        <img
                          src={hospitalLogo}
                          className="w-10 h-10 object-contain rounded-lg shadow-sm"
                          alt="Logo"
                        />
                      )}
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">
                        Change Active System Logo Asset
                      </p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                        Entity Name
                      </label>
                      <input
                        type="text"
                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold mt-1 text-xs outline-none focus:border-blue-500"
                        value={hospitalName}
                        onChange={(e) => setHospitalName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                        <Mail size={10} /> Central System Email
                      </label>
                      <input
                        type="email"
                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold mt-1 text-xs outline-none focus:border-blue-500"
                        value={hospitalEmail}
                        onChange={(e) => setHospitalEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                        Regional Coordinates
                      </label>
                      <input
                        type="text"
                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold mt-1 text-xs outline-none focus:border-blue-500"
                        value={locationName}
                        onChange={(e) => setLocationName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                      <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                        <Server size={14} className="text-blue-500" /> Telemetry
                        Monitor & Health Logs
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-black uppercase block">
                            Live Node Health
                          </span>
                          <input
                            type="text"
                            className="text-lg font-black bg-transparent border-none outline-none mt-1 w-full text-blue-600"
                            value={systemHealth}
                            onChange={(e) => setSystemHealth(e.target.value)}
                          />
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-black uppercase block">
                            Active Audit Faults
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg font-black text-red-500">
                              {auditAlertsCount}
                            </span>
                            <button
                              type="button"
                              onClick={() => setAuditAlertsCount((p) => p + 1)}
                              className="text-[9px] bg-red-50 text-red-600 font-black px-2 py-1 rounded uppercase tracking-wider ml-auto"
                            >
                              Trigger Alert
                            </button>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={triggerTelemetryRefresh}
                        className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest rounded-xl flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-md"
                      >
                        <RefreshCw size={12} /> Run Framework Cache Refresh
                      </button>
                      <p className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                        Last Dashboard Synchronization: {lastSyncTime}
                      </p>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                      <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                        <Shield size={14} className="text-blue-500" /> System
                        Guard Gates
                      </h3>
                      {isAdmin ? (
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-xs font-black block">
                              Maintenance Gate
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold block uppercase mt-0.5">
                              {isMaintenanceMode
                                ? "Admin-only access while maintenance is active"
                                : "Open to staff and admin users"}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updatedState = !isMaintenanceMode;
                              setIsMaintenanceMode(updatedState);
                              setSystemStatus(updatedState ? "closed" : "open");
                            }}
                            className={`w-12 h-6 rounded-full transition-colors relative ${isMaintenanceMode ? "bg-amber-500" : "bg-slate-200"}`}
                          >
                            <div
                              className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${isMaintenanceMode ? "right-1" : "left-1"}`}
                            />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-xs font-black block">
                              Maintenance Gate
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold block uppercase mt-0.5">
                              Only administrators may view or change maintenance
                              mode.
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 italic">
                            Please contact an administrator to enable or disable
                            maintenance access.
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-xs font-black block">
                            Enforce MFA Verification
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold block uppercase mt-0.5">
                            Role-Based Gatekeeper Key
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setMfaEnabled(!mfaEnabled)}
                          className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${mfaEnabled ? "bg-blue-600" : "bg-slate-200"}`}
                        >
                          <div
                            className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${mfaEnabled ? "right-1" : "left-1"}`}
                          />
                        </button>
                      </div>

                      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                          <Lock size={14} className="text-blue-500" />{" "}
                          Credential Management
                        </h3>
                        <p className="text-sm text-slate-500">
                          Update your administrator password securely. Staff
                          users can also use the pharmacy dashboard to update
                          their own password.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsChangePasswordOpen(true)}
                          className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
                        >
                          Change Password
                        </button>
                      </div>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 animate-pop-in border border-slate-100 shadow-2xl relative my-auto">
            <button
              onClick={() => setIsChangePasswordOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-red-500"
            >
              <X size={20} />
            </button>
            <h3 className="text-2xl font-black italic mb-2">Change Password</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-6">
              Use a secure, professional password for your account.
            </p>

            {passwordChangeError && (
              <div className="mb-4 rounded-3xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                {passwordChangeError}
              </div>
            )}
            {passwordChangeSuccess && (
              <div className="mb-4 rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
                {passwordChangeSuccess}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                  Current Password
                </label>
                <input
                  type="password"
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold mt-1 text-xs outline-none"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                  New Password
                </label>
                <input
                  type="password"
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold mt-1 text-xs outline-none"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold mt-1 text-xs outline-none"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordChangeLoading}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-blue-100 disabled:opacity-60"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 animate-pop-in border border-slate-100 shadow-2xl relative my-auto">
            <button
              onClick={() => setIsRegModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-red-500"
            >
              <X size={20} />
            </button>
            <h3 className="text-2xl font-black italic mb-2">
              Register Professional Profile
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-6">
              Staff Directory & Operational Profiles Link
            </p>

            <form onSubmit={handleRegisterSave} className="space-y-4">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b pb-1">
                1. Demographics & Contact (Staff_Directory)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold mt-1 text-xs outline-none"
                    value={newStaff.name}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                    National ID
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold mt-1 text-xs outline-none"
                    value={newStaff.nationalId}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, nationalId: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold mt-1 text-xs outline-none"
                    value={newStaff.dob}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, dob: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                    Gender
                  </label>
                  <select
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold mt-1 text-xs outline-none"
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
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold mt-1 text-xs outline-none"
                    value={newStaff.phone}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, phone: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold mt-1 text-xs outline-none"
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
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                  Home Address
                </label>
                <input
                  type="text"
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold mt-1 text-xs outline-none"
                  value={newStaff.address}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, address: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                    Login Email
                  </label>
                  <input
                    type="email"
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold mt-1 text-xs outline-none"
                    value={newStaff.email}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                    Login Password
                  </label>
                  <input
                    type={showRegPassword ? "text" : "password"}
                    className="w-full p-3 pr-12 bg-slate-50 border border-slate-100 rounded-xl font-bold mt-1 text-xs outline-none"
                    value={newStaff.password}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, password: e.target.value })
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword((prev) => !prev)}
                    className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-900 transition-colors"
                    aria-label={
                      showRegPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b pb-1 pt-2">
                2. Credentials & Job Data (Professional_Profiles)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                    Job Title / Role
                  </label>
                  <select
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold mt-1 text-xs outline-none"
                    value={newStaff.jobTitle}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, jobTitle: e.target.value })
                    }
                  >
                    <option>Administrator</option>
                    <option>Doctor</option>
                    <option>Nurse</option>
                    <option>Lab Tech</option>
                    <option>Receptionist</option>
                    <option>Cashier</option>
                    <option>Pharmacist</option>
                    <option>Store Manager</option>
                    <option>Ward</option>
                    <option>Triage</option>
                    <option>Radiology</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                    Department
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold mt-1 text-xs outline-none"
                    value={newStaff.dept}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, dept: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                    Qualification
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold mt-1 text-xs outline-none"
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
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                    Certification No
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold mt-1 text-xs outline-none"
                    value={newStaff.certNo}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, certNo: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold mt-1 text-xs outline-none"
                    value={newStaff.yearsExp}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, yearsExp: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                    Contract Status
                  </label>
                  <select
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold mt-1 text-xs outline-none"
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
                  className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-blue-100"
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
    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all cursor-pointer ${active ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-slate-400 hover:bg-slate-50"}`}
  >
    {React.cloneElement(icon, { size: 20 })}{" "}
    <span className="font-black text-sm">{label}</span>
  </button>
);

const StatusButton = ({ current, type, onClick, label, activeColor, icon }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all duration-300 cursor-pointer ${current === type ? activeColor + " text-white shadow-md shadow-slate-200" : "text-slate-400 hover:bg-white"}`}
  >
    {icon} <span>{label}</span>
  </button>
);

const StatCardGraph = ({ label, value, color, bgColor, onAnchorAction }) => (
  <div
    className={`${bgColor} p-8 rounded-[2.5rem] border border-white shadow-sm relative overflow-hidden group`}
  >
    <div className="relative z-10">
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
        {label}
      </p>
      <h2 className="text-4xl font-black mt-2">{value}</h2>
      <button
        type="button"
        onClick={onAnchorAction}
        className="text-[9px] font-black text-blue-600 mt-4 uppercase hover:underline cursor-pointer"
      >
        View All →
      </button>
    </div>
    <div className="absolute inset-0 top-12 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none">
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

const DeptCard = ({ icon, label, sub, color }) => {
  const colorMap = {
    emerald: "bg-emerald-50/60 text-emerald-600",
    blue: "bg-blue-50/60 text-blue-600",
    indigo: "bg-indigo-50/60 text-indigo-600",
    rose: "bg-rose-50/60 text-rose-600",
    amber: "bg-amber-50/60 text-amber-600",
    slate: "bg-slate-50 text-slate-600",
  };
  return (
    <div
      className={`${colorMap[color]} p-5 rounded-2xl flex items-center justify-between group cursor-pointer border border-white hover:bg-white hover:shadow-md transition-all`}
    >
      <div className="flex items-center gap-4">
        <div className="bg-white p-3 rounded-xl shadow-sm text-slate-800">
          {icon}
        </div>
        <div>
          <h4 className="font-black text-slate-800 text-sm">{label}</h4>
          <p className="text-[9px] font-black opacity-50 uppercase mt-0.5">
            {sub}
          </p>
        </div>
      </div>
      <ArrowRight
        size={16}
        className="opacity-0 group-hover:opacity-100 transition-all text-slate-400"
      />
    </div>
  );
};

const PaginationBar = ({ current, total, onPrev, onNext }) => (
  <div className="p-6 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
      Page {current} of {total}
    </p>
    <div className="flex gap-2">
      <button
        disabled={current === 1}
        onClick={onPrev}
        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black disabled:opacity-30 transition-all cursor-pointer"
      >
        Previous
      </button>
      <button
        disabled={current === total}
        onClick={onNext}
        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black disabled:opacity-30 transition-all cursor-pointer"
      >
        Next
      </button>
    </div>
  </div>
);

const ProfileField = ({ label, value }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
      {label}
    </label>
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-slate-800">
      {value}
    </div>
  </div>
);

const SettingsCard = ({ icon, title, desc }) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer">
    <div className="bg-slate-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-lg font-black text-slate-900 mb-2">{title}</h3>
    <p className="text-xs text-slate-400 font-medium leading-relaxed">{desc}</p>
  </div>
);

const ManageFieldItem = ({ label, value, isEdit, onChange }) => (
  <div className="space-y-1 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block ml-1">
      {label}
    </label>
    {isEdit ? (
      <input
        type="text"
        className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-800 outline-none focus:border-blue-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    ) : (
      <span className="text-xs font-bold text-slate-700 block px-2 py-1">
        {value || "Unassigned"}
      </span>
    )}
  </div>
);

export default AdminDashboard;
