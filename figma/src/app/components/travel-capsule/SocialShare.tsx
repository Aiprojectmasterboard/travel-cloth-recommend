import React, { useState } from "react";
import { useLang } from "../../context/LanguageContext";
import { Icon } from "./Icon";

export function SocialShareButton() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { t, displayFont, bodyFont } = useLang();

  // Build share URL: use /share/:tripId if on a dashboard page with a tripId
  const buildShareUrl = (): string => {
    if (typeof window === "undefined") return "";
    const tripId = sessionStorage.getItem("tc_trip_id");
    if (tripId) {
      const base = window.location.origin;
      return `${base}/share/${tripId}?utm_source=share&utm_medium=direct`;
    }
    return window.location.href;
  };
  const shareUrl = buildShareUrl();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#E8DDD4] hover:border-[#C4613A]/40 bg-white text-[12px] uppercase tracking-[0.08em] text-[#57534e] hover:text-[#C4613A] transition-all cursor-pointer"
        style={{ fontFamily: bodyFont, fontWeight: 500 }}
      >
        <Icon name="share" size={16} />
        Share
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-3 w-[300px] bg-white rounded-2xl border border-[#E8DDD4] p-6 z-50"
            style={{ boxShadow: "0 12px 40px rgba(0,0,0,.12)" }}
          >
            <h4 className="text-[18px] text-[#292524] not-italic mb-1" style={{ fontFamily: displayFont }}>
              {t("share.title")}
            </h4>
            <p className="text-[13px] text-[#57534e] mb-5" style={{ fontFamily: bodyFont }}>
              {t("share.subtitle")}
            </p>

            {/* Social platforms */}
            <div className="flex gap-3 mb-5">
              {[
                { name: "Instagram", icon: "photo_camera", color: "#E1306C", bg: "#E1306C/10" },
                { name: "X / Twitter", icon: "tag", color: "#1A1410", bg: "#1A1410/10" },
                { name: "Pinterest", icon: "push_pin", color: "#E60023", bg: "#E60023/10" },
              ].map((platform) => (
                <button
                  key={platform.name}
                  onClick={() => { /* Mock share */ setOpen(false); }}
                  className="flex-1 flex flex-col items-center gap-2 py-3 rounded-xl hover:bg-[#FDF8F3] transition-colors cursor-pointer border border-transparent hover:border-[#E8DDD4]"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${platform.color}15` }}
                  >
                    <Icon name={platform.icon} size={18} className="text-[#292524]" />
                  </div>
                  <span className="text-[10px] text-[#57534e]" style={{ fontFamily: bodyFont, fontWeight: 500 }}>
                    {platform.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Copy link */}
            <button
              onClick={handleCopy}
              className="w-full h-[40px] flex items-center justify-center gap-2 bg-[#FDF8F3] border border-[#E8DDD4] rounded-lg text-[12px] uppercase tracking-[0.08em] text-[#57534e] hover:text-[#C4613A] hover:border-[#C4613A]/30 transition-all cursor-pointer"
              style={{ fontFamily: bodyFont, fontWeight: 500 }}
            >
              <Icon name={copied ? "check" : "link"} size={14} />
              {copied ? t("share.copied") : t("share.copyLink")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
