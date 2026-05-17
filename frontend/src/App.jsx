import React, { useState } from "react";
import Landingpage from "./pages/Landingpage";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import DemoPage from "./pages/Demo";

export default function App() {
  // SETTING INITIAL STATE TO 'admin' FOR IMMEDIATE ACCESS
  const [currentPage, setCurrentPage] = useState("admin");

  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  const handleLogout = () => {
    setCurrentPage("home"); // Allows you to still go back to the landing page
  };

  return (
    <>
      {/* 1. ADMIN DASHBOARD (Now the Default Entry Point) */}
      {currentPage === "admin" && (
        <AdminDashboard
          onLogout={handleLogout}
          isMaintenanceMode={isMaintenanceMode}
          setIsMaintenanceMode={setIsMaintenanceMode}
        />
      )}

      {/* 2. LANDING PAGE */}
      {currentPage === "home" && (
        <Landingpage
          onLoginClick={() => setCurrentPage("login")}
          onDemoClick={() => setCurrentPage("demo")}
        />
      )}

      {/* 3. DEMO PAGE */}
      {currentPage === "demo" && (
        <DemoPage onBackClick={() => setCurrentPage("home")} />
      )}

      {/* 4. LOGIN PAGE */}
      {currentPage === "login" && (
        <Login
          onBackClick={() => setCurrentPage("home")}
          onLoginSuccess={() => setCurrentPage("admin")}
        />
      )}
    </>
  );
}
