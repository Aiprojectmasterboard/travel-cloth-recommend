import { IMAGES } from "../constants/images";
import wardrobeImg from "../../assets/94873ae744f2a797c5c10269a41b6763829932a2.png";
import React from "react";
import { useNavigate } from "react-router";
import { OnboardingLayout } from "../components/travel-capsule/OnboardingLayout";
import { ProgressBar, BtnPrimary, BtnSecondary, Icon, TCInput } from "../components/travel-capsule";
import { useOnboarding } from "../context/OnboardingContext";

const GENDERS = [
  { value: "male", label: "Male", icon: "male" },
  { value: "female", label: "Female", icon: "female" },
  { value: "non-binary", label: "Non-binary", icon: "transgender" },
];

export function OnboardingStep2() {
  const navigate = useNavigate();
  const { data, setData } = useOnboarding();

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
        <label
          className="text-[11px] uppercase tracking-[0.12em] text-[#57534e] block mb-1"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Body Info
        </label>
        <span className="text-[12px] text-[#57534e]/60 block mb-4" style={{ fontFamily: "var(--font-body)" }}>
          Optional — helps with more accurate sizing recommendations
        </span>
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