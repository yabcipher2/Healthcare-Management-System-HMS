# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.






the triagepage.jsx file code is this

import React, { useState, useEffect } from "react";

import {

  Activity,

  Heart,

  Thermometer,

  Wind,

  AlertTriangle,

  Users,

  CheckCircle,

  Clock,

  LayoutDashboard,

  FileText,

  Search,

  ChevronRight,

  ArrowUpRight,

  Filter,

  ShieldAlert,

  Settings,

  LogOut,

  ChevronLeft,

  UserCheck,

} from "lucide-react";



export default function TriagePage({ onLogout }) {

  const [activeTab, setActiveTab] = useState("dashboard");

  const [selectedPatient, setSelectedPatient] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");

  const [triageFilter, setTriageFilter] = useState("All");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [redCriticalsToday, setRedCriticalsToday] = useState(0);

  const [totalAssessedToday, setTotalAssessedToday] = useState(0);

  const [vitals, setVitals] = useState({

    bpSystolic: "",

    bpDiastolic: "",

    heartRate: "",

    temperature: "",

    spo2: "",

    respiratoryRate: "",

    weight: "",

    randomBloodSugar: "",

    triageCategory: "",

    secondaryUrgencyNotes: "",

  });



  // Dispatch state

  const [dispatching, setDispatching] = useState(false);

  const [dispatchStatus, setDispatchStatus] = useState(null); // null, 'success', 'error'

  const [selectedDepartment, setSelectedDepartment] = useState("");

  const [doctorsByDepartment, setDoctorsByDepartment] = useState([]);

  const [selectedDoctor, setSelectedDoctor] = useState("");

  const [departments, setDepartments] = useState([]);

  const [departmentsLoading, setDepartmentsLoading] = useState(false);

  const [departmentsError, setDepartmentsError] = useState("");

  const [doctorsLoading, setDoctorsLoading] = useState(false);

  const hospitalLogo = "/mesra icon.png";



  // API Configuration

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const token = localStorage.getItem("token");



  const getAuthHeaders = (isJson = true) => {

    const headers = {};

    if (isJson) headers["Content-Type"] = "application/json";

    if (token) headers["Authorization"] = `Bearer ${token}`;

    return headers;

  };



  // Waiting Queue State

  const [queue, setQueue] = useState([]);



  // Fetch queue from backend on mount

  useEffect(() => {

    const fetchQueue = async () => {

      try {

        setLoading(true);

        const response = await fetch(`${API_URL}/api/triage/queue`, {

          headers: getAuthHeaders(),

        });

        if (!response.ok) throw new Error("Failed to fetch queue");

        const data = await response.json();

        setQueue(data.data || []);

        setError("");

      } catch (err) {

        console.error("Error fetching queue:", err);

        setError("Failed to load queue");

      } finally {

        setLoading(false);

      }

    };

    fetchQueue();

  }, [API_URL]);



  // Fetch triage statistics from backend on mount

  useEffect(() => {

    const fetchStatistics = async () => {

      try {

        // Fetch red criticals today

        const redCriticalsResponse = await fetch(

          `${API_URL}/api/triage/red-criticals-today`,

          {

            headers: getAuthHeaders(),

          },

        );

        if (!redCriticalsResponse.ok)

          throw new Error("Failed to fetch red criticals today");

        const redCriticalsData = await redCriticalsResponse.json();

        setRedCriticalsToday(redCriticalsData.count || 0);



        // Fetch total assessed today

        const totalAssessedResponse = await fetch(

          `${API_URL}/api/triage/total-assessed-today`,

          {

            headers: getAuthHeaders(),

          },

        );

        if (!totalAssessedResponse.ok)

          throw new Error("Failed to fetch total assessed today");

        const totalAssessedData = await totalAssessedResponse.json();

        setTotalAssessedToday(totalAssessedData.count || 0);

      } catch (err) {

        console.error("Error fetching triage statistics:", err);

      }

    };

    fetchStatistics();

  }, [API_URL]);



  // Fetch departments from backend on mount

  useEffect(() => {

    const fetchDepartments = async () => {

      try {

        setDepartmentsLoading(true);

        const response = await fetch(`${API_URL}/api/doctor/departments`, {

          headers: getAuthHeaders(),

        });

        if (!response.ok) throw new Error("Failed to fetch departments");

        const data = await response.json();

        if (data.success) {

          setDepartments(data.data || []);

        } else {

          setDepartmentsError(data.message || "Failed to fetch departments");

        }

      } catch (err) {

        console.error("Error fetching departments:", err);

        setDepartmentsError(err.message);

      } finally {

        setDepartmentsLoading(false);

      }

    };



    fetchDepartments();

  }, [API_URL]);



  // Fetch doctors when department changes

  useEffect(() => {

    if (!selectedDepartment) {

      setDoctorsByDepartment([]);

      setSelectedDoctor("");

      return;

    }



    const fetchDoctorsByDepartment = async () => {

      try {

        setDoctorsLoading(true);

        const storedToken = localStorage.getItem("token");

        const response = await fetch(

          `${API_URL}/api/doctor/doctors/department/${selectedDepartment}`,

          {

            headers: {

              Authorization: `Bearer ${storedToken}`,

            },

          },

        );

        if (!response.ok) {

          const errorData = await response.json();

          console.error("Failed to fetch doctors by department:", errorData);

          setDoctorsByDepartment([]);

          setSelectedDoctor("");

          return;

        }

        const data = await response.json();

        if (data.success) {

          setDoctorsByDepartment(data.data || []);

          if (data.data && data.data.length > 0) {

            setSelectedDoctor(data.data[0]._id);

          } else {

            setSelectedDoctor("");

          }

        }

      } catch (err) {

        console.error("Error fetching doctors by department:", err);

        setDoctorsByDepartment([]);

        setSelectedDoctor("");

      } finally {

        setDoctorsLoading(false);

      }

    };



    fetchDoctorsByDepartment();

  }, [selectedDepartment, API_URL]);



  // Dynamic Triage Color Calculator based on Vitals Metrics

  useEffect(() => {

    const sys = parseInt(vitals.bpSystolic);

    const pulse = parseInt(vitals.heartRate);

    const temp = parseFloat(vitals.temperature);

    const ox = parseInt(vitals.spo2);



    if (!sys && !pulse && !temp && !ox) return;



    if ((ox && ox < 90) || (sys && sys < 80) || (pulse && pulse > 130)) {

      setVitals((prev) => ({ ...prev, triageCategory: "Red (Resuscitation)" }));

    } else if (

      (ox && ox >= 90 && ox < 94) ||

      (sys && sys >= 160) ||

      (temp && temp > 39)

    ) {

      setVitals((prev) => ({ ...prev, triageCategory: "Orange (Emergent)" }));

    } else if ((temp && temp >= 38) || (pulse && pulse > 100)) {

      setVitals((prev) => ({ ...prev, triageCategory: "Yellow (Urgent)" }));

    } else {

      setVitals((prev) => ({ ...prev, triageCategory: "Green (Non-Urgent)" }));

    }

  }, [vitals.bpSystolic, vitals.heartRate, vitals.temperature, vitals.spo2]);



  const handleVitalChange = (e) => {

    const { name, value } = e.target;

    setVitals((prev) => ({ ...prev, [name]: value }));

  };



  const handleTriageSubmit = (e) => {

    e.preventDefault();

    // Vitals verified, now swap to routing dispatch panel interface

    setDispatching(true);

  };



  // Handle Confirm Dispatch

  const handleConfirmDispatch = async () => {

    if (!selectedDepartment || !selectedDoctor) {

      alert("Please select both department and doctor.");

      return;

    }



    try {

      const storedToken = localStorage.getItem("token");

      const response = await fetch(

        `${API_URL}/api/triage/${selectedPatient._id}/dispatch`,

        {

          method: "PUT",

          headers: {

            "Content-Type": "application/json",

            Authorization: `Bearer ${storedToken}`,

          },

          body: JSON.stringify({

            ...vitals,

            department: selectedDepartment,

            doctorId: selectedDoctor,

            dispatchedBy: "Triage Officer",

            dispatchedAt: new Date().toISOString(),

          }),

        },

      );



      if (!response.ok) {

        const errorData = await response.json();

        throw new Error(errorData.message || "Failed to dispatch patient");

      }



      const result = await response.json();

      if (!result.success) {

        throw new Error(result.message || "Failed to dispatch patient");

      }



      setDispatchStatus("success");



      // Remove from queue and reset state

      setQueue((prev) => prev.filter((p) => p._id !== selectedPatient._id));

      setSelectedPatient(null);

      setVitals({

        bpSystolic: "",

        bpDiastolic: "",

        heartRate: "",

        temperature: "",

        spo2: "",

        respiratoryRate: "",

        weight: "",

        randomBloodSugar: "",

        triageCategory: "",

        secondaryUrgencyNotes: "",

      });

      setSelectedDepartment("");

      setDoctorsByDepartment([]);

      setSelectedDoctor("");

      setDispatching(false);



      // Show success brief feedback message then clear

      setTimeout(() => {

        setDispatchStatus(null);

      }, 3000);



      // Return to live queue stream screen

      setActiveTab("waitingList");

    } catch (err) {

      setDispatchStatus("error");

      alert(`Error: ${err.message}`);

      console.error("Error dispatching patient:", err);

    }

  };



  return (

    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">

      {/* SIDEBAR NAVIGATION */}

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

                MESRA <span className="text-blue-600">TRIAGE</span>

              </h3>

              <span className="text-[10px] text-slate-400 font-mono tracking-widest block mt-1 uppercase font-bold">

                Vital Screening

              </span>

            </div>

          </div>



          <nav className="p-4 space-y-1">

            <button

              type="button"

              onClick={() => {

                setActiveTab("dashboard");

                setSelectedPatient(null);

                setDispatching(false);

              }}

              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition ${activeTab === "dashboard" ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}

            >

              <LayoutDashboard size={16} /> Dashboard Stats

            </button>

            <button

              type="button"

              onClick={() => {

                setActiveTab("waitingList");

                setSelectedPatient(null);

                setDispatching(false);

              }}

              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition ${activeTab === "waitingList" ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}

            >

              <Users size={16} /> Intake Waiting Queue ({queue.length})

            </button>

          </nav>

        </div>



        <div className="p-4 border-t border-slate-100">

          <div className="bg-slate-50 rounded-xl p-3 text-[11px] font-mono text-slate-500 mb-3 border border-slate-200/60">

            <p className="font-bold text-blue-600">Station Node: TRIAGE-A</p>

            <p>Clerk ID: NURSE_REMA</p>

          </div>

          <button

            type="button"

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



      {/* WORKSPACE AREA */}

      <div className="flex-1 flex flex-col min-w-0">

        <header className="bg-white border-b border-slate-200/80 sticky top-0 px-8 py-5 z-20 flex justify-between items-center">

          <h1 className="text-sm font-black tracking-widest text-slate-900 uppercase font-mono">

            {activeTab === "dashboard" && "Emergency Traffic Control Overview"}

            {activeTab === "waitingList" &&

              (selectedPatient

                ? dispatching

                  ? "Clinical Routing Assignment"

                  : "Vital Entry Validation"

                : "Incoming Triage Registry")}

          </h1>

          <div className="flex items-center gap-2 font-mono text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/40">

            <Clock size={12} className="text-blue-600" /> Active System Time:{" "}

            <span className="font-bold text-slate-800">10:42 AM</span>

          </div>

        </header>



        <main className="flex-1 p-8 overflow-y-auto">

          {/* FEEDBACK STATUS ALERTS */}

          {dispatchStatus === "success" && (

            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2 animate-fadeIn">

              <CheckCircle size={16} className="text-emerald-600" /> Patient

              vital packet recorded and dispatched successfully!

            </div>

          )}



          {/* TRIAGE DASHBOARD VIEW */}

          {activeTab === "dashboard" && (

            <div className="space-y-8 animate-fadeIn">

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                {[

                  {

                    label: "Active In-Queue",

                    value: queue.length,

                    icon: <Users size={18} />,

                    bg: "bg-blue-600 text-white",

                  },

                  {

                    label: "Red Criticals Today",

                    value: `${redCriticalsToday} Patients`,

                    icon: <ShieldAlert size={18} />,

                    bg: "bg-rose-50 text-rose-600 border border-rose-100",

                  },

                  {

                    label: "Avg Triage Clear Velocity",

                    value: "4.8 Min",

                    icon: <Clock size={18} />,

                    bg: "bg-emerald-50 text-emerald-600 border border-emerald-100",

                  },

                  {

                    label: "Total Assessed Today",

                    value: `${totalAssessedToday} Patients`,

                    icon: <CheckCircle size={18} />,

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

                      <span className="text-2xl font-black text-slate-900 mt-1 block">

                        {stat.value}

                      </span>

                    </div>

                    <div className={`p-3 rounded-xl ${stat.bg}`}>

                      {stat.icon}

                    </div>

                  </div>

                ))}

              </div>



              {/* Triage System Guidance Warning block */}

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">

                  <AlertTriangle className="text-amber-500" size={16} />{" "}

                  Automated Color Hierarchy Rules

                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">

                  <div className="p-3.5 bg-rose-50/60 border border-rose-100 rounded-xl">

                    <span className="font-bold text-rose-700 block mb-1">

                      RED LEVEL

                    </span>{" "}

                    SpO2 &lt; 90% | SBP &lt; 80 mmHg. Instantaneous Doctor

                    Dispatch.

                  </div>

                  <div className="p-3.5 bg-amber-50/60 border border-amber-100 rounded-xl">

                    <span className="font-bold text-amber-700 block mb-1">

                      ORANGE LEVEL

                    </span>{" "}

                    SpO2 90-94% | SBP &gt; 160 mmHg. High priority review.

                  </div>

                  <div className="p-3.5 bg-yellow-50/60 border border-yellow-100 rounded-xl">

                    <span className="font-bold text-yellow-700 block mb-1">

                      YELLOW LEVEL

                    </span>{" "}

                    Temp &gt; 38°C | HR &gt; 100 bpm. Routine urgent sequence.

                  </div>

                  <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl">

                    <span className="font-bold text-emerald-700 block mb-1">

                      GREEN LEVEL

                    </span>{" "}

                    Normal parameter boundaries. Stable clinical observation

                    track.

                  </div>

                </div>

              </div>

            </div>

          )}



          {/* WAITING QUEUE LIST */}

          {activeTab === "waitingList" && !selectedPatient && (

            <div className="space-y-6 animate-fadeIn">

              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">

                <div className="relative w-full sm:w-80">

                  <Search

                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"

                    size={14}

                  />

                  <input

                    type="text"

                    value={searchQuery}

                    onChange={(e) => setSearchQuery(e.target.value)}

                    placeholder="Filter live queue..."

                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"

                  />

                </div>

              </div>



              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

                <table className="w-full text-left border-collapse">

                  <thead>

                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 font-mono">

                      <th className="p-4 px-6">Queue ID</th>

                      <th className="p-4 px-6">Full Name</th>

                      <th className="p-4 px-6">Demographics</th>

                      <th className="p-4 px-6">Arrival Time</th>

                      <th className="p-4 px-6">Presenting Complaint</th>

                      <th className="p-4 px-6 text-right">Action</th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">

                    {queue

                      .filter(

                        (p) =>

                          p.patientName

                            .toLowerCase()

                            .includes(searchQuery.toLowerCase()) ||

                          p.cardId

                            .toLowerCase()

                            .includes(searchQuery.toLowerCase()),

                      )

                      .map((p) => (

                        <tr

                          key={p._id}

                          className="hover:bg-slate-50/60 transition"

                        >

                          <td className="p-4 px-6 font-mono text-blue-600 font-bold">

                            {p.cardId}

                          </td>

                          <td className="p-4 px-6 text-slate-900 font-bold text-sm">

                            {p.patientName}

                          </td>

                          <td className="p-4 px-6">

                            {p.gender} ({p.age} Yrs)

                          </td>

                          <td className="p-4 px-6 font-mono text-slate-500">

                            {p.registrationTime}

                          </td>

                          <td className="p-4 px-6 max-w-xs truncate text-slate-500">

                            {p.chiefComplaint}

                          </td>

                          <td className="p-4 px-6 text-right">

                            <button

                              type="button"

                              onClick={() => setSelectedPatient(p)}

                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-[11px] font-black uppercase tracking-wider rounded-xl hover:bg-blue-700 transition shadow-sm"

                            >

                              Screen Vitals <ChevronRight size={12} />

                            </button>

                          </td>

                        </tr>

                      ))}

                    {queue.length === 0 && (

                      <tr>

                        <td

                          colSpan="6"

                          className="p-8 text-center text-slate-400 font-mono"

                        >

                          {loading

                            ? "Loading queue streams..."

                            : "No patients waiting in queue intake."}

                        </td>

                      </tr>

                    )}

                  </tbody>

                </table>

              </div>

            </div>

          )}



          {/* VITALS ENTRY SCREEN */}

          {activeTab === "waitingList" && selectedPatient && (

            <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden animate-fadeIn text-slate-800">

              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">

                <div>

                  <h2 className="text-base font-bold uppercase tracking-wider">

                    {selectedPatient.patientName}

                  </h2>

                  <p className="text-xs text-slate-400 mt-0.5">

                    Demographics: {selectedPatient.gender},{" "}

                    {selectedPatient.age} Yrs | Queue Token:{" "}

                    {selectedPatient.cardId}

                  </p>

                </div>

                <span className="bg-blue-600 text-white text-xs font-mono font-bold px-3 py-1 rounded-lg">

                  {dispatching

                    ? "FINAL ROUTING SELECTION"

                    : "LIVE VITALS ACQUISITION"}

                </span>

              </div>



              <form onSubmit={handleTriageSubmit} className="p-8 space-y-6">

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">

                  <strong>Stated Complaint at Intake:</strong>{" "}

                  {selectedPatient.chiefComplaint}

                </div>



                {/* Grid Fields Row 1 */}

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">

                  <div className="space-y-1.5">

                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">

                      <Heart size={12} className="text-rose-500" /> SBP (mmHg)

                    </label>

                    <input

                      type="number"

                      name="bpSystolic"

                      value={vitals.bpSystolic}

                      onChange={handleVitalChange}

                      placeholder="e.g. 120"

                      required

                      disabled={dispatching}

                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"

                    />

                  </div>

                  <div className="space-y-1.5">

                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">

                      <Heart size={12} className="text-rose-400" /> DBP (mmHg)

                    </label>

                    <input

                      type="number"

                      name="bpDiastolic"

                      value={vitals.bpDiastolic}

                      onChange={handleVitalChange}

                      placeholder="e.g. 80"

                      required

                      disabled={dispatching}

                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"

                    />

                  </div>

                  <div className="space-y-1.5">

                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">

                      <Activity size={12} className="text-red-500" /> Pulse

                      (BPM)

                    </label>

                    <input

                      type="number"

                      name="heartRate"

                      value={vitals.heartRate}

                      onChange={handleVitalChange}

                      placeholder="e.g. 72"

                      required

                      disabled={dispatching}

                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"

                    />

                  </div>

                  <div className="space-y-1.5">

                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">

                      <Thermometer size={12} className="text-orange-500" /> Temp

                      (°C)

                    </label>

                    <input

                      type="number"

                      step="0.1"

                      name="temperature"

                      value={vitals.temperature}

                      onChange={handleVitalChange}

                      placeholder="e.g. 36.7"

                      required

                      disabled={dispatching}

                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"

                    />

                  </div>

                </div>



                {/* Grid Fields Row 2 */}

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">

                  <div className="space-y-1.5">

                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">

                      <Wind size={12} className="text-cyan-500" /> SpO2 (%)

                    </label>

                    <input

                      type="number"

                      name="spo2"

                      value={vitals.spo2}

                      onChange={handleVitalChange}

                      placeholder="e.g. 98"

                      required

                      disabled={dispatching}

                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"

                    />

                  </div>

                  <div className="space-y-1.5">

                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">

                      Resp Rate (cpm)

                    </label>

                    <input

                      type="number"

                      name="respiratoryRate"

                      value={vitals.respiratoryRate}

                      onChange={handleVitalChange}

                      placeholder="e.g. 16"

                      disabled={dispatching}

                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"

                    />

                  </div>

                  <div className="space-y-1.5">

                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">

                      Weight (kg)

                    </label>

                    <input

                      type="number"

                      name="weight"

                      value={vitals.weight}

                      onChange={handleVitalChange}

                      placeholder="e.g. 70"

                      disabled={dispatching}

                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"

                    />

                  </div>

                  <div className="space-y-1.5">

                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">

                      RBS (mg/dL)

                    </label>

                    <input

                      type="number"

                      name="randomBloodSugar"

                      value={vitals.randomBloodSugar}

                      onChange={handleVitalChange}

                      placeholder="e.g. 110"

                      disabled={dispatching}

                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"

                    />

                  </div>

                </div>



                {/* Computed Categories */}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">

                  <div className="space-y-1.5">

                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">

                      Calculated System Category (Auto)

                    </label>

                    <input

                      type="text"

                      name="triageCategory"

                      value={vitals.triageCategory || "Awaiting Parameters..."}

                      readOnly

                      className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-black text-blue-600 focus:outline-none font-mono"

                    />

                 

                      the half code is this so keep this ode and you will give me the full modified work when i gie you the remaining code






                      see this image the reason why  i give you this image is to just help you to understand the format of navbar i want to make you to me and work every thing according to the requirement what i tell you next 

first in the doctor page make navbar that are patient history,  laboratory,  radiology and pharmacy in each there should be their own pages, in the patient history their should have previous all patient history and the new form that is used to write the new patient history with save button it must not disappear until the doctor click the return card button that found on this page at the bottom and when clicked it it return to the reception and display succesful message at the top, 



the second is the laboratory navbar in that their should be a list of all laboratory examination, the way them will list is first the domain of examination then under them each type of examination with clickable button means the doctor click all necessary lab examination and when finish click the button called submit to lab then it will display in the lab page that are selected by the doctor and when the lab examinations are send to the lab the physician name should send together with the examinations and the top it should display a signal that is the process is in the laboratory do the same thing when it is in the ultrasound and pharmacy process, list all laboratory examination by your self do not miss any one of them



the third is the ultrasound navbar page in that do by your self all necessary things because i have no idea about that but at the bottom add button to the submit to the ultrasound page and their should be a form to send a diagnosis to that page



the forth is the pharmacy navbar page in that the doctor order medication to patient and their should be a list of all medicines and when that medicine is out of stock the medicine is written by red other wise with black and after select the necessary medicines their should be a dropdowns for select the dosage duration and other information and then click the submit button found the bottom of the page and the it will send to the pharmacy page 



keep the sidebar and dashboard from the code that i give you recently and give me the full code that work without error and make it smart attractive and real system addition to this make the sidebar color black green and minimize the font size of the system means contract in same extent 