import React, { useState, useEffect } from "react";
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
} from "lucide-react";

export default function DoctorPage({ onLogout }) {
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, consultationQueue, patientWorkspace
  const [selectedCase, setSelectedCase] = useState(null);
  const [assigningPatient, setAssigningPatient] = useState(null);
  const [assignedStation, setAssignedStation] = useState("NS-Alpha");
  const [carePlan, setCarePlan] = useState("");
  const [dispatching, setDispatching] = useState(false);
   const hospitalLogo = "/mesra icon.png";
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Doctor Active Caseload
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Completed Encounters Count
  const [completedEncountersCount, setCompletedEncountersCount] = useState(0);

  // Doctor Information
  const [doctorInfo, setDoctorInfo] = useState({
    name: "Loading...",
    specialty: "Loading...",
    department: "Loading...",
  });
  const [doctorLoading, setDoctorLoading] = useState(true);

  // Fetch doctor cases on component mount
  useEffect(() => {
    // Debug: Check what's in localStorage
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    console.log(
      "[DoctorPage] LocalStorage token:",
      storedToken ? "Present (length: " + storedToken.length + ")" : "Missing",
    );
    console.log(
      "[DoctorPage] LocalStorage user:",
      storedUser ? "Present" : "Missing",
    );

    const fetchCases = async () => {
      console.log(
        "[DoctorPage] Attempting to fetch cases with token:",
        storedToken
          ? "Present (first 10 chars: " + storedToken.substring(0, 10) + "..."
          : "Missing",
      );
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/doctor/cases`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          console.error(
            "[DoctorPage] Cases request failed with status:",
            response.status,
            "data:",
            errorData,
          );
          throw new Error(errorData.message || "Failed to fetch cases");
        }
        const data = await response.json();
        // Handle different possible response structures
        const casesData = data.data || data || [];
        setCases(casesData);
      } catch (err) {
        setError(err.message);
        console.error("[DoctorPage] Error fetching cases:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [API_URL]);

  // Fetch completed encounters count on component mount
  useEffect(() => {
    const fetchCompletedEncountersCount = async () => {
      try {
        const storedToken = localStorage.getItem("token");
        const response = await fetch(
          `${API_URL}/api/doctor/completed-encounters-count`,
          {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          },
        );
        if (!response.ok)
          throw new Error("Failed to fetch completed encounters count");
        const data = await response.json();
        setCompletedEncountersCount(data.count);
      } catch (err) {
        console.error("Error fetching completed encounters count:", err);
      }
    };

    fetchCompletedEncountersCount();
  }, [API_URL]);

  // Fetch doctor information on component mount
  useEffect(() => {
    // Debug: Check what's in localStorage
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    console.log(
      "Doctor info - LocalStorage token:",
      storedToken ? "Present (length: " + storedToken.length + ")" : "Missing",
    );
    console.log(
      "Doctor info - LocalStorage user:",
      storedUser ? "Present" : "Missing",
    );

    const fetchDoctorInfo = async () => {
      try {
        setDoctorLoading(true);
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          console.error(
            "Doctor info request failed with status:",
            response.status,
            "data:",
            errorData,
          );
          throw new Error(errorData.message || "Failed to fetch doctor info");
        }
        const data = await response.json();
        // data is { success: true, data: { ...user, staffProfile } }
        const userData = data.data;
        const staffProfile = userData.staffProfile;
        setDoctorInfo({
          name:
            userData.name ||
            (staffProfile ? staffProfile.name : "") ||
            "Dr. Unknown",
          specialty: staffProfile ? staffProfile.jobTitle : "MD",
          department: staffProfile ? staffProfile.dept : "Unknown Department",
        });
      } catch (err) {
        console.error("Error fetching doctor info:", err);
        // Fallback to default values if API fails
        setDoctorInfo({
          name: "Dr. Beza Kemal (MD)",
          specialty: "Internal Medicine",
          department: "Internal Med Ward",
        });
       } finally {
         setDoctorLoading(false);
       }
     };

     fetchDoctorInfo();
   }, [API_URL]);

   // Fetch selected patient data when selectedCase changes
   useEffect(() => {
     if (!selectedCase) return;

     const fetchSelectedPatient = async () => {
       try {
         const storedToken = localStorage.getItem("token");
         const response = await fetch(`${API_URL}/api/doctor/patient/${selectedCase._id}`, {
           headers: {
             Authorization: `Bearer ${storedToken}`,
           },
         });
         if (!response.ok) {
           const errorData = await response.json();
           console.error("Failed to fetch selected patient:", errorData);
           // Don't update state on error, keep the existing selectedCase
           return;
         }
         const data = await response.json();
         if (data.success) {
           // Update with fresh data from server
           setSelectedCase(data.data);
         }
       } catch (err) {
         console.error("Error fetching selected patient:", err);
       }
     };

     fetchSelectedPatient();
   }, [selectedCase, API_URL]);

    // Consultation Clinical Input Data Structures
   const [encounter, setEncounter] = useState({
     historyPresentIllness: "",
     physicalExamination: "",
     icd11Diagnosis: "",
     labRequests: [],
     labResults: "",
     prescriptionLines: [],
   });

  // Intermediate Line Generation Fields
  const [currentLab, setCurrentLab] = useState("");
  const [currentDrug, setCurrentDrug] = useState({
    name: "",
    formulation: "",
    strength: "",
    dosage: "",
    frequency: "Once Daily (OD)",
    duration: "",
    quantityRequired: 1,
  });

  const addLabLine = () => {
    if (!currentLab.trim()) return;
    setEncounter((prev) => ({
      ...prev,
      labRequests: [...prev.labRequests, currentLab],
    }));
    setCurrentLab("");
  };

  const addDrugLine = () => {
    if (!currentDrug.name.trim() || !currentDrug.dosage) return;
    setEncounter((prev) => ({
      ...prev,
      prescriptionLines: [...prev.prescriptionLines, { ...currentDrug }],
    }));
    setCurrentDrug({
      name: "",
      formulation: "",
      strength: "",
      dosage: "",
      frequency: "Once Daily (OD)",
      duration: "",
      quantityRequired: 1,
    });
  };

    const finalizeEncounter = async (e) => {
      e.preventDefault();
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
              historyPresentIllness: encounter.historyPresentIllness,
              physicalExamination: encounter.physicalExamination,
              icd11Diagnosis: encounter.icd11Diagnosis,
              labRequests: encounter.labRequests,
              prescriptionLines: encounter.prescriptionLines,
            }),
          }
        );
        if (!response.ok) throw new Error("Failed to submit consultation");
        
        // Get the updated patient data from the response
        const result = await response.json();
        if (!result.success) throw new Error(result.message || "Failed to submit consultation");
        
        const updatedPatient = result.data;
        
        alert("Encounter submitted successfully to pharmacy/lab routing layers.");
        
        // Update selected case with the latest patient data
        setSelectedCase(updatedPatient);
        
        // Reset the encounter form for potential additional notes or updates
        setEncounter({
          historyPresentIllness: "",
          physicalExamination: "",
          icd11Diagnosis: "",
          labRequests: [],
          labResults: "",
          prescriptionLines: [
            {
              name: "",
              formulation: "",
              strength: "",
              dosage: "",
              frequency: "Once Daily (OD)",
              duration: "",
              quantityRequired: 1,
            }
          ],
        });
        
        // Stay in consultation queue tab to continue working with the patient
        setActiveTab("consultationQueue");
      } catch (err) {
        alert(`Error: ${err.message}`);
        console.error("Error finalizing encounter:", err);
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
                MESRA <span className="text-blue-600">PHYSICIAN</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono tracking-widest block mt-1 uppercase font-bold">
                Consultation Portal
              </span>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setSelectedCase(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition ${activeTab === "dashboard" ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              <LayoutDashboard size={16} /> Clinical Analytics
            </button>
            <button
              onClick={() => {
                setActiveTab("consultationQueue");
                setSelectedCase(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition ${activeTab === "consultationQueue" ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              <Clipboard size={16} /> Active Consult Queue ({cases.length})
            </button>
          </nav>
        </div>

       <div className="p-4 border-t border-slate-100">
         <div className="bg-slate-50 rounded-xl p-3 text-[11px] font-mono text-slate-500 mb-3 border border-slate-200/60">
           <p className="font-bold text-blue-600">Physician Account</p>
           <p>{doctorInfo.name}</p>
           <p className="text-slate-400">{doctorInfo.department}</p>
         </div>
         
         {/* Lab Statistics Section */}
         <div className="bg-slate-50 rounded-xl p-3 text-[11px] font-mono text-slate-500 mb-3 border border-slate-200/60">
           <p className="font-bold text-purple-600">Lab Statistics</p>
           <p className="flex items-center justify-between">
             <span>Pending Tests:</span>
             <span className="font-mono text-slate-900">
               {selectedCase ? encounter.labRequests.length : 0}
             </span>
           </p>
           <p className="text-xs text-slate-500">
             {selectedCase ? 
               `${encounter.labRequests.length} test${encounter.labRequests.length !== 1 ? 's' : ''} ordered for current patient` : 
               'Select a patient to view lab orders'}
           </p>
         </div>
         
         {/* Made functional by attaching onClick invoking the onLogout callback */}
         <button
           onClick={onLogout}
           className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 text-xs font-bold uppercase tracking-wider rounded-xl transition"
         >
           <LogOut size={14} /> Close Session
         </button>
       </div>
      </aside>

      {/* WORKSPACE AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200/80 sticky top-0 px-8 py-5 z-20 flex justify-between items-center">
          <h1 className="text-sm font-black tracking-widest text-slate-900 uppercase font-mono">
            {activeTab === "dashboard" &&
              "Physician Overview & Clinical Metrics"}
            {activeTab === "consultationQueue" &&
              (selectedCase
                ? "Active Electronic Medical Record (EMR) Encounter"
                : "Assigned Patient Triaged Caseload")}
          </h1>
          <span className="text-[11px] font-mono font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1.5 rounded-lg uppercase">
            Secure Encrypted Token Node
          </span>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          {/* CLINICAL ANALYTICS DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
   {[
     {
       label: "Assigned Consults Pending",
       value: cases.length,
       desc: "Awaiting primary medical assessment loops.",
     },
     {
       label: "Completed Encounters Today",
       value: `${completedEncountersCount} Cases`,
       desc: "Securely dispatched to pharmacy or labs.",
     },
     {
       label: "Average Consult Window",
       value: "14.2 Minutes",
       desc: "Patient charting conversion efficiency.",
     },
   ].map((m) => (
     <div
       key={m.label}
       className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm"
     >
       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
         {m.label}
       </span>
       <span className="text-3xl font-black text-slate-900 mt-2 block font-mono">
         {m.value}
       </span>
       <p className="text-xs text-slate-500 mt-2 leading-relaxed">
         {m.desc}
       </p>
     </div>
   ))}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-3">
                  Physician Notice Bulletin
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ensure all encounter files contain complete diagnostic
                  tracking parameters before submitting prescriptions. ICD-11
                  coding constraints are actively enforced dynamically by the
                  medical core servers.
                </p>
              </div>
            </div>
          )}

          {/* CONSULTATION TARGET QUEUE */}
          {activeTab === "consultationQueue" && !selectedCase && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
{cases.map((c) => {
      // Determine status label and color based on currentStatus
      const statusConfig = {
        Registration: { label: "Registered", color: "bg-gray-500 text-white" },
        Triage: { label: "Triaged", color: "bg-blue-500 text-white" },
        Consultation: { label: "Consulting", color: "bg-green-500 text-white" },
        Laboratory: { label: "At Laboratory", color: "bg-purple-500 text-white" },
        Pharmacy: { label: "At Pharmacy", color: "bg-orange-500 text-white" },
        Billing: { label: "At Billing", color: "bg-red-500 text-white" },
        Discharged: { label: "Discharged", color: "bg-teal-500 text-white" },
      };
      
      const status = statusConfig[c.currentStatus] || statusConfig.Registration;
      
      return (
        <div
          key={c.cardId}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-blue-500 transition flex flex-col justify-between space-y-4"
        >
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-slate-900 text-base">
                  {c.patientName}
                </h4>
                <p className="text-xs font-mono text-blue-600 font-bold mt-0.5">
                  MRN Identifier Token: {c.cardId}
                </p>
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${status.color}`}
              >
                {status.label}
              </span>
            </div>

            {/* Show different information based on status */}
            {c.currentStatus === "Triage" && (
              <>
                {/* Display vital signs collected during triage */}
                <div className="grid grid-cols-4 gap-2 mt-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center text-slate-700">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">
                      BP
                    </span>
                    <span className="text-xs font-black font-mono">
                      {c.triage?.bloodPressure}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">
                      PR
                    </span>
                    <span className="text-xs font-black font-mono">
                      {c.triage?.heartRate} bpm
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">
                      Temp
                    </span>
                    <span className="text-xs font-black font-mono">
                      {c.triage?.temperature}°C
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">
                      Resp
                    </span>
                    <span className="text-xs font-black font-mono">
                      {c.triage?.respiratoryRate} rpm
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-4 leading-relaxed line-clamp-2">
                  <strong className="text-slate-700">
                    Stated Intake Complaint:
                  </strong>{" "}
                  {c.chiefComplaint}
                </p>
              </>
            )}
            
            {c.currentStatus === "Laboratory" && (
              <>
                <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                  <strong className="text-slate-700">Lab Status:</strong> 
                  <span className={`inline-flex items-center gap-1`}>
                    <span className={`w-2 h-2 rounded-full ${c.laboratory?.labStatus === "Completed" ? "bg-green-500" : "bg-yellow-500"}`}></span>
                    <span>{c.laboratory?.labStatus === "Completed" ? "Results Available" : "Pending Results"}</span>
                  </span>
                </p>
              </>
            )}
            
            {c.currentStatus === "Pharmacy" && (
              <>
                <p className="text-xs text-slate-500 mb-2">
                  <strong className="text-slate-700">Pharmacy Status:</strong> 
                  {c.pharmacy?.dispenseStatus === "Dispensed" ? "Medication Dispensed" : "Pending"}
                </p>
                {c.pharmacy?.prescribedDrugs && c.pharmacy?.prescribedDrugs.length > 0 && (
                  <div className="mt-2 p-3 bg-slate-50 rounded">
                    <p className="text-xs font-bold text-slate-900 mb-1">Prescribed Medications:</p>
                    <ul className="text-xs text-slate-600 list-disc pl-5">
                      {c.pharmacy.prescribedDrugs.map((drug, index) => (
                        <li key={index}>{drug}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
            
            {(c.currentStatus === "Consultation" || c.currentStatus === "Registration") && (
              <>
                {/* Display vital signs collected during triage */}
                <div className="grid grid-cols-4 gap-2 mt-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center text-slate-700">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">
                      BP
                    </span>
                    <span className="text-xs font-black font-mono">
                      {c.triage?.bloodPressure}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">
                      PR
                    </span>
                    <span className="text-xs font-black font-mono">
                      {c.triage?.heartRate} bpm
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">
                      Temp
                    </span>
                    <span className="text-xs font-black font-mono">
                      {c.triage?.temperature}°C
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">
                      Resp
                    </span>
                    <span className="text-xs font-black font-mono">
                      {c.triage?.respiratoryRate} rpm
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-4 leading-relaxed line-clamp-2">
                  <strong className="text-slate-700">
                    Stated Intake Complaint:
                  </strong>{" "}
                  {c.chiefComplaint}
                </p>
              </>
            )}
          </div>

          <button
            onClick={() => setSelectedCase(c)}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition shadow-sm flex items-center justify-center gap-1"
          >
            View Patient Details <ChevronRight size={14} />
          </button>
        </div>
      );
    })}
              </div>
            </div>
          )}

          {/* PHYSICIAN ENCOUNTER CLINICAL WORKSPACE */}
          {selectedCase && (
            <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden animate-fadeIn text-slate-800">
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold uppercase tracking-wider">
                    {selectedCase.patientName}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    MRN Index Node: {selectedCase.cardId} | Sex/Age:{" "}
                    {selectedCase.gender}, {selectedCase.age} Yrs
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="text-xs bg-slate-800 text-slate-400 px-3 py-1.5 rounded-lg hover:text-white"
                >
                  Exit Case File
                </button>
              </div>

              <div className="px-8 py-3.5 bg-blue-50 border-b border-slate-200/60 flex flex-wrap gap-6 text-xs text-slate-600 font-medium">
                <div>
                  BP Status:{" "}
                  <strong className="text-slate-900 font-mono font-bold">
                    {selectedCase.triage?.bloodPressure} mmHg
                  </strong>
                </div>
                <div>
                  Pulse Frequency:{" "}
                  <strong className="text-slate-900 font-mono font-bold">
                    {selectedCase.triage?.heartRate} BPM
                  </strong>
                </div>
                <div>
                  Core Temperature:{" "}
                  <strong className="text-slate-900 font-mono font-bold">
                    {selectedCase.triage?.temperature} °C
                  </strong>
                </div>
                 <div>
                   Respiratory Rate:{" "}
                   <strong className="text-slate-900 font-mono font-bold">
                     {selectedCase.triage?.respiratoryRate} rpm
                   </strong>
                 </div>
                 {/* Lab Results Section */}
                 {selectedCase.laboratory?.labStatus === "Completed" && selectedCase.laboratory?.testResults && (
                   <div className="ml-auto border-l-2 border-plum-500 pl-4">
                     <div className="text-[11px] font-bold text-plum-600 uppercase tracking-wider block">
                       Lab Results
                     </div>
                     <div className="text-xs text-slate-600 whitespace-pre-wrap">
                       {JSON.stringify(selectedCase.laboratory.testResults, null, 2)}
                     </div>
                   </div>
                 )}
               </div>

               <form onSubmit={finalizeEncounter} className="p-8 space-y-6">
                {/* Subjective Notes */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                    History of Present Illness (HPI) / Progress Notes *
                  </label>
                  <textarea
                    value={encounter.historyPresentIllness}
                    onChange={(e) =>
                      setEncounter({
                        ...encounter,
                        historyPresentIllness: e.target.value,
                      })
                    }
                    required
                    rows={3}
                    placeholder="Document symptomatic trajectory, historical systemic reviews, and patient presentations details..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Objective Notes */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                    Physical Examination Findings *
                  </label>
                  <textarea
                    value={encounter.physicalExamination}
                    onChange={(e) =>
                      setEncounter({
                        ...encounter,
                        physicalExamination: e.target.value,
                      })
                    }
                    required
                    rows={3}
                    placeholder="Document systematic inspection, percussion, auscultation notes and objective updates..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Assessment Coding */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                    ICD-11 Primary Diagnostic Formulation Title *
                  </label>
                  <input
                    type="text"
                    value={encounter.icd11Diagnosis}
                    onChange={(e) =>
                      setEncounter({
                        ...encounter,
                        icd11Diagnosis: e.target.value,
                      })
                    }
                    required
                    placeholder="Enter formal diagnostic classification title or numeric codes..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <hr className="border-slate-100" />

                {/* Lab Order Module */}
                <div className="space-y-3 bg-slate-50/60 p-5 rounded-2xl border border-slate-200/60">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <FlaskConical size={12} className="text-blue-600" />{" "}
                    Laboratory Diagnostics Request Sheet
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={currentLab}
                      onChange={(e) => setCurrentLab(e.target.value)}
                      placeholder="e.g. CBC with Diff, Liver Function Test (LFT), Serum Creatinine"
                      className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={addLabLine}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition"
                    >
                      Add Panel
                    </button>
                  </div>
                  {encounter.labRequests.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                       {encounter.labRequests.map((lab) => (
                         <span
                           key={lab}
                           className="bg-blue-50 text-blue-700 border border-blue-200/60 text-[10px] font-bold px-2.5 py-1 rounded-md"
                         >
                           {lab}
                         </span>
                       ))}
                    </div>
                  )}
                </div>

                {/* Electronic Prescription Module */}
                <div className="space-y-4 bg-slate-50/60 p-5 rounded-2xl border border-slate-200/60">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Pill size={12} className="text-emerald-600" /> Secure
                    E-Prescription Order Interface
                  </label>
                   <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                     <input
                       type="text"
                       value={currentDrug.name}
                       onChange={(e) =>
                         setCurrentDrug({ ...currentDrug, name: e.target.value })
                       }
                       placeholder="Medication Name"
                       className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                     />
                     <input
                       type="text"
                       value={currentDrug.formulation}
                       onChange={(e) =>
                         setCurrentDrug({
                           ...currentDrug,
                           formulation: e.target.value,
                         })
                       }
                       placeholder="Formulation (e.g. Tablet)"
                       className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                     />
                     <input
                       type="text"
                       value={currentDrug.strength}
                       onChange={(e) =>
                         setCurrentDrug({
                           ...currentDrug,
                           strength: e.target.value,
                         })
                       }
                       placeholder="Strength (e.g. 500mg)"
                       className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                     />
                     <input
                       type="text"
                       value={currentDrug.dosage}
                       onChange={(e) =>
                         setCurrentDrug({
                           ...currentDrug,
                           dosage: e.target.value,
                         })
                       }
                       placeholder="Dosage"
                       className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                     />
                     <select
                       value={currentDrug.frequency}
                       onChange={(e) =>
                         setCurrentDrug({
                           ...currentDrug,
                           frequency: e.target.value,
                         })
                       }
                       className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                     >
                       <option>Once Daily (OD)</option>
                       <option>Twice Daily (BID)</option>
                       <option>Three Times Daily (TID)</option>
                       <option>Four Times Daily (QID)</option>
                       <option>As Needed (PRN)</option>
                     </select>
                     <input
                       type="number"
                       value={currentDrug.quantityRequired}
                       onChange={(e) =>
                         setCurrentDrug({
                           ...currentDrug,
                           quantityRequired: parseInt(e.target.value) || 1,
                         })
                       }
                       placeholder="Qty"
                       className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                     />
                     <input
                       type="text"
                       value={currentDrug.duration}
                       onChange={(e) =>
                         setCurrentDrug({
                           ...currentDrug,
                           duration: e.target.value,
                         })
                       }
                       placeholder="Duration (e.g. 7 Days)"
                       className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                     />
                   </div>
                  <button
                    type="button"
                    onClick={addDrugLine}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition shadow-sm"
                  >
                    Authorize & Stage Medication Line
                  </button>

                  {encounter.prescriptionLines.length > 0 && (
                    <ul className="space-y-1.5 pt-2 border-t border-slate-200/60 font-mono text-[11px] text-slate-700 list-disc pl-4">
                        {encounter.prescriptionLines.map((line, index) => (
                          <li
                            key={index}
                            className="font-semibold text-slate-900"
                          >
                            {line.name} {line.strength} - {line.formulation}, {line.dosage} - {line.frequency} for {line.duration} ({line.quantityRequired} units)
                          </li>
                        ))}
                    </ul>
                  )}
                </div>

                {/* Final Form Execution Buttons */}
                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedCase(null)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-xl transition"
                  >
                    Postpone
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-md"
                  >
                    Authenticate & Push Encounter
                  </button>
                </div>
              </form>

              {/* =======================================================================
  DOCTOR-TO-NURSE CLINICAL PIPELINE & PATIENT ASSIGNMENT HUB
  ======================================================================= */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden mt-6">
                <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
                  <div>
                    <span className="text-xs font-mono text-indigo-400 font-bold uppercase">
                      Clinical Dispatch Center
                    </span>
                    <h3 className="text-sm font-black tracking-wide text-white mt-0.5">
                      Assign Patient & Broadcast Orders to Nurse
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse">
                    Pipeline Synced
                  </span>
                </div>

                <div className="p-6 space-y-6">
                  {/* 1. ASSIGNMENT ACTION: SELECT NURSE STATION CHANNELS */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                        Assign Duty Nursing Unit
                      </label>
                      <select
                        value={assignedStation}
                        onChange={(e) => setAssignedStation(e.target.value)}
                      >
                        <option value="NS-Alpha">
                          Nurse Station Alpha (General Care)
                        </option>
                        <option value="NS-Beta">
                          Nurse Station Beta (Outpatient Lounge)
                        </option>
                        <option value="NS-Critical">
                          ICU / Critical Care Nursing Fleet
                        </option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                        Set Dispatch Priority Status
                      </label>
                      <select
                        value={assigningPatient?.status || "Pending Meds"}
                        onChange={(e) => {
                          if (assigningPatient) {
                            setAssigningPatient({
                              ...assigningPatient,
                              status: e.target.value,
                            });
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Pending Meds">
                          Routine Assessment & Medication
                        </option>
                        <option value="Urgent Treatment Required">
                          Urgent Intervention Track
                        </option>
                        <option value="Post-Op Monitoring">
                          Post-Op Vital Monitoring
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* 2. LIVE FEED: READ RE-EVALUATION NOTES SUBMITTED BY NURSE */}
                  <div className="space-y-2 border-t border-slate-100 pt-4">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                      Incoming Report from Assigned Nurse
                    </label>

                    {selectedCase ? (
                      <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex gap-3.5">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm font-mono text-xs font-bold">
                          RN
                        </div>
                        <div>
                          <p className="text-xs text-indigo-900 font-medium leading-relaxed italic">
                            "Patient queued for nurse assignment. No nursing
                            notes yet."
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-4 text-center text-xs text-slate-400 font-medium">
                        No active nursing reports filed yet. Use the action
                        panel below to push this patient profile into the
                        nursing queue.
                      </div>
                    )}
                  </div>

                  {/* 3. OUTGOING: WRITE CLINICAL DIRECTION FOR THE CARE PLAN */}
                  <div className="space-y-2 border-t border-slate-100 pt-4">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                      Physician Care Instructions & Order Blueprint
                    </label>
                    <textarea
                      rows="3"
                      placeholder="Type specific care directions or medication plans (e.g., 'Administer 500mg IV Amoxicillin immediately. Log vitals every 2 hours and report stabilization trends.')..."
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={carePlan}
                      onChange={(e) => setCarePlan(e.target.value)}
                    />
                  </div>

                  {/* 4. ASSIGNMENT COMMIT BUTTON */}
                  <button
                    type="button"
                    onClick={async () => {
                      if (!selectedCase) {
                        alert(
                          "Please select a patient from your dashboard registry first.",
                        );
                        return;
                      }
                      try {
                        setDispatching(true);
                        const storedToken = localStorage.getItem("token");
                        const response = await fetch(`${API_URL}/api/nurse`, {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${storedToken}`,
                          },
                          body: JSON.stringify({
                            patientId: selectedCase._id,
                            cardId: selectedCase.cardId,
                            patientName:
                              selectedCase.patientName ||
                              `${selectedCase.firstName} ${selectedCase.middleName} ${selectedCase.lastName}`,
                            age: selectedCase.age,
                            gender: selectedCase.gender,
                            assignedStation: assignedStation,
                            assignedDoctor: "Dr. Beza Kemal (MD)",
                            status: "Pending Meds",
                            carePlan,
                            assignedBy: "Dr. Beza Kemal (MD)",
                          }),
                        });
                        if (!response.ok) {
                          const errData = await response.json();
                          throw new Error(
                            errData.message || "Failed to assign patient",
                          );
                        }
                        alert(
                          `Patient successfully dispatched to ${assignedStation} nurse station.`,
                        );
                        setCases((prev) =>
                          prev.filter((c) => c._id !== selectedCase._id),
                        );
                        setSelectedCase(null);
                        setAssigningPatient(null);
                        setCarePlan("");
                        setAssignedStation("NS-Alpha");
                      } catch (err) {
                        alert(`Assignment failed: ${err.message}`);
                      } finally {
                        setDispatching(false);
                      }
                    }}
                    disabled={dispatching}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2-2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2-2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      />
                    </svg>
                    {dispatching
                      ? "Dispatching..."
                      : "Commit Nurse Assignment & Dispatch"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
