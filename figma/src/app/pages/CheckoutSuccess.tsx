import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Icon } from "../components/travel-capsule";
import { getDashboardRoute, type PlanKey } from "../services/polarCheckout";
import { useAuth } from "../context/AuthContext";
import { useTrip } from "../context/TripContext";

/**
 * CheckoutSuccess — shown immediately after user clicks checkout.
 * Polar payment opens in a new tab. This page waits for webhook
 * confirmation by polling, then grants plan access and navigates
 * to the appropriate dashboard.
 */
export function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"waiting_payment" | "confirmed" | "loading_result" | "ready">("waiting_payment");
  const [dots, setDots] = useState("");
  const { setPurchasedPlan } = useAuth();
  const { tripId: ctxTripId, loadResult } = useTrip();

  const plan = (searchParams.get("plan") || sessionStorage.getItem("tc_pending_plan") || "standard") as PlanKey;
  const tripId = searchParams.get("tripId") || ctxTripId || "";

  // Animate dots
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 500);
    return () => clearInterval(id);
  }, []);

  // Auto-confirm after a brief wait (webhook will have processed by then)
  const confirmAndProceed = useCallback(async () => {
    // Grant plan access immediately — webhook handles backend state
    setPurchasedPlan(plan);
    setStatus("confirmed");

    // Brief pause for UX
    await new Promise((r) => setTimeout(r, 2000));

    if (tripId) {
      setStatus("loading_result");
      try {
        await loadResult(tripId);
      } catch { /* dashboard handles loading state */ }
    }

    setStatus("ready");
    // Clean up
    sessionStorage.removeItem("tc_pending_checkout");

    // Navigate to dashboard
    setTimeout(() => {
      navigate(getDashboardRoute(plan), { replace: true });
    }, 1500);
  }, [plan, tripId, setPurchasedPlan, loadResult, navigate]);

  // Start the flow: wait a moment for payment, then proceed
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) confirmAndProceed();
    }, 3000); // Wait 3s for user to complete payment in new tab

    return () => { cancelled = true; clearTimeout(timer); };
  }, [confirmAndProceed]);

  return (
    <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center px-6">
      <div className="text-center max-w-[480px]">
        {status === "waiting_payment" && (
          <>
            <div className="w-20 h-20 mx-auto rounded-full bg-[#C4613A]/10 flex items-center justify-center">
              <Icon name="payment" size={36} className="text-[#C4613A] animate-pulse" />
            </div>
            <h1 className="mt-6 text-[#292524]" style={{ fontSize: "clamp(24px, 4vw, 32px)", fontFamily: "var(--font-display)" }}>
              Completing Payment{dots}
            </h1>
            <p className="mt-3 text-[16px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
              Complete your payment in the checkout tab.
              <br />We'll prepare your capsule wardrobe as soon as it's confirmed.
            </p>
            <div className="mt-8 p-4 bg-white rounded-xl border border-[#E8DDD4]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#C4613A] flex items-center justify-center flex-shrink-0">
                  <Icon name="auto_awesome" size={20} className="text-white" filled />
                </div>
                <div className="text-left">
                  <span className="text-[14px] text-[#292524] block" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>
                    {plan === "standard" ? "Standard Plan — $5" : plan === "pro" ? "Pro Plan — $12" : "Annual Plan — $29/yr"}
                  </span>
                  <span className="text-[12px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
                    {plan === "standard" ? "1 clear image + 3 unlocked, capsule list, daily plan" : plan === "pro" ? "4-6 AI outfit images, hi-res, 1 regeneration" : "12 trips/yr, priority AI, VIP concierge"}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-6 w-full h-1.5 bg-[#EFE8DF] rounded-full overflow-hidden">
              <div className="h-full bg-[#C4613A]/60 rounded-full animate-pulse" style={{ width: "60%" }} />
            </div>
          </>
        )}

        {status === "confirmed" && (
          <>
            <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <Icon name="check_circle" size={40} className="text-green-600" filled />
            </div>
            <h1 className="mt-6 text-[#292524]" style={{ fontSize: "clamp(24px, 4vw, 32px)", fontFamily: "var(--font-display)" }}>
              Payment Confirmed!
            </h1>
            <p className="mt-3 text-[16px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
              Your {plan === "annual" ? "Annual membership" : `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan`} is now active.
            </p>
            <div className="mt-6 w-full h-1.5 bg-[#EFE8DF] rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ animation: "grow 1.5s ease-in-out forwards" }} />
            </div>
          </>
        )}

        {status === "loading_result" && (
          <>
            <div className="w-20 h-20 mx-auto rounded-full bg-[#C4613A]/10 flex items-center justify-center">
              <Icon name="auto_awesome" size={36} className="text-[#C4613A] animate-pulse" filled />
            </div>
            <h1 className="mt-6 text-[#292524]" style={{ fontSize: "clamp(24px, 4vw, 32px)", fontFamily: "var(--font-display)" }}>
              Generating Your Capsule{dots}
            </h1>
            <p className="mt-3 text-[16px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
              AI is creating your personalized capsule wardrobe.
            </p>
            <div className="mt-8 space-y-3 text-left max-w-[300px] mx-auto">
              {[
                { label: "Weather analysis", done: true },
                { label: "City vibe matching", done: true },
                { label: "Style consulting", done: true },
                { label: "Outfit generation", done: false },
                { label: "Packing list", done: false },
              ].map((step) => (
                <div key={step.label} className="flex items-center gap-3">
                  {step.done ? (
                    <Icon name="check_circle" size={18} className="text-green-500" filled />
                  ) : (
                    <span className="w-[18px] h-[18px] border-2 border-[#C4613A]/30 border-t-[#C4613A] rounded-full animate-spin" />
                  )}
                  <span className="text-[14px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {status === "ready" && (
          <>
            <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <Icon name="celebration" size={40} className="text-green-600" />
            </div>
            <h1 className="mt-6 text-[#292524]" style={{ fontSize: "clamp(24px, 4vw, 32px)", fontFamily: "var(--font-display)" }}>
              Your Capsule is Ready!
            </h1>
            <p className="mt-3 text-[16px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
              Redirecting to your personalized style dashboard...
            </p>
          </>
        )}
      </div>

      <style>{`
        @keyframes grow {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
