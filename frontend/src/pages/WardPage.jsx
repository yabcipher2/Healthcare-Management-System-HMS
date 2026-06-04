import React, { useState } from "react";
import {
  Layers,
  Search,
  LogOut,
  Bed,
  Users,
  AlertCircle,
  Clock,
  DoorOpen,
  CheckCircle,
  ArrowDownToLine,
  Activity,
  Hospital,
} from "lucide-react";

export default function WardPage({ onLogout }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBed, setSelectedBed] = useState(null);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [discharging, setDischarging] = useState(false);
  const hospitalLogo = "/mesra icon.png";
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  const totalBeds = beds.length;
  const occupiedCount = beds.filter((b) => b.status === "Occupied").length;
  const availableCount = totalBeds - occupiedCount;

  useEffect(() => {
    const fetchBeds = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/ward`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch beds");
        const data = await response.json();
        const mapped = (data.data || []).map((b) => ({
          ...b,
          admissionTime: b.admissionTime || "",
          attendingDoctor: b.attendingDoctor || "",
          severity: b.severity || "",
          patientName: b.patientName || "",
        }));
        setBeds(mapped);
        setError("");
      } catch (err) {
        console.error("Error fetching beds:", err);
        setError("Failed to load bed data");
      } finally {
        setLoading(false);
      }
    };
    fetchBeds();
  }, [API_URL, token]);

  const handleDischargePatient = async (bedId) => {
    try {
      setDischarging(true);
      const response = await fetch(`${API_URL}/api/ward/${bedId}/discharge`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to discharge bed");
      setBeds((prev) =>
        prev.map((b) =>
          b.bedId === bedId
            ? { ...b, status: "Available", patientName: "", admissionTime: "", attendingDoctor: "", severity: "", patientCardId: "" }
            : b
        )
      );
      setSelectedBed(null);
    } catch (err) {
      alert(`Discharge failed: ${err.message}`);
    } finally {
      setDischarging(false);
    }
  };

  const filteredBeds = beds.filter(
    (b) =>
      (b.bedId || b.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.patientName || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-400 text-sm font-bold">
        Loading bed allocation matrix...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-400 text-sm font-bold">
        {error}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 z-30">
        <div>
          <div className="p-6 border-b border-slate-200 flex items-center gap-3.5">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md">
              <Hospital size={20} />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-black text-lg tracking-wider text-slate-900">
                  MESRA
                </span>
                <span className="font-bold text-[10px] uppercase tracking-widest bg-teal-600 px-1.5 py-0.5 rounded text-white font-mono">
                  WARD
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono tracking-tight">
                Inpatient Unit Asset Deck
              </p>
            </div>
          </div>

          <nav className="p-4 space-y-1.5 pt-6">
            <button className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-teal-600 text-white shadow-lg shadow-teal-600/20">
              <Layers size={16} />
              Bed Control Matrix
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="bg-slate-100 rounded-xl p-3 border border-slate-200 text-[10px] font-mono text-slate-600 space-y-1">
            <p className="text-teal-600 font-bold">
              Facility Location: Block B
            </p>
            <p>Role: Ward Allocation Controller</p>
          </div>
          <div className="p-4 border-t border-slate-200 space-y-3">
            <div className="bg-slate-100 rounded-xl p-3 border border-slate-200 text-[10px] font-mono text-slate-600 space-y-1">
              <p className="text-indigo-600 font-bold">Station ID: NS-Alpha</p>
              <p>Role: Clinical / Ward Nurse</p>
            </div>
            {/* THIS IS YOUR LOGOUT BUTTON */}
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-rose-950 text-slate-300 hover:text-rose-400 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
            >
              <LogOut size={14} /> Exit Platform
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT FRAMEWORK */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-8 py-4 z-20 flex justify-between items-center shadow-sm">
          <h1 className="text-base font-bold tracking-wider text-slate-800 uppercase font-mono">
            Inpatient Bed Occupancy & Chronology Monitor
          </h1>
          <div className="text-right font-mono text-[11px] text-slate-400">
            System State:{" "}
            <span className="text-teal-500 font-bold">
              Dynamic Tracker Active
            </span>
          </div>
        </header>

        {/* METRICS DASHBOARD RIBBON */}
        <div className="px-8 pt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                Total Grid Capacitance
              </p>
              <h3 className="text-xl font-black text-slate-800 mt-1">
                {totalBeds} Bed Units
              </h3>
            </div>
            <Bed className="text-slate-300" size={24} />
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-wider">
                Active Occupancies
              </p>
              <h3 className="text-xl font-black text-slate-800 mt-1">
                {occupiedCount} Assigned
              </h3>
            </div>
            <Users className="text-amber-400" size={24} />
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-wider">
                Vacant & Prepared
              </p>
              <h3 className="text-xl font-black text-slate-800 mt-1">
                {availableCount} Vacant
              </h3>
            </div>
            <DoorOpen className="text-emerald-500" size={24} />
          </div>
        </div>

        <main className="flex-1 p-8 overflow-y-auto grid lg:grid-cols-12 gap-8">
          {/* LEFT AREA: GRID MAP SCREEN */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-400 mb-3">
                Query Ward Grid Allocation
              </h3>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by bed tag, room module, or inpatient name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

             {/* WARD INTERACTIVE MATRIX GRID */}
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {filteredBeds.map((bed) => (
                 <div
                   key={bed.bedId}
                   onClick={() => setSelectedBed(bed)}
                   className={`p-5 bg-white border rounded-2xl cursor-pointer transition-all ${selectedBed?.bedId === bed.bedId ? "border-teal-500 ring-2 ring-teal-500/10 shadow-md" : "border-slate-200 shadow-sm hover:border-slate-300"}`}
                 >
                   <div className="flex justify-between items-start">
                     <div>
                       <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                         {bed.room}
                       </span>
                       <h4 className="font-black text-slate-800 text-sm mt-0.5 flex items-center gap-1.5">
                         <Bed
                           size={15}
                           className={
                             bed.status === "Occupied"
                               ? "text-amber-500"
                               : "text-emerald-500"
                           }
                         />
                         Slot Code {bed.bedId}
                       </h4>
                     </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${bed.status === "Occupied" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}
                    >
                      {bed.status}
                    </span>
                  </div>

                  {bed.status === "Occupied" ? (
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {bed.patientName}
                      </p>
                      <p className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock size={11} /> Duration: {bed.admissionTime}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic mt-4 pt-3 border-t border-slate-100 font-medium">
                      Ready for immediate room transfer
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT AREA: DETAILED MONITORING CONSOLE */}
          <div className="lg:col-span-5">
            {selectedBed ? (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-fadeIn">
                <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                  <div>
                    <span className="text-xs font-mono text-teal-400 font-bold uppercase">
                      {selectedBed.room}
                    </span>
                    <h2 className="text-base font-black tracking-wide text-white mt-0.5">
                      Bed Asset {selectedBed.id}
                    </h2>
                  </div>
                  <span className="text-xs font-mono font-bold bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-300">
                    {selectedBed.type}
                  </span>
                </div>

                <div className="p-6 space-y-6">
                  {selectedBed.status === "Occupied" ? (
                    <>
                      <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-5 space-y-2 text-xs text-amber-900">
                        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-amber-800">
                          <Activity size={12} /> Active Ward Occupancy Dossier
                        </div>
                        <div className="space-y-1 mt-1 font-medium">
                          <p>
                            <span className="text-amber-700/80">
                              Inpatient Name:
                            </span>{" "}
                            {selectedBed.patientName}
                          </p>
                          <p>
                            <span className="text-amber-700/80">
                              Attending Physician:
                            </span>{" "}
                            {selectedBed.attendingDoctor}
                          </p>
                          <p>
                            <span className="text-amber-700/80">
                              Severity Assignment:
                            </span>{" "}
                            {selectedBed.severity}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                          Admission Chronology Timeline
                        </span>
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5 text-xs font-medium text-slate-700">
                          <Clock size={14} className="text-teal-500" /> Patient
                          checked into asset structure{" "}
                          <strong>{selectedBed.admissionTime}</strong>.
                        </div>
                      </div>

                      <button
                        onClick={() => handleDischargePatient(selectedBed.bedId)}
                        disabled={discharging}
                        className="w-full py-3 bg-slate-900 hover:bg-rose-950 border border-slate-800 text-slate-200 hover:text-rose-400 font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <ArrowDownToLine size={15} /> {discharging ? "Processing..." : "Finalize Inpatient Exit & Release Bed"}
                      </button>
                    </>
                  ) : (
                    <div className="p-8 text-center space-y-4">
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                        <CheckCircle size={22} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                          Bed Unit Asset Vacant
                        </h4>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                          This allocation asset slot is fully sterilized,
                          configured, and waiting for an incoming patient
                          dispatch request from the Doctor-Nurse Pipeline hub.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-96 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col justify-center items-center text-slate-400 bg-white shadow-sm">
                <Bed size={36} className="text-slate-300 mb-2" />
                <p className="text-xs font-bold uppercase tracking-wider">
                  Select an operational bed slot cell grid to monitor
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
