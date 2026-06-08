import React, { useEffect, useState } from "react";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import DemoPage from "./pages/Demo";
import ReceptionPage from "./pages/ReceptionPage";
import TriagePage from "./pages/TriagePage";
import DoctorPage from "./pages/DoctorPage";
import PharmacyPage from "./pages/PharmacyPage";
import LaboratoryPage from "./pages/LaboratoryPage";
import Landingpage from "./pages/Landingpage";
import WardPage from "./pages/WardPage";
import NursePage from "./pages/NursePage";
import StoreManagementPage from "./pages/StoreManagementPage";
import { HospitalStatusProvider } from "./context/HospitalStatusContext";

export default function App() {
  // 1. FORCED ROUTING CONTROLLER
  const [currentPage, setCurrentPage] = useState("home");

  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  // FIXED: Added clear string role parsers for ward, nurse, and store setups
  const getPageFromRole = (role) => {
    const normalizedRole = role?.toLowerCase?.() || "";
    if (normalizedRole.includes("administrator")) return "admin";
    if (normalizedRole.includes("pharmacist")) return "pharmacy";
    if (normalizedRole.includes("laboratory") || normalizedRole.includes("lab"))
      return "laboratory";
    if (normalizedRole.includes("doctor")) return "doctor";
    if (normalizedRole.includes("reception")) return "reception";
    if (normalizedRole.includes("ward") || normalizedRole.includes("charge"))
      return "ward";
    if (normalizedRole.includes("nurse")) return "nurse";
    if (
      normalizedRole.includes("store") ||
      normalizedRole.includes("inventory") ||
      normalizedRole.includes("supply")
    )
      return "storemanagement";
    return "home";
  };

  const getPageFromUser = (user) => {
    if (!user) return "home";
    return user.dashboardRoute || getPageFromRole(user.role);
  };

  // --- CRITICAL DOCUMENTATION PATH GUARD FIX ---
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

  // 2. FALLBACK PROTECTION ENGINE
  const validPages = [
    "reception",
    "triage",
    "doctor",
    "pharmacy",
    "laboratory",
    "admin",
    "home",
    "demo",
    "login",
    "nurse",
    "ward",
    "storemanagement",
  ];

  // Safeguards string states to match valid target links
  const activeView = validPages.includes(currentPage) ? currentPage : "home";

  return (
    <HospitalStatusProvider>
      <>
        {/* 3. RECEPTION DASHBOARD NODE */}
        {activeView === "reception" && <ReceptionPage onLogout={handleLogout} />}

      {/* 4. TRIAGE CLINICAL STATION SCREEN */}
      {activeView === "triage" && <TriagePage onLogout={handleLogout} />}

      {/* 5. DOCTOR CONSULTATION ROOM INTERFACE */}
      {activeView === "doctor" && <DoctorPage onLogout={handleLogout} />}

      {/* 5.5 PHARMACY AND DISPENSING DEPOT */}
      {activeView === "pharmacy" && <PharmacyPage onLogout={handleLogout} />}

      {/* 5.6 LABORATORY DIAGNOSTICS DECK */}
      {activeView === "laboratory" && (
        <LaboratoryPage onLogout={handleLogout} />
      )}

      {/* FIXED: Standardized case strings from upper to lower matching validPages array */}
      {/* 5.7 WARD OCCUPANCY OPERATIONS */}
      {activeView === "ward" && <WardPage onLogout={handleLogout} />}

      {/* 5.8 NURSE CLINICAL PIPELINE HUB */}
      {activeView === "nurse" && <NursePage onLogout={handleLogout} />}

      {/* 5.9 INVENTORY DEPOT DEPOT STORE */}
      {activeView === "storemanagement" && (
        <StoreManagementPage onLogout={handleLogout} />
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
      </>
    </HospitalStatusProvider>
  );
}
