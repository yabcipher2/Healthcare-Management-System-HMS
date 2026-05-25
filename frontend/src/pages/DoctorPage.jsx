import React, { useState } from 'react';
import { 
  User, Activity, FileText, Clipboard, Heart, Thermometer, Wind, 
  CheckCircle, ShieldAlert, FlaskConical, Pill, Plus, Search, 
  ChevronRight, AlertCircle, LayoutDashboard, Folder, MessageSquare, LogOut 
} from 'lucide-react';

export default function DoctorPage({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, consultationQueue, patientWorkspace
  const [selectedCase, setSelectedCase] = useState(null);
  const hospitalLogo = "/mesra icon.png";
  
  // Doctor Active Caseload Mock Database
  const [cases] = useState([
    { mrn: "MR-2026-004", name: "Almaz Tekle", age: "38", gender: "Female", triage: "Orange (Emergent)", bp: "158/95", pr: "98", temp: "37.2", spo2: "93%", complaint: "Acute episodic shortness of breath paired with bilateral lower limb pitting edema." },
    { mrn: "MR-2026-009", name: "Yusuf Mohammed", age: "51", gender: "Male", triage: "Yellow (Urgent)", bp: "135/84", pr: "104", temp: "38.9", spo2: "96%", complaint: "Productive foul-smelling sputum cough, localized chest rub pain for 4 days." }
  ]);

  // Consultation Clinical Input Data Structures
  const [encounter, setEncounter] = useState({
    historyPresentIllness: '', physicalExamination: '',
    icd11Diagnosis: '', labRequests: [], prescriptionLines: []
  });

  // Intermediate Line Generation Fields
  const [currentLab, setCurrentLab] = useState('');
  const [currentDrug, setCurrentDrug] = useState({ name: '', dosage: '', frequency: '', duration: '' });

  const addLabLine = () => {
    if (!currentLab.trim()) return;
    setEncounter(prev => ({ ...prev, labRequests: [...prev.labRequests, currentLab] }));
    setCurrentLab('');
  };

  const addDrugLine = () => {
    if (!currentDrug.name.trim() || !currentDrug.dosage) return;
    const line = `${currentDrug.name} ${currentDrug.dosage} - ${currentDrug.frequency} for ${currentDrug.duration}`;
    setEncounter(prev => ({ ...prev, prescriptionLines: [...prev.prescriptionLines, line] }));
    setCurrentDrug({ name: '', dosage: '', frequency: 'Once Daily (OD)', duration: '' });
  };

  const finalizeEncounter = (e) => {
    e.preventDefault();
    alert(`Encounter Summary for MRN ${selectedCase.mrn} locked, authenticated, and pushed directly to Central EMR Pharmacy/Lab routing layers.`);
    setSelectedCase(null);
    setEncounter({ historyPresentIllness: '', physicalExamination: '', icd11Diagnosis: '', labRequests: [], prescriptionLines: [] });
    setActiveTab('consultationQueue');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-68 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 z-30">
        <div>
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <img src={hospitalLogo} alt="Mesra Logo" className="w-10 h-10 object-contain rounded-xl" />
            <div>
              <h3 className="font-black text-slate-900 tracking-tight text-md leading-none">MESRA <span className="text-blue-600">PHYSICIAN</span></h3>
              <span className="text-[10px] text-slate-400 font-mono tracking-widest block mt-1 uppercase font-bold">Consultation Portal</span>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            <button onClick={() => { setActiveTab('dashboard'); setSelectedCase(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
              <LayoutDashboard size={16} /> Clinical Analytics
            </button>
            <button onClick={() => { setActiveTab('consultationQueue'); setSelectedCase(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition ${activeTab === 'consultationQueue' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
              <Clipboard size={16} /> Active Consult Queue ({cases.length})
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3 text-[11px] font-mono text-slate-500 mb-3 border border-slate-200/60">
            <p className="font-bold text-blue-600">Physician Account</p>
            <p>DR. BEZA_KEMAL (MD)</p>
            <p className="text-slate-400">Internal Med Ward</p>
          </div>
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 text-xs font-bold uppercase tracking-wider rounded-xl transition">
            <LogOut size={14} /> Close Session
          </button>
        </div>
      </aside>

      {/* WORKSPACE AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200/80 sticky top-0 px-8 py-5 z-20 flex justify-between items-center">
          <h1 className="text-sm font-black tracking-widest text-slate-900 uppercase font-mono">
            {activeTab === 'dashboard' && "Physician Overview & Clinical Metrics"}
            {activeTab === 'consultationQueue' && (selectedCase ? "Active Electronic Medical Record (EMR) Encounter" : "Assigned Patient Triaged Caseload")}
          </h1>
          <span className="text-[11px] font-mono font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1.5 rounded-lg uppercase">Secure Encrypted Token Node</span>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">

          {/* CLINICAL ANALYTICS DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { label: 'Assigned Consults Pending', value: cases.length, desc: 'Awaiting primary medical assessment loops.' },
                  { label: 'Completed Encounters Today', value: '18 Cases', desc: 'Securely dispatched to pharmacy or labs.' },
                  { label: 'Average Consult Window', value: '14.2 Minutes', desc: 'Patient charting conversion efficiency.' }
                ].map((m, idx) => (
                  <div key={idx} className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{m.label}</span>
                    <span className="text-3xl font-black text-slate-900 mt-2 block font-mono">{m.value}</span>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{m.desc}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-3">Physician Notice Bulletin</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Ensure all encounter files contain complete diagnostic tracking parameters before submitting prescriptions. ICD-11 coding constraints are actively enforced dynamically by the medical core servers.</p>
              </div>
            </div>
          )}

          {/* CONSULTATION TARGET QUEUE */}
          {activeTab === 'consultationQueue' && !selectedCase && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cases.map((c) => (
                  <div key={c.mrn} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-blue-500 transition flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">{c.name}</h4>
                          <p className="text-xs font-mono text-blue-600 font-bold mt-0.5">MRN Identifier Token: {c.mrn}</p>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${c.triage.includes('Orange') ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-yellow-50 text-yellow-600 border border-yellow-100'}`}>{c.triage}</span>
                      </div>

                      {/* Display vital signs collected during triage */}
                      <div className="grid grid-cols-4 gap-2 mt-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center text-slate-700">
                        <div><span className="text-[9px] font-bold text-slate-400 uppercase block">BP</span><span className="text-xs font-black font-mono">{c.bp}</span></div>
                        <div><span className="text-[9px] font-bold text-slate-400 uppercase block">PR</span><span className="text-xs font-black font-mono">{c.pr} bpm</span></div>
                        <div><span className="text-[9px] font-bold text-slate-400 uppercase block">Temp</span><span className="text-xs font-black font-mono">{c.temp}°C</span></div>
                        <div><span className="text-[9px] font-bold text-slate-400 uppercase block">SpO2</span><span className="text-xs font-black font-mono">{c.spo2}</span></div>
                      </div>

                      <p className="text-xs text-slate-500 mt-4 leading-relaxed line-clamp-2"><strong className="text-slate-700">Stated Intake Complaint:</strong> {c.complaint}</p>
                    </div>

                    <button onClick={() => setSelectedCase(c)} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition shadow-sm flex items-center justify-center gap-1">
                      Initiate Consultation Room <ChevronRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PHYSICIAN ENCOUNTER CLINICAL WORKSPACE */}
          {selectedCase && (
            <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden animate-fadeIn text-slate-800">
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold uppercase tracking-wider">{selectedCase.name}</h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">MRN Index Node: {selectedCase.mrn} | Sex/Age: {selectedCase.gender}, {selectedCase.age} Yrs</p>
                </div>
                <button onClick={() => setSelectedCase(null)} className="text-xs bg-slate-800 text-slate-400 px-3 py-1.5 rounded-lg hover:text-white">Exit Case File</button>
              </div>

              {/* Patient Vitals Quick Banner */}
              <div className="px-8 py-3.5 bg-blue-50 border-b border-slate-200/60 flex flex-wrap gap-6 text-xs text-slate-600 font-medium">
                <div>BP Status: <strong className="text-slate-900 font-mono font-bold">{selectedCase.bp} mmHg</strong></div>
                <div>Pulse Frequency: <strong className="text-slate-900 font-mono font-bold">{selectedCase.pr} BPM</strong></div>
                <div>Core Temperature: <strong className="text-slate-900 font-mono font-bold">{selectedCase.temp} °C</strong></div>
                <div>Oxygen Index: <strong className="text-slate-900 font-mono font-bold">{selectedCase.spo2}</strong></div>
                <div className="ml-auto text-[11px] font-bold text-orange-600 uppercase tracking-wider">Triage Level: {selectedCase.triage}</div>
              </div>

              <form onSubmit={finalizeEncounter} className="p-8 space-y-6">
                
                {/* Subjective Notes */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">History of Present Illness (HPI) / Progress Notes *</label>
                  <textarea value={encounter.historyPresentIllness} onChange={(e) => setEncounter({...encounter, historyPresentIllness: e.target.value})} required rows={3} placeholder="Document symptomatic trajectory, historical systemic reviews, and patient presentations details..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                {/* Objective Notes */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Physical Examination Findings *</label>
                  <textarea value={encounter.physicalExamination} onChange={(e) => setEncounter({...encounter, physicalExamination: e.target.value})} required rows={3} placeholder="Document systematic inspection, percussion, auscultation notes and objective updates..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                {/* Assessment Coding */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">ICD-11 Primary Diagnostic Formulation Title *</label>
                  <input type="text" value={encounter.icd11Diagnosis} onChange={(e) => setEncounter({...encounter, icd11Diagnosis: e.target.value})} required placeholder="Enter formal diagnostic classification title or numeric codes..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <hr className="border-slate-100" />

                {/* Lab Order Module */}
                <div className="space-y-3 bg-slate-50/60 p-5 rounded-2xl border border-slate-200/60">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1"><FlaskConical size={12} className="text-blue-600" /> Laboratory Diagnostics Request Sheet</label>
                  <div className="flex gap-3">
                    <input type="text" value={currentLab} onChange={(e) => setCurrentLab(e.target.value)} placeholder="e.g. CBC with Diff, Liver Function Test (LFT), Serum Creatinine" className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none" />
                    <button type="button" onClick={addLabLine} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition">Add Panel</button>
                  </div>
                  {encounter.labRequests.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {encounter.labRequests.map((lab, index) => (
                        <span key={index} className="bg-blue-50 text-blue-700 border border-blue-200/60 text-[10px] font-bold px-2.5 py-1 rounded-md">{lab}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Electronic Prescription Module */}
                <div className="space-y-4 bg-slate-50/60 p-5 rounded-2xl border border-slate-200/60">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1"><Pill size={12} className="text-emerald-600" /> Secure E-Prescription Order Interface</label>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input type="text" value={currentDrug.name} onChange={(e) => setCurrentDrug({...currentDrug, name: e.target.value})} placeholder="Medication Name" className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none" />
                    <input type="text" value={currentDrug.dosage} onChange={(e) => setCurrentDrug({...currentDrug, dosage: e.target.value})} placeholder="Dosage (e.g. 500mg)" className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none" />
                    <select value={currentDrug.frequency} onChange={(e) => setCurrentDrug({...currentDrug, frequency: e.target.value})} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none">
                      <option>Once Daily (OD)</option><option>Twice Daily (BID)</option>
                      <option>Three Times Daily (TID)</option><option>Four Times Daily (QID)</option>
                      <option>As Needed (PRN)</option>
                    </select>
                    <input type="text" value={currentDrug.duration} onChange={(e) => setCurrentDrug({...currentDrug, duration: e.target.value})} placeholder="Duration (e.g. 7 Days)" className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none" />
                  </div>
                  <button type="button" onClick={addDrugLine} className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition shadow-sm">Authorize & Stage Medication Line</button>
                  
                  {encounter.prescriptionLines.length > 0 && (
                    <ul className="space-y-1.5 pt-2 border-t border-slate-200/60 font-mono text-[11px] text-slate-700 list-disc pl-4">
                      {encounter.prescriptionLines.map((line, index) => (
                        <li key={index} className="font-semibold text-slate-900">{line}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Final Form Execution Buttons */}
                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setSelectedCase(null)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-xl transition">Postpone</button>
                  <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-md">Authenticate & Push Encounter</button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}