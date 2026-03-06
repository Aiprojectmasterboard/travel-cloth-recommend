/** Google Analytics event helper — safe to call even if gtag is not loaded */
export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number,
) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value,
    });
  }
}

// Pre-defined funnel events
export const GA = {
  onboardingStart: () => trackEvent("onboarding_start", "funnel"),
  onboardingStep: (step: number) => trackEvent("onboarding_step", "funnel", `step_${step}`, step),
  onboardingComplete: () => trackEvent("onboarding_complete", "funnel"),
  previewGenerated: (city: string) => trackEvent("preview_generated", "engagement", city),
  planSelected: (plan: string) => trackEvent("plan_selected", "conversion", plan),
  checkoutStart: (plan: string) => trackEvent("checkout_start", "conversion", plan),
  checkoutSuccess: (plan: string, amount: number) => trackEvent("purchase", "conversion", plan, amount),
  emailCapture: () => trackEvent("email_capture", "conversion"),
  shareClick: (medium: string) => trackEvent("share_click", "engagement", medium),
  ctaClick: (location: string) => trackEvent("cta_click", "engagement", location),
};
