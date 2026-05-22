import React, { useState, useEffect } from "react";
import {
  Users,
  Beaker,
  Pill,
  Phone,
  MapPin,
  ChevronRight,
  Stethoscope,
  Clock,
  ShieldCheck,
  Menu,
  X,
  Lock,
  Activity,
  CreditCard,
  Layout,
  Check,
  ArrowRight,
} from "lucide-react";

const LandingPage = ({ onLoginClick, onDemoClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
          <div className="flex items-center gap-3 text-[#2563EB] font-bold text-2xl">
            <img
              src="/mesra icon.png"
              alt="Mesra Logo"
              className="w-10 h-10 object-contain animate-float"
            />
            <span className="tracking-tight italic uppercase text-xl">
              Mesra <span className="text-slate-900 not-italic">Digital</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 font-medium">
            <a
              href="#services"
              className="hover:text-[#2563EB] transition cursor-pointer"
            >
              Services
            </a>
            <a
              href="#workflow"
              className="hover:text-[#2563EB] transition cursor-pointer"
            >
              System Flow
            </a>
            <a
              href="#roles"
              className="hover:text-[#2563EB] transition cursor-pointer"
            >
              Security
            </a>
            <button
              className="bg-[#2563EB] text-white px-8 py-3 rounded-full hover:bg-blue-700 transition-all active:scale-95 font-semibold cursor-pointer shadow-lg shadow-blue-100"
              onClick={onLoginClick}
            >
              Login to Portal
            </button>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-slate-600 p-2 cursor-pointer"
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* 2. MOBILE MENU FIX */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 py-8 px-6 space-y-6 flex flex-col animate-slide-down shadow-xl relative z-[90]">
            <a
              href="#services"
              onClick={() => setIsMenuOpen(false)}
              className="text-xl font-black text-slate-700 border-b border-slate-50 pb-4 flex justify-between items-center group"
            >
              Clinical Services{" "}
              <ChevronRight size={18} className="text-slate-300" />
            </a>
            <a
              href="#workflow"
              onClick={() => setIsMenuOpen(false)}
              className="text-xl font-black text-slate-700 border-b border-slate-50 pb-4 flex justify-between items-center group"
            >
              System Flow <ChevronRight size={18} className="text-slate-300" />
            </a>
            <a
              href="#roles"
              onClick={() => setIsMenuOpen(false)}
              className="text-xl font-black text-slate-700 border-b border-slate-50 pb-4 flex justify-between items-center group"
            >
              Data Security{" "}
              <ChevronRight size={18} className="text-slate-300" />
            </a>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                onDemoClick();
              }}
              className="text-xl font-black text-[#2563EB] border-b border-slate-50 pb-4 text-left flex justify-between items-center cursor-pointer"
            >
              Watch Demo <Activity size={18} className="animate-pulse" />
            </button>
            <button
              className="w-full bg-[#2563EB] text-white py-5 rounded-[2rem] font-black uppercase tracking-widest active:scale-95 transition-all mt-4"
              onClick={() => {
                setIsMenuOpen(false);
                onLoginClick();
              }}
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
                Welcome to Mesra Digital Health
              </span>
              <h1 className="text-6xl font-extrabold leading-tight text-slate-900">
                Precision Care, <br />
                <span className="text-[#2563EB]">Digitally Redefined.</span>
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
                Transitioning paper-based chaos to high-performance clinical
                truth with Mesra.
              </p>
              <div className="flex gap-4">
                <button
                  className="bg-[#2563EB] text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 hover:shadow-xl transition-all transform hover:-translate-y-1 active:scale-95 cursor-pointer"
                  onClick={onLoginClick}
                >
                  Get Started <ChevronRight size={20} />
                </button>
                <button
                  onClick={onDemoClick}
                  className="border-2 border-slate-200 text-slate-700 px-8 py-4 rounded-xl font-bold hover:bg-slate-50 transition active:scale-95 cursor-pointer"
                >
                  Watch Demo
                </button>
              </div>
            </div>
            <div className="relative animate-fade-in-up">
              <div className="bg-blue-600/10 absolute -inset-4 rounded-3xl -rotate-2"></div>
              <img
                src="https://images.unsplash.com/photo-1576091160550-2173bdb999ef?auto=format&fit=crop&q=80&w=800"
                alt="Mesra Dashboard"
                className="rounded-2xl shadow-2xl relative z-10 border border-white"
              />
            </div>
          </div>
        </section>

        {/* SERVICES SECTION */}
        <section
          id="services"
          className="py-24 px-4 bg-white border-b border-slate-100"
        >
          <div className="max-w-7xl mx-auto text-center mb-16">
            <span className="text-[#2563EB] font-black uppercase text-[10px] tracking-[0.3em]">
              The Mesra Ecosystem
            </span>
            <h2 className="text-5xl font-black text-slate-900 mt-4 mb-4 italic">
              Advanced Clinical Modules
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium">
              Every department in your hospital, synchronized in one
              high-performance digital environment.
            </p>
          </div>
          <div className="max-w-7xl mx-auto grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Inpatient Ward",
                icon: <ShieldCheck className="text-blue-600" />,
                desc: "Real-time bed occupancy tracking and automated admission-to-discharge workflows.",
              },
              {
                title: "Smart Pharmacy",
                icon: <Pill className="text-purple-500" />,
                desc: "AI-driven stock alerts, drug interaction checks, and automated prescription handling.",
              },
              {
                title: "Digital Laboratory",
                icon: <Beaker className="text-amber-500" />,
                desc: "Instant result delivery to doctor dashboards with QR-coded medical reports.",
              },
              {
                title: "Emergency Triage",
                icon: <Activity className="text-red-500" />,
                desc: "Color-coded patient prioritization based on Ethiopian Ministry of Health standards.",
              },
              {
                title: "Radiology (PACS)",
                icon: <Users className="text-indigo-500" />,
                desc: "Centralized storage for X-rays and Ultrasounds with remote specialist access.",
              },
              {
                title: "Appointment AI",
                icon: <Clock className="text-green-500" />,
                desc: "Reduce wait times with smart queuing and SMS reminders for scheduled patients.",
              },
              {
                title: "Revenue Cycle",
                icon: <CreditCard className="text-emerald-500" />,
                desc: "Automated billing for insurance and private patients with detailed financial audits.",
              },
              {
                title: "Telemedicine",
                icon: <Phone className="text-sky-500" />,
                desc: "Secure video consultations for follow-ups, bringing care to patients' homes.",
              },
            ].map((service, i) => (
              <div
                key={i}
                className="p-8 rounded-[2.5rem] bg-[#F8FAFC] border border-slate-100 hover:bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group animate-pop-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  {service.icon}
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3">
                  {service.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">
                  {service.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* WORKFLOW SECTION */}
        <section
          id="workflow"
          className="py-24 px-4 bg-slate-50 border-t border-slate-100"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 animate-fade-in-up">
              <h2 className="text-4xl font-black text-slate-900 mb-4 italic">
                The Mesra Framework
              </h2>
              <p className="text-slate-500 max-w-xl mx-auto">
                A unified clinical journey powered by specialized management
                portals.
              </p>
            </div>
            <div className="grid lg:grid-cols-2 gap-8 items-stretch">
              <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-blue-50 text-[#2563EB] rounded-2xl flex items-center justify-center">
                    <Activity size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                    Clinical Workflow
                  </h3>
                </div>
                <div className="space-y-6 flex-1">
                  {[
                    {
                      step: "01",
                      label: "Patient Registration",
                      color: "text-blue-500",
                    },
                    {
                      step: "02",
                      label: "Triage & Vitals",
                      color: "text-red-500",
                    },
                    {
                      step: "03",
                      label: "Doctor Consultation",
                      color: "text-green-500",
                    },
                    {
                      step: "04",
                      label: "Laboratory Testing",
                      color: "text-amber-500",
                    },
                    {
                      step: "05",
                      label: "Pharmacy Dispensing",
                      color: "text-purple-500",
                    },
                    {
                      step: "06",
                      label: "Financial Settlement",
                      color: "text-emerald-500",
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 group">
                      <span className={`text-sm font-black ${item.color} w-8`}>
                        {item.step}
                      </span>
                      <div className="h-12 flex-1 bg-slate-50 rounded-2xl flex items-center px-6 border border-transparent group-hover:border-blue-100 group-hover:bg-white transition-all shadow-sm group-hover:shadow-md">
                        <span className="font-bold text-slate-700 text-sm">
                          {item.label}
                        </span>
                        <Check
                          size={16}
                          className="ml-auto text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </div>
                      {i !== 5 && (
                        <ArrowRight
                          size={14}
                          className="text-slate-300 hidden md:block"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#1E293B] p-10 rounded-[3rem] shadow-2xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px]"></div>
                <div className="flex items-center gap-3 mb-8 relative z-10">
                  <div className="w-12 h-12 bg-white/10 text-blue-400 rounded-2xl flex items-center justify-center">
                    <Layout size={24} />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter">
                    System Hubs
                  </h3>
                </div>
                <p className="text-blue-400 font-bold text-sm mb-6 uppercase tracking-[0.2em] relative z-10">
                  11 Specialized Dashboards
                </p>
                <div className="grid grid-cols-2 gap-3 relative z-10">
                  {[
                    "Admin Master",
                    "Doctor Portal",
                    "Nurse Station",
                    "Reception Desk",
                    "Lab Technician",
                    "Pharmacy Hub",
                    "Inpatient Ward",
                    "Radiology Center",
                    "Finance Dept",
                    "Emergency Room",
                    "Store Manager",
                  ].map((dash, i) => (
                    <div
                      key={i}
                      className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3 hover:bg-white/10 hover:border-blue-500/50 transition-all cursor-default group"
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full group-hover:animate-pulse"></div>
                      <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
                        {dash}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-10 p-6 bg-blue-600 rounded-2xl text-center shadow-lg shadow-blue-900/20 relative z-10">
                  <p className="text-xs font-black uppercase tracking-widest mb-1">
                    Total System Integration
                  </p>
                  <p className="text-blue-100 text-[10px] font-medium opacity-80 italic">
                    Synchronized data across all 11 departments
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECURITY SECTION */}
        <section
          id="roles"
          className="py-24 px-4 bg-white border-t border-slate-100"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 animate-fade-in-up">
              <span className="bg-red-100 text-red-600 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase">
                Fort-Knox Security
              </span>
              <h2 className="text-4xl font-black text-slate-900 mt-4 mb-4">
                Mission-Critical Data Protection
              </h2>
              <p className="text-slate-500 max-w-2xl mx-auto">
                Mesra utilizes bank-grade infrastructure to ensure your clinic
                remains compliant and secure 24/7.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: "Cloud-Based Storage",
                  desc: "Secure, scalable patient records hosted on encrypted tier-4 data centers.",
                  icon: <Lock className="text-blue-600" />,
                  color: "bg-blue-50",
                },
                {
                  title: "AES-256 Encryption",
                  desc: "Industry-standard data encryption at rest and in transit (SSL/TLS).",
                  icon: <ShieldCheck className="text-green-600" />,
                  color: "bg-green-50",
                },
                {
                  title: "Automatic Backups",
                  desc: "Redundant daily backups ensure zero data loss during system recovery.",
                  icon: <Activity className="text-red-600" />,
                  color: "bg-red-50",
                },
                {
                  title: "MFA Authentication",
                  desc: "Multi-factor login verification for all administrative and clinical staff.",
                  icon: <Users className="text-indigo-600" />,
                  color: "bg-indigo-50",
                },
              ].map((card, i) => (
                <div
                  key={i}
                  className="p-8 rounded-[2.5rem] bg-[#F8FAFC] border border-slate-100 hover:bg-white hover:shadow-2xl transition-all duration-500 group"
                >
                  <div
                    className={`${card.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                  >
                    {card.icon}
                  </div>
                  <h3 className="font-black text-xl text-slate-900 mb-3">
                    {card.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-12 p-8 bg-slate-900 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[80px]"></div>
              <div className="relative z-10 flex items-center gap-6">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border border-white/10">
                  <ShieldCheck size={32} className="text-blue-400" />
                </div>
                <div>
                  <h4 className="text-2xl font-black italic">
                    MOH Compliant Architecture
                  </h4>
                  <p className="text-slate-400 text-sm">
                    Strictly following the Ethiopian Ministry of Health digital
                    privacy guidelines.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 relative z-10">
                <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest">
                  ISO 27001
                </div>
                <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest">
                  GDPR Ready
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-[#1E293B] text-white pt-20 pb-10">
          <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-3 font-bold text-2xl uppercase">
                <img src="/mesra icon.png" alt="Mesra" className="w-8 h-8" />
                <span className="italic text-xl">
                  Mesra{" "}
                  <span className="text-[#2563EB] not-italic">Digital</span>
                </span>
              </div>
              <p className="text-slate-400 text-sm">
                Empowering healthcare through digital excellence in Ethiopia.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-xs uppercase tracking-widest text-blue-400">
                Quick Links
              </h4>
              <ul className="space-y-4 text-slate-400 text-sm font-bold">
                <li>
                  <a href="#services" className="hover:text-white transition">
                    Services
                  </a>
                </li>
                <li>
                  <button
                    onClick={onDemoClick}
                    className="hover:text-white transition"
                  >
                    Request Demo
                  </button>
                </li>
                <li>
                  <a href="#roles" className="hover:text-white transition">
                    Security
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-xs uppercase tracking-widest text-blue-400">
                Contact
              </h4>
              <ul className="space-y-4 text-slate-400 text-sm">
                <li className="flex items-center gap-3 font-bold">
                  <Phone size={16} /> +251 911 000 000
                </li>
                <li className="flex items-center gap-3 font-bold">
                  <MapPin size={16} /> Addis Ababa, Ethiopia
                </li>
              </ul>
            </div>
            <div className="bg-slate-800/50 p-8 rounded-[2.5rem] border border-slate-700 text-center">
              <h4 className="font-bold mb-4 text-[10px] text-slate-400 uppercase tracking-widest">
                Hotline
              </h4>
              <p className="text-5xl font-black text-[#2563EB] italic">9981</p>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-16 pt-8 text-center">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              © 2026 Mesra Digital Health System.
            </p>
          </div>
        </footer>
      </main>

      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-[150] bg-[#2563EB] text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 transition-all active:scale-90 cursor-pointer"
        >
          <ChevronRight size={24} className="-rotate-90" />
        </button>
      )}
    </div>
  );
};

export default LandingPage;
