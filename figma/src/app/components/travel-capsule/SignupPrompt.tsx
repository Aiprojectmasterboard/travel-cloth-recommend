import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LanguageContext";
import { Icon } from "./Icon";

/** Floating prompt shown on Standard/Pro dashboards after purchase (no account) */
export function SignupPrompt() {
  const { isLoggedIn, showSignupPrompt, setShowSignupPrompt, setShowLoginModal } = useAuth();
  const { t, displayFont, bodyFont } = useLang();

  if (isLoggedIn || !showSignupPrompt) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[90vw]">
      <div
        className="bg-white rounded-2xl border border-[#E8DDD4] p-6"
        style={{ boxShadow: "0 12px 40px rgba(0,0,0,.12)" }}
      >
        <button
          onClick={() => setShowSignupPrompt(false)}
          className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#EFE8DF] transition-colors cursor-pointer"
        >
          <Icon name="close" size={16} className="text-[#57534e]" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-full bg-[#C4613A]/10 flex items-center justify-center">
            <Icon name="bookmark" size={18} className="text-[#C4613A]" />
          </div>
          <span className="text-[16px] text-[#292524]" style={{ fontFamily: displayFont, fontWeight: 600 }}>
            {t("auth.signUpPrompt")}
          </span>
        </div>

        <p className="text-[13px] text-[#57534e] mb-4 leading-relaxed" style={{ fontFamily: bodyFont }}>
          {t("auth.signUpBody")}
        </p>

        <button
          onClick={() => { setShowSignupPrompt(false); setShowLoginModal(true); }}
          className="w-full h-[44px] flex items-center justify-center gap-2.5 bg-[#1A1410] text-white rounded-none hover:bg-[#C4613A] transition-all cursor-pointer text-[12px] uppercase tracking-[0.08em]"
          style={{ fontFamily: bodyFont, fontWeight: 600 }}
        >
          <Icon name="person" size={16} className="text-white" />
          {t("auth.signUp")}
        </button>

        <p className="mt-3 text-center text-[13px] text-[#57534e]" style={{ fontFamily: bodyFont }}>
          {t("auth.alreadyHaveAccount")}{" "}
          <button
            onClick={() => { setShowSignupPrompt(false); setShowLoginModal(true); }}
            className="text-[#C4613A] font-semibold hover:text-[#A84A25] transition-colors cursor-pointer"
          >
            {t("auth.signIn")}
          </button>
        </p>

        <button
          onClick={() => setShowSignupPrompt(false)}
          className="w-full mt-2 h-[36px] text-[12px] text-[#57534e] hover:text-[#C4613A] transition-colors cursor-pointer"
          style={{ fontFamily: bodyFont, fontWeight: 500 }}
        >
          {t("auth.maybeLater")}
        </button>
      </div>
    </div>
  );
}
