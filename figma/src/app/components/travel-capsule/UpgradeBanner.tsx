import React, { useState, useEffect } from "react";
import { Icon } from "./Icon";
import { useLang } from "../../context/LanguageContext";

interface UpgradeBannerProps {
  initialMinutes?: number;
  initialSeconds?: number;
  onUpgrade?: () => void;
}

export function UpgradeBanner({ initialMinutes = 14, initialSeconds = 59, onUpgrade }: UpgradeBannerProps) {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60 + initialSeconds);
  const { t, bodyFont } = useLang();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const secs = (timeLeft % 60).toString().padStart(2, "0");

  return (
    <div className="w-full bg-[#C4613A] py-3 px-6 rounded-xl">
      <div className="mx-auto flex items-center justify-between flex-wrap gap-3" style={{ maxWidth: "var(--max-w)" }}>
        <div className="flex items-center gap-4">
          <span className="text-white/80 text-[12px] uppercase tracking-[0.08em]" style={{ fontFamily: bodyFont, fontWeight: 500 }}>
            {t("upgrade.limitedOffer")}
          </span>
          <span className="text-white text-[20px] tabular-nums" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
            {mins}:{secs}
          </span>
        </div>
        <button
          onClick={onUpgrade}
          className="h-[36px] px-5 bg-white text-[#C4613A] text-[12px] uppercase tracking-[0.08em] rounded-full hover:bg-white/90 transition-colors cursor-pointer"
          style={{ fontFamily: bodyFont, fontWeight: 600 }}
        >
          {t("upgrade.cta")}
        </button>
      </div>
    </div>
  );
}


/**
 * Floating bottom CTA bar — sticky at the bottom of the viewport.
 */
export function FloatingUpgradeBar({ onUpgrade }: { onUpgrade?: () => void }) {
  const { t, bodyFont } = useLang();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 600);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="no-print fixed bottom-0 left-0 right-0 z-50 bg-[#1A1410]/95 backdrop-blur-md border-t border-[#C4613A]/20 py-3 px-6 transition-transform" style={{ transform: visible ? "translateY(0)" : "translateY(100%)" }}>
      <div className="mx-auto flex items-center justify-between" style={{ maxWidth: "var(--max-w)" }}>
        <div className="hidden sm:flex items-center gap-3">
          <Icon name="auto_awesome" size={18} className="text-[#C4613A]" filled />
          <div>
            <span className="text-white text-[13px] block" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
              {t("upgrade.title")}
            </span>
            <span className="text-white/50 text-[11px]" style={{ fontFamily: bodyFont }}>
              {t("upgrade.proDesc")}
            </span>
          </div>
        </div>
        <button
          onClick={onUpgrade}
          className="h-[42px] px-6 bg-[#C4613A] text-white text-[13px] uppercase tracking-[0.08em] rounded-full hover:bg-[#A84A25] transition-colors cursor-pointer flex items-center gap-2 sm:ml-4"
          style={{ fontFamily: bodyFont, fontWeight: 600 }}
        >
          <Icon name="auto_awesome" size={16} className="text-white" filled />
          {t("upgrade.bottomCta")}
        </button>
      </div>
    </div>
  );
}
