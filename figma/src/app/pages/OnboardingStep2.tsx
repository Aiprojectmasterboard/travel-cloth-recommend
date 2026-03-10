import wardrobeImg from "../../assets/94873ae744f2a797c5c10269a41b6763829932a2.png";
import React from "react";
import { useNavigate } from "react-router";
import { OnboardingLayout } from "../components/travel-capsule/OnboardingLayout";
import { ProgressBar, BtnPrimary, BtnSecondary, Icon } from "../components/travel-capsule";
import { useOnboarding, type Silhouette } from "../context/OnboardingContext";
import { GA } from "../lib/analytics";
import { useLang } from "../context/LanguageContext";
import { SEO } from "../components/SEO";

const GENDERS = [
  { value: "male", labelKey: "onboarding2.genderMale", icon: "male" },
  { value: "female", labelKey: "onboarding2.genderFemale", icon: "female" },
  { value: "non-binary", labelKey: "onboarding2.genderNonBinary", icon: "transgender" },
];

const SILHOUETTES: { value: Silhouette; labelKey: string }[] = [
  { value: "petite", labelKey: "onboarding2.silhouettePetite" },
  { value: "standard", labelKey: "onboarding2.silhouetteStandard" },
  { value: "tall", labelKey: "onboarding2.silhouetteTall" },
  { value: "plus", labelKey: "onboarding2.silhouettePlus" },
];

/** Stick-figure SVG icons for each silhouette type */
function SilhouetteIcon({ type, selected }: { type: Silhouette; selected: boolean }) {
  const color = selected ? "#C4613A" : "#78716c";
  const size = 48;
  switch (type) {
    case "petite":
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="10" r="4" stroke={color} strokeWidth="2" />
          <line x1="24" y1="14" x2="24" y2="30" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1="18" y1="20" x2="30" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1="24" y1="30" x2="19" y2="40" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1="24" y1="30" x2="29" y2="40" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "standard":
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="8" r="4" stroke={color} strokeWidth="2" />
          <line x1="24" y1="12" x2="24" y2="30" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="20" x2="32" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1="24" y1="30" x2="18" y2="42" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1="24" y1="30" x2="30" y2="42" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "tall":
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="6" r="4" stroke={color} strokeWidth="2" />
          <line x1="24" y1="10" x2="24" y2="30" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1="15" y1="19" x2="33" y2="19" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1="24" y1="30" x2="17" y2="44" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1="24" y1="30" x2="31" y2="44" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "plus":
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="8" r="4" stroke={color} strokeWidth="2" />
          <line x1="24" y1="12" x2="24" y2="30" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="15" y1="20" x2="33" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="24" cy="24" rx="7" ry="5" stroke={color} strokeWidth="1.5" />
          <line x1="24" y1="30" x2="18" y2="42" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1="24" y1="30" x2="30" y2="42" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

export function OnboardingStep2() {
  const navigate = useNavigate();
  const { data, setData } = useOnboarding();
  const { t } = useLang();

  return (
    <>
    <SEO title="Choose Your Style Aesthetic" description="Select your fashion style preferences. Our AI will match outfits to your personal aesthetic for the perfect travel wardrobe." noindex={true} />
    <OnboardingLayout
      imageUrl={wardrobeImg}
      quote="Style is a way to say who you are without having to speak."
      attribution="Rachel Zoe"
    >
      <ProgressBar currentStep={2} sublabel={t("onboarding2.sublabel")} />

      <div className="mt-10">
        <h1 className="text-[#292524]" style={{ fontSize: "clamp(36px, 4vw, 56px)", fontFamily: "var(--font-display)", lineHeight: 1.1 }}>
          {t("onboarding2.title")} <em>{t("onboarding2.titleEm")}</em>
        </h1>
        <p className="mt-4 text-[16px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
          {t("onboarding2.subtitle")}
        </p>
      </div>

      {/* Gender Selection */}
      <div className="mt-10">
        <label
          className="text-[11px] uppercase tracking-[0.12em] text-[#57534e] block mb-4"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {t("onboarding2.genderSelection")}
        </label>
        <div className="grid grid-cols-3 gap-3">
          {GENDERS.map((g) => {
            const selected = data.gender === g.value;
            return (
              <button
                key={g.value}
                onClick={() => setData((prev) => ({ ...prev, gender: g.value }))}
                className={`
                  flex flex-col items-center gap-2 py-5 px-3 rounded-xl border-2 transition-all cursor-pointer
                  ${selected
                    ? "border-[#C4613A] bg-[#C4613A]/5"
                    : "border-[#E8DDD4] bg-white hover:border-[#C4613A]/30"
                  }
                `}
              >
                <Icon
                  name={g.icon}
                  size={28}
                  className={selected ? "text-[#C4613A]" : "text-[#57534e]"}
                />
                <span
                  className={`text-[14px] ${selected ? "text-[#C4613A]" : "text-[#292524]"}`}
                  style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
                >
                  {t(g.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Silhouette Selection */}
      <div className="mt-10">
        <label
          className="text-[11px] uppercase tracking-[0.12em] text-[#57534e] block mb-1"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {t("onboarding2.silhouette")}
        </label>
        <span className="text-[12px] text-[#57534e]/60 block mb-4" style={{ fontFamily: "var(--font-body)" }}>
          {t("onboarding2.silhouetteHint")}
        </span>
        <div className="grid grid-cols-4 gap-3">
          {SILHOUETTES.map((s) => {
            const selected = data.silhouette === s.value;
            return (
              <button
                key={s.value}
                onClick={() => setData((prev) => ({ ...prev, silhouette: s.value }))}
                className={`
                  flex flex-col items-center gap-2 py-4 px-2 rounded-xl border-2 transition-all cursor-pointer
                  ${selected
                    ? "border-[#C4613A] bg-[#C4613A]/5"
                    : "border-[#E8DDD4] bg-white hover:border-[#C4613A]/30"
                  }
                `}
              >
                <SilhouetteIcon type={s.value} selected={selected} />
                <span
                  className={`text-[13px] ${selected ? "text-[#C4613A]" : "text-[#292524]"}`}
                  style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
                >
                  {t(s.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-12 flex items-center justify-between gap-3">
        <BtnSecondary size="sm" onClick={() => navigate("/onboarding/1")}>{t("onboarding2.back")}</BtnSecondary>
        <BtnPrimary size="sm" onClick={() => { GA.onboardingStep(2); navigate("/onboarding/3"); }}>
          <span className="flex items-center gap-2">
            <span className="hidden sm:inline">{t("onboarding2.continueToStyle")}</span>
            <span className="sm:hidden">{t("onboarding2.continue")}</span>
            <Icon name="arrow_forward" size={16} className="text-white" />
          </span>
        </BtnPrimary>
      </div>
    </OnboardingLayout>
    </>
  );
}
