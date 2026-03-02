import React from "react";
import { useNavigate } from "react-router";
import { OnboardingLayout } from "../components/travel-capsule/OnboardingLayout";
import { ProgressBar, BtnPrimary, BtnSecondary } from "../components/travel-capsule";
import { AestheticCard } from "../components/travel-capsule/AestheticCard";
import { useOnboarding } from "../context/OnboardingContext";
import { IMAGES } from "../constants/images";

const AESTHETICS = [
  { label: "Casual", img: IMAGES.casual },
  { label: "Minimalist", img: IMAGES.minimalist },
  { label: "Streetwear", img: IMAGES.streetwearCard },
  { label: "Classic", img: IMAGES.classic },
  { label: "Sporty", img: IMAGES.sporty },
  { label: "Bohemian", img: IMAGES.bohemian },
];

export function OnboardingStep3() {
  const navigate = useNavigate();
  const { data, setData } = useOnboarding();

  const toggleAesthetic = (label: string) => {
    setData((prev) => ({
      ...prev,
      aesthetics: prev.aesthetics.includes(label)
        ? prev.aesthetics.filter((a) => a !== label)
        : [...prev.aesthetics, label],
    }));
  };

  return (
    <OnboardingLayout
      imageUrl={IMAGES.leatherSuitcase}
      quote="The joy of dressing is an art."
      attribution="John Galliano"
    >
      <ProgressBar currentStep={3} sublabel="Curating your vibe" />

      <div className="mt-10">
        <h1 className="text-[#292524]" style={{ fontSize: "clamp(36px, 4vw, 56px)", fontFamily: "var(--font-display)", lineHeight: 1.1 }}>
          Your Style <em>Profile</em>
        </h1>
        <p className="mt-4 text-[16px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
          Define your travel aesthetic so our AI can match outfits to your personal style.
        </p>
      </div>

      {/* Aesthetic Selection */}
      <div className="mt-10">
        <h4 className="text-[#292524] mb-1" style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 16 }}>
          Select Your Aesthetic
        </h4>
        <p className="text-[14px] text-[#57534e] mb-5" style={{ fontFamily: "var(--font-body)" }}>
          Choose the looks that best represent your travel personality.
        </p>

        <div className="grid grid-cols-3 gap-3">
          {AESTHETICS.map((a) => (
            <AestheticCard
              key={a.label}
              label={a.label}
              imageUrl={a.img}
              selected={data.aesthetics.includes(a.label)}
              onClick={() => toggleAesthetic(a.label)}
            />
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-12 flex items-center justify-between">
        <BtnSecondary size="sm" onClick={() => navigate("/onboarding/2")}>Back</BtnSecondary>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/onboarding/4")}
            className="text-[14px] text-[#57534e] hover:text-[#C4613A] transition-colors cursor-pointer underline underline-offset-4"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Skip for now
          </button>
          <BtnPrimary size="sm" onClick={() => navigate("/onboarding/4")}>
            <span className="flex items-center gap-2">
              Continue to Itinerary
              <Icon name="arrow_forward" size={16} className="text-white" />
            </span>
          </BtnPrimary>
        </div>
      </div>
    </OnboardingLayout>
  );
}