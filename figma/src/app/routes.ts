import { createBrowserRouter } from "react-router";
import React from "react";
import { RootLayout } from "./pages/RootLayout";
import { LandingPage } from "./pages/LandingPage";
import { OnboardingStep1 } from "./pages/OnboardingStep1";
import { OnboardingStep2 } from "./pages/OnboardingStep2";
import { OnboardingStep3 } from "./pages/OnboardingStep3";
import { OnboardingStep4 } from "./pages/OnboardingStep4";
import { PreviewPage } from "./pages/PreviewPage";
import { CheckoutSuccess } from "./pages/CheckoutSuccess";
import { SiteMap } from "./pages/SiteMap";
import { ExampleProPage } from "./pages/ExampleProPage";
import { DemoProPage } from "./pages/DemoProPage";
import { ExampleAnnualPage } from "./pages/ExampleAnnualPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { TermsPage } from "./pages/TermsPage";
import { ContactPage } from "./pages/ContactPage";
import { MyPage } from "./pages/MyPage";
import { SharePage } from "./pages/SharePage";

// ─── Lazy-loaded dashboards ───────────────────────────────────────────────
// These are heavy pages with many dependencies (outfitGenerator, exportPdf,
// html2canvas, jsPDF). Lazy loading:
//   1. Isolates TDZ/init errors so they don't crash the entire app
//   2. Reduces initial bundle size (~30% of total code is dashboard-only)
//   3. Code-splits dashboard chunks for faster landing page load
const LazyStandardDashboard = React.lazy(() =>
  import("./pages/StandardDashboard").then((m) => ({ default: m.StandardDashboard }))
);
const LazyProDashboard = React.lazy(() =>
  import("./pages/ProDashboard").then((m) => ({ default: m.ProDashboard }))
);
const LazyAnnualDashboard = React.lazy(() =>
  import("./pages/AnnualDashboard").then((m) => ({ default: m.AnnualDashboard }))
);

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
      { path: "dashboard/standard", Component: LazyStandardDashboard },
      { path: "dashboard/pro", Component: LazyProDashboard },
      { path: "dashboard/annual", Component: LazyAnnualDashboard },
      { path: "share/:tripId", Component: SharePage },
      { path: "examples/pro", Component: ExampleProPage },
      { path: "demo/pro", Component: DemoProPage },
      { path: "examples/annual", Component: ExampleAnnualPage },
      { path: "privacy", Component: PrivacyPage },
      { path: "terms", Component: TermsPage },
      { path: "contact", Component: ContactPage },
      { path: "mypage", Component: MyPage },
    ],
  },
]);
