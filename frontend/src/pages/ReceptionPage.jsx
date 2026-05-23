import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Search, 
  Users, 
  Calendar, 
  User, 
  MapPin, 
  ShieldAlert, 
  Heart, 
  AlertCircle, 
  Edit2, 
  Activity,
  FileText,
  ChevronRight,
  Menu,
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Clock,
  LogOut
} from 'lucide-react';

export default function PatientManagementSystem() {
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, patientsList, registerPatient
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Sample Mock Data matching Ethiopian Administrative Attributes
  const [patients, setPatients] = useState([
    {
      cardId: "MR-2026-001",
      firstName: "Abebe",
      middleName: "Beka",
      lastName: "Alemu",
      age: "28",
      ageUnit: "Years",
      gender: "Male",
      bloodGroup: "O+",
      maritalStatus: "Single",
      subCity: "Bole",
      woreda: "03",
      houseNumber: "1024",
      nationality: "Ethiopian",
      phoneNumber: "+251911234567",
      alternativePhone: "",
      emergencyContactName: "Chaltu Beka",
      emergencyContactPhone: "+251911778899",
      guardianFullName: "",
      guardianRelationship: "",
      guardianPhone: "",
      chiefComplaint: "Patient reports acute abdominal pain lasting over 24 hours associated with intermittent low-grade fever and nausea.",
      admissionType: "OPD",
      paymentType: "Cash",
      companyName: "",
      referredFrom: "Self-Referral",
      registrationTime: "2026-05-22 09:15 AM"
    },
    {
      cardId: "MR-2026-002",
      firstName: "Bethlehem",
      middleName: "Tesfaye",
      lastName: "Getachew",
      age: "34",
      ageUnit: "Years",
      gender: "Female",
      bloodGroup: "A+",
      maritalStatus: "Married",
      subCity: "Yeka",
      woreda: "11",
      houseNumber: "A-44",
      nationality: "Ethiopian",
      phoneNumber: "0912345678",
      emergencyContactName: "Tesfaye Getachew",
      emergencyContactPhone: "0911556677",
      chiefComplaint: "Routine antenatal assessment. Third trimester follow-up presentation.",
      admissionType: "OPD",
      paymentType: "Credit/Insurance",
      companyName: "Nyang Real Estate Payer",
      referredFrom: "Local Clinic",
      registrationTime: "2026-05-22 10:30 AM"
    }
  ]);

  const initialFormState = {
    cardId: '',
    firstName: '',
    middleName: '',
    lastName: '',
    age: '',
    ageUnit: 'Years',
    gender: '',
    bloodGroup: '',
    maritalStatus: '',
    subCity: '',
    woreda: '',
    houseNumber: '',
    nationality: 'Ethiopian',
    phoneNumber: '',
    alternativePhone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    guardianFullName: '',
    guardianRelationship: '',
    guardianPhone: '',
    chiefComplaint: '',
    admissionType: 'OPD',
    paymentType: 'Cash',
    companyName: '',
    referredFrom: 'Self-Referral',
    registrationTime: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});

  // Automatically update and handle fallback live internet system date/time
  useEffect(() => {
    if (activeTab === 'registerPatient' && !isEditing) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      
      // Match standard datetime-local formatting (YYYY-MM-DDTHH:mm)
      const currentDateTimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`;
      setFormData(prev => ({ ...prev, registrationTime: currentDateTimeLocal }));
    }
  }, [activeTab, isEditing]);

  // --- INPUT & ACTION HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const resetToEmptyRegistration = () => {
    setFormData(initialFormState);
    setIsEditing(false);
    setFormErrors({});
    setActiveTab('registerPatient');
  };

  const triggerEditMode = (patient) => {
    // If the record date exists as text, convert it to datetime-local pattern, else bind live timestamp
    let editTime = patient.registrationTime;
    if (editTime && !editTime.includes('T')) {
      const parsed = new Date(editTime);
      if (!isNaN(parsed.getTime())) {
        editTime = parsed.toISOString().slice(0, 16);
      }
    }
    setFormData({ ...patient, registrationTime: editTime });
    setIsEditing(true);
    setFormErrors({});
    setActiveTab('registerPatient');
  };

  const validateForm = () => {
    const errors = {};
    const requiredFields = [
      'firstName', 'middleName', 'lastName', 'age', 
      'gender', 'subCity', 'woreda', 'phoneNumber', 
      'emergencyContactName', 'emergencyContactPhone', 'chiefComplaint', 'registrationTime'
    ];

    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        errors[field] = 'Field is strictly required';
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Convert internal raw calendar value back to clean standard logging format
    const formattedDate = new Date(formData.registrationTime);
    const readableTimestamp = formattedDate.toLocaleDateString('en-US', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    }) + ' ' + formattedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    if (isEditing) {
      setPatients(prev => prev.map(p => p.cardId === formData.cardId ? { ...formData, registrationTime: readableTimestamp } : p));
      setSelectedPatient({ ...formData, registrationTime: readableTimestamp });
      setIsEditing(false);
    } else {
      const generatedId = `MR-2026-${String(patients.length + 1).padStart(3, '0')}`;
      const newRecord = {
        ...formData,
        cardId: generatedId,
        registrationTime: readableTimestamp
      };
      setPatients(prev => [newRecord, ...prev]);
    }

    setFormData(initialFormState);
    setActiveTab('patientsList');
  };

  // --- FILTER & PATIENT SEARCH ENGINE ---
  const filteredPatients = patients.filter(patient => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    let targetPhoneQuery = query;
    if (query.startsWith('09')) {
      targetPhoneQuery = query.substring(1); 
    } else if (query.startsWith('+2519')) {
      targetPhoneQuery = query.substring(5);
    }

    const fullName = `${patient.firstName} ${patient.middleName} ${patient.lastName}`.toLowerCase();
    const cleanPhone = patient.phoneNumber ? patient.phoneNumber.replace(/[\s+-]/g, '') : '';
    const cleanEmergencyPhone = patient.emergencyContactPhone ? patient.emergencyContactPhone.replace(/[\s+-]/g, '') : '';

    return (
      patient.cardId.toLowerCase().includes(query) ||
      fullName.includes(query) ||
      patient.firstName.toLowerCase().includes(query) ||
      patient.lastName.toLowerCase().includes(query) ||
      cleanPhone.includes(targetPhoneQuery) ||
      cleanEmergencyPhone.includes(targetPhoneQuery)
    );
  });

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      
      {/* ==========================================
          LEFT ADMINISTRATIVE SIDEBAR NAVIGATION
          ========================================== */}
      <aside className="w-72 bg-[#081018] border-r border-slate-800 flex flex-col justify-between shrink-0 z-30">
        <div>
          {/* Branded Logo Assembly Area */}
          <div className="p-6 border-b border-slate-800/80 flex items-center gap-3.5">
            <div className="relative w-11 h-11 flex items-center justify-center">
              {/* Custom Overlapping Stethoscope Contours */}
              <div className="absolute inset-0 border-[3px] border-blue-600 rounded-full scale-95 border-t-transparent flex items-center justify-center">
                <div className="w-6 h-6 border-[2.5px] border-cyan-400 rounded-full border-b-transparent transform -rotate-45"></div>
              </div>
              <div className="w-2.5 h-2.5 bg-blue-400 rounded-full z-10 animate-pulse"></div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-black text-lg tracking-wider text-white">MESRA</span>
                <span className="font-bold text-[10px] uppercase tracking-widest bg-blue-600 px-1.5 py-0.5 rounded text-white font-mono">DIGITAL</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight">Enterprise Health Platform</p>
            </div>
          </div>

          {/* Navigation Items Deck */}
          <nav className="p-4 space-y-1.5 pt-6">
            <button
              onClick={() => { setActiveTab('dashboard'); setSelectedPatient(null); }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              <LayoutDashboard size={16} />
              Dashboard Analytics
            </button>

            <button
              onClick={() => { setActiveTab('patientsList'); setSelectedPatient(null); }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'patientsList' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              <Users size={16} />
              Patient Registry Ledger
            </button>

            <button
              onClick={resetToEmptyRegistration}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'registerPatient' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              <UserPlus size={16} />
              Intake Registration
            </button>
          </nav>
        </div>

        {/* System Node Connection Indicator Footer */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800 text-[10px] font-mono text-slate-400 space-y-1">
            <p className="text-blue-400 font-bold">Node Status: Connected</p>
            <p>IP: 10.100.10.4</p>
            <p>Role: Admissions Clerk</p>
          </div>
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900 text-slate-400 hover:text-rose-400 text-xs font-bold uppercase tracking-wider rounded-xl transition-all">
            <LogOut size={14} /> Exit Platform
          </button>
        </div>
      </aside>

      {/* ==========================================
          MAIN CONTENT STAGE/VIEWPORT CONTAINER
          ========================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Universal Sub-Header Row */}
        <header className="bg-[#0D1925]/40 backdrop-blur-md border-b border-slate-800/60 sticky top-0 px-8 py-4 z-20 flex justify-between items-center">
          <div>
            <h1 className="text-base font-bold tracking-wider text-white uppercase font-mono">
              {activeTab === 'dashboard' && "System Analytics Dashboard"}
              {activeTab === 'patientsList' && (selectedPatient ? "Patient Dossier Breakdown" : "Active Registry Files")}
              {activeTab === 'registerPatient' && (isEditing ? "Modify Extant Profile Block" : "Universal Intake Documentation")}
            </h1>
          </div>
          <div className="text-right font-mono text-[11px] text-slate-400">
            Platform Track: <span className="text-cyan-400 font-bold">Live Stream Mode</span>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          
          {/* ==========================================
              VIEWPORT 0: MISSING DASHBOARD ANALYTICS VIEW
              ========================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Analytics Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total Registered Cards', value: '1,482', change: '+14.2%', color: 'border-l-blue-500' },
                  { label: 'Active Outpatient (OPD)', value: '842', change: '+8.6%', color: 'border-l-cyan-500' },
                  { label: 'Active Inpatient (IPD)', value: '124', change: '+2.1%', color: 'border-l-amber-500' },
                  { label: 'Emergency Admissions', value: '516', change: '+22.4%', color: 'border-l-rose-500' },
                ].map((card, idx) => (
                  <div key={idx} className={`bg-[#0D1925] border border-slate-800/80 p-5 rounded-2xl border-l-4 ${card.color} flex flex-col justify-between shadow-lg`}>
                    <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase">{card.label}</span>
                    <div className="flex items-baseline justify-between mt-3">
                      <span className="text-3xl font-black tracking-tight text-white font-mono">{card.value}</span>
                      <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-0.5"><TrendingUp size={12}/>{card.change}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Graphical Distribution Framework Blocks */}
              <div className="grid lg:grid-cols-12 gap-6">
                
                {/* Visual Chart Placeholder Block */}
                <div className="lg:col-span-8 bg-[#0D1925] border border-slate-800 rounded-3xl p-6 shadow-xl">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2 uppercase tracking-wider"><BarChart3 size={15} className="text-blue-500" /> Hourly Registration Flux</h3>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2.5 py-1 rounded-md font-mono">Sync Interval: Realtime</span>
                  </div>
                  
                  {/* Mock Graphical Columns */}
                  <div className="h-56 flex items-end gap-3.5 pt-6 border-b border-slate-800 px-2">
                    {[35, 65, 45, 90, 75, 55, 100].map((height, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <div className="w-full flex gap-1 items-end h-full">
                          <div style={{ height: `${height}%` }} className="w-1/2 bg-blue-600 rounded-t-sm group-hover:bg-blue-500 transition-all duration-300"></div>
                          <div style={{ height: `${Math.max(height - 20, 10)}%` }} className="w-1/2 bg-cyan-400 rounded-t-sm group-hover:bg-cyan-300 transition-all duration-300"></div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 mt-1">
                          {['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'][idx]}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center gap-6 mt-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-blue-600 rounded-sm"></span>Cash Walk-ins</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-cyan-400 rounded-sm"></span>Corporate Credit</span>
                  </div>
                </div>

                {/* Queue Tiers Block */}
                <div className="lg:col-span-4 bg-[#0D1925] border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-white uppercase tracking-wider mb-2">Regional Station Triage Status</h3>
                    <p className="text-[11px] text-slate-400 mb-6">Current allocation distribution metrics inside localized processing slots.</p>
                  </div>
                  <div className="space-y-4">
                    {[
                      { name: 'Outpatient Department', count: '842 Profiled', pct: '65%', color: 'bg-blue-500' },
                      { name: 'Adult Emergency Clinic', count: '516 Profiled', pct: '88%', color: 'bg-rose-500' },
                      { name: 'Pediatric Admission', count: '124 Profiled', pct: '25%', color: 'bg-amber-500' }
                    ].map((triage, index) => (
                      <div key={index} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-300 font-medium">{triage.name}</span>
                          <span className="text-slate-400 font-mono text-[11px]">{triage.count}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div style={{ width: triage.pct }} className={`h-full ${triage.color}`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* VIEWPORT 1: UNIVERSAL PATIENT REGISTRY RECORD LEDGER */}
          {activeTab === 'patientsList' && !selectedPatient && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="bg-[#0D1925] rounded-3xl p-6 text-white border-b-4 border-blue-600 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-base font-black uppercase tracking-widest text-white">Active Admission Case Files</h2>
                  <p className="text-xs text-slate-400 mt-1">Search, evaluate, filter and manage patient electronic medical cards instantaneously.</p>
                </div>
                
                <div className="w-full md:w-96 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Name, Card ID, Phone (09...)..."
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-slate-300 text-[11px] font-black uppercase tracking-wider border-b border-slate-800">
                        <th className="py-4 px-6">Patient Identifier Card</th>
                        <th className="py-4 px-6">Patient Full Medical Name</th>
                        <th className="py-4 px-6">Age / Sex Metrics</th>
                        <th className="py-4 px-6">Primary Phone Contact</th>
                        <th className="py-4 px-6">Sub-City Location</th>
                        <th className="py-4 px-6 text-right">Action Execution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium">
                      {filteredPatients.length > 0 ? (
                        filteredPatients.map((patient) => (
                          <tr key={patient.cardId} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="py-4 px-6 font-mono font-bold text-blue-600">{patient.cardId}</td>
                            <td className="py-4 px-6">
                              <span className="font-bold text-slate-900 text-sm">{patient.firstName} {patient.middleName} {patient.lastName}</span>
                            </td>
                            <td className="py-4 px-6 text-slate-700">
                              <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-800 font-bold mr-1.5">{patient.age} {patient.ageUnit}</span>
                              <span className={`px-2 py-1 rounded-md font-bold ${patient.gender === 'Male' ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'}`}>{patient.gender}</span>
                            </td>
                            <td className="py-4 px-6 font-mono text-slate-600">{patient.phoneNumber}</td>
                            <td className="py-4 px-6"><span className="bg-slate-100 px-2 py-1 rounded-md text-slate-700 font-bold">{patient.subCity}</span></td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => setSelectedPatient(patient)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm hover:bg-blue-700"
                              >
                                Manage
                                <ChevronRight size={12} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="py-12 text-center text-slate-400 font-medium bg-slate-50/50">
                            <AlertCircle className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                            No matching patient records discovered inside local database index.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEWPORT 2: PATIENT SPECIFIC DOSSIER DETAILED RECORD CARD WITH TIMESTAMPS */}
          {selectedPatient && activeTab === 'patientsList' && (
            <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-fadeIn">
              
              <div className="p-6 bg-[#0D1925] text-white border-b-4 border-blue-600 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700 shadow-inner">
                    <User className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-wide text-white">{selectedPatient.firstName} {selectedPatient.middleName} {selectedPatient.lastName}</h2>
                    <p className="text-xs font-mono text-blue-400 mt-0.5">Card Token Identity: <span className="font-bold">{selectedPatient.cardId}</span></p>
                  </div>
                </div>
                <span className="bg-blue-600 text-white font-mono font-bold text-xs px-3 py-1.5 rounded-xl uppercase tracking-wider shadow-md">
                  {selectedPatient.admissionType} Portal Track
                </span>
              </div>

              <div className="p-8 space-y-8">
                
                {/* Visual Registration Log Mark Banner */}
                <div className="flex items-center gap-2 bg-slate-100/80 px-4 py-3 rounded-xl border border-slate-200/40 text-slate-700">
                  <Clock size={14} className="text-blue-600" />
                  <span className="text-xs font-bold uppercase tracking-wider">System Log Registration Timestamp Track:</span>
                  <span className="text-xs font-mono font-bold text-slate-900 ml-auto">{selectedPatient.registrationTime || 'Not Logged'}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="p-3 bg-white rounded-xl border border-slate-200/60 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Patient Age Span</span>
                    <p className="text-sm font-black text-slate-800 mt-1">{selectedPatient.age} {selectedPatient.ageUnit}</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200/60 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Biological Sex Track</span>
                    <p className="text-sm font-black text-slate-800 mt-1">{selectedPatient.gender}</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200/60 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Blood Group Identity</span>
                    <p className="text-sm font-black text-rose-600 mt-1">{selectedPatient.bloodGroup || "Not Stated"}</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200/60 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Marital Metric State</span>
                    <p className="text-sm font-black text-slate-800 mt-1">{selectedPatient.maritalStatus || "Not Categorized"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3 border border-slate-100 p-4 rounded-xl bg-white shadow-sm">
                    <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-widest flex items-center gap-1.5"><MapPin size={12}/> Geographic Coordinates</h4>
                    <div className="text-xs space-y-1.5 text-slate-600">
                      <p>Sub-city Location Cluster: <strong className="text-slate-800">{selectedPatient.subCity}</strong></p>
                      <p>Woreda Zone Sector ID: <strong className="text-slate-800">{selectedPatient.woreda}</strong></p>
                      <p>Residential House Number: <strong className="text-slate-800">{selectedPatient.houseNumber || "N/A"}</strong></p>
                      <p>Primary Comm Phone Line: <strong className="text-slate-800 font-mono">{selectedPatient.phoneNumber}</strong></p>
                    </div>
                  </div>

                  <div className="space-y-3 border border-slate-100 p-4 rounded-xl bg-white shadow-sm">
                    <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-widest flex items-center gap-1.5"><ShieldAlert size={12}/> Primary Emergency Kinship Metrics</h4>
                    <div className="text-xs space-y-1.5 text-slate-600">
                      <p>Emergency Contact Liaison: <strong className="text-slate-800">{selectedPatient.emergencyContactName}</strong></p>
                      <p>Liaison Emergency Telephone: <strong className="text-slate-800 font-mono">{selectedPatient.emergencyContactPhone}</strong></p>
                      {selectedPatient.guardianFullName && (
                        <>
                          <p>Legal Guardian Parent: <strong className="text-slate-800">{selectedPatient.guardianFullName}</strong></p>
                          <p>Guardian Relationship Line: <strong className="text-slate-800">{selectedPatient.guardianRelationship}</strong></p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50/50 border border-amber-200/80 p-5 rounded-2xl space-y-2">
                  <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest block">Chief Intake Symptom Narrative Presenting Complaint</span>
                  <p className="text-xs text-amber-900 leading-relaxed font-medium">{selectedPatient.chiefComplaint}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-500 border-t border-slate-100 pt-5">
                  <div>Settlement Modality: <span className="text-slate-800 font-bold">{selectedPatient.paymentType}</span></div>
                  <div>Inflow Route Context: <span className="text-slate-800 font-bold">{selectedPatient.referredFrom}</span></div>
                  <div>Entry Timestamp Log: <span className="text-slate-800 font-mono font-medium">{selectedPatient.registrationTime}</span></div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-100">
                  <button 
                    onClick={() => triggerEditMode(selectedPatient)}
                    className="flex-1 inline-flex justify-center items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:bg-blue-700"
                  >
                    <Edit2 size={13} /> edit patient data
                  </button>
                  <button 
                    onClick={() => setSelectedPatient(null)}
                    className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Return to Ledger
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* VIEWPORT 3: HOSPITAL-GRADE REGISTRATION FORM COMPONENT WITH AUTOMATIC TIMESTAMPS */}
          {activeTab === 'registerPatient' && (
            <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-fadeIn text-slate-800">
              
              <div className="p-6 bg-[#0D1925] text-white border-b-4 border-blue-600 flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-xl">
                  <UserPlus className="text-blue-400 h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-widest">
                    {isEditing ? `Modifying Extant Metadata Profile Block: ${formData.cardId}` : "Universal Health Intake Registry Document"}
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">Fill out all system variables accurately to build a clean medical file.</p>
                </div>
              </div>

              <form onSubmit={handleFormSubmit} className="p-8 space-y-8">
                
                {/* PHASE I: ADMINISTRATIVE CLASSIFICATIONS */}
                <div className="space-y-4">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-blue-600 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <Calendar size={14} /> Section 1: Administrative Log Classifications
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    
                    {/* Timestamp Verification Input Tag Row */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Registration Time (Live Sync Log) *</label>
                      <input 
                        type="datetime-local"
                        name="registrationTime"
                        value={formData.registrationTime}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold transition-all focus:outline-none bg-white ${formErrors.registrationTime ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'}`}
                      />
                      {formErrors.registrationTime && <p className="text-rose-500 text-[10px] font-bold mt-1 flex items-center gap-1"><AlertCircle size={11}/>{formErrors.registrationTime}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Admission Station Portal *</label>
                      <select 
                        name="admissionType" 
                        value={formData.admissionType} 
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold bg-white transition-all focus:outline-none ${formErrors.admissionType ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'}`}
                      >
                        <option value="OPD">Outpatient Department (OPD)</option>
                        <option value="IPD">Inpatient Department (IPD)</option>
                        <option value="Pedi">Pediatric Admission (Pedi)</option>
                        <option value="Adult">Adult Emergency (Adult)</option>
                        <option value="EMR">Electronic Emergency Ward (EMR)</option>
                        <option value="DVW">Direct Verification Ward (DVW)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Financial Payment Tier Modality</label>
                      <select 
                        name="paymentType" 
                        value={formData.paymentType} 
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="Cash">Cash Outlay Settlement</option>
                        <option value="Credit/Insurance">Insurance Company Credit</option>
                        <option value="Free/Staff">Institutional Staff Waiver</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Company Coverage Title (If Insurance)</label>
                      <input 
                        type="text" 
                        name="companyName" 
                        value={formData.companyName} 
                        onChange={handleInputChange}
                        placeholder="Insurance / Employer Name"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* PHASE II: CORE MEDICAL DEMOGRAPHICS */}
                <div className="space-y-4">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-blue-600 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <User size={14} /> Section 2: Patient Core Demographics
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">First Name *</label>
                      <input 
                        type="text" 
                        name="firstName" 
                        value={formData.firstName} 
                        onChange={handleInputChange}
                        placeholder="Patient First Name"
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold transition-all focus:outline-none ${formErrors.firstName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'}`}
                      />
                      {formErrors.firstName && <p className="text-rose-500 text-[10px] font-bold mt-1 flex items-center gap-1"><AlertCircle size={11}/>{formErrors.firstName}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Middle Name *</label>
                      <input 
                        type="text" 
                        name="middleName" 
                        value={formData.middleName} 
                        onChange={handleInputChange}
                        placeholder="Father's Name"
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold transition-all focus:outline-none ${formErrors.middleName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'}`}
                      />
                      {formErrors.middleName && <p className="text-rose-500 text-[10px] font-bold mt-1 flex items-center gap-1"><AlertCircle size={11}/>{formErrors.middleName}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Last Name *</label>
                      <input 
                        type="text" 
                        name="lastName" 
                        value={formData.lastName} 
                        onChange={handleInputChange}
                        placeholder="Grandfather's Name"
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold transition-all focus:outline-none ${formErrors.lastName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'}`}
                      />
                      {formErrors.lastName && <p className="text-rose-500 text-[10px] font-bold mt-1 flex items-center gap-1"><AlertCircle size={11}/>{formErrors.lastName}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-5 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Age Numerical *</label>
                      <input 
                        type="number" 
                        name="age" 
                        value={formData.age} 
                        onChange={handleInputChange}
                        placeholder="e.g. 24" 
                        min="1"
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold transition-all focus:outline-none ${formErrors.age ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'}`}
                      />
                      {formErrors.age && <p className="text-rose-500 text-[10px] font-bold mt-1 flex items-center gap-1"><AlertCircle size={11}/>{formErrors.age}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Age Unit Scale</label>
                      <select 
                        name="ageUnit" 
                        value={formData.ageUnit} 
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Years">Years Scale</option>
                        <option value="Months">Months Scale</option>
                        <option value="Days">Days Scale</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Assigned Biological Sex *</label>
                      <select 
                        name="gender" 
                        value={formData.gender} 
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold bg-white transition-all focus:outline-none ${formErrors.gender ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'}`}
                      >
                        <option value="">Select Sex</option>
                        <option value="Male">Male Track</option>
                        <option value="Female">Female Track</option>
                      </select>
                      {formErrors.gender && <p className="text-rose-500 text-[10px] font-bold mt-1 flex items-center gap-1"><AlertCircle size={11}/>{formErrors.gender}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Blood Group Typology</label>
                      <select 
                        name="bloodGroup" 
                        value={formData.bloodGroup} 
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Unknown Profile</option>
                        <option value="A+">A+ Type</option><option value="A-">A- Type</option>
                        <option value="B+">B+ Type</option><option value="B-">B- Type</option>
                        <option value="AB+">AB+ Type</option><option value="AB-">AB- Type</option>
                        <option value="O+">O+ Type</option><option value="O-">O- Type</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Marital Metric State</label>
                      <select 
                        name="maritalStatus" 
                        value={formData.maritalStatus} 
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Option</option>
                        <option value="Single">Single</option><option value="Married">Married</option>
                        <option value="Divorced">Divorced</option><option value="Widowed">Widowed</option>
                        <option value="N/A">Not Applicable</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* PHASE III: GEOGRAPHIC COORDINATES */}
                <div className="space-y-4">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-blue-600 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <MapPin size={14} /> Section 3: Geographic Coordinates & Addresses
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Sub-city Location Cluster *</label>
                      <input 
                        type="text" 
                        name="subCity" 
                        value={formData.subCity} 
                        onChange={handleInputChange}
                        placeholder="e.g. Bole / Yeka"
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold transition-all focus:outline-none ${formErrors.subCity ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'}`}
                      />
                      {formErrors.subCity && <p className="text-rose-500 text-[10px] font-bold mt-1 flex items-center gap-1"><AlertCircle size={11}/>{formErrors.subCity}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Woreda Zone Sector *</label>
                      <input 
                        type="text" 
                        name="woreda" 
                        value={formData.woreda} 
                        onChange={handleInputChange}
                        placeholder="e.g. 04 or 12"
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold transition-all focus:outline-none ${formErrors.woreda ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'}`}
                      />
                      {formErrors.woreda && <p className="text-rose-500 text-[10px] font-bold mt-1 flex items-center gap-1"><AlertCircle size={11}/>{formErrors.woreda}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">House Identifier Number</label>
                      <input 
                        type="text" 
                        name="houseNumber" 
                        value={formData.houseNumber} 
                        onChange={handleInputChange}
                        placeholder="e.g. 902 / New"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Patient Corporate Nationality</label>
                      <input 
                        type="text" 
                        name="nationality" 
                        value={formData.nationality} 
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Primary Communication Phone *</label>
                      <input 
                        type="text" 
                        name="phoneNumber" 
                        value={formData.phoneNumber} 
                        onChange={handleInputChange}
                        placeholder="+251 9XX XXXXXX"
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold transition-all focus:outline-none ${formErrors.phoneNumber ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'}`}
                      />
                      {formErrors.phoneNumber && <p className="text-rose-500 text-[10px] font-bold mt-1 flex items-center gap-1"><AlertCircle size={11}/>{formErrors.phoneNumber}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Alternative Call Backup Line</label>
                      <input 
                        type="text" 
                        name="alternativePhone" 
                        value={formData.alternativePhone} 
                        onChange={handleInputChange}
                        placeholder="Secondary Telephone Contact"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* PHASE IV: EMERGENCY CONTACTS & KINSHIP RELATIONS */}
                <div className="space-y-4">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-blue-600 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <ShieldAlert size={14} /> Section 4: Emergency Contacts & Kinship Liaison Parameters
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Emergency Contact Full Name *</label>
                      <input 
                        type="text" 
                        name="emergencyContactName" 
                        value={formData.emergencyContactName} 
                        onChange={handleInputChange}
                        placeholder="Liaison Legal Identity Name"
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold transition-all focus:outline-none ${formErrors.emergencyContactName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'}`}
                      />
                      {formErrors.emergencyContactName && <p className="text-rose-500 text-[10px] font-bold mt-1 flex items-center gap-1"><AlertCircle size={11}/>{formErrors.emergencyContactName}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Emergency Liaison Telephone Number *</label>
                      <input 
                        type="text" 
                        name="emergencyContactPhone" 
                        value={formData.emergencyContactPhone} 
                        onChange={handleInputChange}
                        placeholder="Liaison Active Mobile Line"
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold transition-all focus:outline-none ${formErrors.emergencyContactPhone ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'}`}
                      />
                      {formErrors.emergencyContactPhone && <p className="text-rose-500 text-[10px] font-bold mt-1 flex items-center gap-1"><AlertCircle size={11}/>{formErrors.emergencyContactPhone}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Legal Guardian Full Name (If Minor)</label>
                      <input 
                        type="text" 
                        name="guardianFullName" 
                        value={formData.guardianFullName} 
                        onChange={handleInputChange}
                        placeholder="Parent / Caregiver Identity"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Guardian Relationship</label>
                      <input 
                        type="text" 
                        name="guardianRelationship" 
                        value={formData.guardianRelationship} 
                        onChange={handleInputChange}
                        placeholder="Relationship to Patient"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Guardian Telephone Number</label>
                      <input 
                        type="text" 
                        name="guardianPhone" 
                        value={formData.guardianPhone} 
                        onChange={handleInputChange}
                        placeholder="Guardian Mobile Line"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* PHASE V: CLINICAL ARRIVAL NARRATIVE */}
                <div className="space-y-4">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-blue-600 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <Heart size={14} /> Section 5: Arrival Presentation & Referral Summary
                  </h3>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Chief Complaint *</label>
                    <textarea 
                      name="chiefComplaint"
                      value={formData.chiefComplaint}
                      onChange={handleInputChange}
                      placeholder="Describe the presenting complaint in clinical detail"
                      rows={4}
                      className={`w-full px-4 py-3 rounded-xl border text-xs font-bold transition-all focus:outline-none ${formErrors.chiefComplaint ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'}`}
                    />
                    {formErrors.chiefComplaint && <p className="text-rose-500 text-[10px] font-bold mt-1 flex items-center gap-1"><AlertCircle size={11}/>{formErrors.chiefComplaint}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Referred From</label>
                      <select 
                        name="referredFrom" 
                        value={formData.referredFrom} 
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Self-Referral">Self-Referral</option>
                        <option value="Local Clinic">Local Clinic</option>
                        <option value="Referral Hospital">Referral Hospital</option>
                        <option value="Community Health Center">Community Health Center</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Secondary Review Channel</label>
                      <input 
                        type="text" 
                        name="companyName" 
                        value={formData.companyName} 
                        onChange={handleInputChange}
                        placeholder="Optional payer or referral partner"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions Deck */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-end pt-4 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => { setActiveTab('patientsList'); setIsEditing(false); setSelectedPatient(null); }}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md"
                  >
                    {isEditing ? 'Update Patient Record' : 'Submit Admission Form'}
                  </button>
                </div>

              </form>
            </div>
          )}
        </main>
      </div>

    </div>
  );
}