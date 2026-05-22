import React, { useState } from "react";
import {
  Mail,
  ShieldCheck,
  Users,
  Activity,
  Phone,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";

const DemoPage = ({ onBackClick }) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [visitorName, setVisitorName] = useState("");

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      {/* SIMPLE NAV */}
      <nav className="p-6">
        <button
          onClick={onBackClick}
          className="flex items-center gap-2 text-slate-500 hover:text-[#2563EB] font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft size={20} /> Back to Home
        </button>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-16 animate-fade-in-up">
          <img
            src="/mesra icon.png"
            alt="Mesra"
            className="w-16 h-16 mx-auto mb-6 animate-float"
          />
          <h1 className="text-5xl font-black text-slate-900 mb-4">
            See Mesra in Action
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">
            Experience how Mesra Digital Health transforms clinical operations
            in real-time.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-stretch">
          {/* FORM CARD */}
          <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col transition-all duration-500">
            {!isSubmitted ? (
              <>
                <div className="bg-[#2563EB] p-10 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <Mail size={24} />
                    <h3 className="text-2xl font-black uppercase tracking-tight">
                      Request Access
                    </h3>
                  </div>
                  <p className="text-blue-100 text-sm font-medium">
                    Fill in your details for a personalized system walkthrough.
                  </p>
                </div>

                <form
                  className="p-10 space-y-5 flex-1"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setIsSubmitted(true);
                  }}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={visitorName} // 👈 Link to state
                        onChange={(e) => setVisitorName(e.target.value)} // 👈 Update state when typing
                        className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                        Work Email
                      </label>
                      <input
                        type="email"
                        defaultValue="merong901@gmail.com"
                        className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        placeholder="+251..."
                        className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                        Clinic Name
                      </label>
                      <input
                        type="text"
                        placeholder="Hospital Name"
                        className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                      Message
                    </label>
                    <textarea
                      placeholder="How can Mesra help your clinic?"
                      className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none h-32 resize-none"
                    ></textarea>
                  </div>

                  <button className="w-full py-5 bg-[#2563EB] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 mt-4 active:scale-95 cursor-pointer">
                    Book My Demo
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-pop-in">
                <CheckCircle size={80} className="text-green-500 mb-6" />
                <h2 className="text-3xl font-black text-slate-900 mb-4">
                  Request Sent!
                </h2>
                <p className="text-slate-500 font-medium mb-8">
                  Thank you,{" "}
                  <span className="text-[#2563EB] font-bold">
                    {visitorName || "there"}
                  </span>
                  . Our clinical experts will contact you shortly to schedule
                  your Mesra experience.
                </p>
                <button
                  onClick={onBackClick}
                  className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-black transition-all"
                >
                  Return to Home
                </button>
              </div>
            )}
          </div>

          {/* SIDE INFO */}
          <div className="flex flex-col justify-center space-y-10">
            <h2 className="text-4xl font-black text-slate-900 italic leading-tight">
              What you'll explore in the demo
            </h2>

            <div className="space-y-8">
              <FeatureItem
                icon={<ShieldCheck className="text-green-600" />}
                title="The 360° Dashboard"
                desc="A complete overview of patient admissions, drug inventory, and financial health."
              />
              <FeatureItem
                icon={<Users className="text-blue-600" />}
                title="Multi-Role Interface"
                desc="Switch between Doctor, Receptionist, and Pharmacist views to see the seamless flow."
              />
              <FeatureItem
                icon={<Activity className="text-amber-600" />}
                title="MOH Compliance"
                desc="See how we automate reports required by the Ethiopian Ministry of Health."
              />
            </div>

            <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-blue-400 font-black uppercase text-[10px] tracking-[0.3em] mb-2">
                  Immediate Support
                </p>
                <p className="text-3xl font-black italic">9981 Hotline</p>
                <p className="text-slate-400 text-sm mt-2">
                  Available 24/7 for technical inquiries.
                </p>
              </div>
              <Phone
                className="absolute -right-4 -bottom-4 text-white/5 group-hover:text-white/10 transition-colors"
                size={150}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const FeatureItem = ({ icon, title, desc }) => (
  <div className="flex gap-5 group">
    <div className="w-14 h-14 bg-white shadow-xl rounded-[1.25rem] flex items-center justify-center shrink-0 border border-slate-50 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <div>
      <h4 className="font-black text-xl text-slate-800">{title}</h4>
      <p className="text-slate-500 leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default DemoPage;
