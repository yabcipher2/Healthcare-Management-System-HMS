import React, { useState } from "react";
import Landingpage from "./pages/Landingpage";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import DemoPage from "./pages/Demo";
import ReceptionPage from "./pages/ReceptionPage";

export default function App() {
  // 2. SET TO "reception" TO FORCE IMMEDIATE ACCESS IN THE BROWSER
  // Change back to "admin" or "home" when you are ready to use the rest of the application.
  const [currentPage, setCurrentPage] = useState("reception");

  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  const handleLogout = () => {
    setCurrentPage("home"); // Allows you to still go back to the landing page
  };

  return (
    <>
      {/* 3. RECEPTION PAGE CONTROLLER LAYER */}
      {currentPage === "reception" && (
        <ReceptionPage onLogout={handleLogout} />
      )}

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