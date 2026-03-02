import React from "react";
import { useNavigate } from "react-router";
import { OnboardingLayout } from "../components/travel-capsule/OnboardingLayout";
import { ProgressBar, BtnPrimary, BtnSecondary, Icon } from "../components/travel-capsule";
import { useOnboarding } from "../context/OnboardingContext";
import { IMAGES } from "../constants/images";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function OnboardingStep4() {
  const navigate = useNavigate();
  const { data } = useOnboarding();

  // Derive display data
  const primaryCity = data.cities[0];
  const cityName = primaryCity?.city || "Paris";
  const countryName = primaryCity?.country || "France";
  const cityImg = primaryCity?.imageUrl || IMAGES.paris;
  const fromDate = primaryCity?.fromDate || "2026-04-12";
  const toDate = primaryCity?.toDate || "2026-04-18";

  // Calculate days
  const dayCount = fromDate && toDate
    ? Math.max(1, Math.round((new Date(toDate).getTime() - new Date(fromDate).getTime()) / 86400000))
    : 6;

  const formatDate = (d: string) => {
    if (!d) return "—";
    const date = new Date(d);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const genderLabel = data.gender
    ? data.gender.charAt(0).toUpperCase() + data.gender.slice(1)
    : "Not specified";
  const styleLabel = data.aesthetics.length > 0 ? data.aesthetics.join(", ") : "Not selected";

  return (
    <OnboardingLayout
      imageUrl={IMAGES.airport}
      quote="The journey of a thousand miles begins with a single step."
      attribution="Lao Tzu"
    >
      <ProgressBar currentStep={4} sublabel="About your destination" />

      <div className="mt-10">
        <h1 className="text-[#292524]" style={{ fontSize: "clamp(36px, 4vw, 56px)", fontFamily: "var(--font-display)", lineHeight: 1.1 }}>
          Ready for your <em>getaway?</em>
        </h1>
        <p className="mt-4 text-[16px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
          Review your trip details before we analyze the perfect capsule wardrobe.
        </p>
      </div>

      {/* Summary Card */}
      <div className="mt-10 bg-white rounded-2xl overflow-hidden border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
        {/* City Image */}
        <div className="relative h-[200px]">
          <ImageWithFallback
            src={cityImg}
            alt={cityName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute top-4 left-4">
            <span
              className="px-3 py-1 bg-[#C4613A] text-white rounded-sm text-[10px] uppercase tracking-[0.12em]"
              style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}
            >
              Trip Summary
            </span>
          </div>
          <div className="absolute bottom-4 left-5">
            <h3
              className="text-white text-[28px] italic"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {cityName}, {countryName}
            </h3>
          </div>
        </div>

        {/* Info rows */}
        <div className="p-6">
          <div className="space-y-4">
            {[
              { icon: "calendar_today", label: "Dates", value: `${formatDate(fromDate)} — ${formatDate(toDate)}` },
              { icon: "schedule", label: "Duration", value: `${dayCount} days` },
              { icon: "palette", label: "Style", value: styleLabel },
              { icon: "person", label: "Gender", value: genderLabel },
              { icon: "photo_camera", label: "Reference Photo", value: data.photo ? "Uploaded" : "Not provided" },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <Icon name={row.icon} size={18} className="text-[#C4613A] flex-shrink-0" />
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="text-[12px] uppercase tracking-[0.08em] text-[#57534e] flex-shrink-0" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>
                    {row.label}
                  </span>
                  <span className="text-[14px] text-[#292524] truncate" style={{ fontFamily: "var(--font-body)" }}>
                    {row.value}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-[#E8DDD4]">
            <p className="text-[14px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
              Everything correct?
            </p>
            <button
              onClick={() => navigate("/onboarding/1")}
              className="mt-1 inline-flex items-center gap-1 text-[#C4613A] text-[12px] uppercase tracking-[0.08em] hover:text-[#A84A25] transition-colors cursor-pointer"
              style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}
            >
              Edit Details
              <Icon name="edit" size={14} className="text-[#C4613A]" />
            </button>
          </div>
        </div>
      </div>

      {/* Main CTA */}
      <div className="mt-8">
        <BtnPrimary className="w-full" size="lg" onClick={() => navigate("/preview")}>
          <span className="flex items-center gap-2">
            <Icon name="auto_awesome" size={20} className="text-white" filled />
            Analyze My Trip
          </span>
        </BtnPrimary>
      </div>

      {/* The Next Step */}
      <div className="mt-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C4613A]" />
          <span className="text-[11px] uppercase tracking-[0.15em] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>
            The Next Step
          </span>
        </div>
        <p className="text-[14px] text-[#57534e] leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
          Once you click "Analyze My Trip," our AI will process weather forecasts, cultural context, and your style preferences to generate a complete capsule wardrobe in under 30 seconds.
        </p>
      </div>

      {/* Footer legal */}
      <div className="mt-10 pt-6 border-t border-[#E8DDD4]">
        <p className="text-[11px] text-[#57534e]/50 leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
          By clicking "Analyze My Trip" you agree to our Terms of Service and Privacy Policy. Your data is encrypted and never shared with third parties.
        </p>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between pb-6">
        <BtnSecondary size="sm" onClick={() => navigate("/onboarding/3")}>Back</BtnSecondary>
      </div>
    </OnboardingLayout>
  );
}