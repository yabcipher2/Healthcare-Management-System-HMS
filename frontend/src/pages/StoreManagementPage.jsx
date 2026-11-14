import React, { useState, useEffect, useCallback } from "react";
import {
  Boxes,
  Search,
  LogOut,
  ShieldAlert,
  Menu,
  X,
  PlusCircle,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  Heart,
  FileText,
  Activity,
  ClipboardList,
  TestTube,
  Bed,
  Pill,
  Hospital,
  Calendar,
  User,
  Save,
} from "lucide-react";
import SidebarCollapseButton from "../components/SidebarCollapseButton";
import {
  logAudit,
  fetchAuditLogs,
  fetchAuditAlertsCount,
  clearExpiredToken,
} from "../utils/audit";
import NotificationBell from "../components/NotificationBell";
import ThemeToggle from "../components/ThemeToggle";

export default function StoreManagementPage({ onLogout }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [subTab, setSubTab] = useState("medicines");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [beds, setBeds] = useState([]);
  const [labAgents, setLabAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [restockAmount, setRestockAmount] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerType, setRegisterType] = useState("");
  const [registerForm, setRegisterForm] = useState({});
  const hospitalLogo = "/mesra icon.png";
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");
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
      const result = await fetchAuditLogs({
        page: 1,
        limit: 20,
        module: "Store-Management",
      });
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch inventory
        const inventoryResponse = await fetch(`${API_URL}/api/store`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (inventoryResponse.ok) {
          const inventoryData = await inventoryResponse.json();
          const mappedInventory = (inventoryData.data || []).map((item) => ({
            id: item.itemId,
            name: item.name,
            type: item.type,
            stock: item.stock,
            unit: item.unit,
            minThreshold: item.minThreshold,
            shelfLocation: item.shelfLocation,
            status: item.status,
            expiryDate: item.expiryDate,
          }));
          setInventory(mappedInventory);
        }

        // Fetch beds
        const bedsResponse = await fetch(`${API_URL}/api/store/beds`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (bedsResponse.ok) {
          const bedsData = await bedsResponse.json();
          setBeds(bedsData.data || []);
        }

        // Fetch lab agents
        const labAgentsResponse = await fetch(
          `${API_URL}/api/store/lab-agents`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (labAgentsResponse.ok) {
          const labAgentsData = await labAgentsResponse.json();
          const mappedLabAgents = (labAgentsData.data || []).map((agent) => ({
            id: agent.agentId,
            name: agent.name,
            type: agent.category,
            quantity: agent.quantity,
            stock: agent.quantity,
            unit: agent.unit,
            status: agent.status,
          }));
          setLabAgents(mappedLabAgents);
        }

        setError("");
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [API_URL, token]);

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    const parsedAmount = parseInt(restockAmount);
    if (!parsedAmount || parsedAmount <= 0) return;
    try {
      setSaving(true);
      const newStock = selectedItem.stock + parsedAmount;
      const newStatus =
        newStock > selectedItem.minThreshold ? "In Stock" : "Low Stock";
      const response = await fetch(
        `${API_URL}/api/store/${selectedItem.id}/stock`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ stock: newStock, status: newStatus }),
        },
      );
      if (!response.ok) throw new Error("Failed to update stock");
      const result = await response.json();
      setInventory((prev) =>
        prev.map((item) => (item.id === selectedItem.id ? result.data : item)),
      );

      await logAudit({
        action: "UPDATE",
        module: "Store-Management",
        details: `Restocked ${selectedItem.name} by ${parsedAmount} ${selectedItem.unit}`,
        targetId: selectedItem.id,
        targetType: "Inventory",
      });

      setSelectedItem(null);
      setRestockAmount("");
      loadAuditLogs();
      loadAuditAlertsCount();
      alert(
        `Restock successful. Added ${parsedAmount} units to ${selectedItem.name}.`,
      );
    } catch (err) {
      alert(`Restock failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRegisterSubmit = async () => {
    try {
      setSaving(true);

      let endpoint = "";
      let auditModule = "Store-Management";
      let bodyData = { ...registerForm };

      if (registerType === "medicine") {
        endpoint = `${API_URL}/api/store`;
        if (!bodyData.itemId) {
          bodyData.itemId = `MED-${Date.now()}`;
        }
      } else if (registerType === "bed") {
        endpoint = `${API_URL}/api/store/beds`;
        if (!bodyData.type) {
          bodyData.type = "General";
        }
      } else if (registerType === "lab-agent") {
        endpoint = `${API_URL}/api/store/lab-agents`;
        bodyData.category = bodyData.type || "Consumable";
        delete bodyData.type;
        bodyData.quantity = bodyData.stock;
        delete bodyData.stock;

        if (!bodyData.agentId) {
          bodyData.agentId = `LA-${Date.now()}`;
        }
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      });

      if (response.ok) {
        await logAudit({
          action: "CREATE",
          module: auditModule,
          details: `Registered new ${registerType}: ${registerForm.name}`,
          targetId:
            registerForm.id || registerForm.bedId || registerForm.agentId,
          targetType: registerType,
        });
        window.location.reload();
        setShowRegisterModal(false);
        setRegisterForm({});
        loadAuditLogs();
        loadAuditAlertsCount();
      } else {
        const errorData = await response.json();
        if (response.status === 401) {
          clearExpiredToken();
          alert("Session expired. Please log in again.");
          onLogout();
          return;
        }
        throw new Error(errorData.message || "Registration failed");
      }
    } catch (err) {
      alert(`Registration failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const openRegisterModal = (type) => {
    setRegisterType(type);
    setRegisterForm(getInitialForm(type));
    setShowRegisterModal(true);
  };

  const getInitialForm = (type) => {
    switch (type) {
      case "medicine":
        return {
          itemId: "",
          name: "",
          type: "medicines",
          stock: 0,
          unit: "tablets",
          minThreshold: 10,
          shelfLocation: "",
          expiryDate: "",
          status: "In Stock",
        };
        break;
      case "bed":
        return {
          bedId: "",
          room: "",
          type: "General",
          status: "Available",
        };
        break;
      case "lab-agent":
        return {
          agentId: "",
          name: "",
          type: "Consumable",
          stock: 0,
          unit: "ml",
          status: "In Stock",
        };
        break;
      default:
        return {};
    }
  };

  // Filter data based on active tab and search query
  const getFilteredData = () => {
    let data = [];
    if (activeTab === "inventory") {
      if (subTab === "medicines") {
        data = inventory.filter((item) => item.type === "medicines");
      } else if (subTab === "beds") {
        data = beds;
      } else if (subTab === "lab-agents") {
        data = labAgents;
      }
    }

    return data.filter(
      (item) =>
        (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.id || item.bedId || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
    );
  };

  const filteredData = getFilteredData();

  // Get expiring medicines (within 30 days)
  const getExpiringMedicines = () => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return inventory.filter(
      (item) =>
        item.type === "medicines" &&
        item.expiryDate &&
        new Date(item.expiryDate) <= thirtyDaysFromNow,
    );
  };

  const expiringMedicines = getExpiringMedicines();

  // Dashboard metrics
  const totalMedicines = inventory.filter(
    (item) => item.type === "medicines",
  ).length;
  const totalBeds = beds.length;
  const totalLabAgents = labAgents.length;
  const lowStockMedicines = inventory.filter(
    (item) => item.type === "medicines" && item.stock <= item.minThreshold,
  ).length;
  const occupiedBeds = beds.filter((bed) => bed.status === "Occupied").length;
  const availableBeds = beds.filter((bed) => bed.status === "Available").length;

  const openInventorySection = (section) => {
    setActiveTab("inventory");
    setSubTab(section);
    setSearchQuery("");
    setSelectedItem(null);
  };

  return (
    <div className="flex min-h-screen bg-[#0E1B17] text-slate-200 font-sans antialiased text-[10px] selection:bg-[#10B981] selection:text-white">
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-16"} bg-[#0E1B17] text-slate-300 flex flex-col justify-between shrink-0 sticky top-0 h-screen overflow-hidden z-30 font-mono border-r border-[#0E1B17] transition-all duration-300`}
      >
        <div>
          {/* Brand Panel */}
          <div
            className={`p-4 border-b border-[#29323a] flex items-center ${sidebarOpen ? "gap-2.5" : "justify-center"} bg-[#0E1B17]`}
          >
            <div className="w-8 h-8 rounded-lg bg-[#10B981] flex items-center justify-center border border-[#10B981]/20 shadow-[0_0_15px_rgba(16,185,129,0.4)] shrink-0">
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
                <h3 className="font-black tracking-wider text-[13px] text-white leading-none">
                  MESRA<span className="text-[#10B981]">STORE</span>
                </h3>
                <span className="text-[9px] text-[#94A3B8] font-bold tracking-widest block mt-0.5 uppercase">
                  Supply Management
                </span>
              </div>
            )}
          </div>

          {/* Sidebar Collapse Control */}
          <SidebarCollapseButton
            collapsed={!sidebarOpen}
            onToggle={() => setSidebarOpen((open) => !open)}
            label="store sidebar"
          />

          {/* NAVIGATION */}
          <nav className="p-3 space-y-1 pt-4">
            {sidebarOpen && (
              <div className="text-[9px] font-black uppercase text-[#94A3B8] px-3 py-2 tracking-widest">
                Management Modules
              </div>
            )}

            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center ${sidebarOpen ? "gap-2.5 px-3" : "justify-center px-2"} py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition ${activeTab === "dashboard" ? "bg-[#10B981] text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] font-black" : "text-[#94A3B8] hover:bg-[#0E1B17] hover:text-white"}`}
            >
              <Boxes size={14} /> {sidebarOpen && "Dashboard"}
            </button>

            <button
              onClick={() => openInventorySection("medicines")}
              className={`w-full flex items-center ${sidebarOpen ? "gap-2.5 px-3" : "justify-center px-2"} py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition ${activeTab === "inventory" ? "bg-[#10B981] text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] font-black" : "text-[#94A3B8] hover:bg-[#0E1B17] hover:text-white"}`}
            >
              <ClipboardList size={14} /> {sidebarOpen && "Inventory"}
            </button>

            <button
              onClick={() => openInventorySection("medicines")}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition text-[#94A3B8] hover:bg-[#0E1B17] hover:text-white"
            >
              <Pill size={14} /> {sidebarOpen && "Medicines"}
            </button>

            <button
              onClick={() => openInventorySection("lab-agents")}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition text-[#94A3B8] hover:bg-[#0E1B17] hover:text-white"
            >
              <TestTube size={14} /> {sidebarOpen && "Lab Agents"}
            </button>

            <button
              onClick={() => openInventorySection("beds")}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition text-[#94A3B8] hover:bg-[#0E1B17] hover:text-white"
            >
              <Bed size={14} /> {sidebarOpen && "Ward Beds"}
            </button>

            <button
              onClick={() => setActiveTab("register")}
              className={`w-full flex items-center ${sidebarOpen ? "gap-2.5 px-3" : "justify-center px-2"} py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition ${activeTab === "register" ? "bg-[#10B981] text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] font-black" : "text-[#94A3B8] hover:bg-[#0E1B17] hover:text-white"}`}
            >
              <PlusCircle size={14} /> {sidebarOpen && "Register"}
            </button>

            <button
              onClick={() => {
                setActiveTab("audit");
                loadAuditLogs();
              }}
              className={`w-full flex items-center ${sidebarOpen ? "justify-between px-3" : "justify-center px-2"} py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition ${activeTab === "audit" ? "bg-[#10B981] text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] font-black" : "text-[#94A3B8] hover:bg-[#0E1B17] hover:text-white"}`}
            >
              <div
                className={`flex items-center ${sidebarOpen ? "gap-2.5" : ""}`}
              >
                <ShieldAlert size={14} /> {sidebarOpen && "Security Trails"}
              </div>
              {sidebarOpen && (
                <span className="bg-[#0E1B17] text-[#10B981] px-2 py-0.5 rounded text-[8px] font-bold border border-[#10B981]/30">
                  {auditAlertsCount}
                </span>
              )}
            </button>

          </nav>
        </div>

        {/* LOGOUT FOOTER */}
        <div className="p-4 border-t border-[#29323a] bg-[#0E1B17] space-y-3">
          {sidebarOpen && (
            <div className="bg-[#0E1B17] rounded-lg p-2.5 border border-[#29323a] text-[10px] font-mono text-[#94A3B8] space-y-1">
               <p className="text-[#10B981] font-bold">Location: Store Wing</p>
              <p>Role: Store Manager</p>
            </div>
          )}

          <button
            onClick={onLogout}
            className="w-full py-2 bg-[#EF4444]/40 hover:bg-[#b91c1c] border border-[#EF4444]/30 text-[#EF4444] font-bold uppercase text-[10px] tracking-wider rounded-lg transition flex items-center justify-center gap-1.5"
          >
            <LogOut size={13} /> {sidebarOpen && "Exit Platform"}
          </button>
        </div>
      </aside>
      {/* MAIN VIEWPORT PANEL */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-[#0E1B17]/80 border-b border-[#29323a] px-6 py-4 z-20 flex justify-between items-center shadow-sm backdrop-blur-sm">
          <h1 className="text-[12px] font-black tracking-widest text-white uppercase font-mono flex items-center gap-2">
            Store Management System:
            <span className="text-[#10B981]">
              {activeTab === "dashboard"
                ? "Dashboard"
                : activeTab === "inventory"
                  ? "Inventory"
                  : activeTab === "register"
                    ? "Register"
                    : "Audit"}
            </span>
          </h1>
          <div className="flex items-center gap-3">
            <NotificationBell role="Store" />
            <ThemeToggle />
            <div className="text-right font-mono text-[10px] text-[#94A3B8]">
              Status:{" "}
              <span className="text-[#10B981] font-bold">Live System</span>
            </div>
          </div>
        </header>
        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div className="p-6 space-y-6">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-[#0E1B17] p-4 rounded-xl border border-[#29323a] shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono font-bold text-[#94A3B8] uppercase tracking-wider">
                    Total Medicines
                  </p>
                  <h3 className="text-lg font-black text-white mt-1">
                    {totalMedicines} Items
                  </h3>
                </div>
                <Pill className="text-[#10B981]" size={20} />
              </div>

              <div className="bg-[#0E1B17] p-4 rounded-xl border border-[#29323a] shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono font-bold text-[#94A3B8] uppercase tracking-wider">
                    Total Beds
                  </p>
                  <h3 className="text-lg font-black text-white mt-1">
                    {totalBeds} Units
                  </h3>
                </div>
                <Bed className="text-[#10B981]" size={20} />
              </div>

              <div className="bg-[#0E1B17] p-4 rounded-xl border border-[#29323a] shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono font-bold text-[#94A3B8] uppercase tracking-wider">
                    Lab Agents
                  </p>
                  <h3 className="text-lg font-black text-white mt-1">
                    {totalLabAgents} Agents
                  </h3>
                </div>
                <TestTube className="text-[#10B981]" size={20} />
              </div>

              <div className="bg-[#0E1B17] p-4 rounded-xl border border-[#29323a] shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono font-bold text-[#10B981] uppercase tracking-wider">
                    Low Stock Medicines
                  </p>
                  <h3 className="text-lg font-black text-white mt-1">
                    {lowStockMedicines} Items
                  </h3>
                </div>
                <TrendingDown
                  className={
                    lowStockMedicines > 0
                      ? "text-[#10B981] animate-bounce"
                      : "text-slate-300"
                  }
                  size={20}
                />
              </div>

              <div className="bg-[#0E1B17] p-4 rounded-xl border border-[#29323a] shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono font-bold text-[#10B981] uppercase tracking-wider">
                    Occupied Beds
                  </p>
                  <h3 className="text-lg font-black text-white mt-1">
                    {occupiedBeds} / {totalBeds}
                  </h3>
                </div>
                <Activity className="text-[#10B981]" size={20} />
              </div>

              <div className="bg-[#0E1B17] p-4 rounded-xl border border-[#29323a] shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono font-bold text-[#10B981] uppercase tracking-wider">
                    Available Beds
                  </p>
                  <h3 className="text-lg font-black text-white mt-1">
                    {availableBeds} Units
                  </h3>
                </div>
                <CheckCircle className="text-[#10B981]" size={20} />
              </div>
            </div>

            {/* Expiry Alert */}
            {expiringMedicines.length > 0 && (
              <div className="bg-[#0E1B17] border border-[#10B981]/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="text-[#10B981]" size={16} />
                  <h3 className="text-[11px] font-black text-[#10B981] uppercase tracking-wider">
                    Medicines Expiring Soon ({expiringMedicines.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {expiringMedicines.slice(0, 5).map((medicine) => (
                    <div
                      key={medicine.id}
                      className="flex justify-between items-center p-2 bg-[#0E1B17] rounded border border-[#29323a]"
                    >
                      <div>
                        <span className="text-[11px] font-bold text-white">
                          {medicine.name}
                        </span>
                        <span className="text-[10px] text-[#94A3B8] ml-2">
                          Stock: {medicine.stock} {medicine.unit}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#10B981] bg-[#29323a] px-2 py-1 rounded">
                        {new Date(medicine.expiryDate).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {/* INVENTORY TAB */}
        {activeTab === "inventory" && (
          <div className="p-6 space-y-6">
            {/* Sub Tabs */}
            <div className="flex gap-2 bg-[#0E1B17] p-1 rounded-lg border border-[#29323a]">
              <button
                onClick={() => setSubTab("medicines")}
                className={`px-4 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition ${
                  subTab === "medicines"
                    ? "bg-[#10B981] text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                    : "text-[#94A3B8] hover:bg-[#0E1B17] hover:text-white"
                }`}
              >
                <Pill size={14} className="inline mr-1" /> Medicines
              </button>
              <button
                onClick={() => setSubTab("beds")}
                className={`px-4 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition ${
                  subTab === "beds"
                    ? "bg-[#10B981] text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                    : "text-[#94A3B8] hover:bg-[#0E1B17] hover:text-white"
                }`}
              >
                <Bed size={14} className="inline mr-1" /> Beds
              </button>
              <button
                onClick={() => setSubTab("lab-agents")}
                className={`px-4 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition ${
                  subTab === "lab-agents"
                    ? "bg-[#10B981] text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                    : "text-[#94A3B8] hover:bg-[#0E1B17] hover:text-white"
                }`}
              >
                <TestTube size={14} className="inline mr-1" /> Lab Agents
              </button>
            </div>

            {/* Search */}
            <div className="bg-[#0E1B17] rounded-xl p-4 border border-[#29323a] shadow-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder={`Search ${subTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#0E1B17] border border-[#29323a] rounded-lg text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-[#10B981] placeholder:text-[#94A3B8]"
                />
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-[#0E1B17] rounded-xl border border-[#29323a] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-[11px] font-mono">
                  <thead className="bg-[#0E1B17] text-[#94A3B8] uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-3 py-2 text-left font-bold">ID</th>
                      <th className="px-3 py-2 text-left font-bold">Name</th>
                      {subTab === "medicines" && (
                        <>
                          <th className="px-3 py-2 text-left font-bold">
                            Stock
                          </th>
                          <th className="px-3 py-2 text-left font-bold">
                            Location
                          </th>
                          <th className="px-3 py-2 text-left font-bold">
                            Expiry
                          </th>
                          <th className="px-3 py-2 text-left font-bold">
                            Status
                          </th>
                        </>
                      )}
                      {subTab === "beds" && (
                        <>
                          <th className="px-3 py-2 text-left font-bold">
                            Room
                          </th>
                          <th className="px-3 py-2 text-left font-bold">
                            Type
                          </th>
                          <th className="px-3 py-2 text-left font-bold">
                            Status
                          </th>
                          <th className="px-3 py-2 text-left font-bold">
                            Patient
                          </th>
                        </>
                      )}
                      {subTab === "lab-agents" && (
                        <>
                          <th className="px-3 py-2 text-left font-bold">
                            Type
                          </th>
                          <th className="px-3 py-2 text-left font-bold">
                            Stock
                          </th>
                          <th className="px-3 py-2 text-left font-bold">
                            Status
                          </th>
                        </>
                      )}
                      <th className="px-3 py-2 text-left font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#29323a]">
                    {filteredData.length === 0 ? (
                      <tr>
                        <td
                          colSpan={
                            subTab === "medicines"
                              ? 7
                              : subTab === "beds"
                                ? 6
                                : 5
                          }
                          className="px-3 py-6 text-center text-[#94A3B8] italic"
                        >
                          No {subTab} found.
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((item) => (
                        <tr
                          key={item.id || item.bedId}
                          className="hover:bg-[#0E1B17] cursor-pointer"
                          onClick={() => setSelectedItem(item)}
                        >
                          <td className="px-3 py-2 font-black text-[#10B981]">
                            {item.id || item.bedId}
                          </td>
                          <td className="px-3 py-2 text-white">
                            {item.name || item.room}
                          </td>
                          {subTab === "medicines" && (
                            <>
                              <td className="px-3 py-2 text-white">
                                {item.stock} {item.unit}
                              </td>
                              <td className="px-3 py-2 text-[#94A3B8]">
                                {item.shelfLocation}
                              </td>
                              <td className="px-3 py-2 text-[#94A3B8]">
                                {item.expiryDate ? (
                                  <span
                                    className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                      new Date(item.expiryDate) <=
                                      new Date(
                                        Date.now() + 30 * 24 * 60 * 60 * 1000,
                                      )
                                        ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30"
                                        : "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30"
                                    }`}
                                  >
                                    {new Date(
                                      item.expiryDate,
                                    ).toLocaleDateString()}
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="px-3 py-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                    item.status === "Low Stock"
                                      ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30"
                                      : "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30"
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </td>
                            </>
                          )}
                          {subTab === "beds" && (
                            <>
                              <td className="px-3 py-2 text-[#94A3B8]">
                                {item.room}
                              </td>
                              <td className="px-3 py-2 text-[#94A3B8]">
                                {item.type}
                              </td>
                              <td className="px-3 py-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                    item.status === "Occupied"
                                      ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30"
                                      : "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30"
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-[#94A3B8]">
                                {item.patientName || "—"}
                              </td>
                            </>
                          )}
                          {subTab === "lab-agents" && (
                            <>
                              <td className="px-3 py-2 text-[#94A3B8]">
                                {item.type}
                              </td>
                              <td className="px-3 py-2 text-white">
                                {item.stock} {item.unit}
                              </td>
                              <td className="px-3 py-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                    item.status === "Low Stock"
                                      ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30"
                                      : "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30"
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </td>
                            </>
                          )}
                          <td
                            className="px-3 py-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => setSelectedItem(item)}
                              className="px-2 py-1 bg-[#10B981] text-white rounded text-[10px] font-bold hover:bg-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                            >
                              View
                            </button>
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
        {/* REGISTER TAB */}
        {activeTab === "register" && (
          <div className="p-6 space-y-6">
            <div className="bg-[#0E1B17] rounded-xl p-6 border border-[#29323a] shadow-sm">
              <h2 className="text-[13px] font-black text-white uppercase tracking-wider mb-4">
                Register New Items
              </h2>
              <p className="text-[11px] text-[#94A3B8] mb-6">
                Select the type of item you want to register in the system.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => openRegisterModal("medicine")}
                  className="p-6 border-2 border-[#29323a] rounded-xl hover:border-[#10B981] hover:bg-[#0E1B17] transition group"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-[#29323a] rounded-full flex items-center justify-center mb-3 group-hover:bg-[#10B981]/20 transition">
                      <Pill className="text-[#10B981]" size={24} />
                    </div>
                    <h3 className="text-[12px] font-bold text-white uppercase tracking-wider mb-1">
                      Medicine
                    </h3>
                    <p className="text-[10px] text-[#94A3B8]">
                      Register pharmaceutical items
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => openRegisterModal("bed")}
                  className="p-6 border-2 border-[#29323a] rounded-xl hover:border-[#10B981] hover:bg-[#0E1B17] transition group"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-[#29323a] rounded-full flex items-center justify-center mb-3 group-hover:bg-[#10B981]/20 transition">
                      <Bed className="text-[#10B981]" size={24} />
                    </div>
                    <h3 className="text-[12px] font-bold text-white uppercase tracking-wider mb-1">
                      Bed
                    </h3>
                    <p className="text-[10px] text-[#94A3B8]">
                      Register hospital beds
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => openRegisterModal("lab-agent")}
                  className="p-6 border-2 border-[#29323a] rounded-xl hover:border-[#10B981] hover:bg-[#0E1B17] transition group"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-[#29323a] rounded-full flex items-center justify-center mb-3 group-hover:bg-[#10B981]/20 transition">
                      <TestTube className="text-[#10B981]" size={24} />
                    </div>
                    <h3 className="text-[12px] font-bold text-white uppercase tracking-wider mb-1">
                      Lab Agent
                    </h3>
                    <p className="text-[10px] text-[#94A3B8]">
                      Register laboratory reagents
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
        {/* AUDIT TAB */}
        {activeTab === "audit" && (
          <div className="px-6 pb-6 space-y-4 animate-fadeIn">
            <div className="bg-[#0E1B17] rounded-2xl border border-[#29323a] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#29323a] flex items-center justify-between bg-[#0E1B17]/50">
                <div>
                  <h1 className="text-lg font-black text-white">
                    Store Management Audit Logs
                  </h1>
                  <p className="text-[#94A3B8] font-medium mt-0.5 text-[11px]">
                    System activity and changes tracking
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold bg-[#29323a] text-[#10B981] border border-[#10B981]/30 px-2 py-1 rounded uppercase">
                  Store Module
                </span>
              </div>
              {auditLogsError && (
                <div className="mx-4 mt-4 p-3 bg-[#10B981]/20 border border-[#10B981]/30 rounded-lg text-[11px] font-bold text-[#10B981]">
                  {auditLogsError}
                </div>
              )}
              {auditLogsLoading ? (
                <div className="p-8 text-center text-[11px] font-black text-[#94A3B8] uppercase tracking-wider">
                  Loading audit logs...
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="p-8 text-center text-[11px] font-black text-[#94A3B8] uppercase tracking-wider">
                  No audit logs found for store management
                </div>
              ) : (
                <div className="divide-y divide-[#29323a]">
                  {auditLogs.map((log) => (
                    <div
                      key={log._id || log.id}
                      className="p-4 flex items-start gap-3 hover:bg-[#0E1B17] transition"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#29323a] flex items-center justify-center shrink-0 text-[#10B981]">
                        {log.action === "CREATE" && <PlusCircle size={16} />}
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
                          <span className="text-[10px] font-mono font-bold bg-[#29323a] text-[#10B981] px-2 py-0.5 rounded uppercase border border-[#10B981]/30">
                            {log.action}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#94A3B8] mt-1 leading-relaxed">
                          {log.details}
                        </p>
                        <p className="text-[10px] text-[#94A3B8] mt-1.5 font-mono">
                          {log.userName} • {log.userRole} •{" "}
                          {log.department || "—"} •{" "}
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
        {/* REGISTRATION MODAL */}
        {showRegisterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E1B17]/90 backdrop-blur-sm">
            <div className="bg-[#0E1B17] rounded-2xl border border-[#29323a] shadow-2xl w-full max-w-md">
              <div className="p-4 bg-[#0E1B17] text-white flex justify-between items-center border-b border-[#29323a]">
                <h2 className="text-[13px] font-black uppercase tracking-wider text-white">
                  Register {registerType}
                </h2>
                <button
                  onClick={() => setShowRegisterModal(false)}
                  className="text-[#94A3B8] hover:text-white transition"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {registerType === "medicine" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                          Item ID *
                        </label>
                        <input
                          type="text"
                          value={registerForm.itemId || ""}
                          onChange={(e) =>
                            setRegisterForm({
                              ...registerForm,
                              itemId: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-[#0E1B17] border border-[#29323a] rounded-lg text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                          placeholder="e.g., MED-001"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                          Medicine Name *
                        </label>
                        <input
                          type="text"
                          value={registerForm.name || ""}
                          onChange={(e) =>
                            setRegisterForm({
                              ...registerForm,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-[#0E1B17] border border-[#29323a] rounded-lg text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                          placeholder="Enter medicine name"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                          Initial Stock
                        </label>
                        <input
                          type="number"
                          value={registerForm.stock || 0}
                          onChange={(e) =>
                            setRegisterForm({
                              ...registerForm,
                              stock: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 bg-[#0E1B17] border border-[#29323a] rounded-lg text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                          Unit
                        </label>
                        <select
                          value={registerForm.unit || "tablets"}
                          onChange={(e) =>
                            setRegisterForm({
                              ...registerForm,
                              unit: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-[#0E1B17] border border-[#29323a] rounded-lg text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                        >
                          <option value="tablets">Tablets</option>
                          <option value="capsules">Capsules</option>
                          <option value="ml">ml</option>
                          <option value="mg">mg</option>
                          <option value="bottles">Bottles</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                          Min Threshold
                        </label>
                        <input
                          type="number"
                          value={registerForm.minThreshold || 10}
                          onChange={(e) =>
                            setRegisterForm({
                              ...registerForm,
                              minThreshold: parseInt(e.target.value) || 10,
                            })
                          }
                          className="w-full px-3 py-2 bg-[#0E1B17] border border-[#29323a] rounded-lg text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                          Expiry Date
                        </label>
                        <input
                          type="date"
                          value={registerForm.expiryDate || ""}
                          onChange={(e) =>
                            setRegisterForm({
                              ...registerForm,
                              expiryDate: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-[#0E1B17] border border-[#29323a] rounded-lg text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                        Shelf Location
                      </label>
                      <input
                        type="text"
                        value={registerForm.shelfLocation || ""}
                        onChange={(e) =>
                          setRegisterForm({
                            ...registerForm,
                            shelfLocation: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-[#0E1B17] border border-[#29323a] rounded-lg text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                        placeholder="e.g., A-1-5"
                      />
                    </div>
                  </>
                )}

                {registerType === "bed" && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                        Bed ID *
                      </label>
                      <input
                        type="text"
                        value={registerForm.bedId || ""}
                        onChange={(e) =>
                          setRegisterForm({
                            ...registerForm,
                            bedId: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-[#0E1B17] border border-[#29323a] rounded-lg text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                        placeholder="e.g., BED001"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                          Room
                        </label>
                        <input
                          type="text"
                          value={registerForm.room || ""}
                          onChange={(e) =>
                            setRegisterForm({
                              ...registerForm,
                              room: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-[#0E1B17] border border-[#29323a] rounded-lg text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                          placeholder="e.g., R101"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                          Type
                        </label>
                        <select
                          value={registerForm.type || "General"}
                          onChange={(e) =>
                            setRegisterForm({
                              ...registerForm,
                              type: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-[#0E1B17] border border-[#29323a] rounded-lg text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                        >
                          <option value="General">General</option>
                          <option value="Critical Care">Critical Care</option>
                          <option value="Children's Block">
                            Children's Block
                          </option>
                          <option value="Maternity">Maternity</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                        Status
                      </label>
                      <select
                        value={registerForm.status || "Available"}
                        onChange={(e) =>
                          setRegisterForm({
                            ...registerForm,
                            status: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-[#0E1B17] border border-[#29323a] rounded-lg text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                      >
                        <option value="Available">Available</option>
                        <option value="Occupied">Occupied</option>
                        <option value="Maintenance">Maintenance</option>
                      </select>
                    </div>
                  </>
                )}

                {registerType === "lab-agent" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                          Agent ID *
                        </label>
                        <input
                          type="text"
                          value={registerForm.agentId || ""}
                          onChange={(e) =>
                            setRegisterForm({
                              ...registerForm,
                              agentId: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-[#0E1B17] border border-[#29323a] rounded-lg text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                          placeholder="e.g., LA-001"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                          Agent Name *
                        </label>
                        <input
                          type="text"
                          value={registerForm.name || ""}
                          onChange={(e) =>
                            setRegisterForm({
                              ...registerForm,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-[#0E1B17] border border-[#29323a] rounded-lg text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                          placeholder="Enter agent name"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                          Category
                        </label>
                        <select
                          value={registerForm.type || "Consumable"}
                          onChange={(e) =>
                            setRegisterForm({
                              ...registerForm,
                              type: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-[#0E1B17] border border-[#29323a] rounded-lg text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                        >
                          <option value="Reagent">Reagent</option>
                          <option value="Consumable">Consumable</option>
                          <option value="Equipment">Equipment</option>
                          <option value="Diagnostic Kit">Diagnostic Kit</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                          Initial Stock
                        </label>
                        <input
                          type="number"
                          value={registerForm.stock || 0}
                          onChange={(e) =>
                            setRegisterForm({
                              ...registerForm,
                              stock: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 bg-[#0E1B17] border border-[#29323a] rounded-lg text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                        Unit
                      </label>
                      <select
                        value={registerForm.unit || "ml"}
                        onChange={(e) =>
                          setRegisterForm({
                            ...registerForm,
                            unit: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-[#0E1B17] border border-[#29323a] rounded-lg text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                      >
                        <option value="ml">ml</option>
                        <option value="L">L</option>
                        <option value="pcs">pcs</option>
                        <option value="mg">mg</option>
                        <option value="g">g</option>
                      </select>
                    </div>
                  </>
                )}

                <button
                  onClick={handleRegisterSubmit}
                  disabled={saving}
                  className="w-full py-3 bg-[#10B981] hover:bg-[#10B981] text-white font-black uppercase tracking-widest text-[10px] rounded-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save size={14} />{" "}
                  {saving ? "Registering..." : "Register Item"}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ITEM DETAIL MODAL */}
        {selectedItem && activeTab === "inventory" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E1B17]/90 backdrop-blur-sm">
            <div className="bg-[#0E1B17] rounded-2xl border border-[#29323a] shadow-2xl w-full max-w-md">
              <div className="p-4 bg-[#0E1B17] text-white flex justify-between items-center border-b border-[#29323a]">
                <h2 className="text-[13px] font-black uppercase tracking-wider">
                  {selectedItem.name || selectedItem.room}
                </h2>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-[#94A3B8] hover:text-white transition"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {subTab === "medicines" &&
                  selectedItem.type === "medicines" && (
                    <>
                      <div className="grid grid-cols-2 gap-3 text-[11px]">
                        <div>
                          <span className="text-[#94A3B8] font-bold block">
                            Stock:
                          </span>
                          <span className="text-white">
                            {selectedItem.stock} {selectedItem.unit}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#94A3B8] font-bold block">
                            Location:
                          </span>
                          <span className="text-white">
                            {selectedItem.shelfLocation}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#94A3B8] font-bold block">
                            Status:
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              selectedItem.status === "Low Stock"
                                ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30"
                                : "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30"
                            }`}
                          >
                            {selectedItem.status}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#94A3B8] font-bold block">
                            Expiry:
                          </span>
                          <span className="text-white">
                            {selectedItem.expiryDate
                              ? new Date(
                                  selectedItem.expiryDate,
                                ).toLocaleDateString()
                              : "—"}
                          </span>
                        </div>
                      </div>

                      {selectedItem.stock <= selectedItem.minThreshold && (
                        <form
                          onSubmit={handleRestockSubmit}
                          className="space-y-3 border-t border-[#29323a] pt-4"
                        >
                          <h3 className="text-[11px] font-bold text-[#10B981] uppercase">
                            Restock Item
                          </h3>
                          <div>
                            <label className="block text-[10px] font-bold text-[#94A3B8] uppercase mb-1">
                              Add Quantity ({selectedItem.unit})
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={restockAmount}
                              onChange={(e) => setRestockAmount(e.target.value)}
                              className="w-full px-3 py-2 bg-[#0E1B17] border border-[#29323a] rounded-lg text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                              placeholder="Enter quantity to add"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-2 bg-[#10B981] hover:bg-[#10B981] text-white font-bold uppercase text-[10px] rounded-lg transition disabled:opacity-50 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                          >
                            {saving ? "Restocking..." : "Restock Item"}
                          </button>
                        </form>
                      )}
                    </>
                  )}

                {subTab === "beds" && (
                  <div className="text-[11px] space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[#94A3B8] font-bold block">
                          Bed ID:
                        </span>
                        <span className="text-white">
                          {selectedItem.bedId}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#94A3B8] font-bold block">
                          Room:
                        </span>
                        <span className="text-white">
                          {selectedItem.room}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#94A3B8] font-bold block">
                          Type:
                        </span>
                        <span className="text-white">
                          {selectedItem.type}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#94A3B8] font-bold block">
                          Status:
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            selectedItem.status === "Occupied"
                              ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30"
                              : "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30"
                          }`}
                        >
                          {selectedItem.status}
                        </span>
                      </div>
                    </div>
                    {selectedItem.patientName && (
                      <div className="border-t border-[#29323a] pt-3">
                        <span className="text-[#94A3B8] font-bold block">
                          Patient:
                        </span>
                        <span className="text-white">
                          {selectedItem.patientName}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {subTab === "lab-agents" && (
                  <div className="text-[11px] space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[#94A3B8] font-bold block">
                          Type:
                        </span>
                        <span className="text-white">
                          {selectedItem.type}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#94A3B8] font-bold block">
                          Stock:
                        </span>
                        <span className="text-white">
                          {selectedItem.stock} {selectedItem.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#94A3B8] font-bold block">
                          Status:
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            selectedItem.status === "Low Stock"
                              ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30"
                              : "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30"
                          }`}
                        >
                          {selectedItem.status}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
