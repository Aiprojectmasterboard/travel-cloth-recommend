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
 * Inline comparison card — shown between outfit cards in StandardDashboard
 * to highlight the difference between Standard and Pro.
 */
export function ProUpsellCard({ onUpgrade }: { onUpgrade?: () => void }) {
  const { t, displayFont, bodyFont } = useLang();

  const features = [
    { icon: "auto_awesome", text: t("upgrade.feature1") },
    { icon: "public", text: t("upgrade.feature2") },
    { icon: "hd", text: t("upgrade.feature3") },
    { icon: "refresh", text: t("upgrade.feature4") },
    { icon: "luggage", text: t("upgrade.feature5") },
  ];

  return (
    <div className="relative bg-gradient-to-br from-[#1A1410] to-[#2d241c] rounded-2xl overflow-hidden p-6 sm:p-8" style={{ boxShadow: "0 8px 32px rgba(0,0,0,.15)" }}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#C4613A]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#C4613A]/5 rounded-full blur-2xl" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <Icon name="auto_awesome" size={20} className="text-[#C4613A]" filled />
          <span className="text-[10px] uppercase tracking-[0.15em] text-[#C4613A]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
            {t("upgrade.whyPro")}
          </span>
        </div>
        <h3 className="text-white italic text-[24px] sm:text-[28px] mb-2" style={{ fontFamily: displayFont, lineHeight: 1.2 }}>
          {t("upgrade.title")}
        </h3>
        <p className="text-white/60 text-[14px] mb-6 max-w-[500px]" style={{ fontFamily: bodyFont }}>
          {t("upgrade.subtitle")}
        </p>

        {/* Comparison */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <span className="text-[9px] uppercase tracking-[0.12em] text-white/40 block mb-1" style={{ fontFamily: "var(--font-mono)" }}>
              {t("upgrade.yourPlan")}
            </span>
            <span className="text-white/80 text-[14px] block mb-1" style={{ fontFamily: bodyFont, fontWeight: 600 }}>Standard</span>
            <span className="text-white/40 text-[11px]" style={{ fontFamily: bodyFont }}>{t("upgrade.standardDesc")}</span>
          </div>
          <div className="bg-[#C4613A]/15 border border-[#C4613A]/30 rounded-xl p-4">
            <span className="text-[9px] uppercase tracking-[0.12em] text-[#C4613A] block mb-1" style={{ fontFamily: "var(--font-mono)" }}>
              {t("upgrade.proPlan")}
            </span>
            <span className="text-white text-[14px] block mb-1" style={{ fontFamily: bodyFont, fontWeight: 600 }}>Pro — $3.99</span>
            <span className="text-white/60 text-[11px]" style={{ fontFamily: bodyFont }}>{t("upgrade.proDesc")}</span>
          </div>
        </div>

        {/* Feature list */}
        <div className="space-y-2.5 mb-6">
          {features.map((f) => (
            <div key={f.icon} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[#C4613A]/15 flex items-center justify-center flex-shrink-0">
                <Icon name={f.icon} size={14} className="text-[#C4613A]" />
              </div>
              <span className="text-white/80 text-[13px]" style={{ fontFamily: bodyFont }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Persuasion text */}
        <div className="bg-white/5 rounded-lg p-4 mb-6 border-l-2 border-[#C4613A]">
          <p className="text-white/70 text-[12px] italic leading-relaxed" style={{ fontFamily: displayFont }}>
            "{t("upgrade.reason1")}"
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={onUpgrade}
          className="w-full h-[52px] bg-[#C4613A] text-white text-[14px] uppercase tracking-[0.08em] rounded-xl hover:bg-[#A84A25] transition-colors cursor-pointer flex items-center justify-center gap-2"
          style={{ fontFamily: bodyFont, fontWeight: 600 }}
        >
          <Icon name="auto_awesome" size={18} className="text-white" filled />
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
