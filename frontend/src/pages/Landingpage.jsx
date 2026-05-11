import React, { useState, useEffect } from "react";
import {
  Activity,
  Users,
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
} from "lucide-react";

const LandingPage = ({ onLoginClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    window.pageYOffset > 300 ? setIsVisible(true) : setIsVisible(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#1E293B]">
      {/* 1. NAVBAR */}
      <nav className="fixed w-full bg-white/90 backdrop-blur-md z-[100] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#2563EB] font-bold text-2xl">
            <Activity size={32} className="animate-pulse" />
            <span>
              HMS <span className="text-slate-900">Digital</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-medium">
            <a href="#services" className="hover:text-[#2563EB] transition">
              Services
            </a>
            <a href="#workflow" className="hover:text-[#2563EB] transition">
              Workflow
            </a>
            <a href="#roles" className="hover:text-[#2563EB] transition">
              Security
            </a>
            <button
              className="bg-[#2563EB] text-white px-8 py-3 rounded-full hover:bg-blue-700 transition-all transform hover:-translate-y-1 active:scale-95 font-semibold cursor-pointer"
              onClick={onLoginClick}
            >
              Login to Portal
            </button>
          </div>
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-slate-600 p-2"
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 py-6 px-4 space-y-4 flex flex-col">
            <a
              href="#services"
              onClick={() => setIsMenuOpen(false)}
              className="text-lg font-medium text-slate-600 border-b border-slate-50 pb-2"
            >
              Services
            </a>
            <a
              href="#workflow"
              onClick={() => setIsMenuOpen(false)}
              className="text-lg font-medium text-slate-600 border-b border-slate-50 pb-2"
            >
              Workflow
            </a>
            <a
              href="#roles"
              onClick={() => setIsMenuOpen(false)}
              className="text-lg font-medium text-slate-600 border-b border-slate-50 pb-2"
            >
              Security
            </a>
            <button
              className="bg-[#2563EB] text-white px-6 py-3 rounded-xl font-bold active:scale-95"
              onClick={onLoginClick}
            >
              Login to Portal
            </button>
          </div>
        )}
      </nav>

      <main className="pt-20">
        {/* HERO SECTION */}
        <section className="py-20 px-4 min-h-[80vh] flex items-center overflow-hidden">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in-up">
              <span className="bg-blue-100 text-[#2563EB] px-4 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase">
                Next-Gen Clinic Management
              </span>
              <h1 className="text-6xl font-extrabold leading-tight text-slate-900">
                Precision Care, <br />
                <span className="text-[#2563EB]">Simplified Workflow.</span>
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
                Transitioning paper-based chaos to high-performance clinical
                truth.
              </p>
              <div className="flex gap-4">
                <button
                  className="bg-[#2563EB] text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 hover:shadow-xl transition-all transform hover:-translate-y-1 active:scale-95 cursor-pointer"
                  onClick={onLoginClick}
                >
                  Get Started <ChevronRight size={20} />
                </button>
                <button
                  onClick={() => setShowDemo(true)}
                  className="border-2 border-slate-200 text-slate-700 px-8 py-4 rounded-xl font-bold hover:bg-slate-50 transition active:scale-95 cursor-pointer"
                >
                  View Demo
                </button>
              </div>
            </div>
            <div
              className="relative animate-fade-in-up"
              style={{ animationDelay: "200ms" }}
            >
              <div className="bg-blue-600/10 absolute -inset-4 rounded-3xl -rotate-2"></div>
              <img
                src="https://images.unsplash.com/photo-1576091160550-2173bdb999ef?auto=format&fit=crop&q=80&w=800"
                alt="Dashboard"
                className="rounded-2xl shadow-2xl relative z-10 border border-white animate-pulse-slow"
              />
            </div>
          </div>
        </section>

        {/* 3. SERVICES SECTION */}
        <section id="services" className="py-24 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 animate-fade-in-up">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                Comprehensive Care Modules
              </h2>
              <p className="text-slate-500 max-w-2xl mx-auto">
                Digital precision for every department.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Inpatient Management",
                  desc: "Bed tracking and admission workflows.",
                  icon: <ShieldCheck className="text-blue-600" />,
                },
                {
                  title: "Digital Lab Results",
                  desc: "Automated test requests and delivery.",
                  icon: <Beaker className="text-amber-500" />,
                },
                {
                  title: "Inventory Control",
                  desc: "Real-time tracking of pharmacy stock.",
                  icon: <Pill className="text-purple-500" />,
                },
                {
                  title: "Appointment Scheduling",
                  desc: "Smart booking to reduce wait times.",
                  icon: <Clock className="text-green-500" />,
                },
                {
                  title: "Electronic Health Records",
                  desc: "Secure storage of patient history.",
                  icon: <Users className="text-indigo-500" />,
                },
                {
                  title: "Financial Analytics",
                  desc: "Detailed billing and revenue reports.",
                  icon: <Activity className="text-red-500" />,
                },
              ].map((service, i) => (
                <div
                  key={i}
                  className="p-8 rounded-3xl bg-[#F8FAFC] border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all animate-pop-in"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                  <p className="text-slate-500 text-sm">{service.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. WORKFLOW SECTION */}
        <section
          id="workflow"
          className="py-24 bg-white overflow-hidden border-t border-slate-100"
        >
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-16">Linear Clinical Path</h2>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 relative">
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-10"></div>
              {[
                {
                  icon: <Users />,
                  label: "Registration",
                  color: "bg-blue-500",
                },
                { icon: <Activity />, label: "Triage", color: "bg-red-500" },
                {
                  icon: <Stethoscope />,
                  label: "Consultation",
                  color: "bg-green-500",
                },
                {
                  icon: <Beaker />,
                  label: "Laboratory",
                  color: "bg-amber-500",
                },
                { icon: <Pill />, label: "Pharmacy", color: "bg-purple-500" },
                {
                  icon: <CreditCard />,
                  label: "Billing",
                  color: "bg-emerald-500",
                },
              ].map((step, i) => (
                <div
                  key={i}
                  className="group flex flex-col items-center animate-pop-in"
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  <div
                    className={`${step.color} p-5 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-all`}
                  >
                    {step.icon}
                  </div>
                  <p className="mt-4 font-bold text-xs uppercase text-slate-700">
                    {step.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. ROLE-BASED SECURITY */}
        <section id="roles" className="py-24 px-4 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 animate-fade-in-up">
              <h2 className="text-4xl font-bold mb-4">
                Tailored Access Control
              </h2>
              <p className="text-slate-500">
                Security-first architecture for medical data privacy.
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  role: "Administrator",
                  power: "Full Control",
                  icon: <ShieldCheck className="text-red-500" />,
                },
                {
                  role: "Doctor",
                  power: "Clinical Access",
                  icon: <Stethoscope className="text-blue-500" />,
                },
                {
                  role: "Receptionist",
                  power: "Patient Entry",
                  icon: <Users className="text-green-500" />,
                },
                {
                  role: "Pharmacist",
                  power: "Drug Inventory",
                  icon: <Pill className="text-purple-500" />,
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white p-8 rounded-3xl border border-slate-100 text-center hover:shadow-lg transition-all animate-pop-in"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="w-16 h-16 mx-auto bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-lg">{item.role}</h3>
                  <p className="text-[10px] font-black text-[#2563EB] uppercase tracking-widest mt-2">
                    {item.power}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="bg-[#1E293B] text-white pt-20 pb-10">
          <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-2 font-bold text-2xl">
                <Activity className="text-[#2563EB]" />
                <span>HMS Digital</span>
              </div>
              <p className="text-slate-400 text-sm">
                Digital transformation in Ethiopia.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-xs uppercase tracking-widest">
                Quick Links
              </h4>
              <ul className="space-y-4 text-slate-400 text-sm font-medium">
                <li>
                  <a href="#services" className="hover:text-white transition">
                    Services
                  </a>
                </li>
                <li>
                  <a href="#workflow" className="hover:text-white transition">
                    Workflow
                  </a>
                </li>
                <li>
                  <a href="#roles" className="hover:text-white transition">
                    Security
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-xs uppercase tracking-widest">
                Contact
              </h4>
              <ul className="space-y-4 text-slate-400 text-sm font-medium">
                <li className="flex items-center gap-3">
                  <Phone size={16} /> +251 911 000 000
                </li>
                <li className="flex items-center gap-3">
                  <MapPin size={16} /> Addis Ababa
                </li>
              </ul>
            </div>
            <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700">
              <h4 className="font-bold mb-4 text-[10px] text-slate-400 uppercase tracking-widest">
                24/7 Hotline
              </h4>
              <p className="text-4xl font-black text-[#2563EB]">9981</p>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-16 pt-8 px-4">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
              <div className="flex flex-wrap justify-center gap-6 opacity-60">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                  <ShieldCheck size={16} className="text-green-500" /> Data
                  Privacy
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border-l border-slate-700 pl-6">
                  <Lock size={16} className="text-blue-400" /> Encryption
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border-l border-slate-700 pl-6">
                  <Activity size={16} className="text-red-400" /> MOH Compliant
                </div>
              </div>
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                © 2026 HMS Digital | Yabsra & Meron.
              </div>
            </div>
          </div>
        </footer>
      </main>

      {/* MODALS & BUTTONS */}
      {showDemo && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl bg-black rounded-3xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setShowDemo(false)}
              className="absolute top-4 right-4 text-white hover:text-red-500 z-10"
            >
              <X size={32} />
            </button>
            <div className="aspect-video flex items-center justify-center text-white">
              <p className="text-xl font-bold animate-pulse">
                Demo Video Playing...
              </p>
            </div>
          </div>
        </div>
      )}

      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-[150] bg-[#2563EB] text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 transition-all active:scale-90 cursor-pointer group"
        >
          <ChevronRight
            size={24}
            className="-rotate-90 group-hover:scale-125 transition-transform"
          />
        </button>
      )}
    </div>
  );
};

export default LandingPage; // This is important!
