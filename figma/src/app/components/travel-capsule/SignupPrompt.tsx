import React, { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LanguageContext";
import { Icon } from "./Icon";

function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/FBAN|FBAV|Instagram|Twitter|Snapchat|Line\/|NAVER|Kakao|WeChat|MicroMessenger/.test(ua)) return true;
  if (/iPhone|iPad|iPod/.test(ua) && /AppleWebKit/.test(ua) && !/Safari/.test(ua)) return true;
  if (/Android/.test(ua) && /wv/.test(ua)) return true;
  return false;
}

/** Floating prompt shown on Standard/Pro dashboards after purchase (no account) */
export function SignupPrompt() {
  const { isLoggedIn, showSignupPrompt, setShowSignupPrompt, loginWithGoogle } = useAuth();
  const { t, displayFont, bodyFont } = useLang();
  const [urlCopied, setUrlCopied] = useState(false);
  const inApp = useMemo(() => isInAppBrowser(), []);

  if (isLoggedIn || !showSignupPrompt) return null;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = window.location.href;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 3000);
  };

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

        {inApp ? (
          <div className="w-full p-3 bg-amber-50 border border-amber-200 rounded-lg mb-2">
            <p className="text-[12px] text-amber-700 mb-2 leading-relaxed" style={{ fontFamily: bodyFont }}>
              {t("auth.inAppBody")}
            </p>
            <button
              onClick={handleCopyUrl}
              className="w-full h-[36px] flex items-center justify-center gap-2 bg-amber-600 text-white text-[12px] rounded-lg hover:bg-amber-700 transition-colors cursor-pointer"
              style={{ fontFamily: bodyFont, fontWeight: 600 }}
            >
              <Icon name={urlCopied ? "check" : "content_copy"} size={14} className="text-white" />
              {urlCopied ? t("auth.urlCopied") : t("auth.openBrowser")}
            </button>
          </div>
        ) : (
          <button
            onClick={loginWithGoogle}
            className="w-full h-[44px] flex items-center justify-center gap-2.5 bg-[#1A1410] text-white rounded-none hover:bg-[#C4613A] transition-all cursor-pointer text-[12px] uppercase tracking-[0.08em]"
            style={{ fontFamily: bodyFont, fontWeight: 600 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#fff"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff"/>
            </svg>
            {t("auth.signInGoogle")}
          </button>
        )}

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
