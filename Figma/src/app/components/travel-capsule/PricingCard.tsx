import React from "react";
import { BtnPrimary, BtnSecondary, BtnDark } from "./Buttons";
import { CheckItem } from "./CheckItem";

interface PricingCardProps {
  variant: "standard" | "pro" | "annual";
  title: string;
  price: string;
  period?: string;
  features: string[];
  badge?: string;
  onSelect?: () => void;
}

export function PricingCard({ variant, title, price, period = "/month", features, badge, onSelect }: PricingCardProps) {
  if (variant === "pro") {
    return (
      <div
        className="relative flex flex-col p-8 bg-[#C4613A] text-white rounded-2xl"
        style={{ boxShadow: "0 4px 16px rgba(196,97,58,.25)" }}
      >
        {badge && (
          <span
            className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#1A1410] text-white text-[10px] uppercase tracking-[0.12em] rounded-full"
            style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}
          >
            {badge}
          </span>
        )}
        <h3 className="text-white not-italic text-[28px]" style={{ fontFamily: "var(--font-display)" }}>{title}</h3>
        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-[48px] text-white" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>{price}</span>
          <span className="text-[16px] text-white/70" style={{ fontFamily: "var(--font-body)" }}>{period}</span>
        </div>
        <div className="mt-6 flex flex-col gap-3">
          {features.map((f) => (
            <div key={f} className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-white" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span className="text-[14px] text-white/90" style={{ fontFamily: "var(--font-body)" }}>{f}</span>
            </div>
          ))}
        </div>
        <button
          onClick={onSelect}
          className="mt-8 h-[56px] w-full bg-white text-[#C4613A] text-[14px] uppercase tracking-[0.08em] rounded-none hover:bg-white/90 transition-colors cursor-pointer"
          style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}
        >
          Get Pro
        </button>
      </div>
    );
  }

  if (variant === "annual") {
    return (
      <div className="relative flex flex-col p-8 bg-white border border-[#C4613A]/10 rounded-2xl">
        {badge && (
          <span
            className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 gold-gradient text-white text-[10px] uppercase tracking-[0.12em] rounded-full"
            style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}
          >
            {badge}
          </span>
        )}
        <h3 className="not-italic text-[28px] text-[#292524]" style={{ fontFamily: "var(--font-display)" }}>{title}</h3>
        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-[48px] text-[#292524]" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>{price}</span>
          <span className="text-[16px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>{period}</span>
        </div>
        <div className="mt-6 flex flex-col gap-3">
          {features.map((f) => (
            <CheckItem key={f} label={f} />
          ))}
        </div>
        <div className="mt-8">
          <BtnDark onClick={onSelect} className="w-full">Get Annual</BtnDark>
        </div>
      </div>
    );
  }

  // Standard
  return (
    <div className="flex flex-col p-8 bg-white border border-[#C4613A]/10 rounded-2xl">
      <h3 className="not-italic text-[28px] text-[#292524]" style={{ fontFamily: "var(--font-display)" }}>{title}</h3>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-[48px] text-[#292524]" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>{price}</span>
        <span className="text-[16px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>{period}</span>
      </div>
      <div className="mt-6 flex flex-col gap-3">
        {features.map((f) => (
          <CheckItem key={f} label={f} />
        ))}
      </div>
      <div className="mt-8">
        <BtnSecondary onClick={onSelect} className="w-full">Get Started</BtnSecondary>
      </div>
    </div>
  );
}
