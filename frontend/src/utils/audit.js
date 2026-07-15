const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const logAudit = async ({
  action,
  module,
  targetId = "",
  targetType = "",
  details = "",
}) => {
  try {
    const token = localStorage.getItem("token")?.trim();
    const userRaw = localStorage.getItem("user");
    const user = userRaw ? JSON.parse(userRaw) : null;

    const payload = {
      action,
      module,
      userId: user?._id || user?.id || "unknown",
      userName: user?.name || "Unknown",
      userRole: user?.role || "unknown",
      department: user?.dept || "",
      targetId,
      targetType,
      details,
    };

    await fetch(`${API_URL}/api/audit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
};

export const fetchAuditLogs = async (filters = {}) => {
  const token = localStorage.getItem("token")?.trim();
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      params.append(key, val);
    }
  });

  const response = await fetch(`${API_URL}/api/audit?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch audit logs");
  }

  return response.json();
};

export const fetchAuditAlertsCount = async () => {
  const token = localStorage.getItem("token")?.trim();
  const response = await fetch(
    `${API_URL}/api/audit/alerts/count`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch audit alerts count");
  }

  const data = await response.json();
  return data.count || 0;
};
