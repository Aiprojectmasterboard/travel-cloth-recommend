import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Icon } from "../components/travel-capsule";
import { getCheckoutStatus, getDashboardRoute, type PlanKey } from "../services/polarCheckout";

/**
 * Checkout Success Page
 *
 * Users are redirected here after completing a Polar checkout.
 * URL: /checkout/success?session_id=xxx&plan=standard|pro|annual
 *
 * This page:
 * 1. Verifies checkout status via Polar client API
 * 2. Shows a success animation
 * 3. Redirects to the appropriate dashboard
 *
 * POLAR COMPLIANCE:
 * - Uses GET /v1/checkouts/client/{client_secret} (no auth needed)
 * - Does NOT expose OAT
 */
export function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "confirmed" | "failed">("verifying");

  const plan = (searchParams.get("plan") || "standard") as PlanKey;
  const sessionId = searchParams.get("session_id") || "";

  useEffect(() => {
    async function verify() {
      try {
        /**
         * PRODUCTION: Verify the checkout session is confirmed.
         * GET /v1/checkouts/client/{client_secret}
         * No authentication required (safe for client-side).
         */
        const result = await getCheckoutStatus(sessionId);
        if (result.status === "confirmed") {
          setStatus("confirmed");
          // Auto-redirect to dashboard after brief success screen
          setTimeout(() => {
            navigate(getDashboardRoute(plan), { replace: true });
          }, 2500);
        } else {
          setStatus("failed");
        }
      } catch {
        setStatus("failed");
      }
    }

    if (sessionId) {
      verify();
    } else {
      // No session ID — demo mode, auto-confirm
      setStatus("confirmed");
      setTimeout(() => {
        navigate(getDashboardRoute(plan), { replace: true });
      }, 2500);
    }
  }, [sessionId, plan, navigate]);

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
              Your {plan === "annual" ? "Annual membership" : plan === "pro" ? "Pro capsule" : "Standard capsule"} is ready.
              Redirecting to your dashboard...
            </p>
            <div className="mt-6 w-full h-1.5 bg-[#EFE8DF] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C4613A] rounded-full"
                style={{ animation: "grow 2.5s ease-in-out forwards" }}
              />
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
