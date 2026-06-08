import { createContext, useContext, useState, useEffect } from "react";

export const HospitalStatusContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const HospitalStatusProvider = ({ children }) => {
  const [status, setStatus] = useState("open");
  const [statusUpdatedAt, setStatusUpdatedAt] = useState("");
  const [lastChecked, setLastChecked] = useState("");
  const [loadingStatus, setLoadingStatus] = useState(true);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem("token")?.trim();
      const response = await fetch(`${API_URL}/api/system/hospital-status`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStatus(result.data.status);
          setStatusUpdatedAt(result.data.updatedAt || "");
          setLastChecked(new Date().toISOString());
          return;
        }
      }
    } catch (err) {
      console.error("Failed to fetch hospital status:", err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const isEmergency = status === "emergency";
  const isMaintenance = status === "closed";

  return (
    <HospitalStatusContext.Provider
      value={{
        status,
        statusUpdatedAt,
        lastChecked,
        loadingStatus,
        isEmergency,
        isMaintenance,
        refreshStatus: fetchStatus,
      }}
    >
      {children}
    </HospitalStatusContext.Provider>
  );
};

export const useHospitalStatus = () => {
  const context = useContext(HospitalStatusContext);
  if (!context) {
    throw new Error(
      "useHospitalStatus must be used within a HospitalStatusProvider",
    );
  }
  return context;
};
