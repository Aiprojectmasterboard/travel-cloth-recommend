import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Icon, BtnPrimary } from "../components/travel-capsule";
import { getDashboardRoute, type PlanKey } from "../services/polarCheckout";
import { useAuth } from "../context/AuthContext";
import { useTrip } from "../context/TripContext";
import { WORKER_URL } from "../lib/api";

/**
 * CheckoutSuccess — the user lands here BEFORE completing Polar payment.
 *
 * Flow:
 *   1. PreviewPage navigates here with ?plan&tripId&checkout_id
 *   2. This page auto-opens Polar checkout in a new tab
 *   3. User completes payment in the Polar tab (Polar may redirect to their portal — we don't rely on that)
 *   4. This page polls GET /api/result/:tripId until a paid order exists
 *   5. Once confirmed: grant plan access → load AI results → navigate to dashboard
 */
export function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setPurchasedPlan } = useAuth();
  const { tripId: ctxTripId, loadResult } = useTrip();

  // Read params from URL + sessionStorage fallbacks
  const pendingCheckout = (() => {
    try {
      const raw = sessionStorage.getItem("tc_pending_checkout");
      return raw ? JSON.parse(raw) as { plan?: string; tripId?: string } : null;
    } catch { return null; }
  })();

  const plan = (searchParams.get("plan") || sessionStorage.getItem("tc_pending_plan") || pendingCheckout?.plan || "standard") as PlanKey;
  const tripId = searchParams.get("tripId") || ctxTripId || pendingCheckout?.tripId || "";
  const polarUrl = sessionStorage.getItem("tc_polar_url") || "";

  const [status, setStatus] = useState<"open_checkout" | "waiting_payment" | "confirmed" | "loading_result" | "ready">("open_checkout");
  const [dots, setDots] = useState("");
  const [popupBlocked, setPopupBlocked] = useState(false);
  const pollStarted = useRef(false);

  // Animate dots
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 500);
    return () => clearInterval(id);
  }, []);

  // Step 1: Auto-open Polar in new tab on mount
  useEffect(() => {
    if (!polarUrl) {
      // No Polar URL — maybe came from Polar redirect directly, skip to polling
      setStatus("waiting_payment");
      return;
    }
    const win = window.open(polarUrl, "_blank");
    if (!win || win.closed) {
      // Popup blocked — show manual button
      setPopupBlocked(true);
    }
    setStatus("waiting_payment");
    // Clean up the URL from storage so a refresh doesn't re-open
    sessionStorage.removeItem("tc_polar_url");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step 2: Poll for payment confirmation
  const pollForPayment = useCallback(async () => {
    if (!tripId) {
      // No tripId — grant plan immediately (webhook will handle backend)
      setPurchasedPlan(plan);
      setStatus("ready");
      setTimeout(() => navigate(getDashboardRoute(plan), { replace: true }), 2000);
      return;
    }

    // Poll /api/result/:tripId — returns 402 until order is paid
    const MAX_POLLS = 60; // 5 minutes max
    const POLL_INTERVAL = 5000;

    for (let i = 0; i < MAX_POLLS; i++) {
      try {
        const res = await fetch(`${WORKER_URL}/api/result/${tripId}`);
        if (res.ok) {
          // Payment confirmed — order exists and result is available
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

    // Timeout — grant plan anyway (webhook may still arrive)
    setPurchasedPlan(plan);
    setStatus("ready");
    setTimeout(() => navigate(getDashboardRoute(plan), { replace: true }), 2000);
  }, [tripId, plan, setPurchasedPlan, loadResult, navigate]);

  // Start polling when status becomes waiting_payment
  useEffect(() => {
    if (status === "waiting_payment" && !pollStarted.current) {
      pollStarted.current = true;
      pollForPayment();
    }
  }, [status, pollForPayment]);

  const handleOpenPolar = () => {
    if (polarUrl) window.open(polarUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center px-6">
      <div className="text-center max-w-[480px]">
        {(status === "open_checkout" || status === "waiting_payment") && (
          <>
            <div className="w-20 h-20 mx-auto rounded-full bg-[#C4613A]/10 flex items-center justify-center">
              <Icon name="payment" size={36} className="text-[#C4613A] animate-pulse" />
            </div>
            <h1 className="mt-6 text-[#292524]" style={{ fontSize: "clamp(24px, 4vw, 32px)", fontFamily: "var(--font-display)" }}>
              Complete Your Payment{dots}
            </h1>
            <p className="mt-3 text-[16px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
              {popupBlocked
                ? "Click below to open the payment page, then return here."
                : "A payment window has opened. Complete the checkout and we'll detect it automatically."}
            </p>

            {/* Plan info card */}
            <div className="mt-6 p-4 bg-white rounded-xl border border-[#E8DDD4]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#C4613A] flex items-center justify-center flex-shrink-0">
                  <Icon name="auto_awesome" size={20} className="text-white" filled />
                </div>
                <div className="text-left">
                  <span className="text-[14px] text-[#292524] block" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>
                    {plan === "standard" ? "Standard Plan — $5" : plan === "pro" ? "Pro Plan — $12" : "Annual Plan — $29/yr"}
                  </span>
                  <span className="text-[12px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
                    {plan === "standard" ? "AI outfit + capsule list + daily plan" : plan === "pro" ? "4-6 AI outfit images, hi-res, 1 regen" : "12 trips/yr, priority AI, VIP concierge"}
                  </span>
                </div>
              </div>
            </div>

            {/* Open payment button (fallback if popup blocked) */}
            {popupBlocked && polarUrl && (
              <div className="mt-6">
                <BtnPrimary className="w-full" onClick={handleOpenPolar}>
                  <span className="flex items-center justify-center gap-2">
                    <Icon name="open_in_new" size={16} className="text-white" />
                    Open Payment Page
                  </span>
                </BtnPrimary>
              </div>
            )}

            <div className="mt-6 w-full h-1.5 bg-[#EFE8DF] rounded-full overflow-hidden">
              <div className="h-full bg-[#C4613A]/60 rounded-full animate-pulse" style={{ width: "40%" }} />
            </div>
            <p className="mt-3 text-[12px] text-[#78716c]" style={{ fontFamily: "var(--font-body)" }}>
              Waiting for payment confirmation{dots}
            </p>
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
