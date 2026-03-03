import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { OnboardingProvider } from "../context/OnboardingContext";
import { LanguageProvider } from "../context/LanguageContext";
import { AuthProvider } from "../context/AuthContext";
import { TripProvider } from "../context/TripContext";
import { LoginModal } from "../components/travel-capsule";

/** Scroll to top on every route change */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
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
          </TripProvider>
        </OnboardingProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
