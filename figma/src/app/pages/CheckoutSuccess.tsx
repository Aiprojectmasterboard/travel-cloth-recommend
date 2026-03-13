import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Icon } from "../components/travel-capsule";
import { getDashboardRoute, type PlanKey } from "../services/polarCheckout";
import { useAuth } from "../context/AuthContext";
import { useTrip } from "../context/TripContext";
import { useLang } from "../context/LanguageContext";
import { WORKER_URL } from "../lib/api";
import { GA } from "../lib/analytics";
import { SEO } from "../components/SEO";

/**
 * CheckoutSuccess — the user lands here AFTER completing Polar payment.
 *
 * Flow:
 *   1. User clicks checkout on PreviewPage → redirects to Polar checkout (same tab)
 *   2. User completes payment on Polar
 *   3. Polar redirects back here with ?plan&tripId&checkout_id
 *   4. This page polls GET /api/result/:tripId until a paid order exists
 *   5. Once confirmed: grant plan access → load AI results → navigate to dashboard
 */

type Status = "verifying_payment" | "confirmed" | "loading_result" | "ready";

/* ── Step icon list (icons only — labels come from t() at render time) ── */
const STEP_ICONS = [
  { icon: "payment",      minPct: 0,  maxPct: 15 },
  { icon: "thermostat",   minPct: 15, maxPct: 30 },
  { icon: "palette",      minPct: 30, maxPct: 50 },
  { icon: "auto_awesome", minPct: 50, maxPct: 70 },
  { icon: "checkroom",    minPct: 70, maxPct: 90 },
  { icon: "celebration",  minPct: 90, maxPct: 100 },
] as const;

/* ── Map status → step range ──────────────────────────────────────── */
function statusToStep(status: Status): { stepIndex: number; rangeMin: number; rangeMax: number } {
  switch (status) {
    case "verifying_payment":
      return { stepIndex: 0, rangeMin: 0, rangeMax: 15 };
    case "confirmed":
      return { stepIndex: 2, rangeMin: 15, rangeMax: 50 };
    case "loading_result":
      return { stepIndex: 4, rangeMin: 50, rangeMax: 90 };
    case "ready":
      return { stepIndex: 5, rangeMin: 90, rangeMax: 100 };
  }
}

/* ── Circular SVG progress ────────────────────────────────────────── */
function CircularProgress({ progress }: { progress: number }) {
  const size = 160;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="block" style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E8DDD4" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#C4613A"
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[#1A1410]" style={{ fontSize: "36px", fontFamily: "var(--font-display)", fontWeight: 700, lineHeight: 1 }}>
          {Math.round(progress)}
          <span style={{ fontSize: "16px", fontFamily: "var(--font-body)", fontWeight: 500, color: "#78716c" }}>%</span>
        </span>
      </div>
    </div>
  );
}

/* ── Step checklist (receives translated labels from parent) ──────── */
function StepChecklist({ currentStep, stepLabels }: { currentStep: number; stepLabels: string[] }) {
  return (
    <div className="mt-8 space-y-3 text-left max-w-[320px] mx-auto">
      {STEP_ICONS.map((step, i) => {
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;
        const label = stepLabels[i] ?? "";
        return (
          <div key={step.icon + i} className="flex items-center gap-3" style={{ transition: "all 0.5s ease" }}>
            {isCompleted ? (
              <span className="material-symbols-outlined text-green-600 flex-shrink-0" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            ) : isCurrent ? (
              <span className="flex-shrink-0 w-[22px] h-[22px] border-2 border-[#C4613A]/30 border-t-[#C4613A] rounded-full" style={{ animation: "checkout-spin 0.8s linear infinite" }} />
            ) : (
              <span className="flex-shrink-0 w-[22px] h-[22px] rounded-full border-2 border-[#D6D3D1]" />
            )}
            <span
              className={isCompleted ? "text-[14px] text-[#a8a29e] line-through" : isCurrent ? "text-[14px] text-[#C4613A]" : "text-[14px] text-[#a8a29e]"}
              style={{ fontFamily: "var(--font-body)", fontWeight: isCurrent ? 600 : 400, transition: "all 0.5s ease" }}
            >
              {label}
            </span>
            <span
              className={`material-symbols-outlined ml-auto flex-shrink-0 ${isCompleted ? "text-[#a8a29e]" : isCurrent ? "text-[#C4613A]" : "text-[#D6D3D1]"}`}
              style={{ fontSize: 18, fontVariationSettings: isCurrent ? "'FILL' 1" : "'FILL' 0", transition: "all 0.5s ease" }}
            >
              {step.icon}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────── */
export function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setPurchasedPlan } = useAuth();
  const { tripId: ctxTripId, loadResult } = useTrip();
  const { t } = useLang();

  // Read params from URL (set by Polar redirect) + sessionStorage fallbacks
  const pendingCheckout = (() => {
    try {
      const raw = sessionStorage.getItem("tc_pending_checkout");
      return raw ? JSON.parse(raw) as { plan?: string; tripId?: string; checkoutId?: string } : null;
    } catch { return null; }
  })();

  const plan = (searchParams.get("plan") || sessionStorage.getItem("tc_pending_plan") || pendingCheckout?.plan || "pro") as PlanKey;
  const tripId = searchParams.get("tripId") || ctxTripId || pendingCheckout?.tripId || "";
  const checkoutId = searchParams.get("checkout_id") || pendingCheckout?.checkoutId || "";

  const [status, setStatus] = useState<Status>("verifying_payment");
  const pollStarted = useRef(false);

  /* ── Step labels (translated) ───────────────────────────────────── */
  const stepLabels = [
    t("checkout.step.paymentConfirmed"),
    t("checkout.step.analyzingWeather"),
    t("checkout.step.matchingVibes"),
    t("checkout.step.consultingAI"),
    t("checkout.step.generatingOutfits"),
    t("checkout.step.finalizingCapsule"),
  ];

  /* ── Progress state ────────────────────────────────────────────── */
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const { stepIndex, rangeMin, rangeMax } = statusToStep(status);
    setCurrentStep(stepIndex);
    setProgress((prev) => Math.max(prev, rangeMin));

    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }

    progressInterval.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= rangeMax) {
          if (progressInterval.current) clearInterval(progressInterval.current);
          return rangeMax;
        }
        const increment = status === "ready" ? 2 : 0.5;
        const next = Math.min(prev + increment, rangeMax);
        for (let s = STEP_ICONS.length - 1; s >= 0; s--) {
          if (next >= STEP_ICONS[s].minPct) {
            setCurrentStep(s);
            break;
          }
        }
        return next;
      });
    }, status === "ready" ? 100 : 500);

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    };
  }, [status]);

  // Poll for payment confirmation and result
  const pollForResult = useCallback(async () => {
    if (!tripId) {
      // No tripId — grant plan immediately (webhook will handle backend)
      setPurchasedPlan(plan);
      setStatus("ready");
      setTimeout(() => navigate(getDashboardRoute(plan), { replace: true }), 2000);
      return;
    }

    const MAX_POLLS = 150; // 5 minutes max at 2s intervals
    const POLL_INTERVAL = 2000;

    for (let i = 0; i < MAX_POLLS; i++) {
      try {
        const res = await fetch(`${WORKER_URL}/api/result/${tripId}`);
        if (res.ok) {
          // Payment confirmed — order exists
          GA.checkoutSuccess(plan, plan === "pro" ? 3.99 : plan === "annual" ? 9.99 : 0);
          setPurchasedPlan(plan);
          setStatus("confirmed");
          await new Promise((r) => setTimeout(r, 1500));

          setStatus("loading_result");
          try {
            await loadResult(tripId);
          } catch { /* dashboard handles loading */ }

          setStatus("ready");
          sessionStorage.removeItem("tc_pending_checkout");
          sessionStorage.removeItem("tc_pending_plan");

          setTimeout(() => navigate(getDashboardRoute(plan), { replace: true }), 1500);
          return;
        }
        // 402 = payment not yet received, keep polling
      } catch {
        // Network error — keep trying
      }
      await new Promise((r) => setTimeout(r, POLL_INTERVAL));
    }

    // Timeout — grant plan anyway (webhook may still arrive later)
    setPurchasedPlan(plan);
    setStatus("ready");
    setTimeout(() => navigate(getDashboardRoute(plan), { replace: true }), 2000);
  }, [tripId, plan, setPurchasedPlan, loadResult, navigate]);

  // Start polling on mount
  useEffect(() => {
    if (!pollStarted.current) {
      pollStarted.current = true;
      pollForResult();
    }
  }, [pollForResult]);

  /* ── Heading text based on status ──────────────────────────────── */
  const heading = (() => {
    switch (status) {
      case "verifying_payment": return t("checkout.heading.verifying");
      case "confirmed":         return t("checkout.heading.confirmed");
      case "loading_result":    return t("checkout.heading.loading");
      case "ready":             return t("checkout.heading.ready");
    }
  })();

  const subtitle = (() => {
    switch (status) {
      case "verifying_payment": return t("checkout.subtitle.verifying");
      case "confirmed":         return plan === "annual"
        ? t("checkout.subtitle.confirmed.annual")
        : t("checkout.subtitle.confirmed.pro");
      case "loading_result":    return t("checkout.subtitle.loading");
      case "ready":             return t("checkout.subtitle.ready");
    }
  })();

  return (
    <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center px-6">
      <SEO title="Payment Successful" description="Your payment was successful. Your AI-generated travel capsule wardrobe is being prepared." noindex={true} />
      <div className="text-center max-w-[480px] w-full">

        <CircularProgress progress={progress} />

        <h1
          className="mt-6 text-[#1A1410]"
          style={{ fontSize: "clamp(24px, 4vw, 32px)", fontFamily: "var(--font-display)", fontWeight: 700, transition: "all 0.5s ease" }}
        >
          {heading}
        </h1>

        <p className="mt-3 text-[16px] text-[#57534e]" style={{ fontFamily: "var(--font-body)", transition: "all 0.5s ease" }}>
          {subtitle}
        </p>

        {/* Plan info card */}
        {status === "verifying_payment" && (
          <div className="mt-6 p-4 bg-white rounded-xl border border-[#E8DDD4]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#C4613A] flex items-center justify-center flex-shrink-0">
                <Icon name="auto_awesome" size={20} className="text-white" filled />
              </div>
              <div className="text-left">
                <span className="text-[14px] text-[#292524] block" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>
                  {plan === "pro"
                    ? t("checkout.plan.pro.label")
                    : t("checkout.plan.annual.label")}
                </span>
                <span className="text-[12px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
                  {plan === "pro"
                    ? t("checkout.plan.pro.desc")
                    : t("checkout.plan.annual.desc")}
                </span>
              </div>
            </div>
          </div>
        )}

        <StepChecklist currentStep={currentStep} stepLabels={stepLabels} />

        <p className="mt-6 text-[12px] text-[#78716c]" style={{ fontFamily: "var(--font-body)" }}>
          {status === "ready" ? t("checkout.footer.redirecting") : t("checkout.footer.wait")}
        </p>
      </div>

      <style>{`
        @keyframes checkout-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
