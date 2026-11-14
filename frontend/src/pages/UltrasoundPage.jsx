import React, { useCallback, useEffect, useState } from "react";
import {
  Activity,
  LayoutDashboard,
  ClipboardCheck,
  Search,
  ShieldAlert,
  Clock,
  LogOut,
  ChevronRight,
  BarChart3,
  Image as ImageIcon,
  Video,
  RefreshCw,
  CheckCircle,
  FlaskConical,
  X,
} from "lucide-react";
import SidebarCollapseButton from "../components/SidebarCollapseButton";
import ThemeToggle from "../components/ThemeToggle";

// Preparation guidance keyed off the requested study name. The doctor asks for
// a modality, not a prep sheet, so the unit derives the standard instruction.
const preparationFor = (study = "") => {
  const name = study.toLowerCase();
  if (name.includes("abdomen")) return "NPO (Fasting 6+ Hours)";
  if (name.includes("pelvic") || name.includes("transvaginal"))
    return "Full Bladder (Hydrated)";
  if (name.includes("kub") || name.includes("renal") || name.includes("bladder"))
    return "Full Bladder (Hydrated)";
  if (name.includes("thyroid")) return "No Preparation Required";
  if (name.includes("echo") || name.includes("fetal"))
    return "Maternal Hydration — Bring Prior Scans";
  return "Standard Preparation";
};

const mapRequest = (patient) => {
  const radiology = patient.radiology || {};
  const scans =
    radiology.requestedModalities?.length > 0
      ? radiology.requestedModalities
      : radiology.requestedModality
        ? [radiology.requestedModality]
        : ["Ultrasound Study"];

  return {
    id: patient.cardId,
    patientId: patient._id,
    patientName:
      patient.patientName ||
      [patient.firstName, patient.middleName, patient.lastName]
        .filter(Boolean)
        .join(" ") ||
      "Unnamed Patient",
    mrn: patient.cardId,
    age: patient.age || "—",
    gender: patient.gender || "—",
    currentStatus: patient.currentStatus || "",
    requestedBy: radiology.authorizingPhysician || "Attending Physician",
    timestamp: radiology.timestamp
      ? new Date(radiology.timestamp).toLocaleString()
      : "Not recorded",
    urgency: /urgent|high|immediate/i.test(radiology.urgencyLevel || "")
      ? "Urgent"
      : "Routine",
    scans,
    preparation: preparationFor(scans[0]),
    clinicalIndication: radiology.clinicalIndication || "",
    resultsLogged: { findings: "", impression: "" },
  };
};

export default function UltrasoundPage({ onLogout }) {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [queueError, setQueueError] = useState("");
  const [message, setMessage] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const [scanImages, setScanImages] = useState([]);
  const hospitalLogo = "/mesra icon.png";

  const token = localStorage.getItem("token");

  // 1. Scan Types & Imaging Directory
  const [scanDirectory] = useState([
    {
      code: "US-ABD",
      name: "Abdominal Ultrasound Complete",
      section: "General Sonography",
      turnaround: "30 Mins",
      status: "Operational",
    },
    {
      code: "US-PEL",
      name: "Pelvic / Transvaginal Scan",
      section: "Obstetrics & Gynecology",
      turnaround: "25 Mins",
      status: "Operational",
    },
    {
      code: "US-KUB",
      name: "Kidney, Ureters & Bladder (KUB)",
      section: "Urology Imaging",
      turnaround: "20 Mins",
      status: "Operational",
    },
    {
      code: "US-THY",
      name: "Thyroid High-Resolution Scan",
      section: "Small Parts",
      turnaround: "20 Mins",
      status: "Operational",
    },
    {
      code: "US-ECHO",
      name: "Fetal Echocardiography",
      section: "Obstetrics",
      turnaround: "40 Mins",
      status: "Operational",
    },
  ]);

  // 2. Live worklist — every patient whose record carries a Pending Ultrasound
  //    Scan request placed by a physician.
  const loadQueue = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/ultrasound/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        localStorage.removeItem("token");
        onLogout?.();
        return;
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || `Worklist request failed (${response.status}).`);
      }
      setOrders((data.data || []).map(mapRequest));
      setQueueError("");
      setLastSynced(new Date());
    } catch (err) {
      setQueueError(err.message || "Unable to load the scan worklist.");
    } finally {
      setLoading(false);
    }
  }, [API_URL, token, onLogout]);

  useEffect(() => {
    loadQueue();
    const timer = setInterval(loadQueue, 15000);
    return () => clearInterval(timer);
  }, [loadQueue]);

  const handleImageSelect = (event) => {
    const picked = Array.from(event.target.files || []);
    if (picked.length === 0) return;
    const overflow = scanImages.length + picked.length > 6;
    setScanImages((prev) =>
      [
        ...prev,
        ...picked.map((file) => ({ file, preview: URL.createObjectURL(file) })),
      ].slice(0, 6),
    );
    if (overflow) {
      setMessage({
        type: "error",
        text: "A study can carry at most 6 images — the extra files were ignored.",
      });
    }
    event.target.value = "";
  };

  const removeScanImage = (index) => {
    setScanImages((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const clearScanImages = () => {
    setScanImages((prev) => {
      prev.forEach((image) => URL.revokeObjectURL(image.preview));
      return [];
    });
  };

  const handleResultChange = (key, value) => {
    setSelectedOrder((prev) => ({
      ...prev,
      resultsLogged: {
        ...prev.resultsLogged,
        [key]: value,
      },
    }));
  };

  // Submit Imaging Reports to Central EMR Server
  const handleVerifyAndSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    // Never let a release fail silently: the sonographer must know why the
    // report did not reach the doctor.
    const findings = selectedOrder.resultsLogged.findings.trim();
    const impression = selectedOrder.resultsLogged.impression.trim();
    if (!findings || !impression) {
      setMessage({
        type: "error",
        text: "Enter the sonographic findings and the diagnostic impression before releasing.",
      });
      window.alert(
        "Please enter the sonographic findings and the diagnostic impression before releasing the report.",
      );
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      // Attach the captured stills first; they are stored as files and the
      // patient record only keeps their URLs.
      let imageUrls = [];
      if (scanImages.length > 0) {
        const formData = new FormData();
        scanImages.forEach((image) => formData.append("images", image.file));
        const uploadResponse = await fetch(
          `${API_URL}/api/ultrasound/${selectedOrder.patientId}/images`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          },
        );
        const uploadData = await uploadResponse.json().catch(() => ({}));
        if (!uploadResponse.ok) {
          throw new Error(uploadData.message || "Scan image upload failed.");
        }
        imageUrls = uploadData.data || [];
      }

      const reportText = `FINDINGS:\n${findings}\n\nIMPRESSION:\n${impression}`;
      const response = await fetch(
        `${API_URL}/api/ultrasound/${selectedOrder.patientId}/results`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reportText, imageUrls }),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Report release failed.");
      }

      setMessage({
        type: "success",
        text: `Report ${selectedOrder.id}${imageUrls.length ? ` with ${imageUrls.length} image(s)` : ""} signed and released to ${selectedOrder.requestedBy}'s EMR timeline.`,
      });
      // Explicit acknowledgement, matching the other department modules.
      window.alert(
        `Ultrasound report ${selectedOrder.id} sent successfully to ${selectedOrder.requestedBy} (${selectedOrder.patientName}).\nIMPRESSION: ${selectedOrder.resultsLogged.impression.trim()}${
          imageUrls.length ? `\n${imageUrls.length} scan image(s) attached.` : ""
        }`,
      );
      clearScanImages();
      setOrders((prev) =>
        prev.filter((order) => order.patientId !== selectedOrder.patientId),
      );
      setSelectedOrder(null);
      setActiveTab("activeScans");
      loadQueue();
    } catch (err) {
      const reason = err.message || "Report release failed.";
      setMessage({ type: "error", text: reason });
      window.alert(`Report NOT sent to the doctor: ${reason}`);
    } finally {
      setSubmitting(false);
    }
  };

  const visibleOrders = orders.filter(
    (order) =>
      order.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.mrn || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const urgentCount = orders.filter((o) => o.urgency === "Urgent").length;

  return (
    <div className="flex min-h-screen bg-[#0E1B17] text-white font-sans antialiased">
      {/* SIDEBAR NAVIGATION PANEL */}
      <aside
        className={`${sidebarOpen ? "w-56" : "w-16 [&_span]:hidden [&_p]:hidden [&_h3]:hidden [&_button]:justify-center [&_button]:text-[0px]"} bg-[#0E1B17] text-slate-300 flex flex-col justify-between shrink-0 sticky top-0 h-screen overflow-hidden z-30 font-mono border-r border-[#29323a] transition-all duration-300`}
      >
        <div>
          <div className="p-3 border-b border-[#29323a] flex items-center gap-2">
            <img
              src={hospitalLogo}
              alt="Mesra Logo"
              className="w-7 h-7 object-contain rounded-lg"
            />
            <div>
              <h3 className="font-black text-[11px] text-white leading-none">
                MESRA <span className="text-[#10B981]">RAD</span>
              </h3>
              <span className="text-[9px] text-[#94A3B8] font-bold tracking-wider block mt-0.5">
                Ultrasound Unit
              </span>
            </div>
          </div>

          <SidebarCollapseButton
            collapsed={!sidebarOpen}
            onToggle={() => setSidebarOpen((open) => !open)}
            label="ultrasound sidebar"
          />

          <nav className="p-2 space-y-1">
            <div className="text-[9px] font-black uppercase text-[#94A3B8] px-2 py-1.5 tracking-widest">
              Interface Channels
            </div>
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setSelectedOrder(null);
              }}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition ${
                activeTab === "dashboard"
                  ? "bg-[#10B981] text-white shadow-md font-black"
                  : "text-[#94A3B8] hover:bg-[#12241F] hover:text-white"
              }`}
            >
              <LayoutDashboard size={14} /> <span>Hub Throughput</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("activeScans");
                setSelectedOrder(null);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition ${
                activeTab === "activeScans"
                  ? "bg-[#10B981] text-white shadow-md font-black"
                  : "text-[#94A3B8] hover:bg-[#12241F] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <Video size={14} /> <span>Scan Worklist</span>
              </div>
              {orders.length > 0 && (
                <span className="bg-[#0E1B17] text-[#10B981] border border-[#10B981]/20 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                  {orders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab("scanRegistry");
                setSelectedOrder(null);
              }}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition ${
                activeTab === "scanRegistry"
                  ? "bg-[#10B981] text-white shadow-md font-black"
                  : "text-[#94A3B8] hover:bg-[#12241F] hover:text-white"
              }`}
            >
              <ImageIcon size={14} /> <span>Scan Directory</span>
            </button>
          </nav>
        </div>

        <div className="p-3 border-t border-[#29323a]">
          <div className="bg-[#12241F] rounded-lg p-2.5 text-[10px] font-mono text-[#94A3B8] mb-2 border border-[#29323a]">
            <p className="font-bold text-[#10B981]">Ultrasound Terminal</p>
            <p>Transducer Sync: ONLINE</p>
            <p>Sonographer: {localStorage.getItem("userName") || "Sr. Martha H."}</p>
          </div>
          <button
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              window.location.href = "/login";
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#0E1B17] hover:bg-rose-950/40 border border-[#29323a] hover:border-rose-900 text-[#94A3B8] hover:text-rose-400 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all"
          >
            <LogOut size={13} /> <span>Exit Platform</span>
          </button>
        </div>
      </aside>

      {/* CORE WORKSPACE AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-[#0E1B17] border-b border-[#29323a] sticky top-0 px-6 py-4 z-20 flex flex-wrap gap-3 justify-between items-center">
          <h1 className="text-[13px] font-black tracking-widest text-white uppercase font-mono">
            {activeTab === "dashboard" && "Imaging Performance & Transducer Metrics"}
            {activeTab === "activeScans" &&
              (selectedOrder ? "Acoustic Observation Entry" : "Incoming Patient Scan Worklist")}
            {activeTab === "scanRegistry" && "Institutional Ultrasound Scan Registry"}
          </h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={loadQueue}
              className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] bg-[#12241F] border border-[#29323a] hover:text-white px-3 py-1.5 rounded-lg transition"
            >
              <RefreshCw size={11} className={loading ? "animate-spin" : ""} /> Sync
            </button>
            <div className="flex items-center gap-2 font-mono text-[10px] text-[#94A3B8] bg-[#12241F] px-3 py-1.5 rounded-lg border border-[#29323a]">
              <Clock size={11} className="text-[#10B981]" /> Last sync:
              <span className="font-bold text-white">
                {lastSynced ? lastSynced.toLocaleTimeString() : "—"}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {message && (
            <div
              className={`mb-4 px-4 py-2.5 rounded-lg border font-mono text-[11px] font-bold flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                  : "bg-rose-950/40 border-rose-900 text-rose-300"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle size={13} />
              ) : (
                <ShieldAlert size={13} />
              )}
              {message.text}
            </div>
          )}

          {queueError && (
            <div className="mb-4 px-4 py-2.5 rounded-lg border border-rose-900 bg-rose-950/40 text-rose-300 font-mono text-[11px] font-bold flex items-center gap-2">
              <ShieldAlert size={13} /> {queueError}
            </div>
          )}

          {/* ULTRASOUND DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: "Pending Scans",
                    value: orders.length,
                    icon: <Video size={16} />,
                    bg: "bg-[#10B981] text-white",
                  },
                  {
                    label: "Urgent Scans",
                    value: `${urgentCount} Pending`,
                    icon: <ShieldAlert size={16} />,
                    bg: "bg-rose-50 text-rose-600 border border-rose-100",
                  },
                  {
                    label: "Average Scan Time",
                    value: "18.5 Mins",
                    icon: <Clock size={16} />,
                    bg: "bg-slate-100 text-slate-600",
                  },
                  {
                    label: "Procedures Completed Today",
                    value: "24 Studies",
                    icon: <ClipboardCheck size={16} />,
                    bg: "bg-slate-100 text-slate-700",
                  },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl flex items-center justify-between bg-white border border-slate-200 shadow-sm"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                        {stat.label}
                      </span>
                      <span className="text-xl font-black text-slate-900 mt-1 block font-mono">
                        {stat.value}
                      </span>
                    </div>
                    <div className={`p-2.5 rounded-lg ${stat.bg}`}>{stat.icon}</div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2 font-mono">
                  <BarChart3 className="text-[#10B981]" size={15} /> DICOM Imaging
                  Architecture Sync
                </h3>
                <p className="text-[11px] text-slate-600 leading-relaxed max-w-3xl">
                  This workstation communicates with localized digital sonography
                  systems. Captured high-frequency soundwave maps are temporarily
                  cached and cross-referenced with regional EMR billing systems.
                  Final diagnostic signatures instantly populate relevant clinical
                  timeline screens.
                </p>
              </div>
            </div>
          )}

          {/* ACTIVE INVESTIGATION QUEUE */}
          {activeTab === "activeScans" && !selectedOrder && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-sm">
                <div className="relative w-full sm:w-80">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={13}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Patient name or MRN..."
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-[#10B981]/40 focus:border-[#10B981]"
                  />
                </div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {visibleOrders.length} referred study
                  {visibleOrders.length === 1 ? "" : "s"} awaiting imaging
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500 font-mono">
                      <th className="p-3 px-4">Worklist ID</th>
                      <th className="p-3 px-4">Patient Identifier</th>
                      <th className="p-3 px-4">Requested Study</th>
                      <th className="p-3 px-4">Patient Preparation</th>
                      <th className="p-3 px-4">Physician</th>
                      <th className="p-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px] font-medium text-slate-700">
                    {visibleOrders.map((order) => (
                      <tr key={order.patientId} className="hover:bg-slate-50/70 transition-all">
                        <td className="p-3 px-4 font-mono text-[#0f9f6e] font-bold">
                          {order.id}
                        </td>
                        <td className="p-3 px-4">
                          <span className="text-slate-900 font-bold text-[12px] block">
                            {order.patientName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            MRN: {order.mrn} • {order.gender}, {order.age} Yrs
                          </span>
                        </td>
                        <td className="p-3 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {order.scans.map((scan, i) => (
                              <span
                                key={i}
                                className="bg-slate-100 text-slate-700 border border-slate-200 text-[9px] font-bold px-2 py-0.5 rounded"
                              >
                                {scan}
                              </span>
                            ))}
                          </div>
                          {order.clinicalIndication && (
                            <span className="text-[9px] text-slate-400 font-mono block mt-1">
                              Indication: {order.clinicalIndication}
                            </span>
                          )}
                        </td>
                        <td className="p-3 px-4 font-mono text-slate-500 text-[10px]">
                          {order.preparation}
                          <span className="block text-[9px] text-slate-400">
                            Referred {order.timestamp}
                          </span>
                        </td>
                        <td className="p-3 px-4 text-slate-600 text-[10px] font-mono">
                          {order.requestedBy}
                          <span
                            className={`block mt-0.5 font-bold uppercase ${
                              order.urgency === "Urgent"
                                ? "text-rose-600"
                                : "text-slate-400"
                            }`}
                          >
                            {order.urgency}
                          </span>
                        </td>
                        <td className="p-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setMessage(null);
                              clearScanImages();
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#10B981] hover:bg-[#0d9a6e] text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all shadow-sm"
                          >
                            Log Study <ChevronRight size={11} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!loading && visibleOrders.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center">
                          <Activity className="mx-auto text-slate-300 mb-2" size={22} />
                          <p className="text-[11px] font-mono text-slate-400">
                            {queueError
                              ? "Worklist unavailable — retry the sync above."
                              : "No pending ultrasound referrals. Requests appear here the moment a physician dispatches one."}
                          </p>
                        </td>
                      </tr>
                    )}
                    {loading && visibleOrders.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="p-8 text-center text-[11px] font-mono text-slate-400"
                        >
                          Syncing worklist from the EMR…
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* OBSERVATIONS LOG ENTRY FORM */}
          {activeTab === "activeScans" && selectedOrder && (
            <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden text-slate-800 animate-fadeIn">
              <div className="p-4 bg-[#0E1B17] text-white flex justify-between items-start gap-3">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider">
                    {selectedOrder.patientName}
                  </h2>
                  <p className="text-[10px] text-[#94A3B8] font-mono mt-1">
                    MRN: {selectedOrder.mrn} • {selectedOrder.gender},{" "}
                    {selectedOrder.age} Yrs • Prep: {selectedOrder.preparation}
                  </p>
                </div>
                <span
                  className={`text-[9px] font-mono font-black px-2 py-1 rounded uppercase tracking-widest ${
                    selectedOrder.urgency === "Urgent"
                      ? "bg-rose-600 text-white"
                      : "bg-slate-700 text-slate-200"
                  }`}
                >
                  {selectedOrder.urgency}
                </span>
              </div>

              <form onSubmit={handleVerifyAndSubmit} className="p-6 space-y-5">
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-[11px] text-emerald-900 font-medium">
                  <strong>Referred by:</strong> {selectedOrder.requestedBy} •{" "}
                  {selectedOrder.timestamp}
                  {selectedOrder.clinicalIndication && (
                    <span className="block mt-1 text-emerald-800/80">
                      Indication: {selectedOrder.clinicalIndication}
                    </span>
                  )}
                </div>

                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pb-2 border-b border-slate-100">
                  Sonographic Report Entry
                </h3>

                <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                  <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FlaskConical size={12} className="text-[#10B981]" />
                    {selectedOrder.scans[0]}
                  </h4>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block font-mono">
                      Echogenic Findings & Physical Observations
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={selectedOrder.resultsLogged.findings}
                      onChange={(e) => handleResultChange("findings", e.target.value)}
                      placeholder="Describe architectural echoes, organ boundaries, lesions, sizes or fluid pockets..."
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-[#10B981]/40 focus:border-[#10B981]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block font-mono">
                      Diagnostic Impression
                    </label>
                    <input
                      type="text"
                      required
                      value={selectedOrder.resultsLogged.impression}
                      onChange={(e) => handleResultChange("impression", e.target.value)}
                      placeholder="e.g. Normal liver texture, cholelithiasis detected, or healthy fetal metrics"
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-[#10B981]/40 focus:border-[#10B981]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block font-mono">
                      Captured Scan Images
                    </label>
                    <label
                      htmlFor="scan-image-input"
                      className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-slate-300 hover:border-[#10B981] hover:bg-emerald-50/40 rounded-lg px-3 py-4 cursor-pointer bg-white text-center transition"
                    >
                      <ImageIcon size={16} className="text-[#10B981]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        Attach scan images from file
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">
                        PNG / JPG · up to 6 images · 8 MB each
                      </span>
                      <input
                        id="scan-image-input"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageSelect}
                      />
                    </label>

                    {scanImages.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {scanImages.map((image, index) => (
                          <div
                            key={image.preview}
                            className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-white"
                          >
                            <img
                              src={image.preview}
                              alt={`Selected scan ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeScanImage(index)}
                              title="Remove image"
                              className="absolute top-1 right-1 p-1 bg-slate-900/70 hover:bg-rose-600 text-white rounded-md transition"
                            >
                              <X size={10} />
                            </button>
                            <span className="absolute bottom-0 left-0 right-0 bg-slate-900/60 text-white text-[8px] font-mono px-1 py-0.5 truncate">
                              {image.file.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      clearScanImages();
                      setSelectedOrder(null);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all"
                  >
                    Cancel Study
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-[#10B981] hover:bg-[#0d9a6e] disabled:opacity-60 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all shadow-md"
                  >
                    {submitting ? "Releasing…" : "Verify & Release Report"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SCAN DIRECTORY TAB */}
          {activeTab === "scanRegistry" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500 font-mono">
                      <th className="p-3 px-4">Procedure Code</th>
                      <th className="p-3 px-4">Study Title</th>
                      <th className="p-3 px-4">Imaging Section</th>
                      <th className="p-3 px-4">Est. Duration</th>
                      <th className="p-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px] font-medium text-slate-700">
                    {scanDirectory.map((scan) => (
                      <tr key={scan.code} className="hover:bg-slate-50/70 transition-all">
                        <td className="p-3 px-4 font-mono font-bold text-[#0f9f6e]">
                          {scan.code}
                        </td>
                        <td className="p-3 px-4 text-slate-900 font-bold text-[12px]">
                          {scan.name}
                        </td>
                        <td className="p-3 px-4 font-mono text-slate-500 text-[10px]">
                          {scan.section}
                        </td>
                        <td className="p-3 px-4 text-slate-600 font-mono text-[10px]">
                          {scan.turnaround}
                        </td>
                        <td className="p-3 px-4 text-right">
                          <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 rounded">
                            {scan.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
