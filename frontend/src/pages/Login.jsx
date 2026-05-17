import React, { useState, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ShieldCheck } from "lucide-react";

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

    // Capture the inputs from the form
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;

    // Simulate API delay [cite: 94]
    setTimeout(() => {
      setIsLoading(false);

      // DEVELOPER BYPASS: Use these credentials to enter the Admin Dashboard
      if (email === "admin@mesra.com" && password === "admin123") {
        console.log("Authentication Successful: Role-Based Access Granted");
        onLoginSuccess(); // This triggers the page change to Admin Dashboard in App.jsx
      } else {
        // Based on doc specifications for Audit Alerts [cite: 41]
        setError("Authentication failed. Access Denied.");
      }
    }, 1200);
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
            {/* UPDATED: Mesra Branding Section */}
            <div className="flex flex-col items-center gap-3 mb-4">
              <img
                src="/mesra icon.png"
                alt="Mesra Logo"
                className="w-20 h-20 object-contain animate-float drop-shadow-md"
              />
              <div className="flex items-center gap-2 text-3xl font-black">
                <span className="tracking-tight italic uppercase text-slate-900">
                  Mesra{" "}
                  <span className="text-[#2563EB] not-italic">Digital</span>
                </span>
              </div>
            </div>
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-2">
              Clinical Portal Access
            </h2>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-xl animate-bounce">
                <p className="text-[10px] font-black text-red-600 flex items-center gap-2 uppercase tracking-widest">
                  Access Error: {error}
                </p>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Identity/Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-[#2563EB]">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  className="block w-full pl-12 pr-4 py-4 border border-slate-100 rounded-2xl focus:border-[#2563EB] focus:bg-white transition-all outline-none bg-slate-50 text-slate-900 font-bold"
                  placeholder="admin@mesra.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Access Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-[#2563EB]">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="block w-full pl-12 pr-12 py-4 border border-slate-100 rounded-2xl focus:border-[#2563EB] focus:bg-white transition-all outline-none bg-slate-50 text-slate-900 font-bold"
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
              className={`w-full py-5 rounded-2xl shadow-lg text-white font-black uppercase tracking-widest mt-4 transition-all active:scale-95 cursor-pointer ${
                isLoading
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-[#2563EB] hover:bg-blue-700 shadow-blue-100"
              }`}
            >
              {isLoading ? "Verifying Mesra Access..." : "Secure Sign In"}
            </button>
          </form>

          <div className="mt-10 text-center">
            <div className="inline-block px-6 py-2 bg-slate-50 rounded-full border border-slate-100">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <ShieldCheck size={12} className="text-green-500" /> AES-256
                Encrypted Session
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
