import { createBrowserRouter } from "react-router";
import { RootLayout } from "./pages/RootLayout";
import { LandingPage } from "./pages/LandingPage";
import { OnboardingStep1 } from "./pages/OnboardingStep1";
import { OnboardingStep2 } from "./pages/OnboardingStep2";
import { OnboardingStep3 } from "./pages/OnboardingStep3";
import { OnboardingStep4 } from "./pages/OnboardingStep4";
import { PreviewPage } from "./pages/PreviewPage";
import { StandardDashboard } from "./pages/StandardDashboard";
import { ProDashboard } from "./pages/ProDashboard";
import { AnnualDashboard } from "./pages/AnnualDashboard";
import { CheckoutSuccess } from "./pages/CheckoutSuccess";
import { SiteMap } from "./pages/SiteMap";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: LandingPage },
      { path: "sitemap", Component: SiteMap },
      { path: "onboarding/1", Component: OnboardingStep1 },
      { path: "onboarding/2", Component: OnboardingStep2 },
      { path: "onboarding/3", Component: OnboardingStep3 },
      { path: "onboarding/4", Component: OnboardingStep4 },
      { path: "preview", Component: PreviewPage },
      { path: "checkout/success", Component: CheckoutSuccess },
      { path: "dashboard/standard", Component: StandardDashboard },
      { path: "dashboard/pro", Component: ProDashboard },
      { path: "dashboard/annual", Component: AnnualDashboard },
    ],
  },
]);