import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LanguageContext";
import { Icon } from "./Icon";

/* ─── Password Reset Modal (shown after user clicks reset link in email) ─── */
export function PasswordResetModal() {
  const { showPasswordReset, setShowPasswordReset, updatePassword } = useAuth();
  const { t, displayFont, bodyFont } = useLang();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!showPasswordReset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) { setError(t("auth.passwordMismatch")); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setError(t("auth.passwordMismatch")); return; }
    setLoading(true);
    setError("");
    try {
      await updatePassword(newPassword);
      setSuccess(true);
      setTimeout(() => {
        setShowPasswordReset(false);
        setSuccess(false);
        setNewPassword("");
        setConfirmPassword("");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowPasswordReset(false); }} />

      <div className="relative w-[420px] max-w-[90vw] bg-white rounded-2xl p-8" style={{ boxShadow: "0 24px 48px rgba(0,0,0,.15)" }}>
        <button
          onClick={() => { setShowPasswordReset(false); }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#EFE8DF] transition-colors cursor-pointer"
        >
          <Icon name="close" size={20} className="text-[#57534e]" />
        </button>

        <div className="flex items-center gap-2 mb-6">
          <Icon name="lock_reset" size={28} className="text-[#C4613A]" />
          <span className="text-[20px] tracking-tight text-[#1A1410]" style={{ fontFamily: displayFont, fontWeight: 700 }}>
            Travel Capsule AI
          </span>
        </div>

        <h3 className="text-[28px] text-[#292524] not-italic mb-2" style={{ fontFamily: displayFont }}>
          {t("auth.setNewPassword")}
        </h3>
        <p className="text-[15px] text-[#57534e] mb-6" style={{ fontFamily: bodyFont }}>
          {t("auth.setNewPasswordBody")}
        </p>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Icon name="check_circle" size={28} className="text-green-600" />
            </div>
            <p className="text-[15px] text-green-700 text-center font-medium" style={{ fontFamily: bodyFont }}>
              {t("auth.passwordUpdated")}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <input
                type={showNewPw ? "text" : "password"}
                placeholder={t("auth.newPassword")}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-[44px] px-4 pr-11 bg-[#FDF8F3] border border-[#E8DDD4] rounded-xl text-[14px] text-[#292524] placeholder:text-[#57534e]/50 focus:border-[#C4613A] focus:outline-none transition-colors"
                style={{ fontFamily: bodyFont }}
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-[#57534e]/60 hover:text-[#57534e] transition-colors cursor-pointer"
                tabIndex={-1}
              >
                <Icon name={showNewPw ? "visibility_off" : "visibility"} size={18} />
              </button>
            </div>
            <div className="relative">
              <input
                type={showConfirmPw ? "text" : "password"}
                placeholder={t("auth.confirmPassword")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-[44px] px-4 pr-11 bg-[#FDF8F3] border border-[#E8DDD4] rounded-xl text-[14px] text-[#292524] placeholder:text-[#57534e]/50 focus:border-[#C4613A] focus:outline-none transition-colors"
                style={{ fontFamily: bodyFont }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw(!showConfirmPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-[#57534e]/60 hover:text-[#57534e] transition-colors cursor-pointer"
                tabIndex={-1}
              >
                <Icon name={showConfirmPw ? "visibility_off" : "visibility"} size={18} />
              </button>
            </div>

            {error && (
              <p className="text-[13px] text-red-500 flex items-center gap-1" style={{ fontFamily: bodyFont }}>
                <Icon name="error" size={14} className="text-red-500" /> {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[48px] bg-[#C4613A] text-white text-[14px] uppercase tracking-[0.06em] rounded-xl hover:bg-[#A84A25] transition-colors cursor-pointer disabled:opacity-60"
              style={{ fontFamily: bodyFont, fontWeight: 600 }}
            >
              {loading ? "Processing..." : t("auth.setNewPassword")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ─── Login Modal ─── */
export function LoginModal() {
  const { showLoginModal, setShowLoginModal, loginWithEmail, signUpWithEmail, loginModalContext, setLoginModalContext, resetPassword } = useAuth();
  const { t, displayFont, bodyFont } = useLang();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  // Default to signup mode when opened from onboarding gate
  useEffect(() => {
    if (showLoginModal && loginModalContext === "onboarding_gate") {
      setMode("signup");
    }
  }, [showLoginModal, loginModalContext]);

  if (!showLoginModal) return null;

  const resetForm = () => { setName(""); setEmail(""); setPassword(""); setConfirmPassword(""); setError(""); setShowPassword(false); setShowConfirmPassword(false); setResetSent(false); };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Please fill in all fields."); return; }
    if (mode === "signup" && !name) { setError("Please enter your name."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (mode === "signup" && password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    setError("");
    try {
      if (mode === "signup") {
        await signUpWithEmail(name, email, password);
      } else {
        await loginWithEmail(email, password);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("Please enter your email address."); return; }
    setLoading(true);
    setError("");
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowLoginModal(false); resetForm(); setMode("login"); setLoginModalContext("default"); }} />

      <div className="relative w-[420px] max-w-[90vw] bg-white rounded-2xl p-8" style={{ boxShadow: "0 24px 48px rgba(0,0,0,.15)" }}>
        <button
          onClick={() => { setShowLoginModal(false); resetForm(); setMode("login"); setLoginModalContext("default"); }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#EFE8DF] transition-colors cursor-pointer"
        >
          <Icon name="close" size={20} className="text-[#57534e]" />
        </button>

        <div className="flex items-center gap-2 mb-6">
          <Icon name="luggage" size={28} className="text-[#C4613A]" />
          <span className="text-[20px] tracking-tight text-[#1A1410]" style={{ fontFamily: displayFont, fontWeight: 700 }}>
            Travel Capsule AI
          </span>
        </div>

        <h3 className="text-[28px] text-[#292524] not-italic mb-2" style={{ fontFamily: displayFont }}>
          {loginModalContext === "onboarding_gate"
            ? (mode === "login" ? t("auth.signIn") : t("auth.signUpToSeeResults"))
            : mode === "forgot" ? t("auth.forgotPassword").replace("?", "")
            : mode === "login" ? t("auth.signIn") : t("auth.signUp")}
        </h3>
        <p className="text-[15px] text-[#57534e] mb-6" style={{ fontFamily: bodyFont }}>
          {loginModalContext === "onboarding_gate"
            ? (mode === "login" ? t("auth.signInSubtitle") : t("auth.signUpToSeeResultsBody"))
            : mode === "forgot" ? t("auth.forgotPasswordBody")
            : mode === "login" ? t("auth.signInSubtitle") : t("auth.signUpBody")}
        </p>

        {/* ─── Forgot Password Mode ─── */}
        {mode === "forgot" ? (
          resetSent ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Icon name="mark_email_read" size={28} className="text-green-600" />
              </div>
              <p className="text-[15px] text-green-700 text-center font-medium" style={{ fontFamily: bodyFont }}>
                {t("auth.resetSent")}
              </p>
              <button
                onClick={() => { setMode("login"); resetForm(); }}
                className="mt-2 text-[13px] text-[#C4613A] font-semibold hover:text-[#A84A25] transition-colors cursor-pointer"
                style={{ fontFamily: bodyFont }}
              >
                {t("auth.backToSignIn")}
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-[44px] px-4 bg-[#FDF8F3] border border-[#E8DDD4] rounded-xl text-[14px] text-[#292524] placeholder:text-[#57534e]/50 focus:border-[#C4613A] focus:outline-none transition-colors"
                  style={{ fontFamily: bodyFont }}
                />

                {error && (
                  <p className="text-[13px] text-red-500 flex items-center gap-1" style={{ fontFamily: bodyFont }}>
                    <Icon name="error" size={14} className="text-red-500" /> {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[48px] bg-[#C4613A] text-white text-[14px] uppercase tracking-[0.06em] rounded-xl hover:bg-[#A84A25] transition-colors cursor-pointer disabled:opacity-60"
                  style={{ fontFamily: bodyFont, fontWeight: 600 }}
                >
                  {loading ? "Processing..." : t("auth.sendResetLink")}
                </button>
              </form>

              <p className="mt-5 text-center text-[13px] text-[#57534e]" style={{ fontFamily: bodyFont }}>
                <button
                  onClick={() => { setMode("login"); setError(""); }}
                  className="text-[#C4613A] font-semibold hover:text-[#A84A25] transition-colors cursor-pointer"
                >
                  {t("auth.backToSignIn")}
                </button>
              </p>
            </>
          )
        ) : (
          <>
            {/* Email/Password Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {mode === "signup" && (
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-[44px] px-4 bg-[#FDF8F3] border border-[#E8DDD4] rounded-xl text-[14px] text-[#292524] placeholder:text-[#57534e]/50 focus:border-[#C4613A] focus:outline-none transition-colors"
                  style={{ fontFamily: bodyFont }}
                />
              )}
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[44px] px-4 bg-[#FDF8F3] border border-[#E8DDD4] rounded-xl text-[14px] text-[#292524] placeholder:text-[#57534e]/50 focus:border-[#C4613A] focus:outline-none transition-colors"
                style={{ fontFamily: bodyFont }}
              />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-[44px] px-4 pr-11 bg-[#FDF8F3] border border-[#E8DDD4] rounded-xl text-[14px] text-[#292524] placeholder:text-[#57534e]/50 focus:border-[#C4613A] focus:outline-none transition-colors"
                  style={{ fontFamily: bodyFont }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-[#57534e]/60 hover:text-[#57534e] transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  <Icon name={showPassword ? "visibility_off" : "visibility"} size={18} />
                </button>
              </div>

              {/* Forgot password link — login mode only */}
              {mode === "login" && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => { setMode("forgot"); setError(""); setPassword(""); }}
                    className="text-[12px] text-[#57534e]/70 hover:text-[#C4613A] transition-colors cursor-pointer"
                    style={{ fontFamily: bodyFont }}
                  >
                    {t("auth.forgotPassword")}
                  </button>
                </div>
              )}

              {mode === "signup" && (
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-[44px] px-4 pr-11 bg-[#FDF8F3] border border-[#E8DDD4] rounded-xl text-[14px] text-[#292524] placeholder:text-[#57534e]/50 focus:border-[#C4613A] focus:outline-none transition-colors"
                    style={{ fontFamily: bodyFont }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-[#57534e]/60 hover:text-[#57534e] transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    <Icon name={showConfirmPassword ? "visibility_off" : "visibility"} size={18} />
                  </button>
                </div>
              )}

              {error && (
                <p className="text-[13px] text-red-500 flex items-center gap-1" style={{ fontFamily: bodyFont }}>
                  <Icon name="error" size={14} className="text-red-500" /> {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[48px] bg-[#C4613A] text-white text-[14px] uppercase tracking-[0.06em] rounded-xl hover:bg-[#A84A25] transition-colors cursor-pointer disabled:opacity-60"
                style={{ fontFamily: bodyFont, fontWeight: 600 }}
              >
                {loading ? t("preview.processing") : mode === "login" ? t("auth.signIn") : t("auth.signUp")}
              </button>
            </form>

            {/* Toggle mode */}
            <p className="mt-5 text-center text-[13px] text-[#57534e]" style={{ fontFamily: bodyFont }}>
              {mode === "login" ? "" : `${t("auth.alreadyHaveAccount")} `}
              {mode === "login" ? "" : (
                <button
                  onClick={() => { setMode("login"); setError(""); setConfirmPassword(""); }}
                  className="text-[#C4613A] font-semibold hover:text-[#A84A25] transition-colors cursor-pointer"
                >
                  {t("auth.signIn")}
                </button>
              )}
              {mode === "login" && (
                <>
                  {"Don\u2019t have an account? "}
                  <button
                    onClick={() => { setMode("signup"); setError(""); setConfirmPassword(""); }}
                    className="text-[#C4613A] font-semibold hover:text-[#A84A25] transition-colors cursor-pointer"
                  >
                    {t("auth.signUp")}
                  </button>
                </>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
