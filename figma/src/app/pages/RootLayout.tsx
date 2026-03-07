import React, { Suspense, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router";
import { OnboardingProvider } from "../context/OnboardingContext";
import { LanguageProvider } from "../context/LanguageContext";
import { AuthProvider } from "../context/AuthContext";
import { TripProvider } from "../context/TripContext";
import { LoginModal, PasswordResetModal } from "../components/travel-capsule";
import { ErrorBoundary } from "../components/ErrorBoundary";

/** Scroll to top + Google Analytics page view on every route change */
function ScrollToTop() {
  const { pathname } = useLocation();
  // Skip first render — index.html gtag config already fires initial page_view
  const isFirstRender = useRef(true);

  useEffect(() => {
    // If navigating to landing page with a pending scroll target, let LandingPage handle it
    if (pathname === "/" && sessionStorage.getItem("tc_scroll_target")) return;
    // For all other navigations, clear any stale scroll target and scroll to top
    sessionStorage.removeItem("tc_scroll_target");
    window.scrollTo(0, 0);
  }, [pathname]);

  // Send GA4 page_view event on SPA route changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return; // index.html send_page_view:true handles initial load
    }
    if (typeof window.gtag === "function") {
      window.gtag("event", "page_view", {
        page_path: pathname,
        page_location: window.location.href,
        page_title: document.title,
      });
    }
  }, [pathname]);

  return null;
}

export function RootLayout() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <OnboardingProvider>
          <TripProvider>
            <ScrollToTop />
            <ErrorBoundary>
              <Suspense
                fallback={
                  <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#FDF8F3" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ width: 40, height: 40, border: "3px solid #E8DDD4", borderTopColor: "#C4613A", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
                      <p style={{ fontSize: 14, color: "#57534e", fontFamily: "var(--font-body)" }}>Loading your capsule...</p>
                    </div>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                }
              >
                <Outlet />
              </Suspense>
            </ErrorBoundary>
            <LoginModal />
            <PasswordResetModal />
          </TripProvider>
        </OnboardingProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
