import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  ChevronLeft,
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
  Zap,
  CalendarDays,
  UserPlus,
  Bed,
} from "lucide-react";
import {
  logAudit,
  fetchAuditLogs,
  fetchAuditAlertsCount,
} from "../utils/audit";
import NotificationBell from "../components/NotificationBell";

export default function DoctorPage({ onLogout }) {
  // Navigation State Layout Matrix
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, consultationQueue, doctorAudit
  const [emrSubTab, setEmrSubTab] = useState("history"); // history, nurse, laboratory, radiology, pharmacy, liaison
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [aptSubTab, setAptSubTab] = useState("list"); // list, create
  const [aptForm, setAptForm] = useState({
    patientName: "",
    patientCardId: "",
    appointmentDate: "",
    appointmentTime: "",
    reason: "",
    department: "",
  });
  const [aptSubmitting, setAptSubmitting] = useState(false);
  const [aptMessage, setAptMessage] = useState("");
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [editAptForm, setEditAptForm] = useState({
    appointmentDate: "",
    appointmentTime: "",
    reason: "",
    status: "scheduled",
  });
  const [editAptMessage, setEditAptMessage] = useState("");

  // Core Operational Entities
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [queuePage, setQueuePage] = useState(1);
  const [queuePageSize, setQueuePageSize] = useState(8);
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
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(10);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const hospitalLogo = "/mesra icon.png";

  // Shared auth header builder for inter-department API calls (Ward, Appointments, etc.)
  const getAuthHeaders = useCallback(
    (isJson = true) => {
      const storedToken = localStorage.getItem("token");
      const headers = {};
      if (isJson) headers["Content-Type"] = "application/json";
      if (storedToken)
        headers["Authorization"] = `Bearer ${storedToken}`;
      return headers;
    },
    [],
  );

  const handleAuthError = useCallback(() => {
    localStorage.removeItem("token");
    onLogout?.();
  }, [onLogout]);

  // EMR CLINICAL PERSISTENCE STATE ENGINE
  const [historyForm, setHistoryForm] = useState({
    historyPresentIllness: "",
    physicalExamination: "",
    icd11Diagnosis: "",
    pastMedicalHistory: "",
    familyHistory: "",
    allergies: "",
  });

  // Past Patient History "File" Archive.
  // Fetched from the real API when the history sub-tab is opened or the doctor
  // explicitly refreshes. Each Diagnosis record is presented as a "file" in a
  // list. Clicking a file opens a full-screen detail view that bundles ALL
  // sub-tab data (consultation, lab, radiology, pharmacy, nurse, liaison).
  // All history state is cleared when the card is returned to reception.
  const [patientHistory, setPatientHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyFetched, setHistoryFetched] = useState(false); // true once loaded for this card
  const [historyDetailView, setHistoryDetailView] = useState(null); // holds the Diagnosis record to show in full-screen

  // Laboratory Structural Selection Engine State
  const [selectedLabs, setSelectedLabs] = useState({}); // Example: { "CBC": true, "Serum Creatinine": true }
  const [laboratoryForm, setLaboratoryForm] = useState({
    clinicalSummary: "",
  });

  // Radiology/Ultrasound Clinical Context Form
  const [radiologyForm, setRadiologyForm] = useState({
    clinicalIndication: "",
    urgencyLevel: "Routine",
  });
  const [selectedRegions, setSelectedRegions] = useState({});

  // Pharmacy Prescriptions Selection & Out-of-Stock Grid Mocking
  const [selectedDrugs, setSelectedDrugs] = useState([]);
  const [currentDrugSelection, setCurrentDrugSelection] = useState({
    id: "",
    dosage: "500mg",
    frequency: "Three Times Daily (TDS)",
    duration: "7 Days",
  });

  // Liaison & Admission Coordination Engine State (bridges to Ward Management)
  const [liaisonForm, setLiaisonForm] = useState({
    selectedDepartment: "",
    selectedWardNurse: "",
    admissionUrgency: "Routine",
    clinicalReason: "",
    admissionDate: "",
    dischargeDate: "",
    medicationIntake: "",
  });
  const [wardDepartments, setWardDepartments] = useState([]);
  const [wardNurses, setWardNurses] = useState([]);
  const [wardBeds, setWardBeds] = useState([]);
  const [wardWards, setWardWards] = useState([]);
  const [patientAdmissionRequests, setPatientAdmissionRequests] = useState([]);
  const [liaisonSubmitting, setLiaisonSubmitting] = useState(false);
  const [liaisonMessage, setLiaisonMessage] = useState("");
  const [transferForm, setTransferForm] = useState({
    targetFacility: "",
    clinicalReason: "",
    admissionUrgency: "Routine",
  });
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [transferMessage, setTransferMessage] = useState("");

  // Nurse Coordination Engine State (bridges to Nursing Station)
  const [nurseForm, setNurseForm] = useState({
    selectedDepartment: "",
    selectedNurse: "",
    doctorInstructions: "",
    carePlan: "",
    status: "Pending Meds",
  });
  const [nurseDepartments, setNurseDepartments] = useState([]);
  const [availableNurses, setAvailableNurses] = useState([]);
  const [recommendedNurse, setRecommendedNurse] = useState(null);
  const [nurseSubmitting, setNurseSubmitting] = useState(false);
  const [nurseMessage, setNurseMessage] = useState("");

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

  useEffect(() => {
    setAuditPage(1);
  }, [auditLogs.length]);

  // Fetch Core Active Caseload Matrix
  const fetchCases = useCallback(async () => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      setError("Authentication required. Please log in again.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/doctor/cases`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          localStorage.removeItem("token");
          onLogout?.();
          return;
        }
        throw new Error(errorData.message || `Failed to fetch cases (HTTP ${response.status})`);
      }
      const data = await response.json();
      setCases(data.data || data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("[Caseload Fetch Error Engine Location]", err);
    } finally {
      setLoading(false);
    }
  }, [API_URL, onLogout]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  useEffect(() => {
    setQueuePage(1);
  }, [cases.length]);

  const fetchAppointments = useCallback(async () => {
    setAppointmentsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/doctor/appointments`, {
        headers: getAuthHeaders(),
      });
      if (response.status === 401) {
        localStorage.removeItem("token");
        onLogout?.();
        return;
      }
      const data = await response.json();
      if (response.ok && data.success) {
        setAppointments(data.data || []);
      }
    } catch {}
    setAppointmentsLoading(false);
  }, [API_URL, getAuthHeaders, onLogout]);

  useEffect(() => {
    if (activeTab === "myAppointments") {
      fetchAppointments();
    }
  }, [activeTab, fetchAppointments]);

  // Authenticated Profile Hook Setup
  useEffect(() => {
    const fetchDoctorInfo = async () => {
      const storedToken = localStorage.getItem("token");
      try {
        setDoctorLoading(true);
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("token");
            onLogout?.();
            return;
          }
          throw new Error();
        }
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
          name: "Dr. Medical Practitioner",
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
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("token");
            onLogout?.();
            return;
          }
          throw new Error();
        }
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

  const emergencyCases = useMemo(() => {
    return cases.filter(
      (c) =>
        c.admissionType === "Emergency" ||
        c.triage?.triageCategory === "Emergency" ||
        c.triage?.triageCategory === "Red / Immediate",
    );
  }, [cases]);

  const auditStats = useMemo(() => {
    if (!auditLogs.length) {
      return { total: 0, byAction: {}, success: 0, failed: 0, modules: {} };
    }
    const byAction = {};
    const modules = {};
    let success = 0;
    let failed = 0;
    auditLogs.forEach((log) => {
      const action = (log.action || "UNKNOWN").toUpperCase();
      byAction[action] = (byAction[action] || 0) + 1;
      const module = (log.module || "GENERAL").toUpperCase();
      modules[module] = (modules[module] || 0) + 1;
      const status = (log.status || "").toUpperCase();
      if (status === "SUCCESS" || status === "OK") success += 1;
      else if (status === "FAILED" || status === "ERROR") failed += 1;
    });
    return { total: auditLogs.length, byAction, success, failed, modules };
  }, [auditLogs]);

  // System Submission and Lab/Imaging Workflow Actions
  const handleLaboratorySubmission = async (e) => {
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
    if (!selectedCase?._id) {
      alert(
        "No active patient card locked. Bind an EMR context interface first.",
      );
      return;
    }

    try {
      const storedToken = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/doctor/${selectedCase._id}/laboratory`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedToken}`,
          },
          body: JSON.stringify({
            dispatchedTests: testsToDispatch,
            authorizingPhysician: doctorInfo.name,
            linkedPatient: selectedCase._id,
            clinicalSummary: laboratoryForm.clinicalSummary,
          }),
        },
      );
      if (response.status === 401) {
        localStorage.removeItem("token");
        onLogout?.();
        return;
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Laboratory order dispatch failed.");
      }

      await logAudit({
        action: "CREATE",
        module: "Laboratory",
        details: `Laboratory order transmitted for ${selectedCase.patientName} (${selectedCase.cardId}): ${testsToDispatch.join(", ")}`,
        targetId: selectedCase._id,
        targetType: "LabOrder",
      });

      // Append routing signal state on the client model
      setSelectedCase((prev) => ({
        ...prev,
        laboratory: {
          labStatus: "In Laboratory Processing Loop",
          dispatchedTests: testsToDispatch,
          authorizingPhysician: doctorInfo.name,
          clinicalSummary: laboratoryForm.clinicalSummary,
        },
      }));
      // Don't clear selectedLabs - keep checkboxes checked until card returns to reception
      // Don't clear laboratoryForm - keep summary visible until card returns to reception

      triggerSystemBanner(
        `SUCCESS: Transmitted ${testsToDispatch.length} laboratory test profiles to Laboratory Queue under authorization payload: ${doctorInfo.name}`,
      );
      setEmrSubTab("radiology");
    } catch (err) {
      alert(err.message || "Laboratory dispatch error.");
    }
  };

  const handleRadiologySubmission = async (e) => {
    e.preventDefault();
    
    // Get selected regions
    const regionsToDispatch = Object.keys(selectedRegions).filter(
      (key) => selectedRegions[key],
    );
    
    if (regionsToDispatch.length === 0) {
      alert("Please select at least one imaging protocol or anatomical region.");
      return;
    }
    
    if (!radiologyForm.clinicalIndication.trim()) {
      alert(
        "Please provide diagnostic criteria or physiological validation index.",
      );
      return;
    }
    if (!selectedCase?._id) {
      alert(
        "No active patient card locked. Bind an EMR context interface first.",
      );
      return;
    }

    try {
      const storedToken = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/doctor/${selectedCase._id}/radiology`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedToken}`,
          },
          body: JSON.stringify({
            selectedRegions: regionsToDispatch,
            clinicalIndication: radiologyForm.clinicalIndication,
            urgencyLevel: radiologyForm.urgencyLevel,
          }),
        },
      );
      if (response.status === 401) {
        localStorage.removeItem("token");
        onLogout?.();
        return;
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Radiology order dispatch failed.");
      }

      await logAudit({
        action: "CREATE",
        module: "Radiology",
        details: `Ultrasound request for ${regionsToDispatch.join(", ")} submitted for ${selectedCase.patientName} (${selectedCase.cardId})`,
        targetId: selectedCase._id,
        targetType: "PatientRecord",
      });

      setSelectedCase((prev) => ({
        ...prev,
        radiology: {
          imagingStatus: "Pending Ultrasound Scan",
          requestedModalities: regionsToDispatch,
          clinicalIndication: radiologyForm.clinicalIndication,
          urgencyLevel: radiologyForm.urgencyLevel,
          authorizingPhysician: doctorInfo.name,
        },
      }));

      triggerSystemBanner(
        `SUCCESS: Imaging request pipeline initiated securely for ${regionsToDispatch.length} region(s). Flagged tracking code to ultrasound department node logs.`,
      );
      setEmrSubTab("pharmacy");
    } catch (err) {
      alert(err.message || "Radiology dispatch error.");
    }
  };

  const queuePharmacyMedication = () => {
    if (!currentDrugSelection.id) {
      triggerSystemBanner(
        "Please select a medicine from the inventory before adding.",
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

    triggerSystemBanner(
      `SUCCESS: ${lookUpDrugItem?.name || "Medicine"} added to prescription basket.`,
    );
    setCurrentDrugSelection((p) => ({ ...p, id: "" }));
  };

  const handlePharmacySubmission = async (e) => {
    e.preventDefault();
    if (selectedDrugs.length === 0) {
      alert(
        "Pharmacy order validation intercept failed: Empty prescription matrix lines detected.",
      );
      return;
    }
    if (!selectedCase?._id) {
      alert(
        "No active patient card locked. Bind an EMR context interface first.",
      );
      return;
    }

    const medicationLines = selectedDrugs.map((d) => ({
      name: d.name,
      dosage: d.dosage || "",
      frequency: d.frequency || "",
      duration: d.duration || "",
    }));

    try {
      const storedToken = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/pharmacy/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify({
          patientCardId: selectedCase.cardId,
          patientName: selectedCase.patientName,
          age: selectedCase.age,
          doctorName: doctorInfo.name,
          medications: medicationLines,
          linkedPatient: selectedCase._id,
        }),
      });
      if (response.status === 401) {
        localStorage.removeItem("token");
        onLogout?.();
        return;
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Pharmacy order dispatch failed.");
      }

      await logAudit({
        action: "CREATE",
        module: "Pharmacy",
        details: `Prescription order transmitted for ${selectedCase.patientName} (${selectedCase.cardId}): ${selectedDrugs
          .map((d) => d.name)
          .join(", ")}`,
        targetId: selectedCase._id,
        targetType: "PharmacyOrder",
      });

      setSelectedCase((prev) => ({
        ...prev,
        pharmacy: {
          dispenseStatus: "Pending",
          prescribedDrugs: selectedDrugs.map(
            (d) => `${d.name} - ${d.dosage} [${d.frequency} x ${d.duration}]`,
          ),
          prescriptionLines: selectedDrugs, // Store full prescription objects
          authorizingPhysician: doctorInfo.name,
        },
      }));
      // Don't clear selectedDrugs - keep prescriptions visible until card returns to reception

      triggerSystemBanner(
        `SUCCESS: Dispensation payload transmitted to Pharmacy Dispensation Hub. Awaiting cashier settlement and dispensation.`,
      );
      setEmrSubTab("history");
    } catch (err) {
      alert(err.message || "Pharmacy dispatch error.");
    }
  };

  const savePatientHistoryCoreForm = async (e) => {
    e.preventDefault();
    if (!selectedCase?._id) return;
    
    try {
      const storedToken = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/doctor/${selectedCase._id}/consultation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedToken}`,
          },
          body: JSON.stringify({
            historyPresentIllness: historyForm.historyPresentIllness,
            physicalExamination: historyForm.physicalExamination,
            icd11Diagnosis: historyForm.icd11Diagnosis,
            pastMedicalHistory: historyForm.pastMedicalHistory,
            familyHistory: historyForm.familyHistory,
            allergies: historyForm.allergies,
            labRequests: [],
            prescriptionLines: [],
          }),
        },
      );
      
      if (response.ok) {
        // Update selectedCase with saved data
        setSelectedCase((prev) => ({
          ...prev,
          consultation: {
            ...prev.consultation,
            historyPresentIllness: historyForm.historyPresentIllness,
            physicalExamination: historyForm.physicalExamination,
            icd11Diagnosis: historyForm.icd11Diagnosis,
            pastMedicalHistory: historyForm.pastMedicalHistory,
            familyHistory: historyForm.familyHistory,
            allergies: historyForm.allergies,
          },
        }));
        
        triggerSystemBanner(
          "SUCCESS: Baseline clinical assessment block and local ICD-11 indices successfully committed to persistent component state runtime.",
        );
      }
    } catch (err) {
      console.error("Error saving history:", err);
    }
  };

  // Fetch the patient's full history archive from the API.
  // Called automatically when the history sub-tab is opened, and manually
  // via the refresh button. Results are cached per-card via historyFetched.
  const fetchPatientHistory = useCallback(async (force = false) => {
    if (!selectedCase?._id) return;
    if (historyFetched && !force) return; // already loaded for this card
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const storedToken = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/doctor/patient/${selectedCase._id}/history`,
        { headers: { Authorization: `Bearer ${storedToken}` } },
      );
      if (response.status === 401) { handleAuthError(); return; }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "History fetch failed.");
      setPatientHistory(data.data || []);
      setHistoryFetched(true);
    } catch (err) {
      setHistoryError(err.message || "Unable to retrieve history archive.");
    } finally {
      setHistoryLoading(false);
    }
  }, [API_URL, selectedCase?._id, historyFetched, handleAuthError]);

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
            pastMedicalHistory: historyForm.pastMedicalHistory || "",
            familyHistory: historyForm.familyHistory || "",
            allergies: historyForm.allergies || "",
            labRequests: Object.keys(selectedLabs).filter(
              (k) => selectedLabs[k],
            ),
            prescriptionLines: selectedDrugs,
            // Capture all sub-tab data so the Diagnosis archive record is complete
            radiologyForm: Object.keys(selectedRegions).some(key => selectedRegions[key]) || radiologyForm.clinicalIndication
              ? {
                  regions: Object.keys(selectedRegions).filter(key => selectedRegions[key]),
                  indication: radiologyForm.clinicalIndication,
                  urgency: radiologyForm.urgencyLevel,
                }
              : null,
            nurseForm: nurseForm.doctorInstructions || nurseForm.carePlan
              ? {
                  doctorInstructions: nurseForm.doctorInstructions,
                  carePlan: nurseForm.carePlan,
                  status: nurseForm.status,
                }
              : null,
            liaisonForm: liaisonForm.clinicalReason
              ? {
                  preferredWard: liaisonForm.preferredWard,
                  admissionUrgency: liaisonForm.admissionUrgency,
                  clinicalReason: liaisonForm.clinicalReason,
                  admissionDate: liaisonForm.admissionDate,
                  dischargeDate: liaisonForm.dischargeDate,
                  medicationIntake: liaisonForm.medicationIntake,
                }
              : null,
            transferForm: transferForm.targetFacility
              ? {
                  targetFacility: transferForm.targetFacility,
                  clinicalReason: transferForm.clinicalReason,
                  admissionUrgency: transferForm.admissionUrgency,
                }
              : null,
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
      setLaboratoryForm({
        clinicalSummary: "",
      });
      setRadiologyForm({
        clinicalIndication: "",
        urgencyLevel: "Routine",
      });
      setSelectedRegions({});
      setSelectedDrugs([]);
      setNurseForm({
        selectedDepartment: "",
        selectedNurse: "",
        doctorInstructions: "",
        carePlan: "",
        status: "Pending Meds",
      });
      setLiaisonForm({
        selectedDepartment: "",
        selectedWardNurse: "",
        admissionUrgency: "Routine",
        clinicalReason: "",
        admissionDate: "",
        dischargeDate: "",
        medicationIntake: "",
      });
      setPatientHistory([]);
      setHistoryFetched(false);
      setHistoryDetailView(null);
      setCompletedEncountersCount((p) => p + 1);

      triggerSystemBanner(
        "SUCCESSFUL TRANSACTION: EMR Card structural indices finalized completely. File locked and rerouted back to the Reception/Billing infrastructure array.",
      );
      setActiveTab("consultationQueue");
      fetchCases();
    } catch (err) {
      if (err.message?.includes("401") || err.message?.includes("Token Expired")) {
        localStorage.removeItem("token");
        onLogout?.();
        return;
      }
      console.error(err);
      setSelectedCase(null);
      triggerSystemBanner(
        "SUCCESSFUL TRANSACTION (LOCAL MODE): Target patient index dispatched back to primary registry node.",
      );
      setActiveTab("consultationQueue");
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    if (
      !aptForm.patientName.trim() ||
      !aptForm.patientCardId.trim() ||
      !aptForm.appointmentDate ||
      !aptForm.appointmentTime
    ) {
      setAptMessage("Patient name, card ID, date and time are required.");
      return;
    }
    setAptSubmitting(true);
    setAptMessage("");
    try {
      const response = await fetch(`${API_URL}/api/doctor/appointments`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(aptForm),
      });
      if (response.status === 401) {
        localStorage.removeItem("token");
        onLogout?.();
        return;
      }
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create appointment");
      }

      await logAudit({
        action: "CREATE",
        module: "Appointment",
        details: `Appointment created for ${aptForm.patientName} (${aptForm.patientCardId}) on ${aptForm.appointmentDate} ${aptForm.appointmentTime}`,
        targetId: data.data?._id || "",
        targetType: "Appointment",
      });

      setAptMessage("Appointment created successfully.");
      setAptForm({
        patientName: "",
        patientCardId: "",
        appointmentDate: "",
        appointmentTime: "",
        reason: "",
        department: "",
      });
      setAptSubTab("list");
      fetchAppointments();
    } catch (err) {
      setAptMessage(err.message || "Failed to create appointment.");
    } finally {
      setAptSubmitting(false);
    }
  };

  // Update existing appointment
  const handleUpdateAppointment = async (e) => {
    e.preventDefault();
    if (!editingAppointment) return;
    
    if (!editAptForm.appointmentDate || !editAptForm.appointmentTime) {
      setEditAptMessage("Date and time are required.");
      return;
    }
    
    try {
      const response = await fetch(
        `${API_URL}/api/doctor/appointments/${editingAppointment}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(editAptForm),
        }
      );
      
      if (response.status === 401) {
        localStorage.removeItem("token");
        onLogout?.();
        return;
      }
      
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update appointment");
      }

      await logAudit({
        action: "UPDATE",
        module: "Appointment",
        details: `Appointment updated: ${editAptForm.appointmentDate} ${editAptForm.appointmentTime} - Status: ${editAptForm.status}`,
        targetId: editingAppointment,
        targetType: "Appointment",
      });

      setEditAptMessage("Appointment updated successfully.");
      setTimeout(() => {
        setEditingAppointment(null);
        setEditAptMessage("");
      }, 1500);
      fetchAppointments();
    } catch (err) {
      setEditAptMessage(err.message || "Failed to update appointment.");
    }
  };

  // Delete appointment
  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to delete this appointment?")) {
      return;
    }
    
    try {
      const response = await fetch(
        `${API_URL}/api/doctor/appointments/${appointmentId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );
      
      if (response.status === 401) {
        localStorage.removeItem("token");
        onLogout?.();
        return;
      }
      
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete appointment");
      }

      await logAudit({
        action: "DELETE",
        module: "Appointment",
        details: `Appointment deleted: ${appointmentId}`,
        targetId: appointmentId,
        targetType: "Appointment",
      });

      fetchAppointments(); // Refresh the list
    } catch (err) {
      alert(err.message || "Failed to delete appointment.");
    }
  };

  // Liaison & Admission Coordination -> Ward Management bridge
  const fetchWardDepartments = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/staffs/ward/departments`, {
        headers: getAuthHeaders(),
      });
      if (response.status === 401) return handleAuthError();
      if (!response.ok) return;
      const data = await response.json();
      // Handle both response formats
      const departments = data.departments || data.data || [];
      setWardDepartments(departments);
      console.log("Ward departments fetched:", departments);
    } catch (err) {
      console.warn("Ward departments fetch failed:", err);
    }
  }, [API_URL, getAuthHeaders, handleAuthError]);

  const fetchWardNurses = useCallback(async (department) => {
    if (!department) {
      setWardNurses([]);
      return;
    }
    try {
      const response = await fetch(
        `${API_URL}/api/staffs/ward/staff?department=${encodeURIComponent(department)}`,
        { headers: getAuthHeaders() }
      );
      if (response.status === 401) return handleAuthError();
      if (!response.ok) {
        console.warn("Ward staff fetch failed - response not ok");
        setWardNurses([]);
        return;
      }
      const data = await response.json();
      // Backend returns { success, count, staff }
      const staff = data.staff || data.data || [];
      setWardNurses(staff);
      console.log("Ward staff fetched for", department, ":", staff);
    } catch (err) {
      console.warn("Ward staff fetch failed:", err);
      setWardNurses([]);
    }
  }, [API_URL, getAuthHeaders, handleAuthError]);

  const fetchWardBeds = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/ward`, {
        headers: getAuthHeaders(),
      });
      if (response.status === 401) return handleAuthError();
      if (!response.ok) return;
      const data = await response.json();
      const beds = data.data || [];
      setWardBeds(beds);
      const wards = Array.from(
        new Set(
          ["General Ward"].concat(
            beds
              .map((b) => b.room || b.ward || b.type)
              .filter((w) => w && String(w).trim()),
          ),
        ),
      );
      setWardWards(wards);
    } catch (err) {
      console.warn("Ward bed inventory fetch failed:", err);
    }
  }, [API_URL, getAuthHeaders, handleAuthError]);

  const fetchPatientAdmissionRequests = useCallback(async () => {
    if (!selectedCase?._id) return;
    try {
      const response = await fetch(`${API_URL}/api/ward/admission-requests`, {
        headers: getAuthHeaders(),
      });
      if (response.status === 401) return handleAuthError();
      if (!response.ok) return;
      const data = await response.json();
      const mine = (data.data || []).filter(
        (r) => String(r.patientId) === String(selectedCase._id),
      );
      setPatientAdmissionRequests(mine);
    } catch (err) {
      console.warn("Admission request fetch failed:", err);
    }
  }, [API_URL, getAuthHeaders, handleAuthError, selectedCase?._id]);

  const submitWardAdmission = async (e) => {
    e.preventDefault();
    if (!selectedCase?._id) {
      setLiaisonMessage(
        "No active patient card locked. Bind an EMR context interface first.",
      );
      return;
    }
    if (!liaisonForm.clinicalReason.trim()) {
      setLiaisonMessage(
        "Clinical admission indication is required before transmission.",
      );
      return;
    }
    setLiaisonSubmitting(true);
    setLiaisonMessage("");
    try {
      const response = await fetch(`${API_URL}/api/ward/admission-requests`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          patientId: selectedCase._id,
          patientName: selectedCase.patientName,
          cardId: selectedCase.cardId,
          age: selectedCase.age,
          gender: selectedCase.gender,
          doctorName: doctorInfo.name,
          selectedDepartment: liaisonForm.selectedDepartment,
          selectedWardNurse: liaisonForm.selectedWardNurse,
          admissionUrgency: liaisonForm.admissionUrgency,
          clinicalReason: liaisonForm.clinicalReason,
          admissionDate: liaisonForm.admissionDate,
          dischargeDate: liaisonForm.dischargeDate,
          medicationIntake: liaisonForm.medicationIntake,
        }),
      });
      if (response.status === 401) return handleAuthError();
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Admission transmission failed.");
      }
      await logAudit({
        action: "CREATE",
        module: "Ward-Admission",
        details: `Ward admission request raised for ${selectedCase.patientName} (${selectedCase.cardId}) -> ${liaisonForm.selectedDepartment} / ${liaisonForm.selectedWardNurse}`,
        targetId: selectedCase._id,
        targetType: "AdmissionRequest",
      });
      
      // Update selectedCase with liaison data
      setSelectedCase((prev) => ({
        ...prev,
        liaison: {
          selectedDepartment: liaisonForm.selectedDepartment,
          selectedWardNurse: liaisonForm.selectedWardNurse,
          admissionUrgency: liaisonForm.admissionUrgency,
          clinicalReason: liaisonForm.clinicalReason,
          admissionDate: liaisonForm.admissionDate,
          dischargeDate: liaisonForm.dischargeDate,
          medicationIntake: liaisonForm.medicationIntake,
          status: "Pending Ward Assignment",
        },
      }));
      
      // Don't clear liaisonForm - keep data visible until card returns to reception
      
      setLiaisonMessage(
        "Admission request transmitted to Ward Management Admission Hub. Awaiting bed asset assignment.",
      );
      fetchPatientAdmissionRequests();
    } catch (err) {
      setLiaisonMessage(err.message || "Transmission error.");
    } finally {
      setLiaisonSubmitting(false);
    }
  };

  const submitTransferRequest = async (e) => {
    e.preventDefault();
    if (!selectedCase?._id) {
      setTransferMessage(
        "No active patient card locked. Bind an EMR context interface first.",
      );
      return;
    }
    if (!transferForm.targetFacility.trim() || !transferForm.clinicalReason.trim()) {
      setTransferMessage(
        "Target facility and clinical referral rationale are required.",
      );
      return;
    }
    setTransferSubmitting(true);
    setTransferMessage("");
    try {
      const response = await fetch(`${API_URL}/api/ward/admission-requests`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          patientId: selectedCase._id,
          patientName: selectedCase.patientName,
          cardId: selectedCase.cardId,
          age: selectedCase.age,
          gender: selectedCase.gender,
          doctorName: doctorInfo.name,
          preferredWard: "Referral / Transfer Out",
          admissionUrgency: transferForm.admissionUrgency,
          clinicalReason: `[INTER-FACILITY TRANSFER -> ${transferForm.targetFacility.trim()}] ${transferForm.clinicalReason.trim()}`,
          admissionDate: "",
          dischargeDate: "",
          medicationIntake: "",
        }),
      });
      if (response.status === 401) return handleAuthError();
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Transfer transmission failed.");
      }
      await logAudit({
        action: "CREATE",
        module: "Ward-Admission",
        details: `Inter-facility transfer request for ${selectedCase.patientName} (${selectedCase.cardId}) -> ${transferForm.targetFacility.trim()}`,
        targetId: selectedCase._id,
        targetType: "AdmissionRequest",
      });
      setTransferMessage(
        "Transfer / referral request transmitted to Ward Management for coordination.",
      );
      setTransferForm({
        targetFacility: "",
        clinicalReason: "",
        admissionUrgency: "Routine",
      });
      fetchPatientAdmissionRequests();
    } catch (err) {
      setTransferMessage(err.message || "Transmission error.");
    } finally {
      setTransferSubmitting(false);
    }
  };

  // Pull Ward departments and nurses when liaison tab opens
  useEffect(() => {
    if (emrSubTab !== "liaison") return;
    fetchWardDepartments();
    fetchWardBeds();
    fetchPatientAdmissionRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emrSubTab, selectedCase?._id]);

  // Fetch ward nurses when department changes
  useEffect(() => {
    if (liaisonForm.selectedDepartment) {
      fetchWardNurses(liaisonForm.selectedDepartment);
    }
  }, [liaisonForm.selectedDepartment, fetchWardNurses]);

  // Nurse Coordination bridge
  const fetchNurseDepartments = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/staffs/nurses/departments`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setNurseDepartments(data.departments || []);
      }
    } catch (err) {
      console.error("Failed to fetch nurse departments:", err);
    }
  }, [API_URL]);

  const fetchNursesByDepartment = useCallback(async (department) => {
    if (!department) {
      setAvailableNurses([]);
      return;
    }
    try {
      const storedToken = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/staffs/nurses?department=${encodeURIComponent(department)}`,
        {
          headers: { Authorization: `Bearer ${storedToken}` },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setAvailableNurses(data.nurses || []);
      }
    } catch (err) {
      console.error("Failed to fetch nurses:", err);
      setAvailableNurses([]);
    }
  }, [API_URL]);

  useEffect(() => {
    if (emrSubTab === "nurse") {
      fetchNurseDepartments();
    }
  }, [emrSubTab, fetchNurseDepartments]);

  useEffect(() => {
    if (nurseForm.selectedDepartment) {
      fetchNursesByDepartment(nurseForm.selectedDepartment);
    }
  }, [nurseForm.selectedDepartment, fetchNursesByDepartment]);

  const fetchRecommendedNurse = useCallback(async () => {
    if (!selectedCase?._id) return;
    try {
      const response = await fetch(
        `${API_URL}/api/doctor/patient/${selectedCase._id}/recommended-nurse`,
        { headers: getAuthHeaders() },
      );
      if (response.status === 401) return handleAuthError();
      if (!response.ok) return;
      const data = await response.json();
      setRecommendedNurse(data.data || null);
    } catch (err) {
      console.warn("Recommended nurse fetch failed:", err);
    }
  }, [API_URL, getAuthHeaders, handleAuthError, selectedCase?._id]);

  const submitNurseInstructions = async (e) => {
    e.preventDefault();
    if (!selectedCase?._id) {
      setNurseMessage(
        "No active patient card locked. Bind an EMR context interface first.",
      );
      return;
    }
    if (!nurseForm.selectedNurse) {
      setNurseMessage("Please select a nurse before dispatching.");
      return;
    }
    if (!nurseForm.doctorInstructions.trim()) {
      setNurseMessage(
        "Care instructions are required before dispatch to the Nursing Station.",
      );
      return;
    }
    setNurseSubmitting(true);
    setNurseMessage("");
    try {
      const payload = {
        nurseName: nurseForm.selectedNurse,
        department: nurseForm.selectedDepartment,
        doctorInstructions: nurseForm.doctorInstructions,
        carePlan: nurseForm.carePlan,
        status: nurseForm.status,
      };
      
      console.log("🔷 Dispatching to nurse:", payload);
      console.log("🔷 Patient ID:", selectedCase._id);
      console.log("🔷 Endpoint:", `${API_URL}/api/nurse/${selectedCase._id}/doctor-observation`);
      
      const response = await fetch(
        `${API_URL}/api/nurse/${selectedCase._id}/doctor-observation`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        },
      );
      if (response.status === 401) return handleAuthError();
      const data = await response.json().catch(() => ({}));
      console.log("🔷 Response from server:", { status: response.status, data });
      if (!response.ok) {
        throw new Error(data.message || "Nurse dispatch failed.");
      }
      await logAudit({
        action: "UPDATE",
        module: "Nurse-Coordination",
        details: `Care instructions dispatched to Nursing Station for ${selectedCase.patientName} (${selectedCase.cardId})`,
        targetId: selectedCase._id,
        targetType: "NurseAssignment",
      });
      
      // Update selectedCase with the nurse assignment data
      setSelectedCase((prev) => ({
        ...prev,
        assignedNurseName: nurseForm.selectedNurse,
        assignedNurseDepartment: nurseForm.selectedDepartment,
        doctorInstructions: nurseForm.doctorInstructions,
        carePlan: nurseForm.carePlan,
        nurseAccepted: false,
        nurseResponse: "",
      }));
      
      setNurseMessage(
        "Care instructions transmitted to Nursing Station. Awaiting nurse acknowledgement.",
      );
      
      // Don't clear the form - keep the values visible until card returns to reception
      // setNurseForm({ ... }) REMOVED
    } catch (err) {
      setNurseMessage(err.message || "Transmission error.");
    } finally {
      setNurseSubmitting(false);
    }
  };

  // Pull recommended nurse when the Nurse sub-view is active
  useEffect(() => {
    if (emrSubTab !== "nurse") return;
    fetchRecommendedNurse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emrSubTab, selectedCase?._id]);

  // Fetch updated nurse assignment status when on nurse tab
  useEffect(() => {
    if (emrSubTab !== "nurse" || !selectedCase?._id) return;
    
    const fetchNurseStatus = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/doctor/patient/${selectedCase._id}`,
          { headers: getAuthHeaders() }
        );
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setSelectedCase((prev) => ({
              ...prev,
              assignedNurseName: data.data.assignedNurseName || prev.assignedNurseName,
              assignedNurseDepartment: data.data.assignedNurseDepartment || prev.assignedNurseDepartment,
              doctorInstructions: data.data.doctorInstructions || prev.doctorInstructions,
              carePlan: data.data.carePlan || prev.carePlan,
              nurseAccepted: data.data.nurseAccepted !== undefined ? data.data.nurseAccepted : prev.nurseAccepted,
              nurseResponse: data.data.nurseResponse || prev.nurseResponse,
            }));
            
            // Populate form if data exists
            if (data.data.doctorInstructions || data.data.carePlan) {
              setNurseForm((prev) => ({
                ...prev,
                selectedDepartment: data.data.assignedNurseDepartment || prev.selectedDepartment,
                selectedNurse: data.data.assignedNurseName || prev.selectedNurse,
                doctorInstructions: data.data.doctorInstructions || prev.doctorInstructions,
                carePlan: data.data.carePlan || prev.carePlan,
                status: data.data.status || prev.status,
              }));
            }
          }
        }
      } catch (err) {
        console.warn("Failed to fetch nurse status:", err);
      }
    };
    
    // Fetch immediately and then every 10 seconds
    fetchNurseStatus();
    const interval = setInterval(fetchNurseStatus, 10000);
    return () => clearInterval(interval);
  }, [emrSubTab, selectedCase?._id, API_URL, getAuthHeaders]);

  // Populate History form when patient data is loaded
  useEffect(() => {
    if (!selectedCase) return;
    
    const consultation = selectedCase.consultation;
    if (consultation) {
      // Populate history form from consultation data
      if (consultation.historyPresentIllness || consultation.physicalExamination || consultation.icd11Diagnosis) {
        setHistoryForm((prev) => ({
          ...prev,
          historyPresentIllness: consultation.historyPresentIllness || prev.historyPresentIllness || "",
          physicalExamination: consultation.physicalExamination || prev.physicalExamination || "",
          icd11Diagnosis: consultation.icd11Diagnosis || prev.icd11Diagnosis || "",
          pastMedicalHistory: consultation.pastMedicalHistory || prev.pastMedicalHistory || "",
          familyHistory: consultation.familyHistory || prev.familyHistory || "",
          allergies: consultation.allergies || prev.allergies || "",
        }));
      }
    }
  }, [selectedCase]);

  // Populate Laboratory form when patient data is loaded
  useEffect(() => {
    if (!selectedCase) return;
    
    const laboratory = selectedCase.laboratory;
    if (laboratory) {
      // Populate lab form from laboratory data
      if (laboratory.clinicalSummary) {
        setLaboratoryForm((prev) => ({
          ...prev,
          clinicalSummary: laboratory.clinicalSummary || prev.clinicalSummary || "",
        }));
      }
      
      // Restore selected lab tests if they exist
      if (laboratory.testRequests && Array.isArray(laboratory.testRequests)) {
        const restoredTests = {};
        laboratory.testRequests.forEach(test => {
          restoredTests[test] = true;
        });
        setSelectedLabs((prev) => ({
          ...prev,
          ...restoredTests,
        }));
      }
    }
  }, [selectedCase]);

  // Populate Radiology form when patient data is loaded
  useEffect(() => {
    if (!selectedCase) return;
    
    const radiology = selectedCase.radiology;
    if (radiology) {
      // Populate radiology form from radiology data
      if (radiology.clinicalIndication || radiology.urgencyLevel) {
        setRadiologyForm((prev) => ({
          ...prev,
          clinicalIndication: radiology.clinicalIndication || prev.clinicalIndication || "",
          urgencyLevel: radiology.urgencyLevel || prev.urgencyLevel || "Routine",
        }));
      }
      
      // Restore selected regions if they exist
      if (radiology.requestedModalities && Array.isArray(radiology.requestedModalities)) {
        const restoredRegions = {};
        radiology.requestedModalities.forEach(region => {
          restoredRegions[region] = true;
        });
        setSelectedRegions((prev) => ({
          ...prev,
          ...restoredRegions,
        }));
      }
    }
  }, [selectedCase]);

  // Populate Pharmacy prescriptions when patient data is loaded
  useEffect(() => {
    if (!selectedCase) return;
    
    const pharmacy = selectedCase.pharmacy;
    if (pharmacy && pharmacy.prescriptionLines && Array.isArray(pharmacy.prescriptionLines)) {
      // Restore prescription list from database
      setSelectedDrugs(pharmacy.prescriptionLines);
    }
  }, [selectedCase]);

  // Populate Liaison form when patient data is loaded
  useEffect(() => {
    if (!selectedCase) return;
    
    const liaison = selectedCase.liaison;
    if (liaison) {
      // Populate liaison form from liaison data
      setLiaisonForm((prev) => ({
        ...prev,
        selectedDepartment: liaison.selectedDepartment || prev.selectedDepartment || "",
        selectedWardNurse: liaison.selectedWardNurse || prev.selectedWardNurse || "",
        admissionUrgency: liaison.admissionUrgency || prev.admissionUrgency || "Routine",
        clinicalReason: liaison.clinicalReason || prev.clinicalReason || "",
        admissionDate: liaison.admissionDate || prev.admissionDate || "",
        dischargeDate: liaison.dischargeDate || prev.dischargeDate || "",
        medicationIntake: liaison.medicationIntake || prev.medicationIntake || "",
      }));
    }
  }, [selectedCase]);

  // Clear history cache whenever the doctor binds a new patient card
  useEffect(() => {
    setPatientHistory([]);
    setHistoryFetched(false);
    setHistoryError("");
    setHistoryDetailView(null);
  }, [selectedCase?._id]);

  // Auto-fetch history archive when the history sub-tab is opened
  useEffect(() => {
    if (emrSubTab !== "history" || !selectedCase?._id) return;
    fetchPatientHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emrSubTab, selectedCase?._id]);

  // Clear the history archive and any open detail view when the doctor
  // navigates away from the history sub-tab. This ensures that lab,
  // radiology, pharmacy, nurse, and liaison tabs never hold stale history
  // data in memory — history only lives while the history tab is active.
  useEffect(() => {
    if (emrSubTab === "history") return; // leaving history → clear it
    setPatientHistory([]);
    setHistoryFetched(false);
    setHistoryDetailView(null);
    setHistoryError("");
  }, [emrSubTab]);

  // Refresh the selected patient EMR when the Pharmacy sub-view is opened
  // (kept for potential future use; result panels are shown in history files only)

  return (
    <div className="flex min-h-screen bg-[#0E1B17] text-white font-sans antialiased text-[12px]">
      {/* SYSTEM GLOBAL ACTION FLOATING ALERT BANNER */}
      {globalBannerMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-11/12 max-w-3xl bg-[#0a1510] border-l-4 border-[#10B981] text-[#10B981] px-4 py-2.5 rounded-md shadow-xl font-mono text-[11px] flex items-center justify-between animate-slideDown">
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="shrink-0" />
            <span>{globalBannerMessage}</span>
          </div>
          <button
            onClick={() => setGlobalBannerMessage(null)}
            className="hover:text-white transition p-0.5 shrink-0 ml-3"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
           HISTORY FILE DETAIL — FULL-SCREEN PAGE
           Opens when a doctor clicks a history file card in the History sub-tab.
           Displays the complete Diagnosis record: consultation, vitals snapshot,
           lab requests + results, radiology, pharmacy prescriptions, nurse data,
           and liaison / transfer data. Closed with the back button.
      ════════════════════════════════════════════════════════════════════════ */}
      {historyDetailView && (
        <div className="fixed inset-0 z-[60] bg-[#f0f4f8] overflow-y-auto font-sans text-slate-900 text-[12px]">
          {/* ── Top bar ── */}
          <div className="sticky top-0 z-10 bg-slate-900 text-white px-5 py-3 flex items-center justify-between shadow-md font-mono">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setHistoryDetailView(null)}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white transition text-[11px] font-bold uppercase tracking-wider"
              >
                <ChevronLeft size={16} /> Back to History
              </button>
              <span className="text-slate-600">|</span>
              <div>
                <span className="text-[9px] font-black tracking-widest text-[#3b82f6] block uppercase">
                  Past Encounter Record — Read Only
                </span>
                <h2 className="text-[13px] font-black text-white tracking-tight truncate max-w-xl">
                  {historyDetailView.icd11Diagnosis || "Encounter Record"}
                </h2>
              </div>
            </div>
            <div className="text-right text-[10px] text-slate-400 shrink-0">
              <p className="font-bold text-white">
                {selectedCase?.patientName}
              </p>
              <p>
                MRN:{" "}
                <span className="text-[#3b82f6] font-bold">
                  {selectedCase?.cardId}
                </span>{" "}
                &nbsp;·&nbsp;{" "}
                {historyDetailView.timestamp
                  ? new Date(historyDetailView.timestamp).toLocaleString(
                      "en-GB",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )
                  : "N/A"}
              </p>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-5 py-6 space-y-5">

            {/* ── SECTION 1: Consultation & Vitals ── */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-[#1e3a8a] text-white px-4 py-2.5 flex items-center gap-2 font-mono">
                <FileText size={14} className="text-[#93c5fd]" />
                <span className="text-[11px] font-black uppercase tracking-wider">
                  Consultation — Clinical Assessment
                </span>
                <span className="ml-auto text-[10px] text-[#93c5fd] font-bold">
                  {historyDetailView.doctorName || "Unknown Physician"}
                </span>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                {/* Vitals snapshot */}
                {historyDetailView.triageSnapshot && (
                  <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-wider mb-2">
                      Triage Vitals Snapshot at Time of Encounter
                    </p>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono">
                      {historyDetailView.triageSnapshot.bloodPressure && (
                        <span>
                          <span className="text-slate-400 uppercase text-[9px] mr-1">BP</span>
                          <strong>{historyDetailView.triageSnapshot.bloodPressure} mmHg</strong>
                        </span>
                      )}
                      {historyDetailView.triageSnapshot.heartRate && (
                        <span>
                          <span className="text-slate-400 uppercase text-[9px] mr-1">PR</span>
                          <strong>{historyDetailView.triageSnapshot.heartRate} bpm</strong>
                        </span>
                      )}
                      {historyDetailView.triageSnapshot.temperature && (
                        <span>
                          <span className="text-slate-400 uppercase text-[9px] mr-1">Temp</span>
                          <strong>{historyDetailView.triageSnapshot.temperature}°C</strong>
                        </span>
                      )}
                      {historyDetailView.triageSnapshot.respiratoryRate && (
                        <span>
                          <span className="text-slate-400 uppercase text-[9px] mr-1">RR</span>
                          <strong>{historyDetailView.triageSnapshot.respiratoryRate}/min</strong>
                        </span>
                      )}
                      {historyDetailView.triageSnapshot.spo2 && (
                        <span>
                          <span className="text-slate-400 uppercase text-[9px] mr-1">SpO₂</span>
                          <strong>{historyDetailView.triageSnapshot.spo2}</strong>
                        </span>
                      )}
                      {historyDetailView.triageSnapshot.weight && (
                        <span>
                          <span className="text-slate-400 uppercase text-[9px] mr-1">Weight</span>
                          <strong>{historyDetailView.triageSnapshot.weight} kg</strong>
                        </span>
                      )}
                      {historyDetailView.triageSnapshot.triageCategory && (
                        <span className="ml-auto px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-100 text-amber-700 border border-amber-200">
                          {historyDetailView.triageSnapshot.triageCategory}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                    History of Present Illness (HPI)
                  </p>
                  <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {historyDetailView.hpi || "Not documented."}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Physical Examination
                  </p>
                  <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {historyDetailView.physicalExamination || "Not documented."}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Past Medical History
                  </p>
                  <p className="text-slate-800">
                    {historyDetailView.pastMedicalHistory || "Nil significant."}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Family History
                  </p>
                  <p className="text-slate-800">
                    {historyDetailView.familyHistory || "Non-contributory."}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Allergies
                  </p>
                  <p className="text-slate-800">
                    {historyDetailView.allergies || "No known drug allergies."}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                    ICD-11 Diagnosis
                  </p>
                  <p className="font-black text-slate-900 text-[12px]">
                    {historyDetailView.icd11Diagnosis || "Not recorded."}
                  </p>
                </div>
              </div>
            </div>

            {/* ── SECTION 2: Laboratory ── */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-purple-800 text-white px-4 py-2.5 flex items-center gap-2 font-mono">
                <FlaskConical size={14} className="text-purple-300" />
                <span className="text-[11px] font-black uppercase tracking-wider">
                  Laboratory — Requests & Results
                </span>
              </div>
              <div className="p-4 text-[11px]">
                {(!historyDetailView.labRequests?.length && !historyDetailView.labResultsSnapshot) ? (
                  <p className="text-slate-400 font-mono">No laboratory orders placed during this encounter.</p>
                ) : (
                  <div className="space-y-3">
                    {historyDetailView.labRequests?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Requested Tests
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {historyDetailView.labRequests.map((t, i) => (
                            <span
                              key={i}
                              className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[10px] font-bold font-mono"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {historyDetailView.labResultsSnapshot &&
                      Object.keys(historyDetailView.labResultsSnapshot).length > 0 && (
                        <div>
                          <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Results Snapshot
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {Object.entries(historyDetailView.labResultsSnapshot).map(
                              ([test, value]) => (
                                <div
                                  key={test}
                                  className="flex items-center justify-between border border-slate-100 rounded-lg px-3 py-2 bg-slate-50"
                                >
                                  <span className="font-bold text-slate-700">{test}</span>
                                  <span className="font-mono text-slate-900">{value || "—"}</span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>

            {/* ── SECTION 3: Radiology / Imaging ── */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-blue-700 text-white px-4 py-2.5 flex items-center gap-2 font-mono">
                <Activity size={14} className="text-blue-300" />
                <span className="text-[11px] font-black uppercase tracking-wider">
                  Radiology — Imaging Request & Report
                </span>
              </div>
              <div className="p-4 text-[11px]">
                {!historyDetailView.radiologyRequest?.region && !historyDetailView.radiologyRequest?.regions ? (
                  <p className="text-slate-400 font-mono">No imaging request placed during this encounter.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Modality / Region(s)
                      </p>
                      <p className="font-bold text-slate-800">
                        {historyDetailView.radiologyRequest.regions 
                          ? historyDetailView.radiologyRequest.regions.join(", ")
                          : historyDetailView.radiologyRequest.region}
                        {historyDetailView.radiologyRequest.urgency
                          ? ` — ${historyDetailView.radiologyRequest.urgency}`
                          : ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Clinical Indication
                      </p>
                      <p className="text-slate-800 whitespace-pre-wrap">
                        {historyDetailView.radiologyRequest.indication || "Not documented."}
                      </p>
                    </div>
                    {historyDetailView.radiologyRequest.reportText && (
                      <div className="sm:col-span-2">
                        <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Imaging Report
                        </p>
                        <p className="text-slate-800 whitespace-pre-wrap leading-relaxed bg-slate-50 border border-slate-200 rounded-lg p-3">
                          {historyDetailView.radiologyRequest.reportText}
                        </p>
                      </div>
                    )}
                    {historyDetailView.radiologyRequest.imageUrls?.length > 0 && (
                      <div className="sm:col-span-2">
                        <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Attached Scans
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {historyDetailView.radiologyRequest.imageUrls.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50 block"
                            >
                              <img
                                src={url}
                                alt={`Scan ${i + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── SECTION 4: Pharmacy ── */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-orange-600 text-white px-4 py-2.5 flex items-center gap-2 font-mono">
                <Pill size={14} className="text-orange-200" />
                <span className="text-[11px] font-black uppercase tracking-wider">
                  Pharmacy — Prescription Lines
                </span>
              </div>
              <div className="p-4 text-[11px]">
                {!historyDetailView.prescriptions?.length ? (
                  <p className="text-slate-400 font-mono">No prescriptions written during this encounter.</p>
                ) : (
                  <div className="space-y-1.5">
                    {historyDetailView.prescriptions.map((rx, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-orange-50 border border-orange-100"
                      >
                        <span className="font-bold text-slate-800">
                          {rx.name || rx}
                        </span>
                        {(rx.dosage || rx.frequency || rx.duration) && (
                          <span className="text-slate-500 font-mono text-[10px] shrink-0 ml-3">
                            {[rx.dosage, rx.frequency, rx.duration]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── SECTION 5: Nurse Coordination ── */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-emerald-700 text-white px-4 py-2.5 flex items-center gap-2 font-mono">
                <UserPlus size={14} className="text-emerald-300" />
                <span className="text-[11px] font-black uppercase tracking-wider">
                  Nursing Coordination Snapshot
                </span>
              </div>
              <div className="p-4 text-[11px]">
                {!historyDetailView.nurseData?.doctorInstructions &&
                !historyDetailView.nurseData?.assignedNurseName ? (
                  <p className="text-slate-400 font-mono">No nursing coordination data recorded for this encounter.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {historyDetailView.nurseData?.assignedNurseName && (
                      <div>
                        <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Assigned Nurse
                        </p>
                        <p className="font-bold text-slate-800">
                          {historyDetailView.nurseData.assignedNurseName}
                        </p>
                      </div>
                    )}
                    {historyDetailView.nurseData?.status && (
                      <div>
                        <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Care Status
                        </p>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
                          {historyDetailView.nurseData.status}
                        </span>
                      </div>
                    )}
                    {historyDetailView.nurseData?.carePlan && (
                      <div className="sm:col-span-2">
                        <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Care Plan
                        </p>
                        <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {historyDetailView.nurseData.carePlan}
                        </p>
                      </div>
                    )}
                    {historyDetailView.nurseData?.doctorInstructions && (
                      <div className="sm:col-span-2">
                        <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Doctor Instructions to Nursing
                        </p>
                        <p className="text-slate-800 whitespace-pre-wrap leading-relaxed bg-slate-50 border border-slate-200 rounded-lg p-3">
                          {historyDetailView.nurseData.doctorInstructions}
                        </p>
                      </div>
                    )}
                    {historyDetailView.nurseData?.nurseResponse && (
                      <div className="sm:col-span-2">
                        <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Nurse Response
                        </p>
                        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {historyDetailView.nurseData.nurseResponse}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── SECTION 6: Liaison & Admission / Transfer ── */}
            {(historyDetailView.liaisonData?.clinicalReason ||
              historyDetailView.transferData?.targetFacility) && (
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-[#1e3a8a] text-white px-4 py-2.5 flex items-center gap-2 font-mono">
                  <Bed size={14} className="text-[#93c5fd]" />
                  <span className="text-[11px] font-black uppercase tracking-wider">
                    Liaison, Admission & Transfer Snapshot
                  </span>
                </div>
                <div className="p-4 text-[11px] space-y-4">
                  {historyDetailView.liaisonData?.clinicalReason && (
                    <div>
                      <p className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">
                        Ward Admission Request
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                            Preferred Ward
                          </p>
                          <p className="font-bold text-slate-800">
                            {historyDetailView.liaisonData.preferredWard || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                            Urgency
                          </p>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-100 text-blue-700 border border-blue-200">
                            {historyDetailView.liaisonData.admissionUrgency || "Routine"}
                          </span>
                        </div>
                        {historyDetailView.liaisonData.admissionDate && (
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                              Admit Date
                            </p>
                            <p className="font-bold text-slate-800">
                              {historyDetailView.liaisonData.admissionDate}
                            </p>
                          </div>
                        )}
                        <div className="sm:col-span-3">
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                            Clinical Indication
                          </p>
                          <p className="text-slate-800 whitespace-pre-wrap bg-slate-50 border border-slate-200 rounded-lg p-3">
                            {historyDetailView.liaisonData.clinicalReason}
                          </p>
                        </div>
                        {historyDetailView.liaisonData.medicationIntake && (
                          <div className="sm:col-span-3">
                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                              Ongoing Medication
                            </p>
                            <p className="text-slate-800">
                              {historyDetailView.liaisonData.medicationIntake}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {historyDetailView.transferData?.targetFacility && (
                    <div>
                      <p className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">
                        Transfer / Referral Request
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                            Target Facility
                          </p>
                          <p className="font-bold text-slate-800">
                            {historyDetailView.transferData.targetFacility}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                            Urgency
                          </p>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-purple-100 text-purple-700 border border-purple-200">
                            {historyDetailView.transferData.admissionUrgency || "Routine"}
                          </span>
                        </div>
                        {historyDetailView.transferData.clinicalReason && (
                          <div className="sm:col-span-2">
                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                              Referral Rationale
                            </p>
                            <p className="text-slate-800 whitespace-pre-wrap bg-slate-50 border border-slate-200 rounded-lg p-3">
                              {historyDetailView.transferData.clinicalReason}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Footer close button ── */}
            <div className="flex justify-center pb-6">
              <button
                onClick={() => setHistoryDetailView(null)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-[11px] uppercase tracking-widest rounded-lg transition flex items-center gap-2 shadow-md"
              >
                <ChevronLeft size={14} /> Close & Return to History List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-60 bg-[#0E1B17] text-slate-300 flex flex-col justify-between shrink-0 z-30 font-mono select-none border-r border-[#29323a] sticky top-0 h-screen overflow-y-auto">
        <div>
          {/* Logo */}
          <div className="p-4 border-b border-[#29323a] flex items-center gap-2.5 bg-[#0E1B17]">
            <div className="w-7 h-7 rounded-lg bg-[#10B981] flex items-center justify-center border border-[#10B981]/30 shadow-inner">
              <ActivitySquare size={15} className="text-white" />
            </div>
            <div>
              <h3 className="font-black tracking-tight text-[12px] text-white leading-none">
                MESRA<span className="text-[#10B981]">DIGITAL</span>
              </h3>
              <span className="text-[9px] text-[#94A3B8] font-bold tracking-widest block mt-0.5 uppercase">
                Doctor Module
              </span>
            </div>
          </div>

          {/* Nav */}
          <div className="p-2.5 space-y-0.5">
            <div className="text-[9px] font-bold uppercase text-[#94A3B8] px-3 py-1.5 tracking-widest">
              Core Interface Engine
            </div>

            <button
              onClick={() => { setActiveTab("dashboard"); setSelectedCase(null); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition ${activeTab === "dashboard" ? "bg-[#10B981] text-white" : "text-[#94A3B8] hover:bg-[#152318] hover:text-white"}`}
            >
              <div className="flex items-center gap-2.5"><LayoutDashboard size={14} /> <span>System Overview</span></div>
            </button>

            <button
              onClick={() => setActiveTab("consultationQueue")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition ${activeTab === "consultationQueue" ? "bg-[#10B981] text-white" : "text-[#94A3B8] hover:bg-[#152318] hover:text-white"}`}
            >
              <div className="flex items-center gap-2.5"><ClipboardList size={14} /> <span>Active Consult Queue</span></div>
              <span className="bg-[#0a1510] text-[#10B981] border border-[#10B981]/20 px-1.5 py-0.5 rounded text-[10px] font-bold">{cases.length}</span>
            </button>

            <button
              onClick={() => setActiveTab("emergencyHub")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition ${activeTab === "emergencyHub" ? "bg-[#EF4444] text-white" : emergencyCases.length > 0 ? "bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20 border-l-2 border-[#EF4444] animate-pulse" : "text-[#94A3B8] hover:bg-[#152318] hover:text-white"}`}
            >
              <div className="flex items-center gap-2.5"><Zap size={14} /> <span>Emergency Hub</span></div>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${emergencyCases.length > 0 ? "bg-[#EF4444] text-white animate-pulse" : "bg-[#0a1510] text-[#EF4444]"}`}>{emergencyCases.length}</span>
            </button>

            <button
              onClick={() => setActiveTab("myAppointments")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition ${activeTab === "myAppointments" ? "bg-purple-600 text-white" : "text-[#94A3B8] hover:bg-[#152318] hover:text-white"}`}
            >
              <div className="flex items-center gap-2.5"><CalendarDays size={14} /> <span>My Appointments</span></div>
              <span className="bg-[#0a1510] text-purple-400 px-1.5 py-0.5 rounded text-[10px] font-bold">{appointments.length}</span>
            </button>

            <button
              onClick={() => setActiveTab("doctorAudit")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition ${activeTab === "doctorAudit" ? "bg-amber-600 text-white" : "text-[#94A3B8] hover:bg-[#152318] hover:text-white"}`}
            >
              <div className="flex items-center gap-2.5"><ShieldAlert size={14} /> <span>Security Trail Layer</span></div>
            </button>
          </div>
        </div>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-[#29323a] bg-[#0E1B17] space-y-2.5">
          <div className="bg-[#0a1510] rounded-lg p-2 border border-[#29323a] text-[10px] leading-relaxed">
            <div className="flex items-center gap-1.5 text-[#10B981] font-bold uppercase tracking-wide mb-0.5">
              <User size={11} /> <span>Operator Account Signature</span>
            </div>
            <p className="text-white truncate font-medium">{doctorInfo.name}</p>
            <p className="text-[#94A3B8] truncate text-[9px]">{doctorInfo.department}</p>
          </div>

          {selectedCase && (
            <div className="bg-[#0a1510] rounded-lg p-2 border border-[#10B981]/20 text-[10px] animate-fadeIn">
              <div className="text-[#94A3B8] font-bold uppercase tracking-wide flex items-center gap-1 mb-1">
                <Layers size={11} className="text-[#10B981]" /> <span>Locked Patient Node</span>
              </div>
              <p className="text-white font-bold text-[11px] truncate">{selectedCase.patientName}</p>
              <div className="mt-1 flex items-center justify-between text-[9px] text-[#94A3B8] font-mono">
                <span>MRN Token:</span>
                <span className="text-[#10B981] font-bold">{selectedCase.cardId}</span>
              </div>
              <div className="mt-0.5 flex items-center justify-between text-[9px] text-[#94A3B8] font-mono">
                <span>Active Form:</span>
                <span className="text-white font-bold uppercase text-[8px] px-1 bg-[#10B981]/20 rounded text-[#10B981]">{emrSubTab}</span>
              </div>
            </div>
          )}

          <div className="pt-1.5">
            <button
              onClick={onLogout}
              className="w-full py-1.5 bg-[#EF4444]/10 hover:bg-[#b91c1c]/40 border border-[#EF4444]/30 text-[#EF4444] font-bold uppercase text-[10px] tracking-widest rounded transition flex items-center justify-center gap-1.5"
            >
              <LogOut size={12} /> Terminate Token Session
            </button>
          </div>
        </div>
      </aside>

      {/* CORE WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP HEADER */}
        <header className="bg-[#0E1B17] border-b border-[#29323a] sticky top-0 px-6 py-3 z-20 flex justify-between items-center select-none shadow-sm">
          <div className="flex items-center gap-2">
            <Database size={14} className="text-[#94A3B8]" />
            <h1 className="text-[11px] font-black tracking-widest text-white uppercase font-mono">
              {activeTab === "dashboard" && "Clinical Analytics Matrix Module"}
              {activeTab === "consultationQueue" && (selectedCase ? "Electronic Health Record Core Console Layer" : "Assigned Caseload Intake Pipeline Routing Panel")}
              {activeTab === "doctorAudit" && "System Safety Enforcement Matrix Nodes"}
              {activeTab === "emergencyHub" && "Emergency Critical Care Hub"}
              {activeTab === "myAppointments" && "My Appointments Schedule"}
            </h1>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px]">
            {selectedCase && activeTab === "consultationQueue" && (
              <div className="flex items-center gap-1.5 bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 px-2.5 py-1 rounded font-bold uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                <span>Active State Session Restrained: Card Locked</span>
              </div>
            )}
            <NotificationBell role="Doctor" />
            <div className="bg-[#0a1510] text-[#94A3B8] border border-[#29323a] px-2 py-1 rounded font-bold">
              NODE SECURE IP: 10.100.10.4
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 overflow-y-auto">
          {activeTab === "dashboard" && (
            <div className="space-y-5 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Assigned Intake Queue Count", value: cases.length, desc: "Awaiting primary medical interaction vectors.", color: "border-l-4 border-[#10B981]" },
                  { label: "Finalized Operations Node Counter", value: `${completedEncountersCount} Patients Dispatched`, desc: "Securely transmitted files to billing/pharmacy buffers.", color: "border-l-4 border-[#10B981]/50" },
                  { label: "Node Handoff Network Rate", value: "99.46% Metric Pass", desc: "System operational availability telemetry signature.", color: "border-l-4 border-[#94A3B8]" },
                ].map((stat, index) => (
                  <div key={index} className={`bg-[#0a1510] border border-[#29323a] p-4 rounded-xl shadow-sm ${stat.color}`}>
                    <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest block font-mono">{stat.label}</span>
                    <span className="text-xl font-black text-white mt-1 block font-mono tracking-tight">{stat.value}</span>
                    <p className="text-[11px] text-[#94A3B8] mt-1 leading-relaxed font-sans">{stat.desc}</p>
                  </div>
                ))}
              </div>
              <div className="bg-[#0a1510] rounded-xl border border-[#29323a] p-4 shadow-sm">
                <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider mb-2 font-mono text-[11px]">
                  <AlertCircle size={14} className="text-[#10B981]" />
                  <span>Physician Infrastructure Notice Registry</span>
                </div>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed font-sans">
                  Please update full secondary system clinical datasets before executing diagnostic card updates. Dynamic validation checking parameters are being monitored under encrypted department audit logging blocks.
                </p>
              </div>
            </div>
          )}

          {activeTab === "consultationQueue" && !selectedCase && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center bg-[#0a1510] p-3 border border-[#29323a] rounded-xl shadow-sm">
                <span className="font-mono text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">Available Queue Load Stack Matrix</span>
                <button onClick={fetchCases} className="px-2.5 py-1 bg-[#152318] hover:bg-[#1e3a26] text-[#94A3B8] border border-[#29323a] rounded text-[10px] font-mono font-bold flex items-center gap-1 transition">
                  <RefreshCw size={11} /> Refresh Node Stack
                </button>
              </div>

              {loading ? (
                <div className="text-center p-8 bg-[#0a1510] border border-[#29323a] rounded-xl font-mono text-[#94A3B8]">Querying central database registry sockets...</div>
              ) : error ? (
                <div className="p-4 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl font-mono text-[#EF4444]">{error}</div>
              ) : cases.length === 0 ? (
                <div className="p-8 text-center bg-[#0a1510] border border-[#29323a] rounded-xl font-mono text-[#94A3B8]">No active patient case records routed to this practitioner workspace sequence.</div>
              ) : (
                <>
                  <div className="bg-[#0a1510] border border-[#29323a] rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#0E1B17] border-b border-[#29323a] text-[10px] font-bold uppercase text-[#94A3B8] font-mono">
                          <th className="p-3 px-4">Patient</th>
                          <th className="p-3 px-4">MRN Token</th>
                          <th className="p-3 px-4">Status</th>
                          <th className="p-3 px-4 text-center">BP</th>
                          <th className="p-3 px-4 text-center">PR</th>
                          <th className="p-3 px-4 text-center">Temp</th>
                          <th className="p-3 px-4">Age/Sex</th>
                          <th className="p-3 px-4">Chief Complaint</th>
                          <th className="p-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#29323a] text-[11px] text-slate-300">
                        {cases.slice((queuePage - 1) * queuePageSize, queuePage * queuePageSize).map((patient) => (
                          <tr key={patient.cardId || patient._id} className="hover:bg-[#152318] transition">
                            <td className="p-3 px-4 font-bold text-white">{patient.patientName}</td>
                            <td className="p-3 px-4 font-mono text-[#10B981] font-bold">{patient.cardId}</td>
                            <td className="p-3 px-4">
                              <span className="text-[9px] font-mono font-bold bg-[#10B981]/20 text-[#10B981] px-2 py-0.5 rounded uppercase">{patient.currentStatus || "OPD TRIAGE"}</span>
                            </td>
                            <td className="p-3 px-4 text-center font-mono">{patient.triage?.bloodPressure || "N/A"}</td>
                            <td className="p-3 px-4 text-center font-mono">{patient.triage?.heartRate ? `${patient.triage.heartRate}m` : "N/A"}</td>
                            <td className="p-3 px-4 text-center font-mono">{patient.triage?.temperature ? `${patient.triage.temperature}°C` : "N/A"}</td>
                            <td className="p-3 px-4 font-mono">{patient.age}Y/{patient.gender?.substring(0, 1)}</td>
                            <td className="p-3 px-4 text-[#94A3B8] max-w-xs"><span className="line-clamp-2 block leading-relaxed">{patient.chiefComplaint || "No primary manifest recorded."}</span></td>
                            <td className="p-3 px-4 text-right">
                              <button onClick={() => { setSelectedCase(patient); setEmrSubTab("history"); }} className="px-3 py-1.5 bg-[#10B981] hover:bg-[#0d9a6e] text-white font-mono font-bold text-[10px] uppercase tracking-wider rounded-lg transition flex items-center gap-1 ml-auto">
                                <Eye size={12} /> Bind
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {(() => {
                    const totalPages = Math.max(1, Math.ceil(cases.length / queuePageSize));
                    const start = (queuePage - 1) * queuePageSize + 1;
                    const end = Math.min(queuePage * queuePageSize, cases.length);
                    return (
                      <div className="flex items-center justify-between bg-[#0a1510] border border-[#29323a] rounded-xl shadow-sm px-4 py-2.5">
                        <span className="text-[10px] font-mono text-[#94A3B8] font-bold uppercase tracking-wider">Showing {start} to {end} of {cases.length} entries</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setQueuePage((p) => Math.max(1, p - 1))} disabled={queuePage === 1} className="px-3 py-1.5 bg-[#152318] hover:bg-[#1e3a26] disabled:opacity-40 disabled:cursor-not-allowed text-[#94A3B8] border border-[#29323a] rounded text-[10px] font-mono font-bold flex items-center gap-1 transition">
                            <ChevronLeft size={12} /> Prev
                          </button>
                          <span className="text-[10px] font-mono text-[#94A3B8] font-bold">Page {queuePage} of {totalPages}</span>
                          <button onClick={() => setQueuePage((p) => Math.min(totalPages, p + 1))} disabled={queuePage === totalPages} className="px-3 py-1.5 bg-[#152318] hover:bg-[#1e3a26] disabled:opacity-40 disabled:cursor-not-allowed text-[#94A3B8] border border-[#29323a] rounded text-[10px] font-mono font-bold flex items-center gap-1 transition">
                            Next <ChevronRight size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}

          {selectedCase && activeTab === "consultationQueue" && (
            <div className="bg-[#0a1510] border border-[#29323a] rounded-xl shadow-md overflow-hidden animate-fadeIn text-white">
              {/* EMR Context Banner */}
              <div className="p-3.5 bg-[#0E1B17] text-white flex justify-between items-center font-mono border-b border-[#29323a]">
                <div>
                  <span className="text-[9px] font-black tracking-widest text-[#10B981] block uppercase">ACTIVE CASE CONTEXT ROUTED</span>
                  <h2 className="text-[13px] font-black text-white mt-0.5 tracking-tight uppercase">{selectedCase.patientName}</h2>
                </div>
                <div className="text-right text-[10px] text-[#94A3B8]">
                  <span>MRN ID Node: <strong className="text-white">{selectedCase.cardId}</strong> | Gender/Age: <strong className="text-white">{selectedCase.gender || "N/A"}, {selectedCase.age || "N/A"} Yrs</strong></span>
                </div>
              </div>

              {/* Sub-tab navigation */}
              <div className="bg-[#0E1B17] text-[#94A3B8] border-b border-[#29323a] p-1 flex select-none font-mono text-[11px] font-bold uppercase tracking-wider flex-wrap">
                {[
                  { key: "history", icon: <FileText size={13} />, label: "Patient History Matrix" },
                  { key: "nurse", icon: <UserPlus size={13} />, label: "Nursing Coordination" },
                  { key: "laboratory", icon: <FlaskConical size={13} />, label: "Laboratory Core Diagnostics", dot: selectedCase.laboratory },
                  { key: "radiology", icon: <Activity size={13} />, label: "Ultrasound Imaging Module", dot: selectedCase.radiology },
                  { key: "pharmacy", icon: <Pill size={13} />, label: "Pharmacy Formulary Order", dot: selectedCase.pharmacy },
                  { key: "liaison", icon: <Bed size={13} />, label: "Liaison & Admission" },
                ].map(({ key, icon, label, dot }) => (
                  <button key={key} onClick={() => setEmrSubTab(key)}
                    className={`px-4 py-2 rounded transition flex items-center gap-1.5 ${emrSubTab === key ? "bg-[#10B981]/20 text-[#10B981] border-b-2 border-[#10B981]" : "hover:bg-[#152318] hover:text-white"}`}>
                    <span className={emrSubTab === key ? "text-[#10B981]" : ""}>{icon}</span>
                    {label}
                    {dot && <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping ml-1"></span>}
                  </button>
                ))}
              </div>

              {/* Pipeline status strip */}
              <div className="bg-[#0E1B17] px-4 py-2 border-b border-[#29323a] flex items-center gap-4 text-[10px] font-mono text-[#94A3B8]">
                <span className="font-bold uppercase text-[#94A3B8]">Active Pipeline Track:</span>
                {[
                  { label: "Lab", active: selectedCase.laboratory, activeText: "Processing in Lab Node" },
                  { label: "Ultrasound", active: selectedCase.radiology, activeText: "Active Scan Loop Queue" },
                  { label: "Pharmacy", active: selectedCase.pharmacy, activeText: "Awaiting Dispense Dispatch" },
                ].map(({ label, active, activeText }) => (
                  <div key={label} className="flex items-center gap-1">
                    <span>{label}:</span>
                    <span className={`px-1.5 py-0.5 rounded font-bold uppercase text-[9px] ${active ? "bg-[#10B981]/20 text-[#10B981]" : "bg-[#29323a] text-[#94A3B8]"}`}>
                      {active ? activeText : "Idle"}
                    </span>
                  </div>
                ))}
              </div>

              {/* SUB-TAB ROUTING VIEWS */}
              <div className="p-5 min-h-[350px]">
                {/* SUB-VIEW 1: PATIENT CLINICAL HISTORY & FORMS */}
                {emrSubTab === "history" && (
                  <div className="space-y-4 animate-fadeIn">
                    {/* Current Encounter Clinical Form */}
                    <form onSubmit={savePatientHistoryCoreForm} className="space-y-4">
                      <div className="bg-[#f4f7f5] border border-[#e2eae4] rounded-lg p-3">
                        <h4 className="font-mono font-bold text-[#1e3a8a] text-[11px] uppercase tracking-wider mb-1.5">
                          Baseline Intake Presentation Parameters
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px]">
                          <div>
                            <strong className="text-slate-500 font-mono uppercase">
                              Chief Complaint:
                            </strong>{" "}
                            {selectedCase.chiefComplaint || "No complaint recorded."}
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
                            className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg p-2 text-[11px] text-slate-900 focus:outline-none focus:border-slate-500 font-mono"
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
                            className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg p-2 text-[11px] text-slate-900 focus:outline-none focus:border-slate-500 font-mono"
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
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] text-slate-900 focus:outline-none focus:border-slate-500 font-mono"
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
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] text-slate-900 focus:outline-none focus:border-slate-500 font-mono"
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
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] text-slate-900 focus:outline-none focus:border-slate-500 font-mono"
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
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[11px] focus:outline-none focus:border-[#3b82f6] font-mono font-bold text-slate-900"
                          placeholder="e.g., Type 2 Diabetes Mellitus (5A11) / Essential Hypertension (1B40)"
                        />
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-[#1e3a8a] hover:bg-[#163f24] text-white font-mono font-bold text-[10px] uppercase tracking-wider rounded transition flex items-center gap-1"
                        >
                          Commit Local Forms State
                        </button>
                      </div>
                    </form>

                    {/* ── PAST HISTORY FILE ARCHIVE ── */}
                    <div className="border-t border-slate-200 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Folder size={15} className="text-[#3b82f6]" />
                          <h4 className="font-mono font-black text-[11px] text-slate-700 uppercase tracking-wider">
                            Past Encounter History Archive
                          </h4>
                          {patientHistory.length > 0 && (
                            <span className="bg-[#1e3a8a] text-white text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">
                              {patientHistory.length} FILE{patientHistory.length !== 1 ? "S" : ""}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => fetchPatientHistory(true)}
                          disabled={historyLoading}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition disabled:opacity-50"
                        >
                          <RefreshCw size={10} className={historyLoading ? "animate-spin" : ""} />
                          {historyLoading ? "Loading..." : "Refresh"}
                        </button>
                      </div>

                      {historyError && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-lg px-3 py-2 text-[10px] font-mono font-bold mb-3">
                          {historyError}
                        </div>
                      )}

                      {historyLoading && patientHistory.length === 0 ? (
                        <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px] py-6 justify-center">
                          <RefreshCw size={13} className="animate-spin" />
                          Retrieving history archive from database...
                        </div>
                      ) : patientHistory.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                          <Folder size={32} className="mx-auto mb-2 text-slate-300" />
                          <p className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                            No Previous Encounter Records Found
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            This patient has no archived history files in the system.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {patientHistory.map((record, idx) => (
                            <button
                              key={record._id || idx}
                              type="button"
                              onClick={() => setHistoryDetailView(record)}
                              className="w-full text-left bg-white border border-slate-200 hover:border-[#3b82f6] hover:shadow-md rounded-xl p-3.5 transition group"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 min-w-0">
                                  {/* File icon */}
                                  <div className="shrink-0 mt-0.5 w-9 h-9 rounded-lg bg-[#eff6ff] border border-[#bfdbfe] flex items-center justify-center group-hover:bg-[#dbeafe] transition">
                                    <FileText size={16} className="text-[#3b82f6]" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-mono font-black text-[11px] text-slate-800 truncate">
                                      {record.icd11Diagnosis || "Encounter Record"}
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                                      {record.doctorName || "Unknown Physician"} &nbsp;·&nbsp;
                                      {record.hpi
                                        ? record.hpi.substring(0, 80) + (record.hpi.length > 80 ? "..." : "")
                                        : "No HPI documented."}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                      {record.labRequests?.length > 0 && (
                                        <span className="text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-100 px-1.5 py-0.5 rounded font-mono uppercase">
                                          Lab: {record.labRequests.length} test{record.labRequests.length !== 1 ? "s" : ""}
                                        </span>
                                      )}
                                      {record.prescriptions?.length > 0 && (
                                        <span className="text-[9px] font-bold bg-orange-50 text-orange-700 border border-orange-100 px-1.5 py-0.5 rounded font-mono uppercase">
                                          Rx: {record.prescriptions.length} drug{record.prescriptions.length !== 1 ? "s" : ""}
                                        </span>
                                      )}
                                      {(record.radiologyRequest?.region || record.radiologyRequest?.regions) && (
                                        <span className="text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded font-mono uppercase">
                                          Imaging: {record.radiologyRequest.regions 
                                            ? record.radiologyRequest.regions.join(", ")
                                            : record.radiologyRequest.region}
                                        </span>
                                      )}
                                      {record.nurseData?.assignedNurseName && (
                                        <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded font-mono uppercase">
                                          Nurse: {record.nurseData.assignedNurseName}
                                        </span>
                                      )}
                                      {record.liaisonData?.preferredWard && (
                                        <span className="text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded font-mono uppercase">
                                          Ward: {record.liaisonData.preferredWard}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="shrink-0 text-right">
                                  <p className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                                    {record.timestamp
                                      ? new Date(record.timestamp).toLocaleDateString("en-GB", {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                        })
                                      : "N/A"}
                                  </p>
                                  <ChevronRight size={14} className="text-slate-400 group-hover:text-[#3b82f6] mt-1 ml-auto transition" />
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SUB-VIEW 2: LABORATORY DISPATCH UTILITY GROUPING GRID */}
                {emrSubTab === "laboratory" && (
                  <div className="space-y-4 animate-fadeIn">
                  <form
                    onSubmit={handleLaboratorySubmission}
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
                                  className="mt-0.5 rounded text-[#3b82f6] focus:ring-[#3b82f6]"
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

                    {/* Clinical Summary / Notes */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                        Clinical Summary & Lab Indication
                      </label>
                      <textarea
                        rows="4"
                        value={laboratoryForm.clinicalSummary}
                        onChange={(e) =>
                          setLaboratoryForm((prev) => ({
                            ...prev,
                            clinicalSummary: e.target.value,
                          }))
                        }
                        placeholder="Document clinical context, symptoms, suspected diagnosis, and rationale for requested tests..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-[11px] text-slate-800 focus:outline-none focus:border-slate-600 focus:ring-2 focus:ring-slate-200 font-mono leading-relaxed"
                      />
                      <p className="text-[9px] text-slate-500 font-mono">
                        Provide clinical context to help laboratory staff prioritize and interpret results
                      </p>
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

                  </div>
                )}

                {/* SUB-VIEW 3: RADIOLOGY / ULTRASOUND REQUEST MATRIX INTERFACES */}
                {emrSubTab === "radiology" && (
                  <div className="space-y-4 animate-fadeIn">
                  <form
                    onSubmit={handleRadiologySubmission}
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

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Target Anatomical Regions / Protocols (Select Multiple)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-64 overflow-y-auto">
                        {ultrasoundModalityRegistry.map((mode, idx) => (
                          <label
                            key={idx}
                            className="flex items-center gap-2 text-[11px] text-slate-700 font-mono cursor-pointer hover:bg-white p-2 rounded transition"
                          >
                            <input
                              type="checkbox"
                              checked={selectedRegions[mode] || false}
                              onChange={(e) =>
                                setSelectedRegions((prev) => ({
                                  ...prev,
                                  [mode]: e.target.checked,
                                }))
                              }
                              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                            />
                            <span className="font-medium">{mode}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
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

                  </div>
                )}

                {/* SUB-VIEW 4: PHARMACY DISPENSATION WITH OUT-OF-STOCK HIGHLIGHTING */}
                {emrSubTab === "pharmacy" && (
                  <div className="space-y-4 animate-fadeIn">
                  <form
                    onSubmit={handlePharmacySubmission}
                  >
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Formulate New Medication Prescription Line
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-[9px] font-mono font-bold text-slate-700 uppercase mb-1">
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
                            className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] text-slate-900 font-mono focus:outline-none focus:border-blue-500"
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
                          <label className="block text-[9px] font-mono font-bold text-slate-700 uppercase mb-1">
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
                            className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                            placeholder="e.g., 500mg, 10ml, 1 Puff"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                        <div>
                          <label className="block text-[9px] font-mono font-bold text-slate-700 uppercase mb-1">
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
                            className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                          >
                            <option>Once Daily (OD)</option>
                            <option>Twice Daily (BD)</option>
                            <option>Three Times Daily (TDS)</option>
                            <option>Four Times Daily (QDS)</option>
                            <option>As Required (PRN)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] font-mono font-bold text-slate-700 uppercase mb-1">
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
                            className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                            placeholder="e.g., 7 Days, 1 Month"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={queuePharmacyMedication}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 border border-emerald-500 text-white font-mono font-bold text-[10px] uppercase tracking-wider rounded transition"
                        >
                          Commit Line Item Entry
                        </button>
                      </div>
                    </div>

                    {/* Render Formatted Prescriptions with Crimson Warnings */}
                    <div className="border border-slate-200 rounded-xl bg-white p-3 font-mono text-[11px]">
                      <div className="text-slate-700 font-bold uppercase text-[9px] mb-2 border-b border-slate-100 pb-1 font-mono">
                        Queued Pharmacy Dispatches Basket Matrix:
                      </div>
                      {selectedDrugs.length === 0 ? (
                        <span className="text-slate-600 text-[10px] font-mono">
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

                  </div>
                )}

                {/* SUB-VIEW: NURSE COORDINATION (bridges to Nursing Station) */}
                {emrSubTab === "nurse" && (
                  <div className="space-y-4 animate-fadeIn">
                    {/* Patient context strip */}
                    <div className="bg-[#0c1f17] text-slate-200 border border-emerald-800/40 rounded-xl p-3 flex items-center justify-between font-mono">
                      <div className="flex items-center gap-2 text-[11px]">
                        <UserPlus size={14} className="text-emerald-400" />
                        <span className="uppercase tracking-wider text-slate-400 text-[9px]">
                          Nursing Target:
                        </span>
                        {selectedCase ? (
                          <span className="font-bold text-white">
                            {selectedCase.patientName}{" "}
                            <span className="text-slate-400">
                              ({selectedCase.cardId})
                            </span>
                          </span>
                        ) : (
                          <span className="text-amber-400">
                            No patient card locked
                          </span>
                        )}
                      </div>
                      {selectedCase && (
                        <span className="text-[10px] text-slate-400">
                          {selectedCase.age}Y / {selectedCase.gender}
                        </span>
                      )}
                    </div>

                    {!selectedCase && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-3 text-[11px] font-bold uppercase tracking-wide">
                        Bind an EMR context interface from the Active Consult
                        Queue to coordinate nursing care.
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* CURRENT NURSE ASSIGNMENT STATUS */}
                      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                        <h4 className="flex items-center gap-2 text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
                          <UserPlus size={14} className="text-emerald-500" /> Nurse
                          Assignment Status
                        </h4>
                        <div className="space-y-2 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-slate-500 uppercase font-bold">
                              Assigned Nurse
                            </span>
                            <span className="font-bold text-slate-800">
                              {selectedCase?.assignedNurseName ||
                                "Not yet assigned"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 uppercase font-bold">
                              Recommended Nurse
                            </span>
                            <span className="font-bold text-slate-800">
                              {recommendedNurse
                                ? `${recommendedNurse.nurseName} (${recommendedNurse.department})`
                                : "—"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 uppercase font-bold">
                              Acknowledged
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                selectedCase?.nurseAccepted
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {selectedCase?.nurseAccepted
                                ? "Accepted"
                                : "Awaiting"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 uppercase font-bold text-[10px]">
                              Nurse Response
                            </span>
                            <p className="text-slate-700 mt-0.5">
                              {selectedCase?.nurseResponse ||
                                "No response recorded yet."}
                            </p>
                          </div>
                          {selectedCase?.doctorInstructions && (
                            <div>
                              <span className="text-slate-500 uppercase font-bold text-[10px]">
                                Current Instructions On File
                              </span>
                              <p className="text-slate-700 mt-0.5 whitespace-pre-wrap">
                                {selectedCase.doctorInstructions}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* DISPATCH CARE INSTRUCTIONS */}
                      <form
                        onSubmit={submitNurseInstructions}
                        className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
                      >
                        <h4 className="flex items-center gap-2 text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
                          <Send size={14} className="text-emerald-500" /> Dispatch
                          Care Instructions
                        </h4>

                        {/* Department and Nurse Selection */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                              Select Department
                            </label>
                            <select
                              value={nurseForm.selectedDepartment}
                              onChange={(e) => {
                                setNurseForm((p) => ({
                                  ...p,
                                  selectedDepartment: e.target.value,
                                  selectedNurse: "", // Reset nurse when dept changes
                                }));
                              }}
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-[11px] text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                              required
                            >
                              <option value="">-- Select Department --</option>
                              {nurseDepartments.map((dept) => (
                                <option key={dept} value={dept}>
                                  {dept}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                              Select Nurse
                            </label>
                            <select
                              value={nurseForm.selectedNurse}
                              onChange={(e) =>
                                setNurseForm((p) => ({
                                  ...p,
                                  selectedNurse: e.target.value,
                                }))
                              }
                              disabled={!nurseForm.selectedDepartment}
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-[11px] text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 disabled:opacity-50 disabled:cursor-not-allowed"
                              required
                            >
                              <option value="">-- Select Nurse --</option>
                              {availableNurses.map((nurse) => (
                                <option key={nurse._id || nurse.name} value={nurse.name}>
                                  {nurse.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Care Plan / Orders
                          </label>
                          <textarea
                            rows={3}
                            value={nurseForm.carePlan}
                            onChange={(e) =>
                              setNurseForm((p) => ({
                                ...p,
                                carePlan: e.target.value,
                              }))
                            }
                            placeholder="Care plan summary..."
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-[11px] text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Doctor Instructions to Nursing
                          </label>
                          <textarea
                            rows={3}
                            value={nurseForm.doctorInstructions}
                            onChange={(e) =>
                              setNurseForm((p) => ({
                                ...p,
                                doctorInstructions: e.target.value,
                              }))
                            }
                            placeholder="Specific nursing instructions (meds, obs, vitals)..."
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-[11px] text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Care Status
                          </label>
                          <select
                            value={nurseForm.status}
                            onChange={(e) =>
                              setNurseForm((p) => ({
                                ...p,
                                status: e.target.value,
                              }))
                            }
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-[11px] text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                          >
                            <option value="Pending Meds">Pending Meds</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Stable">Stable</option>
                            <option value="Critical">Critical</option>
                            <option value="Observation">Observation</option>
                          </select>
                        </div>
                        {nurseMessage && (
                          <div
                            className={`text-[10px] font-bold uppercase tracking-wide px-3 py-2 rounded-lg ${
                              nurseMessage.includes("transmitted")
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {nurseMessage}
                          </div>
                        )}
                        <div className="flex justify-end pt-1">
                          <button
                            type="submit"
                            disabled={nurseSubmitting || !selectedCase}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-[10px] uppercase tracking-widest rounded transition flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                          >
                            {nurseSubmitting
                              ? "Transmitting..."
                              : "Dispatch to Nursing Station"}{" "}
                            <Send size={12} />
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* NURSING STATION LINK NOTE */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Activity size={13} className="text-emerald-500" /> Nursing
                        Station Link
                      </h4>
                      <p className="text-[11px] text-slate-600">
                        Dispatched instructions create / update the patient's
                        Nurse Assignment on the Nursing Station. The assigned
                        nurse acknowledges via the Nurse page, and acceptance
                        status reflects back here on the next EMR sync.
                      </p>
                    </div>
                  </div>
                )}

                {/* SUB-VIEW 5: LIAISON & ADMISSION COORDINATION */}
                {emrSubTab === "liaison" && (
                  <div className="space-y-4 animate-fadeIn">
                    {/* Patient context strip */}
                    <div className="bg-[#0f1729] text-slate-200 border border-[#1e3a8a]/40 rounded-xl p-3 flex items-center justify-between font-mono">
                      <div className="flex items-center gap-2 text-[11px]">
                        <Bed size={14} className="text-[#3b82f6]" />
                        <span className="uppercase tracking-wider text-slate-400 text-[9px]">
                          Liaison Target:
                        </span>
                        {selectedCase ? (
                          <span className="font-bold text-white">
                            {selectedCase.patientName}{" "}
                            <span className="text-slate-400">
                              ({selectedCase.cardId})
                            </span>
                          </span>
                        ) : (
                          <span className="text-amber-400">
                            No patient card locked
                          </span>
                        )}
                      </div>
                      {selectedCase && (
                        <span className="text-[10px] text-slate-400">
                          {selectedCase.age}Y / {selectedCase.gender}
                        </span>
                      )}
                    </div>

                    {!selectedCase && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-3 text-[11px] font-bold uppercase tracking-wide">
                        Bind an EMR context interface from the Active Consult
                        Queue to raise ward admission or transfer requests.
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* WARD ADMISSION REQUEST */}
                      <form
                        onSubmit={submitWardAdmission}
                        className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
                      >
                        <h4 className="flex items-center gap-2 text-[12px] font-mono font-black text-[#1e40af] uppercase tracking-wider border-b-2 border-blue-200 pb-2 mb-3">
                          <Bed size={16} className="text-[#3b82f6]" /> Ward Admission Request
                          <span className="ml-auto text-[9px] bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-2.5 py-1 rounded-full font-bold shadow-sm">
                            ✓ AUTO-SAVE ENABLED
                          </span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-mono font-black text-slate-700 uppercase tracking-wider mb-1.5">
                              Ward Department
                            </label>
                            <select
                              value={liaisonForm.selectedDepartment}
                              onChange={(e) => {
                                setLiaisonForm((p) => ({
                                  ...p,
                                  selectedDepartment: e.target.value,
                                  selectedWardNurse: "", // Reset nurse when department changes
                                }));
                              }}
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-[11px] text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/40 font-mono"
                            >
                              <option value="">-- Select Ward Department --</option>
                              {wardDepartments.map((dept) => (
                                <option key={dept} value={dept}>
                                  {dept}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-[10px] font-mono font-black text-slate-700 uppercase tracking-wider mb-1.5">
                              Assign Ward Nurse
                            </label>
                            <select
                              value={liaisonForm.selectedWardNurse}
                              onChange={(e) =>
                                setLiaisonForm((p) => ({
                                  ...p,
                                  selectedWardNurse: e.target.value,
                                }))
                              }
                              disabled={!liaisonForm.selectedDepartment || wardNurses.length === 0}
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-[11px] text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/40 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="">
                                {!liaisonForm.selectedDepartment
                                  ? "Select department first"
                                  : wardNurses.length === 0
                                  ? "No nurses available"
                                  : "-- Select Ward Nurse --"}
                              </option>
                              {wardNurses.map((nurse) => (
                                <option key={nurse._id} value={nurse.name}>
                                  {nurse.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono font-black text-slate-700 uppercase tracking-wider mb-1.5">
                            Admission Urgency
                          </label>
                          <select
                            value={liaisonForm.admissionUrgency}
                            onChange={(e) =>
                              setLiaisonForm((p) => ({
                                ...p,
                                admissionUrgency: e.target.value,
                              }))
                            }
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-[11px] text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/40 font-mono"
                          >
                            <option value="Routine">Routine</option>
                            <option value="Priority">Priority</option>
                            <option value="Emergent">Emergent</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono font-black text-slate-700 uppercase tracking-wider mb-1.5">
                            Clinical Admission Indication
                          </label>
                          <textarea
                            rows={3}
                            value={liaisonForm.clinicalReason}
                            onChange={(e) =>
                              setLiaisonForm((p) => ({
                                ...p,
                                clinicalReason: e.target.value,
                              }))
                            }
                            placeholder="Reason for inpatient admission..."
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-[11px] text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/40 font-mono"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-mono font-black text-slate-700 uppercase tracking-wider mb-1.5">
                              Admit Date
                            </label>
                            <input
                              type="date"
                              value={liaisonForm.admissionDate}
                              onChange={(e) =>
                                setLiaisonForm((p) => ({
                                  ...p,
                                  admissionDate: e.target.value,
                                }))
                              }
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-[11px] text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/40 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono font-black text-slate-700 uppercase tracking-wider mb-1.5">
                              Est. Discharge
                            </label>
                            <input
                              type="date"
                              value={liaisonForm.dischargeDate}
                              onChange={(e) =>
                                setLiaisonForm((p) => ({
                                  ...p,
                                  dischargeDate: e.target.value,
                                }))
                              }
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-[11px] text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/40 font-mono"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Medication Intake (Ongoing)
                          </label>
                          <select
                            value={liaisonForm.medicationIntake}
                            onChange={(e) =>
                              setLiaisonForm((p) => ({
                                ...p,
                                medicationIntake: e.target.value,
                              }))
                            }
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-[11px] text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/40 font-mono"
                          >
                            <option value="">-- Select Medication --</option>
                            {masterPharmacyFormulary.map((med) => (
                              <option key={med.id} value={med.name}>
                                {med.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        {liaisonMessage && (
                          <div
                            className={`text-[10px] font-bold uppercase tracking-wide px-3 py-2 rounded-lg ${
                              liaisonMessage.includes("transmitted")
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {liaisonMessage}
                          </div>
                        )}
                        <div className="flex justify-end pt-1">
                          <button
                            type="submit"
                            disabled={liaisonSubmitting || !selectedCase}
                            className="px-4 py-2 bg-[#1e3a8a] hover:bg-[#1d4ed8] text-white font-mono font-bold text-[10px] uppercase tracking-widest rounded transition flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                          >
                            {liaisonSubmitting
                              ? "Transmitting..."
                              : "Transmit to Ward Hub"}{" "}
                            <Send size={12} />
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* WARD AVAILABILITY SUMMARY (Ward Management link) */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Bed size={13} className="text-[#3b82f6]" /> Live Ward Bed
                        Capacity (Ward Management Link)
                      </h4>
                      {wardBeds.length === 0 ? (
                        <p className="text-[11px] text-slate-400">
                          No ward inventory streamed. Confirm Ward node
                          connectivity.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                          {Object.entries(
                            wardBeds.reduce((acc, b) => {
                              const key =
                                b.room || b.ward || b.type || "Unassigned";
                              if (!acc[key])
                                acc[key] = { total: 0, available: 0 };
                              acc[key].total += 1;
                              if (b.status !== "Occupied")
                                acc[key].available += 1;
                              return acc;
                            }, {}),
                          ).map(([ward, info]) => (
                            <div
                              key={ward}
                              className="border border-slate-200 rounded-lg p-2 text-center"
                            >
                              <p className="text-[10px] font-bold text-slate-700 uppercase truncate">
                                {ward}
                              </p>
                              <p
                                className={`text-[11px] font-black ${
                                  info.available > 0
                                    ? "text-emerald-600"
                                    : "text-rose-600"
                                }`}
                              >
                                {info.available}/{info.total} free
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ACTIVE ADMISSION TRANSMISSION STATUS (mirrors Ward Admission Hub) */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Activity size={13} className="text-[#3b82f6]" /> Active
                        Admission Transmission Status
                      </h4>
                      {patientAdmissionRequests.length === 0 ? (
                        <p className="text-[11px] text-slate-400">
                          No pending admission or transfer requests for this
                          patient in the Ward pipeline.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {patientAdmissionRequests.map((r) => (
                            <div
                              key={r._id}
                              className="flex items-center justify-between border border-slate-100 rounded-lg px-3 py-2"
                            >
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-slate-800">
                                  {r.preferredWard}
                                </p>
                                <p className="text-[10px] text-slate-500 truncate max-w-md">
                                  {r.clinicalReason}
                                </p>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  r.status === "Assigned"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : r.status === "Cancelled"
                                      ? "bg-rose-100 text-rose-700"
                                      : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {r.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* RETURN CARD FOOTER */}
              <div className="p-4 bg-[#0E1B17] border-t border-[#29323a] flex justify-between items-center">
                <p className="text-[10px] font-mono text-[#94A3B8] max-w-md">
                  Closing this medical envelope saves current configuration states onto the primary reception grid layer, releasing operational workspace block locks.
                </p>
                <button type="button" onClick={executeReturnCardToReception}
                  className="px-5 py-2.5 bg-[#10B981] hover:bg-[#0d9a6e] text-white font-mono font-bold text-[11px] uppercase tracking-widest rounded-lg transition shadow-md flex items-center gap-1.5">
                  <ClipboardCheck size={14} /> Return Card to Reception Cluster Node
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

              {auditLogs.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Total Entries</span>
                    <span className="text-lg font-black text-slate-900 font-mono">{auditStats.total}</span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                    <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider block">Success</span>
                    <span className="text-lg font-black text-emerald-700 font-mono">{auditStats.success}</span>
                  </div>
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                    <span className="text-[9px] font-bold text-rose-700 uppercase tracking-wider block">Failed</span>
                    <span className="text-lg font-black text-rose-700 font-mono">{auditStats.failed}</span>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                    <span className="text-[9px] font-bold text-blue-700 uppercase tracking-wider block">Modules Hit</span>
                    <span className="text-lg font-black text-blue-700 font-mono">{Object.keys(auditStats.modules).length}</span>
                  </div>
                </div>
              )}

              {auditLogs.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.entries(auditStats.byAction).map(([action, count]) => (
                    <span key={action} className={`px-2 py-1 rounded text-[9px] font-bold uppercase border ${
                      action === "CREATE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      action === "UPDATE" ? "bg-blue-50 text-blue-700 border-blue-200" :
                      action === "DELETE" ? "bg-rose-50 text-rose-700 border-rose-200" :
                      "bg-slate-100 text-slate-700 border-slate-200"
                    }`}>
                      {action}: {count}
                    </span>
                  ))}
                </div>
              )}

              {auditLogs.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.entries(auditStats.modules).map(([module, count]) => (
                    <span key={module} className="px-2 py-1 rounded text-[9px] font-bold uppercase border bg-amber-50 text-amber-700 border-amber-200">
                      {module}: {count}
                    </span>
                  ))}
                </div>
              )}

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
                <>
                  <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                    {auditLogs.slice((auditPage - 1) * auditPageSize, auditPage * auditPageSize).map((log, index) => (
                      <div
                        key={log._id || index}
                        className="p-3 bg-slate-50 border border-slate-100 rounded-lg font-mono text-[11px] text-slate-600 hover:bg-slate-100 transition"
                      >
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1.5">
                          <span className="text-slate-500 text-[10px]">
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : "RECENT"}
                          </span>
                          <span className="text-slate-900 font-bold uppercase text-[10px] bg-slate-200 px-1.5 py-0.5 rounded">
                            {log.action || "EMR_MODIFICATION"}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            log.status === "SUCCESS" || log.status === "OK" ? "bg-emerald-100 text-emerald-700" :
                            log.status === "FAILED" || log.status === "ERROR" ? "bg-rose-100 text-rose-700" :
                            "bg-blue-100 text-blue-700"
                          }`}>
                            {log.status || "SUCCESS"}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500">
                          <span className="font-bold text-slate-700">Operator:</span>
                          <span>{log.performedBy || log.userName || doctorInfo.name}</span>
                          {(log.userRole || log.department) && (
                            <>
                              {(log.userRole || log.department) && <span className="text-slate-400">|</span>}
                              {log.userRole && <span className="uppercase">{log.userRole}</span>}
                              {log.department && <span className="text-slate-400">({log.department})</span>}
                            </>
                          )}
                        </div>
                        {(log.targetType || log.targetId) && (
                          <div className="text-[10px] text-slate-500 mt-1">
                            <span className="font-bold text-slate-700">Target:</span>{" "}
                            {log.targetType && <span className="uppercase">{log.targetType}</span>}
                            {log.targetId && <span className="text-slate-400">[{log.targetId}]</span>}
                          </div>
                        )}
                        {log.details && (
                          <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">{log.details}</p>
                        )}
                        {log.ipAddress && (
                          <div className="text-[9px] text-slate-400 mt-1 font-mono">IP: {log.ipAddress}</div>
                        )}
                      </div>
                    ))}
                  </div>

                  {(() => {
                    const totalPages = Math.max(1, Math.ceil(auditLogs.length / auditPageSize));
                    const start = (auditPage - 1) * auditPageSize + 1;
                    const end = Math.min(auditPage * auditPageSize, auditLogs.length);
                    return (
                      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl shadow-sm px-4 py-2.5 mt-4">
                        <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                          Showing {start} to {end} of {auditLogs.length} entries
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                            disabled={auditPage === 1}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 border border-slate-200 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition"
                          >
                            <ChevronLeft size={12} /> Prev
                          </button>
                          <span className="text-[10px] font-mono text-slate-600 font-bold">
                            Page {auditPage} of {totalPages}
                          </span>
                          <button
                            onClick={() => setAuditPage((p) => Math.min(totalPages, p + 1))}
                            disabled={auditPage === totalPages}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 border border-slate-200 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition"
                          >
                            Next <ChevronRight size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}

          {/* VIEW: EMERGENCY CRITICAL CARE HUB */}
          {activeTab === "emergencyHub" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                  STAT Emergency Interception Queue
                </span>
                <button
                  onClick={fetchCases}
                  className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-200 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition"
                >
                  <RefreshCw size={11} /> Refresh
                </button>
              </div>

              {emergencyCases.length === 0 ? (
                <div className="text-center py-12 bg-white border border-rose-200 rounded-xl">
                  <Zap size={40} className="mx-auto mb-3 text-rose-300 opacity-50" />
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">No emergency cases intercepted</p>
                </div>
              ) : (
                <div className="bg-white border border-rose-200 rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-rose-50 border-b border-rose-200 text-[10px] font-bold uppercase text-rose-700 font-mono">
                        <th className="p-3 px-4">Patient</th>
                        <th className="p-3 px-4">MRN Token</th>
                        <th className="p-3 px-4">Triage Category</th>
                        <th className="p-3 px-4">Status</th>
                        <th className="p-3 px-4 text-center">BP</th>
                        <th className="p-3 px-4 text-center">PR</th>
                        <th className="p-3 px-4 text-center">Temp</th>
                        <th className="p-3 px-4">Age/Sex</th>
                        <th className="p-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-100 text-[11px] text-slate-700">
                      {emergencyCases.map((patient) => (
                        <tr
                          key={patient.cardId || patient._id}
                          className="hover:bg-rose-50/60 transition"
                        >
                          <td className="p-3 px-4 font-bold text-slate-900">
                            {patient.patientName}
                          </td>
                          <td className="p-3 px-4 font-mono text-rose-600 font-bold">
                            {patient.cardId}
                          </td>
                          <td className="p-3 px-4">
                            <span className="text-[9px] font-mono font-bold bg-rose-600 text-white px-2 py-0.5 rounded uppercase animate-pulse">
                              {patient.triage?.triageCategory || patient.admissionType || "EMERGENCY"}
                            </span>
                          </td>
                          <td className="p-3 px-4">
                            <span className="text-[9px] font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded uppercase">
                              {patient.currentStatus || "OPD TRIAGE"}
                            </span>
                          </td>
                          <td className="p-3 px-4 text-center font-mono">
                            {patient.triage?.bloodPressure || "N/A"}
                          </td>
                          <td className="p-3 px-4 text-center font-mono">
                            {patient.triage?.heartRate
                              ? `${patient.triage.heartRate}m`
                              : "N/A"}
                          </td>
                          <td className="p-3 px-4 text-center font-mono">
                            {patient.triage?.temperature
                              ? `${patient.triage.temperature}°C`
                              : "N/A"}
                          </td>
                          <td className="p-3 px-4 font-mono">
                            {patient.age}Y/
                            {patient.gender?.substring(0, 1)}
                          </td>
                          <td className="p-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedCase(patient);
                                setEmrSubTab("history");
                                setActiveTab("consultationQueue");
                              }}
                              className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-mono font-bold text-[10px] uppercase tracking-wider rounded-lg transition flex items-center gap-1 ml-auto"
                            >
                              <Eye size={12} /> Intercept
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* VIEW: MY APPOINTMENTS */}
          {activeTab === "myAppointments" && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm animate-fadeIn">
              <div className="flex justify-between items-center mb-0 pb-2 border-b border-slate-100 font-mono px-4 pt-4">
                <h3 className="font-black text-[11px] text-slate-500 uppercase tracking-widest">
                  My Appointments Schedule
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchAppointments}
                    className="text-[10px] font-bold text-slate-500 hover:text-slate-800 uppercase tracking-wider transition"
                  >
                    <RefreshCw size={12} className="inline mr-1" /> Refresh
                  </button>
                </div>
              </div>

              <div className="flex border-b border-slate-200 bg-slate-100">
                <button
                  onClick={() => setAptSubTab("list")}
                  className={`px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition flex items-center gap-1.5 ${aptSubTab === "list" ? "bg-white text-slate-900 border-b-2 border-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"}`}
                >
                  <CalendarDays size={13} /> Appointments List
                </button>
                <button
                  onClick={() => setAptSubTab("create")}
                  className={`px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition flex items-center gap-1.5 ${aptSubTab === "create" ? "bg-white text-slate-900 border-b-2 border-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"}`}
                >
                  <Plus size={13} /> New Appointment
                </button>
              </div>

              <div className="p-4">
                {aptSubTab === "list" && (
                  <>
                    {appointmentsLoading ? (
                      <p className="text-[11px] font-mono text-slate-400 animate-pulse">Loading appointments...</p>
                    ) : appointments.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <CalendarDays size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="text-xs font-bold uppercase tracking-wider">No appointments scheduled</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500 font-mono">
                              <th className="p-3 px-4">Patient</th>
                              <th className="p-3 px-4">Card ID</th>
                              <th className="p-3 px-4">Department</th>
                              <th className="p-3 px-4">Date</th>
                              <th className="p-3 px-4">Time</th>
                              <th className="p-3 px-4">Reason</th>
                              <th className="p-3 px-4">Status</th>
                              <th className="p-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {appointments.map((apt) => (
                              <tr key={apt._id} className="hover:bg-slate-50/60 transition">
                                <td className="p-3 px-4 text-[11px] font-bold text-slate-800">{apt.patientName}</td>
                                <td className="p-3 px-4 text-[11px] font-mono text-slate-500">{apt.patientCardId}</td>
                                <td className="p-3 px-4 text-[11px] text-slate-600">{apt.department || "N/A"}</td>
                                <td className="p-3 px-4 text-[11px] font-mono text-slate-600">
                                  {apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleDateString() : "N/A"}
                                </td>
                                <td className="p-3 px-4 text-[11px] font-mono text-slate-600">{apt.appointmentTime || "N/A"}</td>
                                <td className="p-3 px-4 text-[11px] text-slate-500 max-w-[200px] truncate">{apt.reason || "N/A"}</td>
                                <td className="p-3 px-4">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                    apt.status === "Scheduled" ? "bg-blue-100 text-blue-700" : apt.status === "Completed" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                  }`}>
                                    {apt.status}
                                  </span>
                                </td>
                                <td className="p-3 px-4">
                                  <div className="flex items-center gap-2 justify-end">
                                    <button
                                      onClick={() => {
                                        setEditingAppointment(apt._id);
                                        setEditAptForm({
                                          appointmentDate: apt.appointmentDate ? apt.appointmentDate.split('T')[0] : '',
                                          appointmentTime: apt.appointmentTime || '',
                                          reason: apt.reason || '',
                                          status: apt.status || 'Scheduled'
                                        });
                                      }}
                                      className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-[9px] font-bold uppercase transition"
                                      title="Edit appointment"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteAppointment(apt._id)}
                                      className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded text-[9px] font-bold uppercase transition"
                                      title="Delete appointment"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* EDIT APPOINTMENT MODAL */}
                    {editingAppointment && (
                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                          <h3 className="text-[13px] font-bold text-slate-800 mb-4 uppercase tracking-wider">Edit Appointment</h3>
                          <form onSubmit={handleUpdateAppointment} className="space-y-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date</label>
                              <input
                                type="date"
                                value={editAptForm.appointmentDate}
                                onChange={(e) => setEditAptForm(p => ({...p, appointmentDate: e.target.value}))}
                                className="w-full border border-slate-300 rounded px-3 py-2 text-[11px]"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Time</label>
                              <input
                                type="time"
                                value={editAptForm.appointmentTime}
                                onChange={(e) => setEditAptForm(p => ({...p, appointmentTime: e.target.value}))}
                                className="w-full border border-slate-300 rounded px-3 py-2 text-[11px]"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Reason</label>
                              <textarea
                                value={editAptForm.reason}
                                onChange={(e) => setEditAptForm(p => ({...p, reason: e.target.value}))}
                                className="w-full border border-slate-300 rounded px-3 py-2 text-[11px] h-20"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status</label>
                              <select
                                value={editAptForm.status}
                                onChange={(e) => setEditAptForm(p => ({...p, status: e.target.value}))}
                                className="w-full border border-slate-300 rounded px-3 py-2 text-[11px]"
                              >
                                <option value="Scheduled">Scheduled</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </div>
                            {editAptMessage && (
                              <div className={`text-[10px] font-bold px-3 py-2 rounded ${editAptMessage.includes('success') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                {editAptMessage}
                              </div>
                            )}
                            <div className="flex gap-2 pt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingAppointment(null);
                                  setEditAptMessage('');
                                }}
                                className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-bold uppercase"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={editAptSubmitting}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold uppercase disabled:opacity-50"
                              >
                                {editAptSubmitting ? 'Saving...' : 'Save Changes'}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {aptSubTab === "create" && (
                  <form onSubmit={handleCreateAppointment} className="space-y-4 max-w-2xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Patient Name
                        </label>
                        <input
                          type="text"
                          value={aptForm.patientName}
                          onChange={(e) => setAptForm((p) => ({ ...p, patientName: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[11px] focus:outline-none focus:border-slate-500 font-mono"
                          placeholder="Enter patient full name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Patient Card ID
                        </label>
                        <input
                          type="text"
                          value={aptForm.patientCardId}
                          onChange={(e) => setAptForm((p) => ({ ...p, patientCardId: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[11px] focus:outline-none focus:border-slate-500 font-mono"
                          placeholder="e.g., MR-123456"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Appointment Date
                        </label>
                        <input
                          type="date"
                          value={aptForm.appointmentDate}
                          onChange={(e) => setAptForm((p) => ({ ...p, appointmentDate: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[11px] focus:outline-none focus:border-slate-500 font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Appointment Time
                        </label>
                        <input
                          type="time"
                          value={aptForm.appointmentTime}
                          onChange={(e) => setAptForm((p) => ({ ...p, appointmentTime: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[11px] focus:outline-none focus:border-slate-500 font-mono"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Department
                      </label>
                      <select
                        value={aptForm.department}
                        onChange={(e) => setAptForm((p) => ({ ...p, department: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[11px] focus:outline-none focus:border-slate-500 font-mono"
                      >
                        <option value="">-- Select Department --</option>
                        <option value="General Medicine">General Medicine</option>
                        <option value="Surgery">Surgery</option>
                        <option value="Pediatrics">Pediatrics</option>
                        <option value="Obstetrics & Gynecology">Obstetrics & Gynecology</option>
                        <option value="Cardiology">Cardiology</option>
                        <option value="Orthopedics">Orthopedics</option>
                        <option value="ENT">ENT</option>
                        <option value="Ophthalmology">Ophthalmology</option>
                        <option value="Dermatology">Dermatology</option>
                        <option value="Psychiatry">Psychiatry</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Reason / Notes
                      </label>
                      <textarea
                        value={aptForm.reason}
                        onChange={(e) => setAptForm((p) => ({ ...p, reason: e.target.value }))}
                        className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg p-2 text-[11px] focus:outline-none focus:border-slate-500 font-mono"
                        placeholder="Reason for appointment or clinical notes..."
                      />
                    </div>

                    {aptMessage && (
                      <div
                        className={`text-[10px] font-bold uppercase tracking-wide px-3 py-2 rounded-lg ${
                          aptMessage.includes("successfully")
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {aptMessage}
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={aptSubmitting}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-[10px] uppercase tracking-widest rounded transition flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                      >
                        {aptSubmitting ? "Saving..." : "Create Appointment"} <Send size={12} />
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
