import React, { useState, useEffect } from 'react';
import { 
  Activity, Heart, Thermometer, Wind, AlertTriangle, Users, 
  CheckCircle, Clock, LayoutDashboard, FileText, Search, 
  ChevronRight, ArrowUpRight, Filter, ShieldAlert, Settings, LogOut 
} from 'lucide-react';

export default function TriagePage({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, waitingList, recordVitals
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [triageFilter, setTriageFilter] = useState('All');
  const hospitalLogo = "/mesra icon.png";

  // Core Mock Waiting Queue
  const [queue, setQueue] = useState([
    { id: "TR-0921", name: "Tolosa Assefa", age: "45", gender: "Male", arrivalTime: "09:12 AM", complaint: "Severe crushing chest pain, radiating to left arm.", status: "Pending" },
    { id: "TR-0924", name: "Chaltu Desta", age: "29", gender: "Female", arrivalTime: "09:28 AM", complaint: "High grade fever with persistent dry cough.", status: "Pending" },
    { id: "TR-0925", name: "Mekonnen Kebede", age: "62", gender: "Male", arrivalTime: "09:35 AM", complaint: "Open fracture on right lower limb with active bleeding.", status: "Pending" }
  ]);

  // Vitals Registry State
  const [vitals, setVitals] = useState({
    bpSystolic: '', bpDiastolic: '', heartRate: '', temperature: '',
    spo2: '', respiratoryRate: '', weight: '', randomBloodSugar: '',
    triageCategory: '', secondaryUrgencyNotes: ''
  });

  // Dynamic Triage Color Calculator based on Vitals Metrics
  useEffect(() => {
    const sys = parseInt(vitals.bpSystolic);
    const pulse = parseInt(vitals.heartRate);
    const temp = parseFloat(vitals.temperature);
    const ox = parseInt(vitals.spo2);

    if (!sys && !pulse && !temp && !ox) return;

    if ((ox && ox < 90) || (sys && sys < 80) || (pulse && pulse > 130)) {
      setVitals(prev => ({ ...prev, triageCategory: 'Red (Resuscitation)' }));
    } else if ((ox && ox >= 90 && ox < 94) || (sys && sys >= 160) || (temp && temp > 39)) {
      setVitals(prev => ({ ...prev, triageCategory: 'Orange (Emergent)' }));
    } else if ((temp && temp >= 38) || (pulse && pulse > 100)) {
      setVitals(prev => ({ ...prev, triageCategory: 'Yellow (Urgent)' }));
    } else {
      setVitals(prev => ({ ...prev, triageCategory: 'Green (Non-Urgent)' }));
    }
  }, [vitals.bpSystolic, vitals.heartRate, vitals.temperature, vitals.spo2]);

  const handleVitalChange = (e) => {
    const { name, value } = e.target;
    setVitals(prev => ({ ...prev, [name]: value }));
  };

  const handleTriageSubmit = (e) => {
    e.preventDefault();
    // Simulate real routing data serialization
    alert(`Vitals Logged Successfully! Patient ${selectedPatient.name} categorized as ${vitals.triageCategory} and dispatched to Doctor queue.`);
    setQueue(prev => prev.filter(p => p.id !== selectedPatient.id));
    setSelectedPatient(null);
    setVitals({ bpSystolic: '', bpDiastolic: '', heartRate: '', temperature: '', spo2: '', respiratoryRate: '', weight: '', randomBloodSugar: '', triageCategory: '', secondaryUrgencyNotes: '' });
    setActiveTab('waitingList');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-68 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 z-30">
        <div>
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <img src={hospitalLogo} alt="Mesra Logo" className="w-10 h-10 object-contain rounded-xl" />
            <div>
              <h3 className="font-black text-slate-900 tracking-tight text-md leading-none">MESRA <span className="text-blue-600">TRIAGE</span></h3>
              <span className="text-[10px] text-slate-400 font-mono tracking-widest block mt-1 uppercase font-bold">Vital Screening</span>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            <button onClick={() => { setActiveTab('dashboard'); setSelectedPatient(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
              <LayoutDashboard size={16} /> Dashboard Stats
            </button>
            <button onClick={() => { setActiveTab('waitingList'); setSelectedPatient(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition ${activeTab === 'waitingList' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
              <Users size={16} /> Intake Waiting Queue ({queue.length})
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3 text-[11px] font-mono text-slate-500 mb-3 border border-slate-200/60">
            <p className="font-bold text-blue-600">Station Node: TRIAGE-A</p>
            <p>Clerk ID: NURSE_REMA</p>
          </div>
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 text-xs font-bold uppercase tracking-wider rounded-xl transition">
            <LogOut size={14} /> Exit Station
          </button>
        </div>
      </aside>

      {/* WORKSPACE AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200/80 sticky top-0 px-8 py-5 z-20 flex justify-between items-center">
          <h1 className="text-sm font-black tracking-widest text-slate-900 uppercase font-mono">
            {activeTab === 'dashboard' && "Emergency Traffic Control Overview"}
            {activeTab === 'waitingList' && (selectedPatient ? "Vital Entry Validation" : "Incoming Triage Registry")}
          </h1>
          <div className="flex items-center gap-2 font-mono text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/40">
            <Clock size={12} className="text-blue-600" /> Active System Time: <span className="font-bold text-slate-800">10:42 AM</span>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">

          {/* TRIAGE DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Active In-Queue', value: queue.length, icon: <Users size={18} />, bg: 'bg-blue-600 text-white' },
                  { label: 'Red Criticals Today', value: '3 Patients', icon: <ShieldAlert size={18} />, bg: 'bg-rose-50 text-rose-600 border border-rose-100' },
                  { label: 'Avg Triage Clear Velocity', value: '4.8 Min', icon: <Clock size={18} />, bg: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
                  { label: 'Total Assessed Today', value: '42 Patients', icon: <CheckCircle size={18} />, bg: 'bg-slate-100 text-slate-700' }
                ].map((stat, idx) => (
                  <div key={idx} className={`p-5 rounded-2xl flex items-center justify-between shadow-sm bg-white border border-slate-200/60`}>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{stat.label}</span>
                      <span className="text-2xl font-black text-slate-900 mt-1 block">{stat.value}</span>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bg}`}>{stat.icon}</div>
                  </div>
                ))}
              </div>

              {/* Triage System Guidance Warning block */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <AlertTriangle className="text-amber-500" size={16} /> Automated Color Hierarchy Rules
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div className="p-3.5 bg-rose-50/60 border border-rose-100 rounded-xl"><span className="font-bold text-rose-700 block mb-1">RED LEVEL</span> SpO2 &lt; 90% | SBP &lt; 80 mmHg. Instantaneous Doctor Dispatch.</div>
                  <div className="p-3.5 bg-amber-50/60 border border-amber-100 rounded-xl"><span className="font-bold text-amber-700 block mb-1">ORANGE LEVEL</span> SpO2 90-94% | SBP &gt; 160 mmHg. High priority review.</div>
                  <div className="p-3.5 bg-yellow-50/60 border border-yellow-100 rounded-xl"><span className="font-bold text-yellow-700 block mb-1">YELLOW LEVEL</span> Temp &gt; 38°C | HR &gt; 100 bpm. Routine urgent sequence.</div>
                  <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl"><span className="font-bold text-emerald-700 block mb-1">GREEN LEVEL</span> Normal parameter boundaries. Stable clinical observation track.</div>
                </div>
              </div>
            </div>
          )}

          {/* WAITING QUEUE LIST */}
          {activeTab === 'waitingList' && !selectedPatient && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Filter live queue..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
                    {queue.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition">
                        <td className="p-4 px-6 font-mono text-blue-600 font-bold">{p.id}</td>
                        <td className="p-4 px-6 text-slate-900 font-bold text-sm">{p.name}</td>
                        <td className="p-4 px-6">{p.gender} ({p.age} Yrs)</td>
                        <td className="p-4 px-6 font-mono text-slate-500">{p.arrivalTime}</td>
                        <td className="p-4 px-6 max-w-xs truncate text-slate-500">{p.complaint}</td>
                        <td className="p-4 px-6 text-right">
                          <button onClick={() => setSelectedPatient(p)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-[11px] font-black uppercase tracking-wider rounded-xl hover:bg-blue-700 transition shadow-sm">
                            Screen Vitals <ChevronRight size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VITALS ENTRY SCREEN */}
          {selectedPatient && (
            <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden animate-fadeIn text-slate-800">
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold uppercase tracking-wider">{selectedPatient.name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Demographics: {selectedPatient.gender}, {selectedPatient.age} Yrs | ID Token: {selectedPatient.id}</p>
                </div>
                <span className="bg-blue-600 text-white text-xs font-mono font-bold px-3 py-1 rounded-lg">LIVE VITALS ACQUISITION</span>
              </div>

              <form onSubmit={handleTriageSubmit} className="p-8 space-y-6">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                  <strong>Stated Complaint at Intake:</strong> {selectedPatient.complaint}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1"><Heart size={12} className="text-rose-500" /> SBP (mmHg)</label>
                    <input type="number" name="bpSystolic" value={vitals.bpSystolic} onChange={handleVitalChange} placeholder="e.g. 120" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1"><Heart size={12} className="text-rose-400" /> DBP (mmHg)</label>
                    <input type="number" name="bpDiastolic" value={vitals.bpDiastolic} onChange={handleVitalChange} placeholder="e.g. 80" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1"><Activity size={12} className="text-red-500" /> Pulse (BPM)</label>
                    <input type="number" name="heartRate" value={vitals.heartRate} onChange={handleVitalChange} placeholder="e.g. 72" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1"><Thermometer size={12} className="text-orange-500" /> Temp (°C)</label>
                    <input type="number" step="0.1" name="temperature" value={vitals.temperature} onChange={handleVitalChange} placeholder="e.g. 36.7" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1"><Wind size={12} className="text-cyan-500" /> SpO2 (%)</label>
                    <input type="number" name="spo2" value={vitals.spo2} onChange={handleVitalChange} placeholder="e.g. 98" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Resp Rate (cpm)</label>
                    <input type="number" name="respiratoryRate" value={vitals.respiratoryRate} onChange={handleVitalChange} placeholder="e.g. 16" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Weight (kg)</label>
                    <input type="number" name="weight" value={vitals.weight} onChange={handleVitalChange} placeholder="e.g. 70" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">RBS (mg/dL)</label>
                    <input type="number" name="randomBloodSugar" value={vitals.randomBloodSugar} onChange={handleVitalChange} placeholder="e.g. 110" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Calculated System Category (Auto)</label>
                    <input type="text" name="triageCategory" value={vitals.triageCategory} readOnly className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-black text-blue-600 focus:outline-none font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Secondary Clinical Urgency Notes</label>
                    <input type="text" name="secondaryUrgencyNotes" value={vitals.secondaryUrgencyNotes} onChange={handleVitalChange} placeholder="Visible physical symptoms, altered state, etc." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setSelectedPatient(null)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-xl transition">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-md">Dispatch to Physician</button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}