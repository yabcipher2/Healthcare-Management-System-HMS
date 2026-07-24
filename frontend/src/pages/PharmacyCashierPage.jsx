import React, { useState } from "react";

export default function PharmacyCashierPage({ onLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Animation/notification feedback state
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // High-fidelity Mock Pharmacy Queue
  const [pharmacyQueue, setPharmacyQueue] = useState([
    {
      id: "P-409",
      name: "Aster Asfaw",
      phone: "0911778899",
      age: 45,
      gender: "Female",
      prescribedBy: "Dr. Yonas Mulugeta",
      date: "June 4, 2026",
      prescriptions: [
        { id: "M1", name: "Amoxicillin 500mg Caps", price: 180, qty: 2, checked: true },
        { id: "M2", name: "Paracetamol 500mg Tabs", price: 45, qty: 1, checked: true },
        { id: "M3", name: "Omeprazole 20mg Delayed-Release", price: 320, qty: 1, checked: true }
      ]
    },
    {
      id: "P-410",
      name: "Tariku Bekele",
      phone: "0944112233",
      age: 52,
      gender: "Male",
      prescribedBy: "Dr. Abraham Alula",
      date: "June 4, 2026",
      prescriptions: [
        { id: "M4", name: "Metformin 500mg ER", price: 150, qty: 3, checked: true },
        { id: "M5", name: "Atorvastatin 20mg", price: 410, qty: 1, checked: true }
      ]
    }
  ]);

  const handleSelectPatient = (patient) => {
    setPaymentSuccess(false);
    setSelectedPatient({ ...patient, prescriptions: patient.prescriptions.map(m => ({ ...m })) });
  };

  const toggleMed = (medId) => {
    setSelectedPatient(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.map(med => 
        med.id === medId ? { ...med, checked: !med.checked } : med
      )
    }));
  };

  // Compute live pharmaceutical calculation values
  const totalItemsCount = selectedPatient ? selectedPatient.prescriptions.filter(m => m.checked).length : 0;
  const totalPrice = selectedPatient ? selectedPatient.prescriptions.reduce((acc, med) => med.checked ? acc + (med.price * med.qty) : acc, 0) : 0;

  const handleProcessPayment = (e) => {
    e.preventDefault();
    setPaymentSuccess(true);
    
    // Simulate updating backend queue records after CSS transition delay
    setTimeout(() => {
      setPharmacyQueue(prev => prev.filter(p => p.id !== selectedPatient.id));
      setSelectedPatient(null);
      setPaymentSuccess(false);
      setReferenceNumber("");
      setPaymentMethod("Cash");
    }, 2000);
  };

  // Filter queue by Name or Phone
  const filteredRequests = pharmacyQueue.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.phone.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex font-sans overflow-hidden">
      
      {/* SIDEBAR BLOCK */}
      <aside className={`bg-slate-950 border-r border-slate-800 transition-all duration-300 ease-in-out flex flex-col justify-between z-20 ${isSidebarOpen ? "w-64" : "w-20"}`}>
        <div>
          <div className="p-5 flex items-center gap-3 border-b border-slate-800 h-16">
            <div className="bg-emerald-600 p-2 rounded-lg text-white font-black text-xl tracking-wider">M</div>
            {isSidebarOpen && (
              <div className="animate-fadeIn">
                <h2 className="font-bold text-sm leading-none text-white">MESRA DIGITAL</h2>
                <span className="text-[10px] uppercase text-emerald-400 font-semibold tracking-widest">HMS Billing v1.2</span>
              </div>
            )}
          </div>

          <nav className="p-4 space-y-1">
            <button className="w-full flex items-center gap-4 px-3 py-3 rounded-xl bg-emerald-600 text-white font-medium transition-all">
              <span className="text-xl">🧾</span>
              {isSidebarOpen && <span className="animate-fadeIn">Pharmacy Cashier</span>}
            </button>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold px-3 pt-4 pb-1">
              {isSidebarOpen ? "Active Session Controls" : "•••"}
            </div>
            <div className="px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-400">
              👤 {isSidebarOpen ? "Cashier Terminal #04" : "#04"}
            </div>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button onClick={onLogout} className="w-full flex items-center gap-4 px-3 py-3 text-red-400 hover:bg-red-950/40 rounded-xl transition-all group">
            <span className="text-xl group-hover:translate-x-1 transition-transform">🚪</span>
            {isSidebarOpen && <span className="font-medium">Secure Log Out</span>}
          </button>
        </div>
      </aside>

      {/* CORE WORKSPACE APPLICATION SPACE */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-slate-900">
        
        {/* DASHBOARD STATUS BAR */}
        <header className="bg-slate-950/80 backdrop-blur border-b border-slate-800 h-16 px-6 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition">
              ☰
            </button>
            <h1 className="text-lg font-semibold text-white">Pharmacy Invoicing Ledger</h1>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <div className="hidden sm:block">📍 Addis Ababa, ET</div>
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" title="System online sync"></div>
          </div>
        </header>

        {/* METRICS METADATA BANNER AREA */}
        <section className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between shadow-xl">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Pharmacy Bills</p>
              <h3 className="text-2xl font-bold font-mono text-emerald-400 mt-1">{pharmacyQueue.length} Prescriptions</h3>
            </div>
            <div className="text-3xl bg-emerald-950/50 p-3 rounded-xl border border-emerald-900/50 text-emerald-400">💊</div>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between shadow-xl">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">System Local Currency</p>
              <h3 className="text-2xl font-bold text-white mt-1">ETB <span className="text-xs text-slate-400">(Ethiopian Birr)</span></h3>
            </div>
            <div className="text-3xl bg-amber-950/50 p-3 rounded-xl border border-amber-900/50 text-amber-400">🇪🇹</div>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between shadow-xl">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Disbursement Signals</p>
              <h3 className="text-xs font-medium text-slate-300 mt-2">Auto-Unlocks Dispensary</h3>
            </div>
            <div className="text-3xl bg-blue-950/50 p-3 rounded-xl border border-blue-900/50 text-blue-400">🚀</div>
          </div>
        </section>

        {/* DATA UTILITY SECTION GRID */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
          
          {/* QUEUE CONTROL BOX */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col h-[calc(100vh-280px)] shadow-2xl">
            <div className="mb-4">
              <h2 className="font-bold text-white tracking-wide mb-2">Awaiting Pharmacy Payment</h2>
              <div className="relative">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name or phone..." 
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 pl-9 text-sm focus:outline-none focus:border-emerald-500 text-slate-100 placeholder-slate-500"
                />
                <span className="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredRequests.length > 0 ? (
                filteredRequests.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => handleSelectPatient(p)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 transform hover:-translate-y-0.5 ${selectedPatient?.id === p.id ? "bg-emerald-950/40 border-emerald-600 shadow-lg shadow-emerald-950/20" : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-semibold text-slate-200 text-sm">{p.name}</p>
                      <span className="bg-slate-800 text-slate-400 text-[10px] font-mono px-2 py-0.5 rounded-md border border-slate-700">{p.id}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>📱 {p.phone}</span>
                      <span>{p.prescriptions.length} Meds</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-500">No matching prescriptions found.</div>
              )}
            </div>
          </div>

          {/* CHECKOUT SEGMENT WINDOW */}
          <div className="lg:col-span-2 bg-slate-950 rounded-2xl border border-slate-800 p-6 flex flex-col h-[calc(100vh-280px)] justify-between shadow-2xl relative">
            
            {/* SUCCESS SLIDE-IN OVERLAY ANIMATION */}
            {paymentSuccess && (
              <div className="absolute inset-0 bg-slate-950/95 z-30 rounded-2xl flex flex-col justify-center items-center text-center animate-fadeIn p-6 transition-all duration-300">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center text-3xl border border-emerald-500/30 animate-bounce mb-4">✓</div>
                <h3 className="text-xl font-bold text-white mb-1">Payment Processed Successfully!</h3>
                <p className="text-xs text-slate-400 max-w-sm">Prescription receipt logged into audit systems. Notification signal pushed to Pharmacist Dispensation Depot for packing.</p>
              </div>
            )}

            {selectedPatient ? (
              <form onSubmit={handleProcessPayment} className="h-full flex flex-col justify-between">
                <div className="overflow-y-auto pr-1 space-y-5">
                  
                  {/* Demographics details segment */}
                  <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                      <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">Pharmacy Bill</span>
                      <h2 className="text-xl font-bold text-white mt-0.5">{selectedPatient.name}</h2>
                      <p className="text-xs text-slate-400 mt-1">Prescribed by: <span className="text-slate-300 font-medium">{selectedPatient.prescribedBy}</span></p>
                    </div>
                    <div className="flex gap-2 text-xs font-mono">
                      <span className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">Age: {selectedPatient.age} ({selectedPatient.gender})</span>
                      <span className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-emerald-400 font-semibold">Ready to Bill</span>
                    </div>
                  </div>

                  {/* Itemized medication checklist audit panel */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Medication Manifest Check</h3>
                    <div className="space-y-2">
                      {selectedPatient.prescriptions.map(med => (
                        <label key={med.id} className={`flex justify-between items-center p-3.5 rounded-xl border cursor-pointer transition-all ${med.checked ? "bg-slate-900 border-slate-700/80 text-white" : "bg-slate-900/30 border-slate-900 text-slate-500"}`}>
                          <div className="flex items-center gap-3">
                            <input 
                              type="checkbox" 
                              checked={med.checked} 
                              onChange={() => toggleMed(med.id)} 
                              className="w-4 h-4 rounded text-emerald-600 bg-slate-800 border-slate-700 focus:ring-0 focus:ring-offset-0" 
                            />
                            <div>
                              <span className="text-sm font-medium block">{med.name}</span>
                              <span className="text-xs text-slate-500 font-mono">Quantity Segment: {med.qty} × {med.price} ETB</span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-slate-200 text-sm">{(med.price * med.qty).toFixed(2)} ETB</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Accounting Ledger configurations */}
                  <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Financial Payment Gateway</label>
                      <select 
                        value={paymentMethod} 
                        onChange={(e) => setPaymentMethod(e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                      >
                        <option>Cash</option>
                        <option>Telebirr</option>
                        <option>CBE Birr</option>
                        <option>Bank Transfer (CBE/Awash)</option>
                      </select>
                    </div>
                    {paymentMethod !== "Cash" && (
                      <div className="animate-fadeIn">
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Reference Code / Transaction ID</label>
                        <input 
                          type="text" 
                          required
                          value={referenceNumber}
                          onChange={(e) => setReferenceNumber(e.target.value)}
                          placeholder="e.g. TXN987654321" 
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 placeholder-slate-600 font-mono" 
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Processing calculations invoice footer panels */}
                <div className="border-t border-slate-800 pt-4 mt-4 bg-slate-950">
                  <div className="flex justify-between items-center mb-4 px-1">
                    <div>
                      <span className="text-xs font-medium text-slate-400">Total Charged Inventory</span>
                      <p className="text-xs text-slate-300 font-semibold">{totalItemsCount} distinct items selected</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-slate-400">Total Prescription Cost</span>
                      <p className="text-2xl font-black text-emerald-500 font-mono tracking-tight">{totalPrice.toFixed(2)} ETB</p>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={totalPrice === 0}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-950/50 transition-all transform active:scale-[0.99]"
                  >
                    Confirm Ledger Payment & Release Inventory
                  </button>
                </div>
              </form>
            ) : (
              <div className="h-full flex flex-col justify-center items-center text-center p-6 text-slate-500">
                <span className="text-4xl mb-3">📂</span>
                <p className="text-sm font-medium">Select a patient prescription queue sequence from the left ledger index panel to display current line-item billing modules.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
