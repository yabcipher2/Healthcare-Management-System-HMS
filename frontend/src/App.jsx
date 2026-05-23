import React, { useEffect, useState } from "react";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import PharmacyDashboard from "./pages/PharmacyDashboard";

export default function App() {
  const [currentPage, setCurrentPage] = useState("login");
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const normalizedRole = user?.role?.toLowerCase?.() || "";
    if (normalizedRole === "administrator") {
      setCurrentPage("admin");
    } else if (normalizedRole === "pharmacist") {
      setCurrentPage("pharmacy");
    } else if (user) {
      setCurrentPage("other");
    } else {
      setCurrentPage("login");
    }
  }, [user]);

  const handleLoginSuccess = (userPayload) => {
    const normalizedRole = userPayload.role?.toLowerCase?.() || "";
    setUser(userPayload);
    localStorage.setItem("user", JSON.stringify(userPayload));
    setCurrentPage(
      normalizedRole === "administrator"
        ? "admin"
        : normalizedRole === "pharmacist"
          ? "pharmacy"
          : "other",
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setCurrentPage("login");
  };

  return (
    <>
      {currentPage === "admin" && (
        <AdminDashboard
          onLogout={handleLogout}
          isMaintenanceMode={isMaintenanceMode}
          setIsMaintenanceMode={setIsMaintenanceMode}
          user={user}
        />
      )}

      {currentPage === "pharmacy" && (
        <PharmacyDashboard onLogout={handleLogout} user={user} />
      )}

      {currentPage === "other" && (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8 text-center">
          <div className="bg-white rounded-[2.5rem] p-12 border border-slate-200 shadow-sm max-w-2xl">
            <div className="mb-8">
              <h1 className="text-3xl font-black text-slate-900 mb-4">
                Access Restricted
              </h1>
              <p className="text-slate-600 text-sm leading-7">
                Your account is currently assigned the role{" "}
                <strong>{user?.role}</strong>. The administrator dashboard is
                hidden for your role.
              </p>
            </div>

            <div className="grid gap-4 text-left mb-8">
              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
                <p className="text-xs uppercase tracking-widest text-slate-400 font-black mb-2">
                  What this means
                </p>
                <p className="text-slate-600 text-sm leading-6">
                  Only administrators and pharmacists may access their
                  respective portals. All other role views are restricted for
                  security and privacy.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
                <p className="text-xs uppercase tracking-widest text-slate-400 font-black mb-2">
                  Need access?
                </p>
                <p className="text-slate-600 text-sm leading-6">
                  If you believe this is a mistake, please contact your system
                  administrator and request the appropriate dashboard
                  assignment.
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="px-8 py-4 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {currentPage === "login" && <Login onLoginSuccess={handleLoginSuccess} />}
    </>
  );
}
