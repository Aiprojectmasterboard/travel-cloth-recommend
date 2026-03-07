import React, { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router";
import { OnboardingProvider } from "../context/OnboardingContext";
import { LanguageProvider } from "../context/LanguageContext";
import { AuthProvider } from "../context/AuthContext";
import { TripProvider } from "../context/TripContext";
import { LoginModal, PasswordResetModal } from "../components/travel-capsule";

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
            <Outlet />
            <LoginModal />
            <PasswordResetModal />
          </TripProvider>
        </OnboardingProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
