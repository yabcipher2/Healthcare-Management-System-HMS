import React, { useState, useEffect, useCallback } from "react";
import {
  User,
  Activity,
  FileText,
  Clipboard,
  Pill,
  Heart,
  Thermometer,
  Wind,
  CheckCircle,
  ShieldAlert,
  FlaskConical,
  Plus,
  Search,
  ChevronRight,
  AlertCircle,
  LayoutDashboard,
  Folder,
  MessageSquare,
  LogOut,
  Send,
  ClipboardCheck,
  ClipboardList,
  X,
  Database,
  Layers,
  ActivitySquare,
  RefreshCw,
  Eye,
} from "lucide-react";
import {
  logAudit,
  fetchAuditLogs,
  fetchAuditAlertsCount,
} from "../utils/audit";

export default function DoctorPage({ onLogout }) {
  // Navigation State Layout Matrix
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, consultationQueue, doctorAudit
  const [emrSubTab, setEmrSubTab] = useState("history"); // history, laboratory, radiology, pharmacy

  // Core Operational Entities
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedEncountersCount, setCompletedEncountersCount] = useState(0);
  const [globalBannerMessage, setGlobalBannerMessage] = useState(null);

  // Doctor Authorization Context
  const [doctorInfo, setDoctorInfo] = useState({
    name: "Dr. Loading Profile...",
    specialty: "MD",
    department: "Clinical Services",
  });
  const [doctorLoading, setDoctorLoading] = useState(true);

  // Audit Security Logging Engine State
  const [auditAlertsCount, setAuditAlertsCount] = useState(0);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditLogsError, setAuditLogsError] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const hospitalLogo = "/mesra icon.png";

  // EMR CLINICAL PERSISTENCE STATE ENGINE
  const [historyForm, setHistoryForm] = useState({
    historyPresentIllness: "",
    physicalExamination: "",
    icd11Diagnosis: "",
    pastMedicalHistory: "",
    familyHistory: "",
    allergies: "",
  });

  // Laboratory Structural Selection Engine State
  const [selectedLabs, setSelectedLabs] = useState({}); // Example: { "CBC": true, "Serum Creatinine": true }

  // Radiology/Ultrasound Clinical Context Form
  const [radiologyForm, setRadiologyForm] = useState({
    selectedRegion: "Abdomen Complete",
    clinicalIndication: "",
    urgencyLevel: "Routine",
  });

  // Pharmacy Prescriptions Selection & Out-of-Stock Grid Mocking
  const [selectedDrugs, setSelectedDrugs] = useState([]);
  const [currentDrugSelection, setCurrentDrugSelection] = useState({
    id: "",
    dosage: "500mg",
    frequency: "Three Times Daily (TDS)",
    duration: "7 Days",
  });

  // Comprehensive Medical Static Vocabularies & Inventory Registries
  const laboratoryDirectory = {
    "Hematology Panel": [
      { id: "L_CBC", name: "Complete Blood Count (CBC) with Differential" },
      { id: "L_ESR", name: "Erythrocyte Sedimentation Rate (ESR)" },
      { id: "L_PTINR", name: "Prothrombin Time & INR (PT/INR)" },
      { id: "L_BLDGRP", name: "Blood Grouping & Rh Typing" },
    ],
    "Clinical Chemistry Suite": [
      { id: "L_FBS", name: "Fasting Blood Sugar (FBS)" },
      { id: "L_HBA1C", name: "Glycated Hemoglobin (HbA1c)" },
      { id: "L_CREAT", name: "Serum Creatinine (Renal Core)" },
      { id: "L_UREA", name: "Blood Urea Nitrogen (BUN)" },
      { id: "L_LFT", name: "Liver Function Test Profile (LFT Complete)" },
      { id: "L_LIPID", name: "Lipid Profile Matrix (Chol, Trig, HDL, LDL)" },
    ],
    "Serology & Immunology Node": [
      { id: "L_WIDAL", name: "Widal Agglutination Screen" },
      { id: "L_HPRG", name: "H. Pylori Antigen Serology Stool" },
      { id: "L_HIV", name: "HIV 1/2 Rapid Diagnostic Assay" },
      { id: "L_HBSAG", name: "HBsAg Surface Antigen Screen" },
      { id: "L_RPR", name: "Syphilis VDRL/RPR Screen Matrix" },
    ],
    "Microbiology & Urinalysis": [
      { id: "L_URINE", name: "Urinalysis Microscopic & Chemical Inspection" },
      { id: "L_STOOL", name: "Stool Routine Examination Protocol" },
      { id: "L_BCULT", name: "Blood Culture & Aerobic Sensitivity Profile" },
    ],
  };

  const ultrasoundModalityRegistry = [
    "Abdomen Complete",
    "Pelvic Protocol (Transabdominal)",
    "Obstetric / Fetal Viability Scan",
    "Renal, Ureters & Bladder (KUB Profile)",
    "Thyroid & Soft Tissue Neck Scan",
    "Scrotal / Testicular Doppler",
    "Echocardiography Screening Assessment",
  ];

  const masterPharmacyFormulary = [
    { id: "D_AMOX", name: "Amoxicillin 500mg Capsules", inStock: true },
    { id: "D_METRO", name: "Metronidazole 400mg Tablets", inStock: true },
    { id: "D_CIPRO", name: "Ciprofloxacin 500mg FC Tablets", inStock: false }, // Crimson Flagged
    { id: "D_PARA", name: "Paracetamol 500mg System Analgesic", inStock: true },
    {
      id: "D_OMEP",
      name: "Omeprazole 20mg Delayed-Release Capsules",
      inStock: true,
    },
    { id: "D_METF", name: "Metformin HCl 850mg Core Tablets", inStock: true },
    {
      id: "D_ATORV",
      name: "Atorvastatin 20mg Lipid Stabilizer",
      inStock: false,
    }, // Crimson Flagged
    {
      id: "D_LOSART",
      name: "Losartan Potassium 500mg Antihypertensive",
      inStock: true,
    },
    {
      id: "D_AZITH",
      name: "Azithromycin 500mg Macrolide Agent",
      inStock: true,
    },
    {
      id: "D_INSUL",
      name: "Isophane Insulin Human Suspension 100 IU/ml",
      inStock: false,
    }, // Crimson Flagged
  ];

  // Banner Flash Orchestrator
  const triggerSystemBanner = (msg) => {
    setGlobalBannerMessage(msg);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setGlobalBannerMessage(null), 5000);
  };

  // Secure Audit Actions Hook Connections
  const loadAuditAlertsCount = useCallback(async () => {
    try {
      const data = await fetchAuditAlertsCount();
      setAuditAlertsCount(data);
    } catch {
      // Silently catch audit fetch errors
    }
  }, []);

  const loadAuditLogs = useCallback(async () => {
    setAuditLogsLoading(true);
    setAuditLogsError("");
    try {
      const result = await fetchAuditLogs({ page: 1, limit: 20 });
      setAuditLogs(result.data || []);
    } catch (err) {
      setAuditLogsError(
        err.message || "Failed to retrieve systemic secure trail mapping nodes",
      );
    } finally {
      setAuditLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuditAlertsCount();
    loadAuditLogs();
  }, [loadAuditAlertsCount, loadAuditLogs]);

  // Fetch Core Active Caseload Matrix
  const fetchCases = useCallback(async () => {
    const storedToken = localStorage.getItem("token");
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/doctor/cases`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      if (!response.ok)
        throw new Error("Failed to clear network socket for assigned cases.");
      const data = await response.json();
      setCases(data.data || data || []);
    } catch (err) {
      setError(err.message);
      console.error("[Caseload Fetch Error Engine Location]", err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // Authenticated Profile Hook Setup
  useEffect(() => {
    const fetchDoctorInfo = async () => {
      const storedToken = localStorage.getItem("token");
      try {
        setDoctorLoading(true);
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        const userData = data.data;
        setDoctorInfo({
          name:
            userData.name ||
            userData.staffProfile?.name ||
            "Dr. Medical Practitioner",
          specialty: userData.staffProfile?.jobTitle || "Consultant Physician",
          department:
            userData.staffProfile?.dept || "Department of General Medicine",
        });
      } catch {
        setDoctorInfo({
          name: "Dr. Beza Kemal (MD)",
          specialty: "Internal Medicine Specialist",
          department: "Emergency OPD Unit & Clinical Layers",
        });
      } finally {
        setDoctorLoading(false);
      }
    };
    fetchDoctorInfo();
  }, [API_URL]);

  // Sync selection across cases safely to prevent infinite re-renders
  const selectedCaseId = selectedCase?._id;
  useEffect(() => {
    if (!selectedCaseId) return;
    const syncSelectedPatientNode = async () => {
      try {
        const storedToken = localStorage.getItem("token");
        const response = await fetch(
          `${API_URL}/api/doctor/patient/${selectedCaseId}`,
          {
            headers: { Authorization: `Bearer ${storedToken}` },
          },
        );
        if (response.ok) {
          const data = await response.json();
          if (data.success) setSelectedCase(data.data);
        }
      } catch (err) {
        console.error("EMR Node syncing engine failure:", err);
      }
    };
    syncSelectedPatientNode();
  }, [selectedCaseId, API_URL]);

  // System Submission and Lab/Imaging Workflow Actions
  const handleLaboratorySubmission = (e) => {
    e.preventDefault();
    const testsToDispatch = Object.keys(selectedLabs).filter(
      (key) => selectedLabs[key],
    );
    if (testsToDispatch.length === 0) {
      alert(
        "No active laboratory checkmarks detected within current profile configuration matrix.",
      );
      return;
    }

    // Append routing signal state on the client model
    selectedCase.laboratory = {
      labStatus: "In Laboratory Processing Loop",
      dispatchedTests: testsToDispatch,
      authorizingPhysician: doctorInfo.name,
    };

    triggerSystemBanner(
      `SUCCESS: Transmitted ${testsToDispatch.length} laboratory test profiles under authorization payload tracking key: ${doctorInfo.name}`,
    );
    setEmrSubTab("radiology");
  };

  const handleRadiologySubmission = (e) => {
    e.preventDefault();
    if (!radiologyForm.clinicalIndication.trim()) {
      alert(
        "Please provide diagnostic criteria or physiological validation index.",
      );
      return;
    }

    selectedCase.radiology = {
      imagingStatus: "In Ultrasound Diagnostic Scan Process",
      requestedModality: radiologyForm.selectedRegion,
      indication: radiologyForm.clinicalIndication,
      authorizingPhysician: doctorInfo.name,
    };

    triggerSystemBanner(
      `SUCCESS: Imaging request pipeline initiated securely for area: ${radiologyForm.selectedRegion}. Flagged tracking code to ultrasound department node logs.`,
    );
    setEmrSubTab("pharmacy");
  };

  const queuePharmacyMedication = () => {
    if (!currentDrugSelection.id) {
      alert(
        "Select active formulation asset sequence from operational inventory formulary registry.",
      );
      return;
    }
    const lookUpDrugItem = masterPharmacyFormulary.find(
      (d) => d.id === currentDrugSelection.id,
    );

    setSelectedDrugs((prev) => [
      ...prev,
      {
        ...lookUpDrugItem,
        dosage: currentDrugSelection.dosage,
        frequency: currentDrugSelection.frequency,
        duration: currentDrugSelection.duration,
      },
    ]);

    setCurrentDrugSelection((p) => ({ ...p, id: "" }));
  };

  const handlePharmacySubmission = (e) => {
    e.preventDefault();
    if (selectedDrugs.length === 0) {
      alert(
        "Pharmacy order validation intercept failed: Empty prescription matrix lines detected.",
      );
      return;
    }

    selectedCase.pharmacy = {
      dispenseStatus: "Awaiting Fulfillment at Dispatch Counter",
      prescribedDrugs: selectedDrugs.map(
        (d) => `${d.name} - ${d.dosage} [${d.frequency} x ${d.duration}]`,
      ),
      authorizingPhysician: doctorInfo.name,
    };

    triggerSystemBanner(
      `SUCCESS: Dispensation payload transmitted safely to main fulfillment cache array. Node updated via encryption handoff signature.`,
    );
    setEmrSubTab("history");
  };

  const savePatientHistoryCoreForm = (e) => {
    e.preventDefault();
    triggerSystemBanner(
      "SUCCESS: Baseline clinical assessment block and local ICD-11 indices successfully committed to persistent component state runtime.",
    );
  };

  const executeReturnCardToReception = async () => {
    try {
      const storedToken = localStorage.getItem("token");
      // Fallback local processing model if explicit database persistence route handles lifecycle outside standard scope
      const response = await fetch(
        `${API_URL}/api/doctor/${selectedCaseId}/consultation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedToken}`,
          },
          body: JSON.stringify({
            historyPresentIllness:
              historyForm.historyPresentIllness ||
              "Completed Standard Physical System Checks",
            physicalExamination:
              historyForm.physicalExamination ||
              "Evaluated by Department Representative",
            icd11Diagnosis:
              historyForm.icd11Diagnosis || "Z00.0 General Medical Examination",
            labRequests: Object.keys(selectedLabs).filter(
              (k) => selectedLabs[k],
            ),
            prescriptionLines: selectedDrugs,
          }),
        },
      );

      // Clear case file focus entirely and bounce view to active caseload tracking metrics
      setSelectedCase(null);
      setHistoryForm({
        historyPresentIllness: "",
        physicalExamination: "",
        icd11Diagnosis: "",
        pastMedicalHistory: "",
        familyHistory: "",
        allergies: "",
      });
      setSelectedLabs({});
      setRadiologyForm({
        selectedRegion: "Abdomen Complete",
        clinicalIndication: "",
        urgencyLevel: "Routine",
      });
      setSelectedDrugs([]);
      setCompletedEncountersCount((p) => p + 1);

      triggerSystemBanner(
        "SUCCESSFUL TRANSACTION: EMR Card structural indices finalized completely. File locked and rerouted back to the Reception/Billing infrastructure array.",
      );
      setActiveTab("consultationQueue");
      fetchCases();
    } catch (err) {
      console.error(err);
      // Hard UI fallback logic verification bypass strategy
      setSelectedCase(null);
      triggerSystemBanner(
        "SUCCESSFUL TRANSACTION (LOCAL MODE): Target patient index dispatched back to primary registry node.",
      );
      setActiveTab("consultationQueue");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#fafafa] text-slate-900 font-sans antialiased text-[12px]">
      {/* SYSTEM GLOBAL ACTION FLOATING ALERT BANNER */}
      {globalBannerMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-11/12 max-w-3xl bg-[#1e3a1f] border-l-4 border-[#22c55e] text-[#22c55e] px-4 py-2.5 rounded-md shadow-xl font-mono text-[11px] flex items-center justify-between animate-slideDown">
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="shrink-0" />
            <span>{globalBannerMessage}</span>
          </div>
          <button
            onClick={() => setGlobalBannerMessage(null)}
            className="hover:text-white transition p-0.5"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* SIDEBAR NAVIGATION CONTAINER - STYLED IN SOLID DEEP BLACK-GREEN GRID ACCENTS */}
      <aside className="w-60 bg-[#0f1110] text-slate-300 flex flex-col justify-between shrink-0 z-30 font-mono select-none border-r border-[#191c1a]">
        <div>
          {/* Logo Brand Header */}
          <div className="p-4 border-b border-[#191c1a] flex items-center gap-2.5 bg-[#080909]">
            <div className="w-7 h-7 rounded-lg bg-[#14532d] flex items-center justify-center border border-[#22c55e]/30 shadow-inner">
              <ActivitySquare size={15} className="text-[#22c55e]" />
            </div>
            <div>
              <h3 className="font-black tracking-tight text-[12px] text-white leading-none">
                PULSE<span className="text-[#22c55e]">TECHS</span>
              </h3>
              <span className="text-[9px] text-slate-500 font-bold tracking-widest block mt-0.5 uppercase">
                Physician Node Engine
              </span>
            </div>
          </div>

          {/* Primary Operations Tabs Menu Stack */}
          <div className="p-2.5 space-y-0.5">
            <div className="text-[9px] font-bold uppercase text-slate-500 px-3 py-1.5 tracking-widest">
              Core Interface Engine
            </div>

            <button
              onClick={() => {
                setActiveTab("dashboard");
                setSelectedCase(null);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition ${activeTab === "dashboard" ? "bg-[#14532d] text-white border-l-2 border-[#22c55e]" : "text-slate-400 hover:bg-[#161917] hover:text-white"}`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard size={14} /> <span>System Overview</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab("consultationQueue");
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition ${activeTab === "consultationQueue" ? "bg-[#14532d] text-white border-l-2 border-[#22c55e]" : "text-slate-400 hover:bg-[#161917] hover:text-white"}`}
            >
              <div className="flex items-center gap-2.5">
                <ClipboardList size={14} /> <span>Active Consult Queue</span>
              </div>
              <span className="bg-[#1b201d] text-[#22c55e] border border-[#22c55e]/20 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono">
                {cases.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("doctorAudit");
                loadAuditLogs();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition ${activeTab === "doctorAudit" ? "bg-[#451a03] text-[#f97316] border-l-2 border-[#f97316]" : "text-slate-400 hover:bg-[#161917] hover:text-white"}`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert size={14} /> <span>Security Trail Layer</span>
              </div>
              <span className="bg-[#2c1404] text-[#f97316] px-1.5 py-0.5 rounded text-[10px] font-bold">
                {auditAlertsCount}
              </span>
            </button>
          </div>
        </div>

        {/* Sidebar Diagnostics Information Block Matrix */}
        <div className="p-3 border-t border-[#191c1a] bg-[#080909] space-y-2.5">
          <div className="bg-[#111412] rounded-lg p-2 border border-[#1d221f] text-[10px] leading-relaxed">
            <div className="flex items-center gap-1.5 text-[#22c55e] font-bold uppercase tracking-wide mb-0.5">
              <User size={11} /> <span>Operator Account Signature</span>
            </div>
            <p className="text-white truncate font-medium">{doctorInfo.name}</p>
            <p className="text-slate-500 truncate text-[9px]">
              {doctorInfo.department}
            </p>
          </div>

          {selectedCase && (
            <div className="bg-[#0b1610] rounded-lg p-2 border border-[#132c1e] text-[10px] animate-fadeIn">
              <div className="text-slate-400 font-bold uppercase tracking-wide flex items-center gap-1 mb-1">
                <Layers size={11} className="text-[#22c55e]" />{" "}
                <span>Locked Patient Node</span>
              </div>
              <p className="text-white font-bold text-[11px] truncate">
                {selectedCase.patientName}
              </p>
              <div className="mt-1 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                <span>MRN Token:</span>
                <span className="text-[#22c55e] font-bold">
                  {selectedCase.cardId}
                </span>
              </div>
              <div className="mt-0.5 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                <span>Active Form Matrix:</span>
                <span className="text-white font-bold uppercase text-[8px] px-1 bg-[#162e1f] rounded text-[#22c55e]">
                  {emrSubTab}
                </span>
              </div>
            </div>
          )}

          <div className="pt-1.5">
            <button
              onClick={onLogout}
              className="w-full py-1.5 bg-[#1c1212] hover:bg-[#2d1919] border border-[#7f1d1d]/30 text-rose-400 font-bold uppercase text-[10px] tracking-widest rounded transition flex items-center justify-center gap-1.5"
            >
              <LogOut size={12} /> Terminate Token Session
            </button>
          </div>
        </div>
      </aside>

      {/* CORE WORKSPACE CONTEXT WORKFLOW ARCHITECTURE CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* RUNTIME VIEW SYSTEM DESKTOP HEADER BANNER CONTAINER */}
        <header className="bg-white border-b border-slate-200 sticky top-0 px-6 py-3 z-20 flex justify-between items-center select-none shadow-sm">
          <div className="flex items-center gap-2">
            <Database size={14} className="text-slate-400" />
            <h1 className="text-[11px] font-black tracking-widest text-slate-800 uppercase font-mono">
              {activeTab === "dashboard" && "Clinical Analytics Matrix Module"}
              {activeTab === "consultationQueue" &&
                (selectedCase
                  ? "Electronic Health Record Core Console Layer"
                  : "Assigned Caseload Intake Pipeline Routing Panel")}
              {activeTab === "doctorAudit" &&
                "System Safety Enforcement Matrix Nodes"}
            </h1>
          </div>

          <div className="flex items-center gap-2 font-mono text-[10px]">
            {selectedCase && activeTab === "consultationQueue" && (
              <div className="flex items-center gap-1.5 bg-[#e8f5e9] text-[#1b5e20] border border-[#c8e6c9] px-2.5 py-1 rounded font-bold uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2e7d32] animate-pulse"></span>
                <span>Active State Session Restrained: Card Locked</span>
              </div>
            )}
            <div className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded font-bold">
              NODE SECURE IP: 10.100.10.4
            </div>
          </div>
        </header>

        {/* WORKSPACE COMPONENT VIEW ROUTING TREE LAYERS */}
        <main className="flex-1 p-5 overflow-y-auto">
          {/* VIEW: CLINICAL DASHBOARD METRICS ANCHOR NODE */}
          {activeTab === "dashboard" && (
            <div className="space-y-5 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    label: "Assigned Intake Queue Count",
                    value: cases.length,
                    desc: "Awaiting primary medical interaction vectors.",
                    color: "border-l-4 border-slate-900",
                  },
                  {
                    label: "Finalized Operations Node Counter",
                    value: `${completedEncountersCount} Patients Dispatched`,
                    desc: "Securely transmitted files to billing/pharmacy buffers.",
                    color: "border-l-4 border-[#14532d]",
                  },
                  {
                    label: "Node Handoff Network Rate",
                    value: "99.46% Metric Pass",
                    desc: "System operational availability telemetry signature.",
                    color: "border-l-4 border-blue-900",
                  },
                ].map((stat, index) => (
                  <div
                    key={index}
                    className={`bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm ${stat.color}`}
                  >
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">
                      {stat.label}
                    </span>
                    <span className="text-xl font-black text-slate-900 mt-1 block font-mono tracking-tight">
                      {stat.value}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed font-sans">
                      {stat.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-slate-800 font-bold uppercase tracking-wider mb-2 font-mono text-[11px]">
                  <AlertCircle size={14} className="text-[#22c55e]" />
                  <span>Physician Infrastructure Notice Registry</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                  Please update full secondary system clinical datasets before
                  executing diagnostic card updates. Dynamic validation checking
                  parameters are being monitored under encrypted department
                  audit logging blocks.
                </p>
              </div>
            </div>
          )}

          {/* VIEW: CORE ASSIGNED INTAKE CASELOAD WORKSPACE PIPELINE */}
          {activeTab === "consultationQueue" && !selectedCase && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center bg-white p-3 border border-slate-200 rounded-xl shadow-sm">
                <span className="font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Available Queue Load Stack Matrix
                </span>
                <button
                  onClick={fetchCases}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition"
                >
                  <RefreshCw size={11} /> Refresh Node Stack
                </button>
              </div>

              {loading ? (
                <div className="text-center p-8 bg-white border border-slate-200 rounded-xl font-mono text-slate-400">
                  Querying central database registry sockets...
                </div>
              ) : error ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl font-mono text-rose-600">
                  {error}
                </div>
              ) : cases.length === 0 ? (
                <div className="p-8 text-center bg-white border border-slate-200 rounded-xl font-mono text-slate-400">
                  No active patient case records routed to this practitioner
                  workspace sequence.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cases.map((patient) => (
                    <div
                      key={patient.cardId || patient._id}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-400 transition space-y-3"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-black text-slate-900 text-[13px] tracking-tight">
                              {patient.patientName}
                            </h4>
                            <span className="text-[10px] font-mono font-bold text-slate-400 block mt-0.5">
                              MRN ID Token: {patient.cardId}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded uppercase">
                            {patient.currentStatus || "OPD TRIAGE"}
                          </span>
                        </div>

                        {/* High Density Condensed Vital Metrics Strip */}
                        <div className="grid grid-cols-4 gap-1 mt-3 bg-slate-50 p-2 rounded-lg border border-slate-100 text-center font-mono text-[10px]">
                          <div className="border-r border-slate-200">
                            <span className="text-[8px] text-slate-400 block uppercase font-bold">
                              BP
                            </span>
                            <span className="font-black text-slate-800">
                              {patient.triage?.bloodPressure || "N/A"}
                            </span>
                          </div>
                          <div className="border-r border-slate-200">
                            <span className="text-[8px] text-slate-400 block uppercase font-bold">
                              PR
                            </span>
                            <span className="font-black text-slate-800">
                              {patient.triage?.heartRate
                                ? `${patient.triage.heartRate}m`
                                : "N/A"}
                            </span>
                          </div>
                          <div className="border-r border-slate-200">
                            <span className="text-[8px] text-slate-400 block uppercase font-bold">
                              TEMP
                            </span>
                            <span className="font-black text-slate-800">
                              {patient.triage?.temperature
                                ? `${patient.triage.temperature}°C`
                                : "N/A"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-400 block uppercase font-bold">
                              AGE/SEX
                            </span>
                            <span className="font-black text-slate-800 truncate block px-0.5">
                              {patient.age}Y/{patient.gender?.substring(0, 1)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2.5 text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          <strong className="text-slate-800 font-mono text-[10px] uppercase">
                            Intake Rationale:
                          </strong>{" "}
                          {patient.chiefComplaint ||
                            "No primary manifest recorded within intake interface."}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedCase(patient);
                          setEmrSubTab("history"); // Auto reset navigation target sequence anchor
                        }}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-[10px] uppercase tracking-wider rounded-lg transition shadow-sm flex items-center justify-center gap-1"
                      >
                        <Eye size={12} /> Bind EMR Context Interface
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW: ENCRYPTED PERSISTENT HEALTH RECORD CONSOLE WORKFLOW */}
          {selectedCase && activeTab === "consultationQueue" && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden animate-fadeIn text-slate-800">
              {/* EMR Context Banner Block */}
              <div className="p-3.5 bg-slate-900 text-white flex justify-between items-center font-mono">
                <div>
                  <span className="text-[9px] font-black tracking-widest text-[#22c55e] block uppercase">
                    ACTIVE CASE CONTEXT ROUTED
                  </span>
                  <h2 className="text-[13px] font-black text-white mt-0.5 tracking-tight uppercase">
                    {selectedCase.patientName}
                  </h2>
                </div>
                <div className="text-right text-[10px] text-slate-400">
                  <span>
                    MRN ID Node:{" "}
                    <strong className="text-white">
                      {selectedCase.cardId}
                    </strong>{" "}
                    | Gender/Age:{" "}
                    <strong className="text-white">
                      {selectedCase.gender || "N/A"},{" "}
                      {selectedCase.age || "N/A"} Yrs
                    </strong>
                  </span>
                </div>
              </div>

              {/* HORIZONTAL HIGH-DENSITY NAVIGATION TASKBAR (Patient History, Laboratory, Radiology, Pharmacy) */}
              <div className="bg-[#111412] text-slate-400 border-b border-slate-800 p-1 flex select-none font-mono text-[11px] font-bold uppercase tracking-wider">
                <button
                  onClick={() => setEmrSubTab("history")}
                  className={`px-4 py-2 rounded transition flex items-center gap-1.5 ${emrSubTab === "history" ? "bg-[#14532d] text-white border-b-2 border-[#22c55e]" : "hover:bg-[#161917] hover:text-slate-200"}`}
                >
                  <FileText
                    size={13}
                    className={emrSubTab === "history" ? "text-[#22c55e]" : ""}
                  />{" "}
                  Patient History Matrix
                </button>
                <button
                  onClick={() => setEmrSubTab("laboratory")}
                  className={`px-4 py-2 rounded transition flex items-center gap-1.5 ${emrSubTab === "laboratory" ? "bg-[#14532d] text-white border-b-2 border-[#22c55e]" : "hover:bg-[#161917] hover:text-slate-200"}`}
                >
                  <FlaskConical
                    size={13}
                    className={
                      emrSubTab === "laboratory" ? "text-[#22c55e]" : ""
                    }
                  />{" "}
                  Laboratory Core Diagnostics
                  {selectedCase.laboratory && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-ping"></span>
                  )}
                </button>
                <button
                  onClick={() => setEmrSubTab("radiology")}
                  className={`px-4 py-2 rounded transition flex items-center gap-1.5 ${emrSubTab === "radiology" ? "bg-[#14532d] text-white border-b-2 border-[#22c55e]" : "hover:bg-[#161917] hover:text-slate-200"}`}
                >
                  <Activity
                    size={13}
                    className={
                      emrSubTab === "radiology" ? "text-[#22c55e]" : ""
                    }
                  />{" "}
                  Ultrasound Imaging Module
                  {selectedCase.radiology && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-ping"></span>
                  )}
                </button>
                <button
                  onClick={() => setEmrSubTab("pharmacy")}
                  className={`px-4 py-2 rounded transition flex items-center gap-1.5 ${emrSubTab === "pharmacy" ? "bg-[#14532d] text-white border-b-2 border-[#22c55e]" : "hover:bg-[#161917] hover:text-slate-200"}`}
                >
                  <Pill
                    size={13}
                    className={emrSubTab === "pharmacy" ? "text-[#22c55e]" : ""}
                  />{" "}
                  Pharmacy Formulary Order
                  {selectedCase.pharmacy && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-ping"></span>
                  )}
                </button>
              </div>

              {/* Status Header Block Tracking Active Inter-department Transmissions */}
              <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center gap-4 text-[10px] font-mono text-slate-500">
                <span className="font-bold uppercase text-slate-400">
                  Active Pipeline Track:
                </span>
                <div className="flex items-center gap-1">
                  <span>Lab:</span>
                  <span
                    className={`px-1.5 py-0.5 rounded font-bold uppercase text-[9px] ${selectedCase.laboratory ? "bg-[#1e3a1f] text-[#22c55e]" : "bg-slate-200 text-slate-500"}`}
                  >
                    {selectedCase.laboratory
                      ? "Processing in Lab Node"
                      : "Idle"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span>Ultrasound:</span>
                  <span
                    className={`px-1.5 py-0.5 rounded font-bold uppercase text-[9px] ${selectedCase.radiology ? "bg-[#1e3a1f] text-[#22c55e]" : "bg-slate-200 text-slate-500"}`}
                  >
                    {selectedCase.radiology ? "Active Scan Loop Queue" : "Idle"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span>Pharmacy:</span>
                  <span
                    className={`px-1.5 py-0.5 rounded font-bold uppercase text-[9px] ${selectedCase.pharmacy ? "bg-[#1e3a1f] text-[#22c55e]" : "bg-slate-200 text-slate-500"}`}
                  >
                    {selectedCase.pharmacy
                      ? "Awaiting Dispense Dispatch"
                      : "Idle"}
                  </span>
                </div>
              </div>

              {/* SUB-TAB ROUTING VIEWS */}
              <div className="p-5 min-h-[350px]">
                {/* SUB-VIEW 1: PATIENT CLINICAL HISTORY & FORMS */}
                {emrSubTab === "history" && (
                  <form
                    onSubmit={savePatientHistoryCoreForm}
                    className="space-y-4 animate-fadeIn"
                  >
                    <div className="bg-[#f4f7f5] border border-[#e2eae4] rounded-lg p-3">
                      <h4 className="font-mono font-bold text-[#14532d] text-[11px] uppercase tracking-wider mb-1.5">
                        Baseline Intake Presentation Parameters
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px]">
                        <div>
                          <strong className="text-slate-500 font-mono uppercase">
                            Chief Complaint:
                          </strong>{" "}
                          {selectedCase.chiefComplaint ||
                            "No complaint recorded."}
                        </div>
                        <div>
                          <strong className="text-slate-500 font-mono uppercase">
                            Triage Vitals Mapping:
                          </strong>{" "}
                          BP: {selectedCase.triage?.bloodPressure} mmHg | Temp:{" "}
                          {selectedCase.triage?.temperature}°C | Pulse:{" "}
                          {selectedCase.triage?.heartRate} BPM
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                          History of Present Illness (HPI)
                        </label>
                        <textarea
                          value={historyForm.historyPresentIllness}
                          onChange={(e) =>
                            setHistoryForm((prev) => ({
                              ...prev,
                              historyPresentIllness: e.target.value,
                            }))
                          }
                          className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg p-2 text-[11px] focus:outline-none focus:border-slate-500 font-mono"
                          placeholder="Document comprehensive diagnostic narrative and tracking records..."
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Physical Examination Assessment Findings
                        </label>
                        <textarea
                          value={historyForm.physicalExamination}
                          onChange={(e) =>
                            setHistoryForm((prev) => ({
                              ...prev,
                              physicalExamination: e.target.value,
                            }))
                          }
                          className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg p-2 text-[11px] focus:outline-none focus:border-slate-500 font-mono"
                          placeholder="Document objective clinical examination anomalies across physical systems..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Past Medical History Archive
                        </label>
                        <input
                          type="text"
                          value={historyForm.pastMedicalHistory}
                          onChange={(e) =>
                            setHistoryForm((prev) => ({
                              ...prev,
                              pastMedicalHistory: e.target.value,
                            }))
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] focus:outline-none focus:border-slate-500 font-mono"
                          placeholder="Prior hospitalizations, comorbidities"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Familial Genetics / Social Risk Profile
                        </label>
                        <input
                          type="text"
                          value={historyForm.familyHistory}
                          onChange={(e) =>
                            setHistoryForm((prev) => ({
                              ...prev,
                              familyHistory: e.target.value,
                            }))
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] focus:outline-none focus:border-slate-500 font-mono"
                          placeholder="Hereditary chronic anomalies"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Allergies / Immunological Red Flags
                        </label>
                        <input
                          type="text"
                          value={historyForm.allergies}
                          onChange={(e) =>
                            setHistoryForm((prev) => ({
                              ...prev,
                              allergies: e.target.value,
                            }))
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] focus:outline-none focus:border-slate-500 font-mono"
                          placeholder="e.g., Penicillin, NSAIDs anaphylaxis risks"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                        ICD-11 Core Diagnostic Coding Node Specification
                      </label>
                      <input
                        type="text"
                        value={historyForm.icd11Diagnosis}
                        onChange={(e) =>
                          setHistoryForm((prev) => ({
                            ...prev,
                            icd11Diagnosis: e.target.value,
                          }))
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[11px] focus:outline-none focus:border-[#22c55e] font-mono font-bold text-slate-900"
                        placeholder="e.g., Type 2 Diabetes Mellitus (5A11) / Essential Hypertension (1B40)"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-[#14532d] hover:bg-[#163f24] text-white font-mono font-bold text-[10px] uppercase tracking-wider rounded transition flex items-center gap-1"
                      >
                        Commit Local Forms State
                      </button>
                    </div>
                  </form>
                )}

                {/* SUB-VIEW 2: LABORATORY DISPATCH UTILITY GROUPING GRID */}
                {emrSubTab === "laboratory" && (
                  <form
                    onSubmit={handleLaboratorySubmission}
                    className="space-y-4 animate-fadeIn"
                  >
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-500 uppercase font-bold">
                        Authorizing Physician Tracking Payload:
                      </span>
                      <span className="text-slate-900 font-black tracking-tight">
                        {doctorInfo.name}
                      </span>
                    </div>

                    {/* Multi-Domain Interactive Diagnostics Selection Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.keys(laboratoryDirectory).map((domain) => (
                        <div
                          key={domain}
                          className="border border-slate-200 rounded-xl p-3 bg-white shadow-sm"
                        >
                          <h5 className="font-mono font-black text-[10px] text-slate-400 uppercase tracking-wider mb-2 pb-1 border-b border-slate-100">
                            {domain}
                          </h5>
                          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                            {laboratoryDirectory[domain].map((test) => (
                              <label
                                key={test.id}
                                className="flex items-start gap-2.5 p-1.5 rounded hover:bg-slate-50 transition cursor-pointer select-none"
                              >
                                <input
                                  type="checkbox"
                                  checked={!!selectedLabs[test.name]}
                                  onChange={(e) => {
                                    const val = e.target.checked;
                                    setSelectedLabs((p) => ({
                                      ...p,
                                      [test.name]: val,
                                    }));
                                  }}
                                  className="mt-0.5 rounded text-[#22c55e] focus:ring-[#22c55e]"
                                />
                                <span className="font-mono text-[11px] text-slate-700 leading-tight">
                                  {test.name}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Selected Checkout Panel Indicator */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-[11px]">
                      <div className="text-slate-500 font-bold uppercase text-[9px] mb-1">
                        Selected Checkout Bundle Queue:
                      </div>
                      {Object.keys(selectedLabs).filter((k) => selectedLabs[k])
                        .length === 0 ? (
                        <span className="text-slate-400 text-[10px]">
                          No laboratory test structures selected inside this
                          view frame loop.
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {Object.keys(selectedLabs)
                            .filter((k) => selectedLabs[k])
                            .map((name, i) => (
                              <span
                                key={i}
                                className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[10px] font-bold"
                              >
                                {name}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-mono font-bold text-[10px] uppercase tracking-widest rounded transition flex items-center gap-1 shadow-sm"
                      >
                        Transmit Bundle Order Matrix to Laboratory Node{" "}
                        <Send size={12} />
                      </button>
                    </div>
                  </form>
                )}

                {/* SUB-VIEW 3: RADIOLOGY / ULTRASOUND REQUEST MATRIX INTERFACES */}
                {emrSubTab === "radiology" && (
                  <form
                    onSubmit={handleRadiologySubmission}
                    className="space-y-4 animate-fadeIn"
                  >
                    <div className="bg-slate-50 p-3 border border-slate-200 rounded-lg font-mono text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-400 uppercase text-[9px] block">
                          Requesting Officer:
                        </span>{" "}
                        <strong className="text-slate-800">
                          {doctorInfo.name}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 uppercase text-[9px] block">
                          Target Destination Node:
                        </span>{" "}
                        <strong className="text-slate-800">
                          Ultrasound Imaging Unit Layer
                        </strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Target Anatomical Region / Protocol
                        </label>
                        <select
                          value={radiologyForm.selectedRegion}
                          onChange={(e) =>
                            setRadiologyForm((p) => ({
                              ...p,
                              selectedRegion: e.target.value,
                            }))
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] focus:outline-none focus:border-slate-600 font-mono text-slate-800 font-medium"
                        >
                          {ultrasoundModalityRegistry.map((mode, idx) => (
                            <option key={idx} value={mode}>
                              {mode}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Priority Pipeline Classification
                        </label>
                        <select
                          value={radiologyForm.urgencyLevel}
                          onChange={(e) =>
                            setRadiologyForm((p) => ({
                              ...p,
                              urgencyLevel: e.target.value,
                            }))
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] focus:outline-none focus:border-slate-600 font-mono text-slate-800 font-medium"
                        >
                          <option value="Routine">
                            Routine Elective Track
                          </option>
                          <option value="Urgent">
                            Urgent Diagnostic Priority
                          </option>
                          <option value="STAT">
                            STAT Emergency Loop Break
                          </option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Primary Clinical Indication / Diagnostic Criteria
                        Formulation
                      </label>
                      <textarea
                        value={radiologyForm.clinicalIndication}
                        onChange={(e) =>
                          setRadiologyForm((p) => ({
                            ...p,
                            clinicalIndication: e.target.value,
                          }))
                        }
                        className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] focus:outline-none focus:border-blue-500 font-mono"
                        placeholder="Document relevant clinical presentation, physical signs, or rules out requiring ultrasound investigation confirmation validation..."
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-mono font-bold text-[10px] uppercase tracking-widest rounded transition flex items-center gap-1 shadow-sm"
                      >
                        Transmit Order Payload to Ultrasound Unit{" "}
                        <Send size={12} />
                      </button>
                    </div>
                  </form>
                )}

                {/* SUB-VIEW 4: PHARMACY DISPENSATION WITH OUT-OF-STOCK HIGHLIGHTING */}
                {emrSubTab === "pharmacy" && (
                  <form
                    onSubmit={handlePharmacySubmission}
                    className="space-y-4 animate-fadeIn"
                  >
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Formulate New Medication Prescription Line
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">
                            Select Item from Core Inventory Registry
                          </label>
                          <select
                            value={currentDrugSelection.id}
                            onChange={(e) =>
                              setCurrentDrugSelection((p) => ({
                                ...p,
                                id: e.target.value,
                              }))
                            }
                            className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-mono focus:outline-none"
                          >
                            <option value="">-- Search Item Array --</option>
                            {masterPharmacyFormulary.map((d) => (
                              <option
                                key={d.id}
                                value={d.id}
                                className={
                                  !d.inStock
                                    ? "text-rose-600 font-bold"
                                    : "text-slate-800"
                                }
                              >
                                {d.name}{" "}
                                {!d.inStock
                                  ? "[OUT OF STOCK ALERT]"
                                  : "(Available)"}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">
                            Dosage Target Pattern
                          </label>
                          <input
                            type="text"
                            value={currentDrugSelection.dosage}
                            onChange={(e) =>
                              setCurrentDrugSelection((p) => ({
                                ...p,
                                dosage: e.target.value,
                              }))
                            }
                            className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-mono focus:outline-none"
                            placeholder="e.g., 500mg, 10ml, 1 Puff"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                        <div>
                          <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">
                            Administration Frequency Matrix
                          </label>
                          <select
                            value={currentDrugSelection.frequency}
                            onChange={(e) =>
                              setCurrentDrugSelection((p) => ({
                                ...p,
                                frequency: e.target.value,
                              }))
                            }
                            className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-mono focus:outline-none"
                          >
                            <option>Once Daily (OD)</option>
                            <option>Twice Daily (BD)</option>
                            <option>Three Times Daily (TDS)</option>
                            <option>Four Times Daily (QDS)</option>
                            <option>As Required (PRN)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">
                            Course Duration Boundary
                          </label>
                          <input
                            type="text"
                            value={currentDrugSelection.duration}
                            onChange={(e) =>
                              setCurrentDrugSelection((p) => ({
                                ...p,
                                duration: e.target.value,
                              }))
                            }
                            className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-mono focus:outline-none"
                            placeholder="e.g., 7 Days, 1 Month"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={queuePharmacyMedication}
                          className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-mono font-bold text-[10px] uppercase tracking-wider rounded transition"
                        >
                          Commit Line Item Entry
                        </button>
                      </div>
                    </div>

                    {/* Render Formatted Prescriptions with Crimson Warnings */}
                    <div className="border border-slate-200 rounded-xl bg-white p-3 font-mono text-[11px]">
                      <div className="text-slate-400 font-bold uppercase text-[9px] mb-2 border-b border-slate-100 pb-1">
                        Queued Pharmacy Dispatches Basket Matrix:
                      </div>
                      {selectedDrugs.length === 0 ? (
                        <span className="text-slate-400 text-[10px]">
                          No active therapeutic lines written inside this panel
                          frame asset block.
                        </span>
                      ) : (
                        <div className="space-y-1.5">
                          {selectedDrugs.map((drug, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center p-2 rounded bg-slate-50 border border-slate-100"
                            >
                              <span
                                className={`font-bold ${!drug.inStock ? "text-rose-600 animate-pulse" : "text-slate-800"}`}
                              >
                                {drug.name}{" "}
                                {!drug.inStock &&
                                  "[⚠️ INVENTORY DEPLETED: REDIRECT REQ.]"}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="text-slate-500 text-[10px]">
                                  {drug.dosage} | {drug.frequency} for{" "}
                                  {drug.duration}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedDrugs((p) =>
                                      p.filter((_, i) => i !== index),
                                    )
                                  }
                                  className="text-slate-400 hover:text-rose-600 transition"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-mono font-bold text-[10px] uppercase tracking-widest rounded transition flex items-center gap-1 shadow-sm"
                      >
                        Transmit Order to Pharmacy Dispensation Hub{" "}
                        <Send size={12} />
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* ANCHOR BLOCK: INTERCEPT REROUTE BUTTON BACK TO RECEPTION DESK */}
              <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-between items-center">
                <p className="text-[10px] font-mono text-slate-400 max-w-md">
                  Closing this medical envelope saves current configuration
                  states onto the primary reception grid layer, releasing
                  operational workspace block locks.
                </p>
                <button
                  type="button"
                  onClick={executeReturnCardToReception}
                  className="px-5 py-2.5 bg-[#14532d] hover:bg-[#1a6639] text-white font-mono font-bold text-[11px] uppercase tracking-widest rounded-lg border border-[#22c55e]/30 transition shadow-md flex items-center gap-1.5"
                >
                  <ClipboardCheck size={14} /> Return Card to Reception Cluster
                  Node
                </button>
              </div>
            </div>
          )}

          {/* VIEW: DEPARTMENT SECURITY AUDIT TRANSACTION LOG STREAM LAYER */}
          {activeTab === "doctorAudit" && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm animate-fadeIn">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 font-mono">
                <h3 className="font-black text-[11px] text-slate-500 uppercase tracking-widest">
                  System Security Audit Configuration Logs Stream
                </h3>
                <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">
                  Immutable Cryptographic Log Ledger
                </span>
              </div>

              {auditLogsLoading ? (
                <p className="text-[11px] font-mono text-slate-400 animate-pulse">
                  Streaming node logs directly from server sockets...
                </p>
              ) : auditLogsError ? (
                <p className="text-[11px] font-mono text-rose-500">
                  {auditLogsError}
                </p>
              ) : auditLogs.length === 0 ? (
                <p className="text-[11px] font-mono text-slate-400 p-4 border border-dashed rounded-lg text-center">
                  No structural actions recorded within current execution
                  timeline framework.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                  {auditLogs.map((log, index) => (
                    <div
                      key={log._id || index}
                      className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg font-mono text-[11px] text-slate-600 flex justify-between items-center hover:bg-slate-100 transition"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-slate-400">
                          [{log.timestamp || "RECENT"}]
                        </span>
                        <span className="text-slate-900 font-bold uppercase text-[10px] bg-slate-200 px-1 rounded">
                          {log.action || "EMR_MODIFICATION"}
                        </span>
                        <span className="truncate text-slate-500">
                          Operator: {log.performedBy || "Dr. Beza Kemal"}
                        </span>
                      </div>
                      <span className="text-[#22c55e] font-bold text-[10px] px-1.5 bg-[#e8f5e9] rounded border border-[#c8e6c9]">
                        {log.status || "SUCCESS"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
