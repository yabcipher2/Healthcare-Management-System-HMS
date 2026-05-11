import React, { useState, useEffect } from "react";
import { Activity, Mail, Lock, Eye, EyeOff, ArrowLeft, ShieldCheck } from "lucide-react";

const Login = ({ onBackClick }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [currentImg, setCurrentImg] = useState(0);

  // Additional "Smart" Medical & Technology Photos
  const images = [
    "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=1400", // Medical Lab Tech
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1400", // Modern Hospital Hall
    "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1400", // Digital Health Interface
    "https://images.unsplash.com/photo-1532187878418-9f110798e65f?auto=format&fit=crop&q=80&w=1400", // Microscope / Research
    "https://images.unsplash.com/photo-1504439468489-c8920d796a29?auto=format&fit=crop&q=80&w=1400"  // Operation Theater Smart Lighting
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
            index === currentImg ? "opacity-60" : "opacity-0"
          }`}
        >
          <img src={img} alt="Background" className="w-full h-full object-cover scale-105" />
          {/* This gradient makes the background "bolder" and darker for better contrast */}
          <div className="absolute inset-0 bg-slate-900/40 backdrop-saturate-150" />
        </div>
      ))}

      {/* Back Button - Bolder styling */}
      <button 
        onClick={onBackClick}
        className="absolute top-8 left-8 z-50 flex items-center gap-2 text-indigo-900 hover:text-white transition-all font-black bg-white/80 hover:bg-indigo-600 backdrop-blur-md px-6 py-3 rounded-2xl border-2 border-white shadow-xl"
      >
        <ArrowLeft size={20} strokeWidth={3} /> Back to Home
      </button>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Card with a slightly deeper Light Purple and bold shadows */}
        <div className="bg-[#EEF2FF] py-12 px-10 shadow-[0_20px_50px_rgba(79,70,229,0.3)] rounded-[3rem] border-4 border-white">
          
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

export default Login;