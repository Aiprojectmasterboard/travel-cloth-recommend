import React from "react";
import { Outlet } from "react-router";
import { OnboardingProvider } from "../context/OnboardingContext";
import { LanguageProvider } from "../context/LanguageContext";
import { AuthProvider } from "../context/AuthContext";
import { LoginModal } from "../components/travel-capsule";

export function RootLayout() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <OnboardingProvider>
          <Outlet />
          <LoginModal />
        </OnboardingProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
