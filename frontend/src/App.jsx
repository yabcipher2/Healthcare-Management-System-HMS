import React, { useState } from "react";
import Landingpage from "./pages/Landingpage";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import DemoPage from "./pages/Demo";
import ReceptionPage from "./pages/ReceptionPage";
import TriagePage from "./pages/TriagePage";
import DoctorPage from "./pages/DoctorPage";
import LaboratoryPage from "./pages/LaboratoryPage";

export default function App() {
  // 1. FORCED ROUTING CONTROLLER
  // Set to "reception", "triage", "doctor", "pharmacy", "laboratory", "admin", or "home" to immediately jump to that screen.
  const [currentPage, setCurrentPage] = useState("laboratory"); // Default to doctor for development testing

  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  const handleLogout = () => {
    setCurrentPage("home"); // Returns securely back to the landing page
  };

  // 2. FALLBACK PROTECTION ENGINE
  // Defines all explicitly mapped page strings including pharmacy and laboratory additions
  const validPages = [
    "reception", 
    "triage", 
    "doctor", 
    "laboratory",
    "admin", 
    "home", 
    "demo", 
    "login"
  ];
  
  // If a non-existent state or type mismatch happens, safely force render back to landing home view
  const activeView = validPages.includes(currentPage) ? currentPage : "home";

  return (
    <>
      {/* 3. RECEPTION DASHBOARD NODE */}
      {activeView === "reception" && (
        <ReceptionPage onLogout={handleLogout} />
      )}

      {/* 4. TRIAGE CLINICAL STATION SCREEN */}
      {activeView === "triage" && (
        <TriagePage onLogout={handleLogout} />
      )}

      {/* 5. DOCTOR CONSULTATION ROOM INTERFACE */}
      {activeView === "doctor" && (
        <DoctorPage onLogout={handleLogout} />
      )}

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
          onLoginSuccess={() => setCurrentPage("admin")}
        />
      )}
    </>
  );
}