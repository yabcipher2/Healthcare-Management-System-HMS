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

  const getPageFromRole = (role) => {
    const normalizedRole = role?.toLowerCase?.() || "";
    if (normalizedRole.includes("administrator")) return "admin";
    if (normalizedRole.includes("pharmacist")) return "pharmacy";
    if (normalizedRole.includes("laboratory") || normalizedRole.includes("lab"))
      return "laboratory";
    if (normalizedRole.includes("doctor")) return "doctor";
    if (normalizedRole.includes("reception")) return "reception";
    if (normalizedRole.includes("triage") || normalizedRole.includes("nurse"))
      return "triage";
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
      // FIX: If no authenticated session is active, allow safe passage to public nodes ('home', 'demo')
      // instead of aggressively forcing the login gate. This allows public landing page rendering.
      if (currentPage !== "home" && currentPage !== "demo") {
        setCurrentPage("login");
      }
    }
  }, [user]); // Removed currentPage dependency to avoid loop toggles

  const handleLoginSuccess = (userPayload) => {
    setUser(userPayload);
    localStorage.setItem("user", JSON.stringify(userPayload));
    setCurrentPage(getPageFromUser(userPayload));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setCurrentPage("home"); // Safely sets routing state focus back to landing layer
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
  ];

  const activeView = validPages.includes(currentPage) ? currentPage : "home";

  return (
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

      {/* 6. ADMIN SECURITY LAYER */}
      {activeView === "admin" && (
        <AdminDashboard
          onLogout={handleLogout}
          isMaintenanceMode={isMaintenanceMode}
          setIsMaintenanceMode={setIsMaintenanceMode}
          user={user}
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
  );
}
