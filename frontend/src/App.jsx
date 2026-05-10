import React, { useState } from "react";
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
} from "lucide-react";

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#1E293B]">
      {/* 1. NAVBAR - Fixed with high z-index */}
      <nav className="fixed w-full bg-white/90 backdrop-blur-md z-[100] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#2563EB] font-bold text-2xl">
            <Activity size={32} className="animate-pulse" />
            <span>
              HMS <span className="text-slate-900">Digital</span>
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8 font-medium">
            <a href="#services" className="hover:text-[#2563EB] transition">
              Services
            </a>
            <a href="#workflow" className="hover:text-[#2563EB] transition">
              Workflow
            </a>
            <a href="#doctors" className="hover:text-[#2563EB] transition">
              Staff
            </a>
            <button className="bg-[#2563EB] text-white px-8 py-3 rounded-full hover:bg-blue-700 hover:shadow-lg transition-all transform hover:-translate-y-1 active:scale-95 font-semibold whitespace-nowrap">
              Login to Portal
            </button>
          </div>

          {/* Mobile Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-slate-600 p-2"
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 animate-fade-in-up">
            <div className="px-4 py-6 space-y-4 flex flex-col">
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
                href="#doctors"
                onClick={() => setIsMenuOpen(false)}
                className="text-lg font-medium text-slate-600 border-b border-slate-50 pb-2"
              >
                Staff
              </a>
              <button className="bg-[#2563EB] text-white px-6 py-3 rounded-xl font-bold active:scale-95">
                Login to Portal
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* MAIN CONTENT - pt-20 pushes content below fixed navbar */}
      <main className="pt-20">
        {/* 2. HERO SECTION */}
        <section className="py-20 px-4 overflow-hidden min-h-[80vh] flex items-center">
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
                Transitioning from paper-based chaos to a high-performance,
                single source of truth. Manage patients, triage, and pharmacy in
                one click.
              </p>
              <div className="flex gap-4">
                <button className="bg-[#2563EB] text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-100 transition-all transform hover:-translate-y-1 active:scale-95">
                  Get Started <ChevronRight size={20} />
                </button>
                <button className="border-2 border-slate-200 text-slate-700 px-8 py-4 rounded-xl font-bold hover:bg-slate-50 transition-all active:scale-95">
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
                alt="Medical Dashboard"
                className="rounded-2xl shadow-2xl relative z-10 border border-white animate-pulse-slow"
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
              <div key={i} className="space-y-1">
                <h4 className="text-3xl font-black text-[#2563EB]">
                  {stat.val}
                </h4>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. SERVICES SECTION */}
        <section id="services" className="py-24 px-4 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 animate-fade-in-up">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                Comprehensive Care Modules
              </h2>
              <p className="text-slate-500 max-w-2xl mx-auto">
                Specialized modules to handle every department with digital
                precision.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Inpatient Management",
                  desc: "Complete bed management and admission workflows.",
                  icon: <ShieldCheck className="text-blue-600" />,
                },
                {
                  title: "Digital Lab Results",
                  desc: "Automated test requests and instant result delivery.",
                  icon: <Beaker className="text-amber-500" />,
                },
                {
                  title: "Inventory Control",
                  desc: "Real-time tracking of pharmacy stock and alerts.",
                  icon: <Pill className="text-purple-500" />,
                },
                {
                  title: "Appointment Scheduling",
                  desc: "Smart booking system to reduce patient wait times.",
                  icon: <Clock className="text-green-500" />,
                },
                {
                  title: "Electronic Health Records",
                  desc: "Secure storage of history, vitals, and conditions.",
                  icon: <Users className="text-indigo-500" />,
                },
                {
                  title: "Financial Analytics",
                  desc: "Detailed reports on billing and revenue streams.",
                  icon: <Activity className="text-red-500" />,
                },
              ].map((service, i) => (
                <div
                  key={i}
                  className="p-8 rounded-3xl bg-white border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group animate-pop-in"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="bg-[#F8FAFC] w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900">
                    {service.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {service.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. WORKFLOW SECTION */}
        <section id="workflow" className="py-24 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-4">Our Seamless Workflow</h2>
            <p className="text-slate-500 mb-16 uppercase tracking-widest text-xs font-bold">
              Linear Clinical Path
            </p>
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
                    className={`${step.color} p-5 rounded-2xl text-white shadow-lg group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-300`}
                  >
                    {step.icon}
                  </div>
                  <p className="mt-4 font-bold text-xs text-slate-700 uppercase tracking-tighter">
                    {step.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. STAFF SECTION */}
        <section id="doctors" className="py-24 px-4 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-4xl font-bold mb-2">
                  Expert Medical Staff
                </h2>
                <p className="text-slate-500 font-medium">
                  Qualified professionals for Lebawi Net Trading
                </p>
              </div>
              <button className="text-[#2563EB] font-bold flex items-center gap-1 hover:underline">
                View All Staff <ChevronRight size={18} />
              </button>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: "Dr. Meron Abebe",
                  dept: "Senior Physician",
                  img: "https://images.unsplash.com/photo-1559839734-2b71f1536783?auto=format&fit=crop&q=80&w=400",
                },
                {
                  name: "Dr. Elias Tadesse",
                  dept: "Cardiologist",
                  img: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400",
                },
                {
                  name: "Nurse Sarah Bekele",
                  dept: "Head of Triage",
                  img: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=400",
                },
              ].map((staff, i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all group border border-slate-100"
                >
                  <div className="h-64 overflow-hidden">
                    <img
                      src={staff.img}
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                      alt={staff.name}
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-1">{staff.name}</h3>
                    <p className="text-[#2563EB] font-medium text-sm mb-4">
                      {staff.dept}
                    </p>
                    <div className="flex justify-between items-center text-xs text-slate-400 font-bold uppercase">
                      <span>Exp: 8+ Years</span>
                      <span className="text-green-500 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>{" "}
                        Available
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIAL & FOOTER */}
        <section className="py-24 bg-white px-4">
          <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
            <div className="flex justify-center gap-1 text-amber-400 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} fill="currentColor" size={20} />
              ))}
            </div>
            <h3 className="text-2xl italic font-medium text-slate-700 leading-relaxed">
              "The HMS significantly reduced patient waiting time and improved
              our clinical workflow. It is the single source of truth we needed
              for Lebawi Net Trading."
            </h3>
            <p className="mt-6 font-bold text-[#2563EB]">Clinical Director</p>
          </div>
        </section>

        <footer className="bg-[#1E293B] text-white pt-20 pb-10">
          <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-white font-bold text-2xl">
                <Activity size={32} className="text-[#2563EB]" />
                <span>HMS Digital</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Leading digital transformation of healthcare in Ethiopia.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-white uppercase tracking-widest text-xs">
                Quick Links
              </h4>
              <ul className="space-y-4 text-slate-400 text-sm font-medium">
                <li>
                  <a href="#" className="hover:text-white transition">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Pharmacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Support
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-white uppercase tracking-widest text-xs">
                Contact
              </h4>
              <ul className="space-y-4 text-slate-400 text-sm font-medium">
                <li className="flex items-center gap-3">
                  <Phone size={16} /> +251 911 000 000
                </li>
                <li className="flex items-center gap-3">
                  <Mail size={16} /> support@hms.com
                </li>
                <li className="flex items-center gap-3">
                  <MapPin size={16} /> Addis Ababa
                </li>
              </ul>
            </div>
            <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700">
              <h4 className="font-bold mb-4 uppercase tracking-widest text-[10px] text-slate-400">
                24/7 Emergency Hotline
              </h4>
              <p className="text-4xl font-black text-[#2563EB] tracking-tighter">
                9981
              </p>
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

export default LandingPage;
