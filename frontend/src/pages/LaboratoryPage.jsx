import React, { useState } from 'react';
import { 
  FlaskConical, Activity, LayoutDashboard, TestTube, ClipboardCheck,
  Search, CheckCircle, AlertTriangle, ShieldAlert, Clock, 
  Beaker, Users, LogOut, Plus, ChevronRight, BarChart3, Filter, Sliders
} from 'lucide-react';

export default function LaboratoryPage({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, activeOrders, panelInventory
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // 1. Dynamic Laboratory Panels & Test Directory
  const [labPanels] = useState([
    { code: "LAB-CBC", name: "Complete Blood Count (CBC)", section: "Hematology", turnaround: "45 Mins", cost: "Local Sync", status: "Operational" },
    { code: "LAB-LFT", name: "Liver Function Test (LFT)", section: "Clinical Chemistry", turnaround: "2 Hours", cost: "Local Sync", status: "Operational" },
    { code: "LAB-RBS", name: "Random Blood Sugar (RBS)", section: "Enzymology", turnaround: "15 Mins", cost: "Local Sync", status: "Operational" },
    { code: "LAB-WID", name: "Widal & Weil-Felix Test", section: "Serology", turnaround: "1 Hour", cost: "Local Sync", status: "Operational" },
    { code: "LAB-UA", name: "Urinalysis Routine", section: "Microscopy", turnaround: "30 Mins", cost: "Local Sync", status: "Operational" },
    { code: "LAB-CR", name: "Serum Creatinine", section: "Renal Panel", turnaround: "1 Hour", cost: "Local Sync", status: "Operational" }
  ]);

  // 2. Live Electronic Work Order Queue (Passed from Physicians)
  const [orders, setOrders] = useState([
    {
      id: "LAB-9902",
      patientName: "Almaz Tekle",
      mrn: "MR-2026-004",
      age: "38",
      gender: "Female",
      requestedBy: "Dr. Beza Kemal",
      timestamp: "10:20 AM",
      urgency: "High Priority",
      panels: ["Complete Blood Count (CBC)", "Serum Creatinine"],
      specimen: "Whole Blood (EDTA Tube)",
      resultsLogged: { wbc: '', rbc: '', creatinine: '' }
    },
    {
      id: "LAB-9905",
      patientName: "Yusuf Mohammed",
      mrn: "MR-2026-009",
      age: "51",
      gender: "Male",
      requestedBy: "Dr. Beza Kemal",
      timestamp: "10:45 AM",
      urgency: "Routine",
      panels: ["Random Blood Sugar (RBS)", "Urinalysis Routine"],
      specimen: "Fluoride Blood & Random Urine",
      resultsLogged: { rbs: '', protein: '', glucose: '' }
    }
  ]);

  const handleResultChange = (panelKey, value) => {
    setSelectedOrder(prev => ({
      ...prev,
      resultsLogged: {
        ...prev.resultsLogged,
        [panelKey]: value
      }
    }));
  };

  // Submit Analyzed Results to Central EMR Server
  const handleVerifyAndSubmit = (e) => {
    e.preventDefault();
    
    // Simulate dynamic diagnostic validation flags
    alert(`Laboratory Analysis Token ${selectedOrder.id} successfully authenticated, signed by Lab Tech, and released to Doctor EMR timeline.`);
    
    // Remove from active queue
    setOrders(prev => prev.filter(o => o.id !== selectedOrder.id));
    setSelectedOrder(null);
    setActiveTab('activeOrders');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      
      {/* SIDEBAR NAVIGATION PANEL */}
      <aside className="w-68 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 z-30">
        <div>
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200">
              <FlaskConical size={22} className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 tracking-tight text-md leading-none">MESRA <span className="text-blue-600">LAB</span></h3>
              <span className="text-[10px] text-slate-400 font-mono tracking-widest block mt-1 uppercase font-bold">Diagnostics Unit</span>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            <button 
              onClick={() => { setActiveTab('dashboard'); setSelectedOrder(null); }} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <LayoutDashboard size={16} /> Hub Throughput
            </button>
            <button 
              onClick={() => { setActiveTab('activeOrders'); setSelectedOrder(null); }} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'activeOrders' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <TestTube size={16} /> Work Orders ({orders.length})
            </button>
            <button 
              onClick={() => { setActiveTab('panelInventory'); setSelectedOrder(null); }} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'panelInventory' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <Beaker size={16} /> Test Directory
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3 text-[11px] font-mono text-slate-500 mb-3 border border-slate-200/60">
            <p className="font-bold text-blue-600">Laboratory Terminal</p>
            <p>Analyzer Sync: ONLINE</p>
            <p>Technologist: K. Yohannes</p>
          </div>
          <button 
            onClick={onLogout} 
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
          >
            <LogOut size={14} /> Close Session
          </button>
        </div>
      </aside>

      {/* CORE WORKSPACE AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200/80 sticky top-0 px-8 py-5 z-20 flex justify-between items-center">
          <h1 className="text-sm font-black tracking-widest text-slate-900 uppercase font-mono">
            {activeTab === 'dashboard' && "Analyzer Performance & Load Metrics"}
            {activeTab === 'activeOrders' && (selectedOrder ? "Biochemical Assaying Entry" : "Incoming Specimen Accession Queue")}
            {activeTab === 'panelInventory' && "Institutional Pathology Test Registry"}
          </h1>
          <div className="flex items-center gap-2 font-mono text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/40">
            <Clock size={12} className="text-blue-600" /> Active System Time: <span className="font-bold text-slate-800">11:35 PM</span>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">

          {/* LABORATORY INTELLIGENT DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Pending Accessions', value: orders.length, icon: <TestTube size={18} />, bg: 'bg-blue-600 text-white' },
                  { label: 'High Priority Triggers', value: orders.filter(o => o.urgency.includes("High")).length + " Orders", icon: <ShieldAlert size={18} />, bg: 'bg-rose-50 text-rose-600 border border-rose-100' },
                  { label: 'Avg Analyzer Run Cycle', value: '22.4 Mins', icon: <Clock size={18} />, bg: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
                  { label: 'Completed Panels Today', value: '68 Profiles', icon: <ClipboardCheck size={18} />, bg: 'bg-slate-100 text-slate-700' }
                ].map((stat, idx) => (
                  <div key={idx} className="p-5 rounded-2xl flex items-center justify-between shadow-sm bg-white border border-slate-200/60">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{stat.label}</span>
                      <span className="text-2xl font-black text-slate-900 mt-1 block font-mono">{stat.value}</span>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bg}`}>{stat.icon}</div>
                  </div>
                ))}
              </div>

              {/* Pathology Quality Control Information Block */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BarChart3 className="text-blue-600" size={16} /> Real-Time Analyzer Interface Sync
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                  This workstation features dynamic local interface hooks with centralized hematology and biochemistry analyzers. Specimens scanned via regional institutional barcodes will register raw evaluation logs directly into the pending work order profiles below.
                </p>
              </div>
            </div>
          )}

          {/* ACTIVE INVESTIGATION QUEUE */}
          {activeTab === 'activeOrders' && !selectedOrder && (
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
                      <th className="p-4 px-6">Accession ID</th>
                      <th className="p-4 px-6">Patient Identifier</th>
                      <th className="p-4 px-6">Requested Panels</th>
                      <th className="p-4 px-6">Specimen Container</th>
                      <th className="p-4 px-6">Physician</th>
                      <th className="p-4 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {orders.filter(o => o.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || o.mrn.includes(searchQuery)).map(order => (
                      <tr key={order.id} className="hover:bg-slate-50/60 transition-all">
                        <td className="p-4 px-6 font-mono text-blue-600 font-bold">{order.id}</td>
                        <td className="p-4 px-6">
                          <span className="text-slate-900 font-bold text-sm block">{order.patientName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">MRN: {order.mrn} • {order.gender}, {order.age} Yrs</span>
                        </td>
                        <td className="p-4 px-6">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {order.panels.map((p, i) => (
                              <span key={i} className="bg-slate-100 text-slate-700 text-[9px] font-bold px-2 py-0.5 rounded-md">{p}</span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 px-6 font-mono text-slate-500 text-[11px]">{order.specimen}</td>
                        <td className="p-4 px-6 text-slate-600 font-medium">{order.requestedBy}</td>
                        <td className="p-4 px-6 text-right">
                          <button 
                            onClick={() => setSelectedOrder(order)} 
                            className={`inline-flex items-center gap-1.5 px-4 py-2 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm ${
                              order.urgency.includes("High") ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                          >
                            Input Logs <ChevronRight size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* BIOCHEMICAL ASSAY RESULTS ENTRY LAB */}
          {activeTab === 'activeOrders' && selectedOrder && (
            <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden text-slate-800 animate-fadeIn">
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold uppercase tracking-wider">{selectedOrder.patientName}</h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">MRN Profile ID: {selectedOrder.mrn} | Specimen: {selectedOrder.specimen}</p>
                </div>
                <span className="bg-rose-600 text-white text-[10px] font-mono font-black px-2.5 py-1 rounded-md uppercase tracking-widest animate-pulse">{selectedOrder.urgency}</span>
              </div>

              <form onSubmit={handleVerifyAndSubmit} className="p-8 space-y-6">
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-xs text-blue-900 font-medium">
                  <strong>Clinical Orders Released by:</strong> {selectedOrder.requestedBy} on {selectedOrder.timestamp}
                </div>

                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest block pt-2 border-b border-slate-100 pb-2">Quantitative Metrics Acquisition</h3>

                {/* Render Dynamic Form Fields Based on Requested Profiles */}
                {selectedOrder.panels.includes("Complete Blood Count (CBC)") && (
                  <div className="space-y-4 bg-slate-50/60 p-5 rounded-2xl border border-slate-200/40">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Hematology - CBC Parameters</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">WBC Count (×10^9/L) [Ref: 4.0 - 11.0]</label>
                        <input type="text" required value={selectedOrder.resultsLogged.wbc} onChange={(e) => handleResultChange('wbc', e.target.value)} placeholder="e.g. 7.2" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">RBC Count (×10^12/L) [Ref: 4.5 - 5.9]</label>
                        <input type="text" required value={selectedOrder.resultsLogged.rbc} onChange={(e) => handleResultChange('rbc', e.target.value)} placeholder="e.g. 5.1" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  </div>
                )}

                {selectedOrder.panels.includes("Serum Creatinine") && (
                  <div className="space-y-4 bg-slate-50/60 p-5 rounded-2xl border border-slate-200/40">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Renal Function Parameters</h4>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Serum Creatinine (mg/dL) [Ref: 0.7 - 1.3]</label>
                      <input type="text" required value={selectedOrder.resultsLogged.creatinine} onChange={(e) => handleResultChange('creatinine', e.target.value)} placeholder="e.g. 0.95" className="w-full max-w-md px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                )}

                {selectedOrder.panels.includes("Random Blood Sugar (RBS)") && (
                  <div className="space-y-4 bg-slate-50/60 p-5 rounded-2xl border border-slate-200/40">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Enzymology / Metabolic Screen</h4>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Plasma Glucose (mg/dL) [Ref: 70 - 140]</label>
                      <input type="text" required value={selectedOrder.resultsLogged.rbs} onChange={(e) => handleResultChange('rbs', e.target.value)} placeholder="e.g. 112" className="w-full max-w-md px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setSelectedOrder(null)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-xl transition-all">Cancel Run</button>
                  <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1">Verify & Transmit Analytics</button>
                </div>
              </form>
            </div>
          )}

          {/* PATHOLOGY DIAGNOSTIC DIRECTORY */}
          {activeTab === 'panelInventory' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 font-mono">
                      <th className="p-4 px-6">Panel Code</th>
                      <th className="p-4 px-6">Investigation Profile Title</th>
                      <th className="p-4 px-6">Laboratory Section</th>
                      <th className="p-4 px-6">Standard Turnaround (TAT)</th>
                      <th className="p-4 px-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {labPanels.map(panel => (
                      <tr key={panel.code} className="hover:bg-slate-50/60 transition-all">
                        <td className="p-4 px-6 font-mono font-bold text-blue-600">{panel.code}</td>
                        <td className="p-4 px-6 text-slate-900 font-bold text-sm">{panel.name}</td>
                        <td className="p-4 px-6 font-mono text-slate-500">{panel.section}</td>
                        <td className="p-4 px-6 text-slate-600">{panel.turnaround}</td>
                        <td className="p-4 px-6 text-right">
                          <span className="inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-md">
                            {panel.status}
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