import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LanguageContext";
import { Icon } from "./Icon";

function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  // Known in-app browsers (Facebook, Instagram, Twitter/X, Snapchat, Line, etc.)
  if (/FBAN|FBAV|Instagram|Twitter|Snapchat|Line\/|NAVER|Kakao|WeChat|MicroMessenger/.test(ua)) return true;
  // iOS WebView (has AppleWebKit but NOT Safari in UA)
  if (/iPhone|iPad|iPod/.test(ua) && /AppleWebKit/.test(ua) && !/Safari/.test(ua)) return true;
  // Android WebView
  if (/Android/.test(ua) && /wv/.test(ua)) return true;
  return false;
}

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
  const { showLoginModal, setShowLoginModal, loginWithGoogle, loginWithEmail, signUpWithEmail, loginModalContext, setLoginModalContext, resetPassword } = useAuth();
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
  const [urlCopied, setUrlCopied] = useState(false);
  const inApp = useMemo(() => isInAppBrowser(), []);

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
            ? "Sign up to see your free results"
            : mode === "forgot" ? t("auth.forgotPassword").replace("?", "")
            : mode === "login" ? "Sign In" : "Create Account"}
        </h3>
        <p className="text-[15px] text-[#57534e] mb-6" style={{ fontFamily: bodyFont }}>
          {loginModalContext === "onboarding_gate"
            ? "Create a free account to get your AI-powered style analysis. No credit card required."
            : mode === "forgot" ? t("auth.forgotPasswordBody")
            : mode === "login" ? "Access your saved capsules and style profile." : "Join to save your AI-generated capsule wardrobes."}
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
            {/* Google Button — or in-app browser fallback */}
            {inApp ? (
              <div className="w-full p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-[13px] font-semibold text-amber-800 mb-1" style={{ fontFamily: bodyFont }}>
                  {t("auth.inAppTitle")}
                </p>
                <p className="text-[12px] text-amber-700 mb-3 leading-relaxed" style={{ fontFamily: bodyFont }}>
                  {t("auth.inAppBody")}
                </p>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(window.location.href);
                      setUrlCopied(true);
                      setTimeout(() => setUrlCopied(false), 3000);
                    } catch {
                      // fallback for older browsers
                      const ta = document.createElement("textarea");
                      ta.value = window.location.href;
                      ta.style.position = "fixed";
                      ta.style.opacity = "0";
                      document.body.appendChild(ta);
                      ta.select();
                      document.execCommand("copy");
                      document.body.removeChild(ta);
                      setUrlCopied(true);
                      setTimeout(() => setUrlCopied(false), 3000);
                    }
                  }}
                  className="w-full h-[40px] flex items-center justify-center gap-2 bg-amber-600 text-white text-[13px] rounded-lg hover:bg-amber-700 transition-colors cursor-pointer"
                  style={{ fontFamily: bodyFont, fontWeight: 600 }}
                >
                  <Icon name={urlCopied ? "check" : "content_copy"} size={16} className="text-white" />
                  {urlCopied ? t("auth.urlCopied") : t("auth.openBrowser")}
                </button>
              </div>
            ) : (
              <button
                onClick={() => { loginWithGoogle(); resetForm(); }}
                className="w-full h-[48px] flex items-center justify-center gap-3 bg-white border border-[#E8DDD4] rounded-xl hover:bg-[#FDF8F3] hover:border-[#C4613A]/30 transition-all cursor-pointer"
                style={{ boxShadow: "0 2px 6px rgba(0,0,0,.06)" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-[14px] text-[#292524]" style={{ fontFamily: bodyFont, fontWeight: 500 }}>
                  {t("auth.signInGoogle")}
                </span>
              </button>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-[#E8DDD4]" />
              <span className="text-[11px] uppercase tracking-[0.1em] text-[#57534e]/60" style={{ fontFamily: bodyFont }}>or</span>
              <div className="flex-1 h-px bg-[#E8DDD4]" />
            </div>

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
                {loading ? "Processing..." : mode === "login" ? "Sign In" : "Create Account"}
              </button>
            </form>

            {/* Toggle mode */}
            <p className="mt-5 text-center text-[13px] text-[#57534e]" style={{ fontFamily: bodyFont }}>
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setConfirmPassword(""); }}
                className="text-[#C4613A] font-semibold hover:text-[#A84A25] transition-colors cursor-pointer"
              >
                {mode === "login" ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
