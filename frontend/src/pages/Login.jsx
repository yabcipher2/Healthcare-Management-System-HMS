import React, { useState, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";

const Login = ({ onLoginSuccess, onBackClick }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [currentImg, setCurrentImg] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();

      if (response.status === 401) {
        throw new Error("Invalid email or password.");
      }

      if (!response.ok) {
        throw new Error(
          result.message || "Authentication failed. Access Denied.",
        );
      }

      const rawRole = (result.role || result.user?.role || "").toString();
      const normalizedRole = rawRole.toLowerCase();
      let finalRole = rawRole;

      if (normalizedRole.includes("nurse")) finalRole = "Nurse";
      else if (
        normalizedRole.includes("ward") ||
        normalizedRole.includes("charge") ||
        normalizedRole === "ward manager"
      )
        finalRole = "Ward Manager";
      else if (normalizedRole.includes("triage")) finalRole = "Triage";
      else if (normalizedRole.includes("laboratory cashier"))
        finalRole = "Laboratory Cashier";
      else if (normalizedRole.includes("pharmacy cashier"))
        finalRole = "Pharmacy Cashier";

      localStorage.setItem("token", result.token);
      const loginData = {
        ...result.user,
        _id: result._id,
        role: finalRole,
        name: result.name || result.user?.name,
        email: result.email || result.user?.email,
        dashboardRoute: result.dashboardRoute,
      };
      localStorage.setItem("user", JSON.stringify(loginData));
      onLoginSuccess(loginData);
    } catch (error) {
      const isNetworkFailure =
        error instanceof TypeError ||
        /failed to fetch|networkerror|load failed/i.test(error.message || "");
      setError(
        isNetworkFailure
          ? "Unable to reach the server. Please check your connection and try again."
          : error.message || "Invalid email or password.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden font-sans p-4">
      {/* Background Images */}
      {images.map((img, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentImg ? "opacity-60" : "opacity-0"
          }`}
        >
          {typeof window !== "undefined" && navigator.onLine ? (
            <img
              src={img}
              alt="Background"
              className="w-full h-full object-cover scale-105"
              onError={() => {}}
            />
          ) : (
            <div className="w-full h-full bg-[#0E1B17]" />
          )}
          <div className="absolute inset-0 bg-[#050B09]/50 backdrop-blur-[2px]" />
        </div>
      ))}

      {/* Optimized & Minimized Login Card Containment Structure */}
      <div className="relative z-10 w-full max-w-[375px] animate-fade-in-up">
        <div className="bg-[#0E1B17]/95 backdrop-blur-md py-7 px-8 shadow-2xl rounded-[1.75rem] border border-white/10">
          <div className="text-center mb-6">
            {/* Mesra Compressed Branding Section */}
            <div className="flex flex-col items-center gap-1.5 mb-2">
              <img
                src="/mesra icon.png"
                alt="Mesra Logo"
                className="w-14 h-14 object-contain animate-float drop-shadow-md"
              />
              <div className="flex items-center gap-1 text-2xl font-black">
                <span className="tracking-tight italic uppercase text-white">
                  Mesra{" "}
                  <span className="text-[#10B981] not-italic">Digital</span>
                </span>
              </div>
            </div>
            <h2 className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.25em]">
              Clinical Portal Access
            </h2>
            <button
              type="button"
              onClick={onBackClick}
              className="mt-4 inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 hover:bg-slate-100 transition"
            >
              Back to portal
            </button>
          </div>

          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-5 flex items-start gap-2 rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 px-3.5 py-3 text-[11px] font-semibold text-[#FCA5A5]"
            >
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-1.5 ml-1">
                Identity/Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#10B981]">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  className="block w-full pl-10 pr-4 py-2.5 text-xs border border-white/10 rounded-xl focus:border-[#10B981] focus:bg-[#0E1B17] transition-all outline-none bg-[#0E1B17] text-white font-bold"
                  placeholder="admin@mesra.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-1.5 ml-1">
                Access Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#10B981]">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  className="block w-full pl-10 pr-10 py-2.5 text-xs border border-white/10 rounded-xl focus:border-[#10B981] focus:bg-[#0E1B17] transition-all outline-none bg-[#0E1B17] text-white font-bold"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#94A3B8] hover:text-[#10B981] cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 rounded-xl shadow-md text-xs text-white font-black uppercase tracking-widest mt-2 transition-all active:scale-95 cursor-pointer ${
                isLoading
                  ? "bg-[#10B981]/50 cursor-not-allowed"
                  : "bg-[#10B981] hover:bg-[#0D9668] shadow-[#10B981]/20/50"
              }`}
            >
              {isLoading ? "Verifying Mesra Access..." : "Secure Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <div className="inline-block px-4 py-1 bg-[#0E1B17] rounded-full border border-white/10">
              <p className="text-[9px] text-[#94A3B8] font-black uppercase tracking-[0.15em] flex items-center gap-1.5">
                <ShieldCheck size={11} className="text-[#10B981]" /> AES-256
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
