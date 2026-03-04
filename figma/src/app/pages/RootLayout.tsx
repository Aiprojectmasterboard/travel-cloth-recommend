import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { OnboardingProvider } from "../context/OnboardingContext";
import { LanguageProvider } from "../context/LanguageContext";
import { AuthProvider } from "../context/AuthContext";
import { TripProvider } from "../context/TripContext";
import { LoginModal, PasswordResetModal } from "../components/travel-capsule";

/** Scroll to top on every route change, unless landing page has a scroll target */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    // If navigating to landing page with a pending scroll target, let LandingPage handle it
    if (pathname === "/" && sessionStorage.getItem("tc_scroll_target")) return;
    // For all other navigations, clear any stale scroll target and scroll to top
    sessionStorage.removeItem("tc_scroll_target");
    window.scrollTo(0, 0);
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
            <Outlet />
            <LoginModal />
            <PasswordResetModal />
          </TripProvider>
        </OnboardingProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
