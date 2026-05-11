import React, { useState, useEffect } from "react";
import { Activity, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";

const Login = ({ onBackClick }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [currentImg, setCurrentImg] = useState(0);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const images = [
    "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=1400",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1400",
    "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1400",
    "https://images.unsplash.com/photo-1532187878418-9f110798e65f?auto=format&fit=crop&q=80&w=1400",
    "https://images.unsplash.com/photo-1504439468489-c8920d796a29?auto=format&fit=crop&q=80&w=1400",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImg((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    // Simulate API delay
    setTimeout(() => {
      setIsLoading(false);
      setError("Authentication failed. Please verify your credentials.");
    }, 1500);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden font-sans">
      {/* Background Images */}
      {images.map((img, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentImg ? "opacity-60" : "opacity-0"
          }`}
        >
          <img
            src={img}
            alt="Background"
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" />
        </div>
      ))}

      {/* Back Button */}
      <button
        onClick={onBackClick}
        className="absolute top-8 left-8 z-50 flex items-center gap-2 text-slate-900 hover:text-white transition-all font-bold bg-white/90 hover:bg-[#2563EB] backdrop-blur-md px-6 py-3 rounded-2xl border border-white/50 shadow-xl cursor-pointer group"
      >
        <ArrowLeft
          size={20}
          className="group-hover:-translate-x-1 transition-transform"
        />
        <span>Back to Home</span>
      </button>

      <div className="relative z-10 w-full max-w-md px-6 animate-fade-in-up">
        <div className="bg-white/95 backdrop-blur-md py-12 px-10 shadow-2xl rounded-[2.5rem] border border-white">
          <div className="text-center mb-10">
            <div className="flex justify-center items-center gap-3 text-[#2563EB] font-bold text-4xl mb-4">
              <Activity size={40} className="animate-pulse" />
              <span className="tracking-tight text-slate-900">
                HMS <span className="text-[#2563EB]">Digital</span>
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-600 uppercase tracking-widest">
              System Login
            </h2>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-xl animate-bounce">
                <p className="text-xs font-bold text-red-600 flex items-center gap-2">
                  <Activity size={14} /> {error}
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                Identity/Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-[#2563EB]">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  className="block w-full pl-12 pr-4 py-4 border border-slate-200 rounded-xl focus:border-[#2563EB] transition-all outline-none bg-white text-slate-900"
                  placeholder="admin@hms.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                Access Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-[#2563EB]">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="block w-full pl-12 pr-12 py-4 border border-slate-200 rounded-xl focus:border-[#2563EB] transition-all outline-none bg-white text-slate-900"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#2563EB] cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 rounded-xl shadow-lg text-white font-bold uppercase tracking-widest mt-4 transition-all active:scale-95 cursor-pointer ${
                isLoading
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-[#2563EB] hover:bg-blue-700 shadow-blue-200"
              }`}
            >
              {isLoading ? "Verifying Access..." : "Sign In Now"}
            </button>
          </form>

          <div className="mt-10 text-center">
            <div className="inline-block px-4 py-1.5 bg-slate-100 rounded-full border border-slate-200">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
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
