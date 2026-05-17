import React, { useState } from "react";
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
} from "lucide-react";

const patientData = [
  { day: "Mon", count: 400 },
  { day: "Tue", count: 300 },
  { day: "Wed", count: 500 },
  { day: "Thu", count: 280 },
  { day: "Fri", count: 590 },
  { day: "Sat", count: 320 },
];

const distributionData = [
  { name: "OPD", value: 400 },
  { name: "Emergency", value: 300 },
  { name: "Ward", value: 200 },
  { name: "Lab", value: 100 },
];

const COLORS = ["#2563EB", "#10B981", "#F59E0B", "#EF4444"];

const AdminDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState("overview");

  // --- STAFF DIRECTORY STATE (COMBINED WITH PROFESSIONAL PROFILES)  ---
  const [staffList, setStaffList] = useState([
    {
      // Staff_Directory Fields
      id: "S-101",
      name: "Dr. Elias Tadesse",
      dob: "1985-05-12",
      gender: "Male",
      nationalId: "ET-0984",
      phone: "+251 911 223344",
      emergencyContact: "+251 920 112233",
      address: "Bole, Addis Ababa",
      // Professional_Profiles Fields
      profileId: "P-501",
      jobTitle: "Doctor",
      dept: "Cardiology",
      yearsExp: "8",
      qualification: "MD, Senior Surgeon",
      certNo: "MOH-8821",
      hireDate: "2024-01-10",
      contractStatus: "Active",
    },
    {
      id: "S-102",
      name: "Nurse Hana Bekele",
      dob: "1992-08-24",
      gender: "Female",
      nationalId: "ET-4432",
      phone: "+251 912 334455",
      emergencyContact: "+251 911 998877",
      address: "Megenagna, Addis Ababa",
      profileId: "P-502",
      jobTitle: "Nurse",
      dept: "Emergency",
      yearsExp: "4",
      qualification: "BSc in Nursing",
      certNo: "MOH-4431",
      hireDate: "2024-02-15",
      contractStatus: "Active",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // MODAL CONTROL STATES
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  // Empty template mapping perfectly to both documentation schemas
  const [newStaff, setNewStaff] = useState({
    name: "",
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

  // --- LOGIC: REGISTER NEW STAFF (SAVES TO BOTH TABLE MAPPINGS)  ---
  const handleRegisterSave = (e) => {
    e.preventDefault();

    const nextIdNumber = staffList.length + 101;
    const createdStaff = {
      id: `S-${nextIdNumber}`,
      profileId: `P-${nextIdNumber + 400}`,
      name: newStaff.name,
      dob: newStaff.dob,
      gender: newStaff.gender,
      nationalId: newStaff.nationalId,
      phone: newStaff.phone,
      emergencyContact: newStaff.emergencyContact,
      address: newStaff.address,
      jobTitle: newStaff.jobTitle,
      dept: newStaff.dept,
      yearsExp: newStaff.yearsExp,
      qualification: newStaff.qualification,
      certNo: newStaff.certNo,
      hireDate: new Date().toISOString().split("T")[0], // Automatically tracks today's setup timestamp
      contractStatus: newStaff.contractStatus,
    };

    setStaffList([createdStaff, ...staffList]);
    setIsRegModalOpen(false);
    // Reset back to blank database schema model template
    setNewStaff({
      name: "",
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
  };

  // --- LOGIC: UPDATE STATUS TO INACTIVE ---
  const handleDelete = (id) => {
    if (
      window.confirm(
        "Are you sure you want to flag this staff contract profile status as Inactive?",
      )
    ) {
      setStaffList(
        staffList.map((s) =>
          s.id === id ? { ...s, contractStatus: "Inactive" } : s,
        ),
      );
    }
  };

  const handleEditSave = (e) => {
    e.preventDefault();
    setStaffList(
      staffList.map((s) => (s.id === editingStaff.id ? editingStaff : s)),
    );
    setIsEditModalOpen(false);
  };

  // --- LOGIC: SEARCH FILTER ---
  const filteredStaff = staffList.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage) || 1;
  const currentItems = filteredStaff.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col fixed h-full z-50">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <img
              src="/mesra icon.png"
              alt="Mesra"
              className="w-10 h-10 object-contain"
            />
            <span className="text-2xl font-black italic uppercase text-blue-600">
              Mesra
            </span>
          </div>
          <nav className="space-y-1">
            <NavItem
              icon={<LayoutDashboard />}
              label="Dashboard"
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
            />
            <NavItem
              icon={<Users />}
              label="Staff Directory"
              active={activeTab === "staff"}
              onClick={() => setActiveTab("staff")}
            />
            <NavItem
              icon={<UserCog />}
              label="Profile"
              active={activeTab === "profile"}
              onClick={() => setActiveTab("profile")}
            />
            <NavItem
              icon={<Settings />}
              label="Settings"
              active={activeTab === "settings"}
              onClick={() => setActiveTab("settings")}
            />
          </nav>
        </div>
        <button
          onClick={onLogout}
          className="mt-auto m-8 flex items-center gap-3 p-4 text-red-500 font-black text-xs uppercase tracking-widest hover:bg-red-50 rounded-2xl transition-all cursor-pointer"
        >
          <LogOut size={18} /> Logout
        </button>
      </aside>

      <main className="flex-1 ml-72 p-8">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-fade-in-up">
            <header className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black">
                  M
                </div>
                <div>
                  <h1 className="text-3xl font-black text-slate-900">
                    Mesra Digital Health
                  </h1>
                  <div className="flex flex-wrap gap-4 mt-2 items-center text-slate-400 text-xs font-bold">
                    <span className="bg-blue-50 px-3 py-1 rounded-lg text-blue-600 uppercase">
                      Head Administrator
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone size={12} className="text-blue-500" /> +251 90 007
                      1103
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-blue-500" /> Addis Ababa
                    </span>
                  </div>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCardGraph
                label="Total Patients"
                value="1,284"
                color="#3B82F6"
                bgColor="bg-blue-50/50"
              />
              <StatCardGraph
                label="Total Doctors"
                value={staffList.filter((s) => s.jobTitle === "Doctor").length}
                color="#10B981"
                bgColor="bg-emerald-50/50"
              />
              <StatCardGraph
                label="Total Employees"
                value={staffList.length}
                color="#F59E0B"
                bgColor="bg-amber-50/50"
              />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                <h3 className="text-xl font-black mb-6">
                  Department Dashboards
                </h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  <DeptCard
                    icon={<Beaker />}
                    label="Laboratory"
                    sub="LAB TESTS & RESULTS"
                    color="emerald"
                  />
                  <DeptCard
                    icon={<Calculator />}
                    label="Cashier"
                    sub="PAYMENTS & BILLING"
                    color="blue"
                  />
                  <DeptCard
                    icon={<Pill />}
                    label="Pharmacy"
                    sub="MEDICINE INVENTORY"
                    color="indigo"
                  />
                  <DeptCard
                    icon={<Home />}
                    label="Ward Management"
                    sub="ADMISSIONS & OPERATIONS"
                    color="rose"
                  />
                </div>
              </div>

              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center">
                <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest mb-4">
                  Patient Distribution
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributionData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {distributionData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STAFF DIRECTORY VIEW (EXTENDED ROWS BASED ON DB SPECS)  */}
        {activeTab === "staff" && (
          <div className="animate-fade-in-up">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h1 className="text-4xl font-black text-slate-900 italic">
                  Staff Directory
                </h1>
                <p className="text-slate-400 font-medium mt-1">
                  Total Registered Profiles: {staffList.length}
                </p>
              </div>
              <button
                onClick={() => setIsRegModalOpen(true)}
                className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 flex items-center gap-2 hover:bg-blue-700 transition-all cursor-pointer"
              >
                <Plus size={18} /> Register System Profile
              </button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex items-center gap-4 bg-slate-50/30">
                <Search className="text-slate-300" size={20} />
                <input
                  type="text"
                  placeholder="Search by name, staff ID, or position..."
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
                    <tr className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-50 tracking-widest">
                      <th className="p-6">Staff / Profile ID</th>
                      <th className="p-6">Full Name</th>
                      <th className="p-6">Title & Dept</th>
                      <th className="p-6">National ID / Contact</th>
                      <th className="p-6">Qualification / Experience</th>
                      <th className="p-6">Contract Status</th>
                      <th className="p-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-bold text-slate-600">
                    {currentItems.map((staff) => (
                      <tr
                        key={staff.id}
                        className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="p-6">
                          <span className="text-blue-600 font-black block">
                            {staff.id}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-bold">
                            {staff.profileId}
                          </span>
                        </td>
                        <td className="p-6">
                          <span className="text-slate-900 block">
                            {staff.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-normal">
                            {staff.address}
                          </span>
                        </td>
                        <td className="p-6">
                          <span className="text-slate-800 block text-xs uppercase">
                            {staff.jobTitle}
                          </span>
                          <span className="text-[10px] text-blue-500 block font-black uppercase tracking-wider">
                            {staff.dept}
                          </span>
                        </td>
                        <td className="p-6 text-xs">
                          <span className="text-slate-700 block font-mono">
                            {staff.nationalId}
                          </span>
                          <span className="text-slate-400 block font-medium">
                            {staff.phone}
                          </span>
                        </td>
                        <td className="p-6 text-xs">
                          <span className="text-slate-700 block truncate max-w-[180px]">
                            {staff.qualification}
                          </span>
                          <span className="text-slate-400 block font-medium">
                            {staff.yearsExp} Years Exp
                          </span>
                        </td>
                        <td className="p-6">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                              staff.contractStatus === "Active"
                                ? "bg-emerald-100 text-emerald-600"
                                : staff.contractStatus === "On Leave"
                                  ? "bg-amber-100 text-amber-600"
                                  : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {staff.contractStatus}
                          </span>
                        </td>
                        <td className="p-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingStaff(staff);
                                setIsEditModalOpen(true);
                              }}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(staff.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black disabled:opacity-30 transition-all cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black disabled:opacity-30 transition-all cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
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
                <ProfileField label="Full Name" value="Head Administrator" />
                <ProfileField label="Identity/Email" value="admin@mesra.com" />
                <ProfileField label="Assigned Phone" value="+251 90 007 1103" />
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="max-w-4xl mx-auto animate-fade-in-up">
            <h1 className="text-4xl font-black text-slate-900 italic mb-8">
              System Configuration
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SettingsCard
                icon={<Shield className="text-blue-600" />}
                title="Security & RBAC"
                desc="Manage role-based access control and encryption keys."
              />
              <SettingsCard
                icon={<Database className="text-emerald-600" />}
                title="Database Backups"
                desc="Configure automated clinical record backups and recovery."
              />
              <SettingsCard
                icon={<Bell className="text-amber-600" />}
                title="Audit Alerts"
                desc="Set threshold for real-time operational audit alerts."
              />
              <SettingsCard
                icon={<Lock className="text-purple-600" />}
                title="MFA Control"
                desc="Enable Multi-Factor Authentication for clinical portal access."
              />
            </div>
          </div>
        )}
      </main>

      {/* COMPREHENSIVE REGISTRATION MODAL (ALL DB FIELDS CAPTURED)  */}
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
              Staff Directory & Operational Profiles Link{" "}
            </p>

            <form onSubmit={handleRegisterSave} className="space-y-4">
              {/* SECTION A: Staff_Directory Specifications  */}
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b pb-1">
                1. Demographics & Contact{" "}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                    Full Name{" "}
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
                    National ID{" "}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ET-9941"
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
                    Date of Birth{" "}
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
                    Gender{" "}
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
                    Contact Phone{" "}
                  </label>
                  <input
                    type="text"
                    placeholder="+251..."
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
                    Emergency Contact{" "}
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
                  Home Address{" "}
                </label>
                <input
                  type="text"
                  placeholder="Sub City, Neighborhood"
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold mt-1 text-xs outline-none"
                  value={newStaff.address}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, address: e.target.value })
                  }
                  required
                />
              </div>

              {/* SECTION B: Professional_Profiles Specifications  */}
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b pb-1 pt-2">
                2. Clinical & Professional Credentials{" "}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                    Job Title{" "}
                  </label>
                  <select
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold mt-1 text-xs outline-none"
                    value={newStaff.jobTitle}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, jobTitle: e.target.value })
                    }
                  >
                    <option>Doctor</option>
                    <option>Nurse</option>
                    <option>Lab Tech</option>
                    <option>Receptionist</option>
                    <option>Cashier</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                    Department{" "}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Outpatient, Radiology"
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
                    Qualification{" "}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MD, Degree, PhD"
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
                    Certification No{" "}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MOH-XXXX"
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
                    Years of Experience{" "}
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
                    Contract Status{" "}
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

      {/* MODAL 2: EDIT STAFF SPECIFIC MAPS */}
      {isEditModalOpen && editingStaff && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 animate-pop-in border border-slate-100 shadow-2xl">
            <h3 className="text-2xl font-black italic mb-6">Update Profile</h3>
            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">
                  Update Full Name{" "}
                </label>
                <input
                  type="text"
                  value={editingStaff.name}
                  onChange={(e) =>
                    setEditingStaff({ ...editingStaff, name: e.target.value })
                  }
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold mt-1 outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">
                  Update Qualification{" "}
                </label>
                <input
                  type="text"
                  value={editingStaff.qualification}
                  onChange={(e) =>
                    setEditingStaff({
                      ...editingStaff,
                      qualification: e.target.value,
                    })
                  }
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold mt-1 outline-none"
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-blue-100"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- SUBSIDIARY SUB-COMPONENTS ---
const NavItem = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all cursor-pointer ${active ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-slate-400 hover:bg-slate-50"}`}
  >
    {React.cloneElement(icon, { size: 20 })}{" "}
    <span className="font-black text-sm">{label}</span>
  </button>
);

const StatCardGraph = ({ label, value, color, bgColor }) => (
  <div
    className={`${bgColor} p-8 rounded-[2.5rem] border border-white shadow-sm relative overflow-hidden group`}
  >
    <div className="relative z-10">
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
        {label}
      </p>
      <h2 className="text-4xl font-black mt-2">{value}</h2>
      <button className="text-[9px] font-black text-blue-600 mt-4 uppercase hover:underline">
        View All →
      </button>
    </div>
    <div className="absolute inset-0 top-12 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={patientData}>
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

export default AdminDashboard;
