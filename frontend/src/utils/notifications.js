const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getToken = () => localStorage.getItem("token")?.trim();
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// Role-specific notification fetchers
export const fetchNotifications = async (role) => {
  try {
    const endpoints = {
      Doctor: `${API_URL}/api/doctor/cases`,
      Nurse: `${API_URL}/api/nurse/assignments`,
      Laboratory: `${API_URL}/api/lab/orders`,
      Triage: `${API_URL}/api/triage/queue`,
      Pharmacy: `${API_URL}/api/pharmacy/orders`,
      Cashier: `${API_URL}/api/cashier/pending`,
      Ward: `${API_URL}/api/ward/admission-requests`,
      Reception: `${API_URL}/api/patients`,
      Ultrasound: `${API_URL}/api/ultrasound/orders`,
      Store: `${API_URL}/api/store`,
      Admin: `${API_URL}/api/audit`,
      LabCashier: `${API_URL}/api/lab/orders`,
    };

    const url = endpoints[role];
    if (!url) return [];

    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || data || [];
  } catch {
    return [];
  }
};

// Map raw data to notification messages per role
export const buildNotifications = (role, data) => {
  if (!Array.isArray(data) || data.length === 0) return [];

  const now = new Date();

  const mappers = {
    Doctor: (items) =>
      items.slice(0, 5).map((p) => ({
        id: p._id,
        type: "patient",
        title: "New Patient in Queue",
        message: `${p.patientName} — ${p.chiefComplaint || "Awaiting consultation"}`,
        time: p.createdAt ? new Date(p.createdAt).toLocaleTimeString() : "Now",
        urgent: p.triageCategory === "Red / Immediate" || p.triageCategory === "Emergency",
      })),

    Nurse: (items) =>
      items.slice(0, 5).map((a) => ({
        id: a._id,
        type: "assignment",
        title: "Nurse Assignment",
        message: `Patient ${a.patientName || a.cardId} assigned to your station`,
        time: a.createdAt ? new Date(a.createdAt).toLocaleTimeString() : "Now",
        urgent: false,
      })),

    Laboratory: (items) => {
      const pending = items.filter((o) => o.cashierStatus !== "PAID" && o.cashierStatus !== "BYPASSED_EMERGENCY" ? false : true);
      return items.slice(0, 5).map((o) => ({
        id: o._id,
        type: "lab",
        title: o.cashierStatus === "BYPASSED_EMERGENCY" ? "⚡ Emergency Lab Order" : "New Lab Order",
        message: `${o.patientName} — ${(o.dispatchedTests || o.panels || []).join(", ") || "General Suite"}`,
        time: o.createdAt ? new Date(o.createdAt).toLocaleTimeString() : "Now",
        urgent: o.cashierStatus === "BYPASSED_EMERGENCY" || o.triageCategory === "Red / Immediate",
      }));
    },

    Triage: (items) =>
      items.slice(0, 5).map((p) => ({
        id: p._id,
        type: "triage",
        title: "Patient Awaiting Triage",
        message: `${p.patientName || p.name} — ${p.chiefComplaint || "Walk-in"}`,
        time: p.createdAt ? new Date(p.createdAt).toLocaleTimeString() : "Now",
        urgent: false,
      })),

    Pharmacy: (items) =>
      items.filter((o) => o.dispenseStatus !== "Dispensed").slice(0, 5).map((o) => ({
        id: o._id,
        type: "pharmacy",
        title: "New Prescription Order",
        message: `${o.patientName} — ${(o.medications || []).map((m) => m.name).join(", ") || "Prescription pending"}`,
        time: o.createdAt ? new Date(o.createdAt).toLocaleTimeString() : "Now",
        urgent: false,
      })),

    Cashier: (items) =>
      items.slice(0, 5).map((o) => ({
        id: o._id,
        type: "cashier",
        title: "Payment Pending",
        message: `${o.patientName} — awaiting payment clearance`,
        time: o.createdAt ? new Date(o.createdAt).toLocaleTimeString() : "Now",
        urgent: false,
      })),

    Ward: (items) =>
      items.filter((r) => r.status === "Pending").slice(0, 5).map((r) => ({
        id: r._id,
        type: "ward",
        title: "Admission Request",
        message: `${r.patientName} — ${r.admissionUrgency || "Routine"} admission to ${r.preferredWard || "Ward"}`,
        time: r.createdAt ? new Date(r.createdAt).toLocaleTimeString() : "Now",
        urgent: r.admissionUrgency === "Emergent",
      })),

    Reception: (items) =>
      items.filter((p) => p.currentStatus === "Waiting" || p.currentStatus === "Registered").slice(0, 5).map((p) => ({
        id: p._id,
        type: "reception",
        title: "New Patient Registered",
        message: `${p.patientName} — ${p.cardId}`,
        time: p.createdAt ? new Date(p.createdAt).toLocaleTimeString() : "Now",
        urgent: false,
      })),

    Ultrasound: (items) =>
      items.slice(0, 5).map((o) => ({
        id: o._id,
        type: "ultrasound",
        title: "Imaging Request",
        message: `${o.patientName} — ${o.requestedModality || "Ultrasound scan"}`,
        time: o.createdAt ? new Date(o.createdAt).toLocaleTimeString() : "Now",
        urgent: o.urgencyLevel === "STAT",
      })),

    Store: (items) => {
      const lowStock = items.filter((i) => i.stock <= i.minThreshold);
      return lowStock.slice(0, 5).map((i) => ({
        id: i.itemId || i._id,
        type: "store",
        title: "Low Stock Alert",
        message: `${i.name} — only ${i.stock} ${i.unit} remaining`,
        time: "Now",
        urgent: i.stock === 0,
      }));
    },

    Admin: (items) =>
      items.slice(0, 5).map((log) => ({
        id: log._id,
        type: "audit",
        title: `${log.action} — ${log.module}`,
        message: log.details || "System activity recorded",
        time: log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : "Now",
        urgent: log.action === "EMERGENCY_BYPASS" || log.action === "DELETE",
      })),

    LabCashier: (items) =>
      items.filter((o) => o.cashierStatus !== "PAID").slice(0, 5).map((o) => ({
        id: o._id,
        type: "labcashier",
        title: "Lab Payment Pending",
        message: `${o.patientName} — awaiting payment`,
        time: o.createdAt ? new Date(o.createdAt).toLocaleTimeString() : "Now",
        urgent: false,
      })),
  };

  const mapper = mappers[role];
  return mapper ? mapper(data) : [];
};
