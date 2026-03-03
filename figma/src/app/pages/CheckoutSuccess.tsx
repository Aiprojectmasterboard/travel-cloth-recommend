import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Icon } from "../components/travel-capsule";
import { getCheckoutStatus, getDashboardRoute, type PlanKey } from "../services/polarCheckout";
import { useAuth } from "../context/AuthContext";
import { useTrip } from "../context/TripContext";

export function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "confirmed" | "loading_result" | "failed">("verifying");
  const [progressMsg, setProgressMsg] = useState("");
  const { setPurchasedPlan } = useAuth();
  const { tripId, loadResult } = useTrip();

  const plan = (searchParams.get("plan") || "standard") as PlanKey;
  const sessionId = searchParams.get("session_id") || searchParams.get("checkout_id") || "";

  useEffect(() => {
    let cancelled = false;

    async function processPayment() {
      try {
        // Step 1: Verify checkout
        if (sessionId) {
          const result = await getCheckoutStatus(sessionId);
          if (result.status !== "confirmed" && !cancelled) {
            setStatus("failed");
            return;
          }
        }

        if (cancelled) return;

        // Step 2: Set plan access
        setPurchasedPlan(plan);
        setStatus("confirmed");

        // Step 3: Load result data (poll until ready)
        if (tripId) {
          await new Promise((r) => setTimeout(r, 1500)); // Brief pause for UX
          if (cancelled) return;

          setStatus("loading_result");
          setProgressMsg("AI is generating your personalized capsule wardrobe...");

          const resultData = await loadResult(tripId);

          if (cancelled) return;

          if (resultData) {
            navigate(getDashboardRoute(plan), { replace: true });
          } else {
            // Still navigate even if result isn't fully ready — dashboard will handle loading
            navigate(getDashboardRoute(plan), { replace: true });
          }
        } else {
          // No trip_id — just go to dashboard
          setTimeout(() => {
            if (!cancelled) navigate(getDashboardRoute(plan), { replace: true });
          }, 2500);
        }
      } catch {
        if (!cancelled) setStatus("failed");
      }
    }

    processPayment();
    return () => { cancelled = true; };
  }, [sessionId, plan, tripId, navigate, setPurchasedPlan, loadResult]);

  return (
    <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center px-6">
      <div className="text-center max-w-[480px]">
        {status === "verifying" && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-[#C4613A]/10 flex items-center justify-center animate-pulse">
              <Icon name="hourglass_top" size={28} className="text-[#C4613A]" />
            </div>
            <h1 className="mt-6 text-[#292524] text-[28px]" style={{ fontFamily: "var(--font-display)" }}>
              Verifying Payment...
            </h1>
            <p className="mt-3 text-[15px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
              Confirming your checkout with Polar. This only takes a moment.
            </p>
          </>
        )}

        {status === "confirmed" && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <Icon name="check_circle" size={32} className="text-green-600" filled />
            </div>
            <h1 className="mt-6 text-[#292524] text-[28px]" style={{ fontFamily: "var(--font-display)" }}>
              Payment Confirmed!
            </h1>
            <p className="mt-3 text-[15px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
              Preparing your AI-powered capsule wardrobe...
            </p>
            <div className="mt-6 w-full h-1.5 bg-[#EFE8DF] rounded-full overflow-hidden">
              <div className="h-full bg-[#C4613A] rounded-full" style={{ animation: "grow 2s ease-in-out forwards" }} />
            </div>
          </>
        )}

        {status === "loading_result" && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-[#C4613A]/10 flex items-center justify-center">
              <Icon name="auto_awesome" size={28} className="text-[#C4613A] animate-pulse" filled />
            </div>
            <h1 className="mt-6 text-[#292524] text-[28px]" style={{ fontFamily: "var(--font-display)" }}>
              Generating Your Capsule
            </h1>
            <p className="mt-3 text-[15px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
              {progressMsg}
            </p>
            <div className="mt-8 space-y-3 text-left max-w-[300px] mx-auto">
              {[
                { label: "Weather analysis", done: true },
                { label: "City vibe matching", done: true },
                { label: "Style consulting", done: false },
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

        {status === "failed" && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
              <Icon name="error" size={32} className="text-red-500" filled />
            </div>
            <h1 className="mt-6 text-[#292524] text-[28px]" style={{ fontFamily: "var(--font-display)" }}>
              Something went wrong
            </h1>
            <p className="mt-3 text-[15px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
              We couldn't verify your payment. Please try again or contact support.
            </p>
            <button
              onClick={() => navigate("/preview")}
              className="mt-6 h-[48px] px-8 bg-[#C4613A] text-white text-[13px] uppercase tracking-[0.08em] rounded-none hover:bg-[#A84A25] transition-colors cursor-pointer"
              style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}
            >
              Back to Pricing
            </button>
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
