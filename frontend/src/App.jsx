import React, { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import DemoPage from "./pages/Demo";
import ReceptionPage from "./pages/ReceptionPage";
import TriagePage from "./pages/TriagePage";
import DoctorPage from "./pages/DoctorPage";
import PharmacyPage from "./pages/PharmacyPage";
import LaboratoryPage from "./pages/LaboratoryPage";
import Landingpage from "./pages/Landingpage";
import UltrasoundPage from "./pages/UltrasoundPage"; // Import the new UltrasoundPage
import WardPage from "./pages/WardPage";
import NursePage from "./pages/NursePage";
import StoreManagementPage from "./pages/StoreManagementPage";
import LabCashierPage from "./pages/LabCashierPage";
import PharmacyCashierPage from "./pages/PharmacyCashierPage";
import {
  HospitalStatusProvider,
  useHospitalStatus,
} from "./context/HospitalStatusContext";
import { StatusBanner } from "./components/StatusBanner";
import { ThemeProvider } from "./context/ThemeContext";

function AppContent() {
  const { isMaintenance } = useHospitalStatus();
  const [currentPage, setCurrentPage] = useState("home");
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("user"));
      if (stored?.role) {
        const role = (stored.role || "").toString();
        const normalizedRole = role.toLowerCase();
        if (normalizedRole.includes("nurse")) {
          stored.role = "Nurse";
        } else if (
          normalizedRole.includes("ward") ||
          normalizedRole.includes("charge") ||
          normalizedRole === "ward manager" ||
          normalizedRole === "ward"
        ) {
          stored.role = "Ward Manager";
        } else if (normalizedRole.includes("triage")) {
          stored.role = "Triage";
        } else if (normalizedRole.includes("laboratory cashier"))
          stored.role = "Laboratory Cashier";
        else if (normalizedRole.includes("pharmacy cashier"))
          stored.role = "Pharmacy Cashier";
      }
      return stored;
    } catch {
      return null;
    }
  });

  const getPageFromUser = (user) => {
    if (!user || !user.role) return "home";

    const rawRole = user.role.toString().toLowerCase();

    // 1. High-Priority Clinical Station Mapping
    if (rawRole.includes("admin")) return "admin";
    if (rawRole.includes("doctor")) return "doctor";
    if (rawRole.includes("nurse")) return "nurse";
    if (rawRole.includes("triage")) return "triage";
    if (rawRole.includes("reception")) return "reception";
    if (
      rawRole.includes("ward") ||
      rawRole.includes("charge") ||
      rawRole === "ward"
    )
      return "ward";
    if (rawRole.includes("radiology")) return "ultrasound";

    // 2. Operational & Billing Node Mapping
    if (
      rawRole.includes("lab cashier") ||
      rawRole.includes("laboratory cashier")
    )
      return "labCashier";
    if (rawRole.includes("pharmacy cashier")) return "pharmacyCashier";
    if (rawRole.includes("lab") || rawRole.includes("laboratory"))
      return "laboratory";
    if (rawRole.includes("pharmacy") || rawRole.includes("pharmacist"))
      return "pharmacy";
    if (
      rawRole.includes("store") ||
      rawRole.includes("inventory") ||
      rawRole.includes("supply")
    )
      return "storemanagement";

    // 3. Fallback to dashboardRoute if provided by backend
    if (
      user.dashboardRoute &&
      [
        "reception",
        "triage",
        "doctor",
        "pharmacy",
        "laboratory",
        "admin",
        "nurse",
        "ward",
        "storemanagement",
        "labCashier",
        "pharmacyCashier",
        "ultrasound",
      ].includes(user.dashboardRoute)
    ) {
      return user.dashboardRoute;
    }

    return "home";
  };

  const normalizeRole = (raw) => {
    if (!raw) return raw;
    const normalizedRole = raw.toLowerCase();
    if (normalizedRole.includes("administrator")) return "Administrator";
    if (normalizedRole.includes("pharmacy cashier")) return "Pharmacy Cashier";
    if (normalizedRole.includes("pharmacist") || normalizedRole === "pharmacy")
      return "Pharmacist";
    if (normalizedRole.includes("laboratory cashier"))
      return "Laboratory Cashier";
    if (normalizedRole.includes("laboratory") || normalizedRole.includes("lab"))
      return "Laboratory";
    if (normalizedRole.includes("doctor")) return "Doctor";
    if (normalizedRole.includes("reception")) return "Receptionist";
    if (normalizedRole.includes("ward") || normalizedRole.includes("charge"))
      return "Ward Manager";
    if (normalizedRole.includes("nurse")) return "Nurse";
    if (normalizedRole.includes("triage")) return "Triage";
    if (
      normalizedRole.includes("store") ||
      normalizedRole.includes("inventory") ||
      normalizedRole.includes("supply")
    )
      return "Store Manager";
    if (normalizedRole.includes("radiology")) return "Radiology";
    return raw;
  };

  const getPageFromRole = (role) => {
    const raw = normalizeRole(role);
    const normalizedRole = raw?.toLowerCase?.() || "";
    if (normalizedRole.includes("administrator")) return "admin";
    if (normalizedRole.includes("pharmacist-cashier") || normalizedRole.includes("pharmacy cashier"))
      return "pharmacy-cashier"; // Added role mapping for pharmacy cashier
    if (normalizedRole.includes("laboratory-cashier") || normalizedRole.includes("lab cashier"))
      return "lab-cashier"; // Added role mapping for lab cashier
    if (normalizedRole.includes("pharmacist")) return "pharmacy";
    if (normalizedRole.includes("laboratory") || normalizedRole.includes("lab"))
      return "laboratory";
    if (normalizedRole.includes("ultrasound") || normalizedRole.includes("sono"))
      return "ultrasound"; // Added ultrasound role mapping
    if (normalizedRole.includes("doctor")) return "doctor";
    if (normalizedRole.includes("reception")) return "reception";
    if (normalizedRole.includes("ward") || normalizedRole.includes("charge"))
      return "ward";
    if (normalizedRole.includes("nurse")) return "nurse";
    if (normalizedRole.includes("radiology")) return "ultrasound";
    if (
      normalizedRole.includes("store") ||
      normalizedRole.includes("inventory") ||
      normalizedRole.includes("supply")
    )
      return "storemanagement";
    return "home";
  };

  useEffect(() => {
    if (user) {
      setCurrentPage(getPageFromUser(user));
    } else {
      if (currentPage !== "home" && currentPage !== "demo") {
        setCurrentPage("login");
      }
    }
  }, [user]);

  const handleLoginSuccess = (userPayload) => {
    setUser(userPayload);
    localStorage.setItem("user", JSON.stringify(userPayload));
    setCurrentPage(getPageFromUser(userPayload));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setCurrentPage("home");
  };

  const validPages = [
    "reception",
    "triage",
    "doctor",
    "pharmacy",
    "laboratory",
    "ultrasound", // Added ultrasound to the validation engine
    "lab-cashier", // Added lab cashier route protection token
    "pharmacy-cashier", // Added pharmacy cashier route protection token
    "admin",
    "home",
    "demo",
    "login",
    "nurse",
    "ward",
    "storemanagement",
    "labCashier",
    "pharmacyCashier",
  ];

  const activeView = validPages.includes(currentPage) ? currentPage : "home";
  // The light theme is scoped to dashboards: the public pages keep their design.
  const isDashboardView = !["home", "login", "demo"].includes(activeView);

  return (
    <ThemeProvider pageKey={activeView}>
      <StatusBanner />
      <div className={isDashboardView ? "hms-dash" : undefined}>
      {/* 3. RECEPTION DASHBOARD NODE */}
      {activeView === "reception" && (
        <ReceptionPage
          onLogout={handleLogout}
          onNavigateToTriage={() => setCurrentPage("triage")}
        />
      )}

      {/* 4. TRIAGE CLINICAL STATION SCREEN */}
      {activeView === "triage" && <TriagePage onLogout={handleLogout} />}

      {/* 5. DOCTOR CONSULTATION ROOM INTERFACE */}
      {activeView === "doctor" && (
        <DoctorPage
          onLogout={handleLogout}
          onNavigateToPharmacy={() => setActiveView("pharmacy")}
        />
      )}

      {/* 5.5 PHARMACY AND DISPENSING DEPOT */}
      {activeView === "pharmacy" && (
        <PharmacyPage 
          onLogout={handleLogout}
          onNavigateToDoctor={() => setActiveView("doctor")}
          onNavigateToCashier={() => setActiveView("pharmacyCashier")}
        />
      )}

      {/* 5.6 LABORATORY DIAGNOSTICS DECK */}
      {activeView === "laboratory" && (
        <LaboratoryPage onLogout={handleLogout} />
      )}
      {activeView === "ultrasound" && (
        <UltrasoundPage onLogout={handleLogout} />
      )}

      {/* FIXED: Standardized case strings from upper to lower matching validPages array */}
      {/* 5.7 WARD OCCUPANCY OPERATIONS */}
      {activeView === "ward" && <WardPage onLogout={handleLogout} />}

      {/* 5.8 NURSE CLINICAL PIPELINE HUB */}
      {activeView === "nurse" && (
        <NursePage
          onLogout={handleLogout}
          onNavigateToDoctor={() => setActiveView("doctor")}
        />
      )}

      {/* 5.9 INVENTORY DEPOT DEPOT STORE */}
      {activeView === "storemanagement" && (
        <StoreManagementPage
          onLogout={handleLogout}
        />
      )}

      {/* 5.10 LAB CASHIER BILLING TERMINAL */}
      {activeView === "labCashier" && (
        <LabCashierPage onLogout={handleLogout} />
      )}

      {/* 5.11 PHARMACY CASHIER BILLING TERMINAL */}
      {activeView === "pharmacyCashier" && (
        <PharmacyCashierPage 
          onLogout={handleLogout}
          onNavigateToPharmacy={() => setActiveView("pharmacy")}
        />
      )}

      {/* 6. ADMIN SECURITY LAYER */}
      {activeView === "admin" && (
        <AdminDashboard
          onLogout={handleLogout}
          isMaintenanceMode={isMaintenanceMode}
          setIsMaintenanceMode={setIsMaintenanceMode}
          user={user}
          navigateTo={setCurrentPage}
        />
      )}

      {/* 7. LANDING PAGE */}
      {activeView === "home" && (
        <Landingpage
          onLoginClick={() => setCurrentPage("login")}
          onDemoClick={() => setCurrentPage("demo")}
        />
      )}

      {/* 8. DEMO SCREEN PANEL */}
      {activeView === "demo" && (
        <DemoPage onBackClick={() => setCurrentPage("home")} />
      )}

      {/* 9. LOGIN GATEWAY ENTRY */}
      {activeView === "login" && (
        <Login
          onBackClick={() => setCurrentPage("home")}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
      </div>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <HospitalStatusProvider>
      <AppContent />
    </HospitalStatusProvider>
  );
}