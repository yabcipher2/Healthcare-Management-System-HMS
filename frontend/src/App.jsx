import React, { useState, useEffect } from "react";
import {
  Activity,
  Users,
  ClipboardList,
  Beaker,
  Pill,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Stethoscope,
  Clock,
  ShieldCheck,
  Menu,
  X,
  Star,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";

// --- LOGIN PAGE COMPONENT ---
const LoginPage = ({ onBackClick }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [currentImg, setCurrentImg] = useState(0);

  // Dynamic Bolder "Smart" Healthcare & Tech Photos
  const images = [
    "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=1400", 
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1400", 
    "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1400", 
    "https://images.unsplash.com/photo-1532187878418-9f110798e65f?auto=format&fit=crop&q=80&w=1400", 
    "https://images.unsplash.com/photo-1504439468489-c8920d796a29?auto=format&fit=crop&q=80&w=1400"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImg((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden font-sans">
      {/* Background with Darker/Bolder Overlay */}
      {images.map((img, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentImg ? "opacity-70" : "opacity-0"
          }`}
        >
          <img src={img} alt="Background" className="w-full h-full object-cover scale-105" />
          <div className="absolute inset-0 bg-slate-900/60 backdrop-saturate-150" />
        </div>
      ))}

      {/* Back Button */}
      <button 
        onClick={onBackClick}
        className="absolute top-8 left-8 z-50 flex items-center gap-2 text-indigo-900 hover:text-white transition-all font-black bg-white/80 hover:bg-indigo-600 backdrop-blur-md px-6 py-3 rounded-2xl border-2 border-white shadow-xl"
      >
        <ArrowLeft size={20} strokeWidth={3} /> Back to Home
      </button>

      {/* Login Card - Light Purple Aesthetic */}
      <div className="relative z-10 w-full max-w-md px-6 animate-fade-in-up">
        <div className="bg-[#EEF2FF] py-12 px-10 shadow-[0_20px_50px_rgba(79,70,229,0.5)] rounded-[3rem] border-4 border-white">
          <div className="text-center mb-10">
            <div className="flex justify-center items-center gap-3 text-indigo-700 font-black text-4xl mb-4">
              <Activity size={44} strokeWidth={3} className="animate-pulse" />
              <span className="tracking-tighter">HMS <span className="text-slate-900">Digital</span></span>
            </div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">System Login</h2>
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="group">
              <label className="block text-sm font-black text-indigo-900 uppercase tracking-widest mb-2 ml-1">Identity/Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-indigo-600">
                  <Mail size={20} strokeWidth={2.5} />
                </div>
                <input
                  type="email"
                  className="block w-full pl-12 pr-4 py-5 border-2 border-indigo-100 rounded-2xl focus:border-indigo-500 transition-all outline-none bg-white font-bold text-slate-900 shadow-inner"
                  placeholder="admin@hms.com"
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-sm font-black text-indigo-900 uppercase tracking-widest mb-2 ml-1">Access Key</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-indigo-600">
                  <Lock size={20} strokeWidth={2.5} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className="block w-full pl-12 pr-12 py-5 border-2 border-indigo-100 rounded-2xl focus:border-indigo-500 transition-all outline-none bg-white font-bold text-slate-900 shadow-inner"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-indigo-400 hover:text-indigo-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-5 rounded-2xl shadow-2xl text-lg font-black text-white bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] transition-all active:scale-95 uppercase tracking-widest mt-4"
            >
              Sign In Now
            </button>
          </form>

          <div className="mt-10 text-center">
             <div className="inline-block px-4 py-2 bg-indigo-100/50 rounded-full border border-indigo-200">
                <p className="text-[11px] text-indigo-800 font-black uppercase tracking-[0.2em]">
                   Security Status: Level 1 Encrypted
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- LANDING PAGE COMPONENT ---
const LandingPage = ({ onLoginClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#1E293B]">
      <nav className="fixed w-full bg-white/90 backdrop-blur-md z-[100] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#2563EB] font-bold text-2xl">
            <Activity size={32} className="animate-pulse" />
            <span>HMS <span className="text-slate-900">Digital</span></span>
          </div>

          <div className="hidden md:flex items-center gap-8 font-medium">
            <a href="#services" className="hover:text-[#2563EB] transition">Services</a>
            <a href="#workflow" className="hover:text-[#2563EB] transition">Workflow</a>
            <button 
              onClick={onLoginClick}
              className="bg-[#2563EB] text-white px-8 py-3 rounded-full hover:bg-blue-700 hover:shadow-lg transition-all transform hover:-translate-y-1 active:scale-95 font-semibold whitespace-nowrap"
            >
              Login to Portal
            </button>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600 p-2">
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200">
            <div className="px-4 py-6 space-y-4 flex flex-col">
              <a href="#services" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-slate-600 border-b border-slate-50 pb-2">Services</a>
              <a href="#workflow" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-slate-600 border-b border-slate-50 pb-2">Workflow</a>
              <button onClick={onLoginClick} className="bg-[#2563EB] text-white px-6 py-3 rounded-xl font-bold active:scale-95">
                Login to Portal
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="pt-20">
        {/* HERO SECTION */}
        <section className="py-20 px-4 min-h-[80vh] flex items-center overflow-hidden">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <span className="bg-blue-100 text-[#2563EB] px-4 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase">
                Next-Gen Clinic Management
              </span>
              <h1 className="text-6xl font-extrabold leading-tight text-slate-900">
                Precision Care, <br />
                <span className="text-[#2563EB]">Simplified Workflow.</span>
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-lg font-medium">
                Transitioning from paper-based chaos to a high-performance, single source of truth. Manage patients, triage, and pharmacy in one click.
              </p>
              <div className="flex gap-4">
                <button className="bg-[#2563EB] text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all transform hover:-translate-y-1">
                  Get Started <ChevronRight size={20} />
                </button>
                <button className="border-2 border-slate-200 text-slate-700 px-8 py-4 rounded-xl font-bold hover:bg-slate-50 transition-all">
                  View Demo
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-blue-600/10 absolute -inset-4 rounded-3xl -rotate-2"></div>
              <img
                src="https://images.unsplash.com/photo-1576091160550-2173bdb999ef?auto=format&fit=crop&q=80&w=800"
                alt="Medical Dashboard"
                className="rounded-2xl shadow-2xl relative z-10 border border-white"
              />
            </div>
          </div>
        </section>

        {/* STATISTICS SECTION */}
        <section className="py-12 bg-white border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "Daily Patients", val: "250+" },
              { label: "Staff Members", val: "45+" },
              { label: "Efficiency Gain", val: "60%" },
              { label: "Digital Records", val: "10k+" },
            ].map((stat, i) => (
              <div key={i}>
                <h4 className="text-3xl font-black text-[#2563EB]">{stat.val}</h4>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SERVICES SECTION */}
        <section id="services" className="py-24 px-4 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">Comprehensive Care Modules</h2>
              <p className="text-slate-500 max-w-2xl mx-auto">Specialized modules to handle every department with digital precision.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: "Inpatient Management", desc: "Complete bed management and admission workflows.", icon: <ShieldCheck className="text-blue-600" /> },
                { title: "Digital Lab Results", desc: "Automated test requests and instant result delivery.", icon: <Beaker className="text-amber-500" /> },
                { title: "Inventory Control", desc: "Real-time tracking of pharmacy stock and alerts.", icon: <Pill className="text-purple-500" /> },
                { title: "Appointment Scheduling", desc: "Smart booking system to reduce patient wait times.", icon: <Clock className="text-green-500" /> },
                { title: "Electronic Health Records", desc: "Secure storage of history, vitals, and conditions.", icon: <Users className="text-indigo-500" /> },
                { title: "Financial Analytics", desc: "Detailed reports on billing and revenue streams.", icon: <Activity className="text-red-500" /> },
              ].map((service, i) => (
                <div key={i} className="p-8 rounded-3xl bg-white border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all group">
                  <div className="bg-[#F8FAFC] w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">{service.icon}</div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900">{service.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{service.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WORKFLOW SECTION */}
        <section id="workflow" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-4">Our Seamless Workflow</h2>
            <p className="text-slate-500 mb-16 uppercase tracking-widest text-xs font-bold">Linear Clinical Path</p>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 relative">
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-10"></div>
              {[
                { icon: <Users />, label: "Registration", color: "bg-blue-500" },
                { icon: <Activity />, label: "Triage", color: "bg-red-500" },
                { icon: <Stethoscope />, label: "Consultation", color: "bg-green-500" },
                { icon: <Beaker />, label: "Laboratory", color: "bg-amber-500" },
                { icon: <Pill />, label: "Pharmacy", color: "bg-purple-500" },
                { icon: <CreditCard />, label: "Billing", color: "bg-emerald-500" },
              ].map((step, i) => (
                <div key={i} className="group flex flex-col items-center">
                  <div className={`${step.color} p-5 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-all`}>{step.icon}</div>
                  <p className="mt-4 font-bold text-xs text-slate-700 uppercase">{step.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIAL SECTION */}
        <section className="py-24 bg-white px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center gap-1 text-amber-400 mb-6">
              {[...Array(5)].map((_, i) => <Star key={i} fill="currentColor" size={20} />)}
            </div>
            <h3 className="text-2xl italic font-medium text-slate-700 leading-relaxed">
              "The HMS significantly reduced patient waiting time and improved our clinical workflow. It is the single source of truth we needed for Lebawi Net Trading."
            </h3>
            <p className="mt-6 font-bold text-[#2563EB]">Clinical Director</p>
          </div>
        </section>

        {/* FOOTER - From original data */}
        <footer className="bg-[#1E293B] text-white pt-20 pb-10">
          <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-white font-bold text-2xl">
                <Activity size={32} className="text-[#2563EB]" />
                <span>HMS Digital</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">Leading digital transformation of healthcare in Ethiopia.</p>
            </div>
            <div>
              <h4 className="font-bold mb-6 uppercase tracking-widest text-xs">Quick Links</h4>
              <ul className="space-y-4 text-slate-400 text-sm font-medium">
                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                <li><a href="#" className="hover:text-white transition">Pharmacy</a></li>
                <li><a href="#" className="hover:text-white transition">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 uppercase tracking-widest text-xs">Contact</h4>
              <ul className="space-y-4 text-slate-400 text-sm font-medium">
                <li className="flex items-center gap-3"><Phone size={16} /> +251 911 000 000</li>
                <li className="flex items-center gap-3"><Mail size={16} /> support@hms.com</li>
                <li className="flex items-center gap-3"><MapPin size={16} /> Addis Ababa</li>
              </ul>
            </div>
            <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700">
              <h4 className="font-bold mb-4 uppercase tracking-widest text-[10px] text-slate-400">24/7 Emergency Hotline</h4>
              <p className="text-4xl font-black text-[#2563EB] tracking-tighter">9981</p>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">
            © 2026 HMS Digital | Developed by Yabsra & Meron.
          </div>
        </footer>
      </main>
    </div>
  );
};

// --- MAIN APP CONTROLLER ---
export default function App() {
  const [currentPage, setCurrentPage] = useState("home");

  return (
    <>
      {currentPage === "home" ? (
        <LandingPage onLoginClick={() => setCurrentPage("login")} />
      ) : (
        <LoginPage onBackClick={() => setCurrentPage("home")} />
      )}
    </>
  );
}