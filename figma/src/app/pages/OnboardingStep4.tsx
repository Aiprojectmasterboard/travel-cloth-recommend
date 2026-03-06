import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { OnboardingLayout } from "../components/travel-capsule/OnboardingLayout";
import { ProgressBar, BtnPrimary, BtnSecondary, Icon } from "../components/travel-capsule";
import { useOnboarding } from "../context/OnboardingContext";
import { useTrip } from "../context/TripContext";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import { IMAGES } from "../constants/images";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

/** Animated progress steps with percentage bar */
function AnalyzingProgress({ steps }: { steps: string[] }) {
  const [activeStep, setActiveStep] = useState(0);
  const [percent, setPercent] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const stepDuration = 3000; // ms per step
    const tickMs = 50;
    let elapsed = 0;
    intervalRef.current = setInterval(() => {
      elapsed += tickMs;
      const totalMs = steps.length * stepDuration;
      const p = Math.min(Math.round((elapsed / totalMs) * 100), 95);
      setPercent(p);
      const step = Math.min(Math.floor(elapsed / stepDuration), steps.length - 1);
      setActiveStep(step);
    }, tickMs);
    return () => clearInterval(intervalRef.current);
  }, [steps.length]);

  return (
    <div className="mt-6">
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-2 bg-[#EFE8DF] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#C4613A] rounded-full transition-all duration-200"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-[13px] text-[#C4613A] tabular-nums min-w-[36px] text-right" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
          {percent}%
        </span>
      </div>
      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, i) => {
          const done = i < activeStep;
          const current = i === activeStep;
          return (
            <div key={i} className="flex items-center gap-3">
              {done ? (
                <span className="material-symbols-outlined text-green-500" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              ) : current ? (
                <span className="w-[18px] h-[18px] border-2 border-[#C4613A] border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="w-[18px] h-[18px] rounded-full border-2 border-[#d6cfc7]" />
              )}
              <span className={`text-[13px] ${done ? "text-[#57534e]/50" : current ? "text-[#C4613A] font-medium" : "text-[#57534e]/40"}`} style={{ fontFamily: "var(--font-body)" }}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function OnboardingStep4() {
  const navigate = useNavigate();
  const { data } = useOnboarding();
  const { startPreview, loading: tripLoading } = useTrip();
  const { isLoggedIn, setShowLoginModal, setLoginModalContext } = useAuth();
  const { t, lang } = useLang();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  // Derive display data
  const primaryCity = data.cities[0];
  const cityName = primaryCity?.city || "Paris";
  const countryName = primaryCity?.country || "";
  const cityImg = primaryCity?.imageUrl || IMAGES.paris;
  const fromDate = primaryCity?.fromDate || "2026-04-12";
  const toDate = primaryCity?.toDate || "2026-04-18";

  // Calculate nights
  const nightCount = fromDate && toDate
    ? Math.max(1, Math.round((new Date(toDate).getTime() - new Date(fromDate).getTime()) / 86400000))
    : 6;

  const formatDate = (d: string) => {
    if (!d) return "\u2014";
    const date = new Date(d);
    return date.toLocaleDateString(lang, { month: "short", day: "numeric", year: "numeric" });
  };

  const genderLabel = data.gender
    ? data.gender.charAt(0).toUpperCase() + data.gender.slice(1)
    : t("onboarding4.notSpecified");
  const styleLabel = data.aesthetics.length > 0 ? data.aesthetics.join(", ") : t("onboarding4.notSelected");

  const ctaLabel = isLoggedIn ? t("auth.analyzeMyTrip") : t("auth.signUpAndAnalyze");

  const doSubmit = async () => {
    if (submitting || tripLoading) return;
    setSubmitting(true);
    setError(null);

    try {
      await startPreview();
      navigate("/preview");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to analyze trip";
      setError(msg);
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      setLoginModalContext("onboarding_gate");
      setShowLoginModal(true);
      setPendingSubmit(true);
      return;
    }
    await doSubmit();
  };

  // Auto-submit after user logs in with a pending submit
  useEffect(() => {
    if (isLoggedIn && pendingSubmit) {
      setPendingSubmit(false);
      doSubmit();
    }
  }, [isLoggedIn, pendingSubmit]);

  const photoValue = data.faceUrl
    ? t("onboarding4.uploaded")
    : data.photo
      ? t("onboarding4.readyUpload")
      : t("onboarding4.notProvided");

  return (
    <OnboardingLayout
      imageUrl={IMAGES.airport}
      quote="The journey of a thousand miles begins with a single step."
      attribution="Lao Tzu"
    >
      <ProgressBar currentStep={4} sublabel="About your destination" />

      <div className="mt-10">
        <h1 className="text-[#292524]" style={{ fontSize: "clamp(36px, 4vw, 56px)", fontFamily: "var(--font-display)", lineHeight: 1.1 }}>
          {t("onboarding4.title")} <em>{t("onboarding4.titleEm")}</em>
        </h1>
        <p className="mt-4 text-[16px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
          {t("onboarding4.subtitle")}
        </p>
      </div>

      {/* Summary Card */}
      <div className="mt-10 bg-white rounded-2xl overflow-hidden border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
        {/* City Image(s) */}
        {data.cities.length <= 1 ? (
          <div className="relative h-[200px]">
            <ImageWithFallback src={cityImg} alt={cityName} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 bg-[#C4613A] text-white rounded-sm text-[10px] uppercase tracking-[0.12em]" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>{t("onboarding4.tripSummary")}</span>
            </div>
            <div className="absolute bottom-4 left-5">
              <h3 className="text-white text-[28px] italic" style={{ fontFamily: "var(--font-display)" }}>{cityName}{countryName ? `, ${countryName}` : ""}</h3>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className={`grid ${data.cities.length === 2 ? "grid-cols-2" : data.cities.length === 3 ? "grid-cols-3" : "grid-cols-2"} gap-0.5`}>
              {data.cities.slice(0, 4).map((c) => (
                <div key={c.id} className="relative h-[140px]">
                  <ImageWithFallback src={c.imageUrl || IMAGES.paris} alt={c.city} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <span className="text-white text-[16px] italic block" style={{ fontFamily: "var(--font-display)" }}>{c.city}</span>
                    <span className="text-white/70 text-[10px]" style={{ fontFamily: "var(--font-mono)" }}>
                      {c.fromDate ? new Date(c.fromDate).toLocaleDateString(lang, { month: "short", day: "numeric" }) : ""} {c.fromDate && c.toDate ? "\u2013" : ""} {c.toDate ? new Date(c.toDate).toLocaleDateString(lang, { month: "short", day: "numeric" }) : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute top-3 left-3">
              <span className="px-3 py-1 bg-[#C4613A] text-white rounded-sm text-[10px] uppercase tracking-[0.12em]" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>
                {data.cities.length} {t("onboarding4.cities")} \u00B7 {t("onboarding4.tripSummary")}
              </span>
            </div>
          </div>
        )}

        {/* Info rows */}
        <div className="p-6">
          <div className="space-y-4">
            {[
              { icon: "calendar_today", label: t("onboarding4.dates"), value: `${formatDate(fromDate)} \u2014 ${formatDate(toDate)}` },
              { icon: "schedule", label: t("onboarding4.duration"), value: `${nightCount} ${t("general.nights")}` },
              { icon: "palette", label: t("onboarding4.style"), value: styleLabel },
              { icon: "person", label: t("onboarding4.gender"), value: genderLabel },
              { icon: "photo_camera", label: t("onboarding4.refPhoto"), value: photoValue },
            ].map((row) => (
              <div key={row.icon} className="flex items-center gap-3">
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

            {/* Show all cities if multiple */}
            {data.cities.length > 1 && (
              <div className="flex items-start gap-3">
                <Icon name="public" size={18} className="text-[#C4613A] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-[12px] uppercase tracking-[0.08em] text-[#57534e] block mb-1" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>
                    {t("onboarding4.allCities")}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {data.cities.map((c) => (
                      <span key={c.id} className="px-2 py-0.5 bg-[#EFE8DF] rounded-full text-[12px] text-[#292524]" style={{ fontFamily: "var(--font-body)" }}>
                        {c.city}, {c.country}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-[#E8DDD4]">
            <p className="text-[14px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
              {t("onboarding4.everythingCorrect")}
            </p>
            <button
              onClick={() => navigate("/onboarding/1")}
              className="mt-1 inline-flex items-center gap-1 text-[#C4613A] text-[12px] uppercase tracking-[0.08em] hover:text-[#A84A25] transition-colors cursor-pointer"
              style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}
            >
              {t("onboarding4.editDetails")}
              <Icon name="edit" size={14} className="text-[#C4613A]" />
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-[14px] text-red-600" style={{ fontFamily: "var(--font-body)" }}>
            {error}
          </p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-[12px] text-red-500 underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main CTA */}
      <div className="mt-8">
        <BtnPrimary className="w-full" size="lg" onClick={handleSubmit} disabled={submitting}>
          <span className="flex items-center gap-2">
            {submitting ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t("auth.analyzingTrip")}
              </>
            ) : (
              <>
                <Icon name="auto_awesome" size={20} className="text-white" filled />
                {ctaLabel}
              </>
            )}
          </span>
        </BtnPrimary>
      </div>

      {/* Loading state detail with progress */}
      {submitting && (
        <AnalyzingProgress steps={[
          t("onboarding4.fetchingWeather"),
          t("onboarding4.analyzingVibes"),
          t("onboarding4.generatingStyle"),
          t("onboarding4.buildingCapsule"),
        ]} />
      )}

      {/* The Next Step */}
      {!submitting && (
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C4613A]" />
            <span className="text-[11px] uppercase tracking-[0.15em] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>
              {t("onboarding4.theNextStep")}
            </span>
          </div>
          <p className="text-[14px] text-[#57534e] leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
            {t("onboarding4.nextStepBody").replace("{cta}", ctaLabel)}
          </p>
        </div>
      )}

      {/* Footer legal */}
      <div className="mt-10 pt-6 border-t border-[#E8DDD4]">
        <p className="text-[11px] text-[#57534e]/50 leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
          {t("onboarding4.legalText").replace("{cta}", ctaLabel)}
        </p>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between pb-6">
        <BtnSecondary size="sm" onClick={() => navigate("/onboarding/3")}>{t("onboarding4.back")}</BtnSecondary>
      </div>
    </OnboardingLayout>
  );
}
