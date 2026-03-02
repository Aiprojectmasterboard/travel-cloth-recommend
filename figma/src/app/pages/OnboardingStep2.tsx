import wardrobeImg from "../../assets/94873ae744f2a797c5c10269a41b6763829932a2.png";
import React, { useState } from "react";
import { useNavigate } from "react-router";
import { OnboardingLayout } from "../components/travel-capsule/OnboardingLayout";
import { ProgressBar, BtnPrimary, BtnSecondary, Icon, TCInput } from "../components/travel-capsule";
import { useOnboarding } from "../context/OnboardingContext";

const GENDERS = [
  { value: "male", label: "Male", icon: "male" },
  { value: "female", label: "Female", icon: "female" },
  { value: "non-binary", label: "Non-binary", icon: "transgender" },
];

/** Convert cm to { ft, in } */
function cmToFtIn(cm: number): { ft: number; inches: number } {
  const totalInches = cm / 2.54;
  return { ft: Math.floor(totalInches / 12), inches: Math.round(totalInches % 12) };
}
/** Convert ft + inches to cm */
function ftInToCm(ft: number, inches: number): number {
  return Math.round((ft * 12 + inches) * 2.54);
}
/** Convert kg to lbs */
function kgToLb(kg: number): number {
  return Math.round(kg * 2.2046);
}
/** Convert lbs to kg */
function lbToKg(lb: number): number {
  return Math.round(lb / 2.2046);
}

export function OnboardingStep2() {
  const navigate = useNavigate();
  const { data, setData } = useOnboarding();
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");

  // Imperial display state (derived from metric values on switch)
  const [impFt, setImpFt] = useState("");
  const [impIn, setImpIn] = useState("");
  const [impLb, setImpLb] = useState("");

  function switchToImperial() {
    const cm = parseFloat(data.height);
    const kg = parseFloat(data.weight);
    if (!isNaN(cm) && cm > 0) {
      const { ft, inches } = cmToFtIn(cm);
      setImpFt(String(ft));
      setImpIn(String(inches));
    } else {
      setImpFt("");
      setImpIn("");
    }
    if (!isNaN(kg) && kg > 0) {
      setImpLb(String(kgToLb(kg)));
    } else {
      setImpLb("");
    }
    setUnit("imperial");
  }

  function switchToMetric() {
    const ft = parseInt(impFt, 10);
    const inches = parseInt(impIn, 10);
    const lb = parseFloat(impLb);
    if (!isNaN(ft) && !isNaN(inches)) {
      setData((prev) => ({ ...prev, height: String(ftInToCm(ft || 0, inches || 0)) }));
    }
    if (!isNaN(lb) && lb > 0) {
      setData((prev) => ({ ...prev, weight: String(lbToKg(lb)) }));
    }
    setUnit("metric");
  }

  function handleImpFtChange(v: string) {
    setImpFt(v);
    const ft = parseInt(v, 10);
    const inches = parseInt(impIn, 10) || 0;
    if (!isNaN(ft)) setData((prev) => ({ ...prev, height: String(ftInToCm(ft, inches)) }));
  }
  function handleImpInChange(v: string) {
    setImpIn(v);
    const ft = parseInt(impFt, 10) || 0;
    const inches = parseInt(v, 10);
    if (!isNaN(inches)) setData((prev) => ({ ...prev, height: String(ftInToCm(ft, inches)) }));
  }
  function handleImpLbChange(v: string) {
    setImpLb(v);
    const lb = parseFloat(v);
    if (!isNaN(lb) && lb > 0) setData((prev) => ({ ...prev, weight: String(lbToKg(lb)) }));
  }

  return (
    <OnboardingLayout
      imageUrl={wardrobeImg}
      quote="Style is a way to say who you are without having to speak."
      attribution="Rachel Zoe"
    >
      <ProgressBar currentStep={2} sublabel="Personalize your look" />

      <div className="mt-10">
        <h1 className="text-[#292524]" style={{ fontSize: "clamp(36px, 4vw, 56px)", fontFamily: "var(--font-display)", lineHeight: 1.1 }}>
          Personalize <em>your look</em>
        </h1>
        <p className="mt-4 text-[16px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
          Help us understand your preferences to create the perfect capsule wardrobe for your body and style.
        </p>
      </div>

      {/* Gender Selection */}
      <div className="mt-10">
        <label
          className="text-[11px] uppercase tracking-[0.12em] text-[#57534e] block mb-4"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Gender Selection
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
                  {g.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Body Info */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-1">
          <label
            className="text-[11px] uppercase tracking-[0.12em] text-[#57534e]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Body Info
          </label>
          {/* Unit toggle */}
          <div className="flex items-center gap-0 rounded-lg border border-[#E8DDD4] overflow-hidden">
            <button
              onClick={() => unit === "imperial" && switchToMetric()}
              className={`px-3 py-1 text-[11px] uppercase tracking-[0.08em] transition-colors cursor-pointer ${
                unit === "metric"
                  ? "bg-[#C4613A] text-white"
                  : "bg-white text-[#57534e] hover:bg-[#FDF8F3]"
              }`}
              style={{ fontFamily: "var(--font-mono)" }}
            >
              CM / KG
            </button>
            <button
              onClick={() => unit === "metric" && switchToImperial()}
              className={`px-3 py-1 text-[11px] uppercase tracking-[0.08em] transition-colors cursor-pointer ${
                unit === "imperial"
                  ? "bg-[#C4613A] text-white"
                  : "bg-white text-[#57534e] hover:bg-[#FDF8F3]"
              }`}
              style={{ fontFamily: "var(--font-mono)" }}
            >
              FT / LB
            </button>
          </div>
        </div>
        <span className="text-[12px] text-[#57534e]/60 block mb-4" style={{ fontFamily: "var(--font-body)" }}>
          Optional — helps with more accurate sizing recommendations
        </span>

        {unit === "metric" ? (
          <div className="grid grid-cols-2 gap-4">
            <TCInput
              label="Height (cm)"
              placeholder="175"
              type="number"
              value={data.height}
              onChange={(e) => setData((prev) => ({ ...prev, height: e.target.value }))}
            />
            <TCInput
              label="Weight (kg)"
              placeholder="70"
              type="number"
              value={data.weight}
              onChange={(e) => setData((prev) => ({ ...prev, weight: e.target.value }))}
            />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <TCInput
              label="Height (ft)"
              placeholder="5"
              type="number"
              value={impFt}
              onChange={(e) => handleImpFtChange(e.target.value)}
            />
            <TCInput
              label="Height (in)"
              placeholder="9"
              type="number"
              value={impIn}
              onChange={(e) => handleImpInChange(e.target.value)}
            />
            <TCInput
              label="Weight (lb)"
              placeholder="154"
              type="number"
              value={impLb}
              onChange={(e) => handleImpLbChange(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-12 flex items-center justify-between">
        <BtnSecondary size="sm" onClick={() => navigate("/onboarding/1")}>Back</BtnSecondary>
        <BtnPrimary size="sm" onClick={() => navigate("/onboarding/3")}>
          <span className="flex items-center gap-2">
            Continue to Style Profile
            <Icon name="arrow_forward" size={16} className="text-white" />
          </span>
        </BtnPrimary>
      </div>
    </OnboardingLayout>
  );
}
