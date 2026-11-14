import React, { useState, useEffect } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  X,
  CheckCircle2,
} from "lucide-react";

const Login = ({ onLoginSuccess, onBackClick }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [currentImg, setCurrentImg] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

  // Self-service account recovery (email + Staff ID + new access key).
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStaffId, setResetStaffId] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

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

  const openResetModal = () => {
    setResetEmail(email || "");
    setResetStaffId("");
    setResetPassword("");
    setResetConfirm("");
    setResetError("");
    setResetSuccess("");
    setShowReset(true);
  };

  const closeResetModal = () => {
    if (resetLoading) return;
    setShowReset(false);
    setResetError("");
    setResetSuccess("");
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess("");

    if (resetPassword.length < 4) {
      setResetError("The new access key must be at least 4 characters long.");
      return;
    }
    if (resetPassword !== resetConfirm) {
      setResetError("The two access keys do not match.");
      return;
    }

    setResetLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: resetEmail,
          staffId: resetStaffId,
          newPassword: resetPassword,
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Password recovery failed.");
      }

      setResetSuccess(
        result.message || "Password updated. Sign in with your new access key.",
      );
      // Pre-fill the sign-in form so the staff member can continue immediately.
      setEmail(resetEmail);
      setPassword("");
      setError("");
      setResetPassword("");
      setResetConfirm("");
    } catch (err) {
      const isNetworkFailure =
        err instanceof TypeError ||
        /failed to fetch|networkerror|load failed/i.test(err.message || "");
      setResetError(
        isNetworkFailure
          ? "Unable to reach the server. Please check your connection and try again."
          : err.message || "Password recovery failed.",
      );
    } finally {
      setResetLoading(false);
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
              <div className="flex justify-end mt-2 pr-1">
                <button
                  type="button"
                  onClick={openResetModal}
                  className="text-[9px] font-black uppercase tracking-widest text-[#10B981] hover:text-white transition"
                >
                  Forgot password?
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

      {/* ACCOUNT RECOVERY MODAL */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-[380px] rounded-[1.5rem] border border-white/10 bg-[#0E1B17] p-6 shadow-2xl animate-fade-in-up">
            <button
              type="button"
              onClick={closeResetModal}
              aria-label="Close account recovery"
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-white transition"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <KeyRound size={16} className="text-[#10B981]" />
              <h3 className="text-[13px] font-black uppercase tracking-wider text-white">
                Account Recovery
              </h3>
            </div>
            <p className="text-[10px] text-[#94A3B8] mb-5 leading-relaxed">
              Verify the staff account with the work email and the Staff ID on
              your hospital ID badge, then set a new access key.
            </p>

            {resetSuccess ? (
              <div className="space-y-4">
                <div className="flex items-start gap-2 rounded-xl border border-[#10B981]/40 bg-[#10B981]/10 px-3.5 py-3 text-[11px] font-semibold text-[#A7F3D0]">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                  <span>{resetSuccess}</span>
                </div>
                <button
                  type="button"
                  onClick={closeResetModal}
                  className="w-full py-3 rounded-xl bg-[#10B981] hover:bg-[#0D9668] text-white text-[11px] font-black uppercase tracking-widest transition"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleResetPassword}>
                {resetError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 px-3 py-2.5 text-[10px] font-semibold text-[#FCA5A5]"
                  >
                    <AlertCircle size={13} className="mt-0.5 shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-1.5 ml-1">
                    Work Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#10B981]">
                      <Mail size={15} />
                    </div>
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => {
                        setResetEmail(e.target.value);
                        if (resetError) setResetError("");
                      }}
                      placeholder="staff@mesra.com"
                      className="block w-full pl-10 pr-3 py-2.5 text-xs border border-white/10 rounded-xl focus:border-[#10B981] transition-all outline-none bg-[#0E1B17] text-white font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-1.5 ml-1">
                    Staff ID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#10B981]">
                      <ShieldCheck size={15} />
                    </div>
                    <input
                      type="text"
                      required
                      value={resetStaffId}
                      onChange={(e) => {
                        setResetStaffId(e.target.value);
                        if (resetError) setResetError("");
                      }}
                      placeholder="STAFF-103"
                      className="block w-full pl-10 pr-3 py-2.5 text-xs border border-white/10 rounded-xl focus:border-[#10B981] transition-all outline-none bg-[#0E1B17] text-white font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-1.5 ml-1">
                    New Access Key
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#10B981]">
                      <Lock size={15} />
                    </div>
                    <input
                      type={showResetPassword ? "text" : "password"}
                      required
                      value={resetPassword}
                      onChange={(e) => {
                        setResetPassword(e.target.value);
                        if (resetError) setResetError("");
                      }}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-10 py-2.5 text-xs border border-white/10 rounded-xl focus:border-[#10B981] transition-all outline-none bg-[#0E1B17] text-white font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#94A3B8] hover:text-[#10B981]"
                    >
                      {showResetPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-1.5 ml-1">
                    Confirm Access Key
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#10B981]">
                      <Lock size={15} />
                    </div>
                    <input
                      type="password"
                      required
                      value={resetConfirm}
                      onChange={(e) => {
                        setResetConfirm(e.target.value);
                        if (resetError) setResetError("");
                      }}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-3 py-2.5 text-xs border border-white/10 rounded-xl focus:border-[#10B981] transition-all outline-none bg-[#0E1B17] text-white font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className={`w-full py-3 rounded-xl text-[11px] text-white font-black uppercase tracking-widest transition-all active:scale-95 ${
                    resetLoading
                      ? "bg-[#10B981]/50 cursor-not-allowed"
                      : "bg-[#10B981] hover:bg-[#0D9668]"
                  }`}
                >
                  {resetLoading ? "Updating access key..." : "Reset access key"}
                </button>

                <p className="text-[9px] text-[#94A3B8] leading-relaxed text-center">
                  Your Staff ID is listed in the staff directory (Administrator →
                  Staff Management), for example STAFF-103. No access? Ask an
                  administrator to reset the account.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
