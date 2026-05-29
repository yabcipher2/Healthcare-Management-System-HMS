import React, { useState } from "react";
import {
  Activity,
  LayoutDashboard,
  ClipboardCheck,
  Search,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Users,
  LogOut,
  ChevronRight,
  BarChart3,
  Image as ImageIcon,
  FileText,
  Video
} from "lucide-react";

export default function UltrasoundPage({ onLogout }) {
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, activeScans, scanRegistry
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const hospitalLogo = "/mesra icon.png";

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
    }
  ]);

  // 2. Live Scan Worklist Queue (Referred from Physicians/Triage)
  const [orders, setOrders] = useState([
    {
      id: "RAD-4401",
      patientName: "Chaltu Kebede",
      mrn: "MR-2026-012",
      age: "29",
      gender: "Female",
      requestedBy: "Dr. Tariku Alemayehu",
      timestamp: "09:15 AM",
      urgency: "High Priority",
      scans: ["Pelvic / Transvaginal Scan"],
      preparation: "Full Bladder (Hydrated)",
      resultsLogged: { findings: "", impression: "" },
    },
    {
      id: "RAD-4408",
      patientName: "Bekele Zewdu",
      mrn: "MR-2026-019",
      age: "45",
      gender: "Male",
      requestedBy: "Dr. Beza Kemal",
      timestamp: "11:10 AM",
      urgency: "Routine",
      scans: ["Abdominal Ultrasound Complete"],
      preparation: "NPO (Fasting 6+ Hours)",
      resultsLogged: { findings: "", impression: "" },
    },
  ]);

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
  const handleVerifyAndSubmit = (e) => {
    e.preventDefault();

    alert(
      `Ultrasound Imaging Report ${selectedOrder.id} successfully authenticated, signed by Sonographer, and released to Doctor EMR timeline.`
    );

    // Remove from active queue
    setOrders((prev) => prev.filter((o) => o.id !== selectedOrder.id));
    setSelectedOrder(null);
    setActiveTab("activeScans");
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      {/* SIDEBAR NAVIGATION PANEL */}
      <aside className="w-68 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 z-30">
        <div>
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <img
              src={hospitalLogo}
              alt="Mesra Logo"
              className="w-10 h-10 object-contain rounded-xl"
            />
            <div>
              <h3 className="font-black text-slate-900 tracking-tight text-md leading-none">
                MESRA <span className="text-blue-600">RAD</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono tracking-widest block mt-1 uppercase font-bold">
                Ultrasound Unit
              </span>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setSelectedOrder(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "dashboard" ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              <LayoutDashboard size={16} /> Hub Throughput
            </button>
            <button
              onClick={() => {
                setActiveTab("activeScans");
                setSelectedOrder(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "activeScans" ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              <Video size={16} /> Scan Worklist ({orders.length})
            </button>
            <button
              onClick={() => {
                setActiveTab("scanRegistry");
                setSelectedOrder(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "scanRegistry" ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              <ImageIcon size={16} /> Scan Directory
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3 text-[11px] font-mono text-slate-500 mb-3 border border-slate-200/60">
            <p className="font-bold text-blue-600">Ultrasound Terminal</p>
            <p>Transducer Sync: ONLINE</p>
            <p>Sonographer: Sr. Martha H.</p>
          </div>
          <button
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              window.location.href = "/login";
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900 text-slate-400 hover:text-rose-400 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
          >
            <LogOut size={14} /> Exit Platform
          </button>
        </div>
      </aside>

      {/* CORE WORKSPACE AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200/80 sticky top-0 px-8 py-5 z-20 flex justify-between items-center">
          <h1 className="text-sm font-black tracking-widest text-slate-900 uppercase font-mono">
            {activeTab === "dashboard" && "Imaging Performance & Transducer Metrics"}
            {activeTab === "activeScans" &&
              (selectedOrder ? "Acoustic Observation Entry" : "Incoming Patient Scan Worklist")}
            {activeTab === "scanRegistry" && "Institutional Ultrasound Scan Registry"}
          </h1>
          <div className="flex items-center gap-2 font-mono text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/40">
            <Clock size={12} className="text-blue-600" /> Active System Time:{" "}
            <span className="font-bold text-slate-800">11:35 PM</span>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          {/* ULTRASOUND DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    label: "Pending Scans",
                    value: orders.length,
                    icon: <Video size={18} />,
                    bg: "bg-blue-600 text-white",
                  },
                  {
                    label: "Urgent Scans",
                    value: orders.filter((o) => o.urgency.includes("High")).length + " Pending",
                    icon: <ShieldAlert size={18} />,
                    bg: "bg-rose-50 text-rose-600 border border-rose-100",
                  },
                  {
                    label: "Average Scan Time",
                    value: "18.5 Mins",
                    icon: <Clock size={18} />,
                    bg: "bg-emerald-50 text-emerald-600 border border-emerald-100",
                  },
                  {
                    label: "Procedures Completed Today",
                    value: "24 Studies",
                    icon: <ClipboardCheck size={18} />,
                    bg: "bg-slate-100 text-slate-700",
                  },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl flex items-center justify-between shadow-sm bg-white border border-slate-200/60"
                  >
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        {stat.label}
                      </span>
                      <span className="text-2xl font-black text-slate-900 mt-1 block font-mono">
                        {stat.value}
                      </span>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bg}`}>
                      {stat.icon}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BarChart3 className="text-blue-600" size={16} /> DICOM Imaging Architecture Sync
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                  This workstation communicates with localized digital sonography systems.
                  Captured high-frequency soundwave maps are temporarily cached and cross-referenced with regional EMR billing systems.
                  Final diagnostic signatures instantly populate relevant clinical timeline screens.
                </p>
              </div>
            </div>
          )}

          {/* ACTIVE INVESTIGATION QUEUE */}
          {activeTab === "activeScans" && !selectedOrder && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Patient name or MRN..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 font-mono">
                      <th className="p-4 px-6">Worklist ID</th>
                      <th className="p-4 px-6">Patient Identifier</th>
                      <th className="p-4 px-6">Requested Study</th>
                      <th className="p-4 px-6">Patient Preparation Instruction</th>
                      <th className="p-4 px-6">Physician</th>
                      <th className="p-4 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {orders
                      .filter(
                        (o) =>
                          o.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.mrn.includes(searchQuery)
                      )
                      .map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50/60 transition-all">
                          <td className="p-4 px-6 font-mono text-blue-600 font-bold">{order.id}</td>
                          <td className="p-4 px-6">
                            <span className="text-slate-900 font-bold text-sm block">{order.patientName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              MRN: {order.mrn} • {order.gender}, {order.age} Yrs
                            </span>
                          </td>
                          <td className="p-4 px-6">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {order.scans.map((s, i) => (
                                <span key={i} className="bg-slate-100 text-slate-700 text-[9px] font-bold px-2 py-0.5 rounded-md">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 px-6 font-mono text-slate-500 text-[11px]">{order.preparation}</td>
                          <td className="p-4 px-6 text-slate-600 font-medium">{order.requestedBy}</td>
                          <td className="p-4 px-6 text-right">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className={`inline-flex items-center gap-1.5 px-4 py-2 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm ${
                                order.urgency.includes("High") ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-600 hover:bg-blue-700"
                              }`}
                            >
                              Log Study <ChevronRight size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* OBSERVATIONS LOG ENTRY FORM */}
          {activeTab === "activeScans" && selectedOrder && (
            <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden text-slate-800 animate-fadeIn">
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold uppercase tracking-wider">{selectedOrder.patientName}</h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    MRN Profile ID: {selectedOrder.mrn} | Prep: {selectedOrder.preparation}
                  </p>
                </div>
                <span className="bg-rose-600 text-white text-[10px] font-mono font-black px-2.5 py-1 rounded-md uppercase tracking-widest">
                  {selectedOrder.urgency}
                </span>
              </div>

              <form onSubmit={handleVerifyAndSubmit} className="p-8 space-y-6">
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-xs text-blue-900 font-medium">
                  <strong>Procedure Ordered by:</strong> {selectedOrder.requestedBy} on {selectedOrder.timestamp}
                </div>

                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest block pt-2 border-b border-slate-100 pb-2">
                  Sonographic Report Entry
                </h3>

                <div className="space-y-4 bg-slate-50/60 p-5 rounded-2xl border border-slate-200/40">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {selectedOrder.scans[0]}
                  </h4>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                      Echogenic Findings & Physical Observations
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={selectedOrder.resultsLogged.findings}
                      onChange={(e) => handleResultChange("findings", e.target.value)}
                      placeholder="Describe architectural echoes, organ boundaries, lesions, sizes or fluid pockets..."
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                      Diagnostic Impression
                    </label>
                    <input
                      type="text"
                      required
                      value={selectedOrder.resultsLogged.impression}
                      onChange={(e) => handleResultChange("impression", e.target.value)}
                      placeholder="e.g. Normal liver texture, cholelithiasis detected, or healthy fetal metrics"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                  >
                    Cancel Study
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1"
                  >
                    Verify & Release Report
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SCAN DIRECTORY TAB */}
          {activeTab === "scanRegistry" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 font-mono">
                      <th className="p-4 px-6">Procedure Code</th>
                      <th className="p-4 px-6">Study Title</th>
                      <th className="p-4 px-6">Imaging Section</th>
                      <th className="p-4 px-6">Est. Duration</th>
                      <th className="p-4 px-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {scanDirectory.map((scan) => (
                      <tr key={scan.code} className="hover:bg-slate-50/60 transition-all">
                        <td className="p-4 px-6 font-mono font-bold text-blue-600">{scan.code}</td>
                        <td className="p-4 px-6 text-slate-900 font-bold text-sm">{scan.name}</td>
                        <td className="p-4 px-6 font-mono text-slate-500">{scan.section}</td>
                        <td className="p-4 px-6 text-slate-600">{scan.turnaround}</td>
                        <td className="p-4 px-6 text-right">
                          <span className="inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-md">
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