import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface CityEntry {
  id: string;
  city: string;
  country: string;
  imageUrl: string;
  fromDate: string;
  toDate: string;
}

export interface OnboardingData {
  cities: CityEntry[];
  gender: string;
  height: string;
  weight: string;
  aesthetics: string[];
  /** Base64 data-URL of user's uploaded reference photo */
  photo: string;
  /** Original filename of the uploaded photo */
  photoName: string;
}

interface OnboardingContextType {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

const ONBOARDING_KEY = "tc_onboarding_data";

const DEFAULT_DATA: OnboardingData = {
  cities: [],
  gender: "",
  height: "",
  weight: "",
  aesthetics: [],
  photo: "",
  photoName: "",
};

function readStoredOnboarding(): OnboardingData {
  try {
    const raw = sessionStorage.getItem(ONBOARDING_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<OnboardingData>;
      return { ...DEFAULT_DATA, ...parsed, photo: "", photoName: "" };
    }
  } catch {
    // sessionStorage unavailable or JSON parse failed — fall through to default
  }
  return { ...DEFAULT_DATA };
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<OnboardingData>(readStoredOnboarding);

  const setData: React.Dispatch<React.SetStateAction<OnboardingData>> = useCallback(
    (updater) => {
      setDataState((prev) => {
        const next =
          typeof updater === "function"
            ? (updater as (p: OnboardingData) => OnboardingData)(prev)
            : updater;
        try {
          // Exclude photo (base64 — too large for sessionStorage)
          const { photo: _p, photoName: _pn, ...toStore } = next;
          sessionStorage.setItem(ONBOARDING_KEY, JSON.stringify(toStore));
        } catch {
          // QuotaExceededError or private browsing — silently ignore
        }
        return next;
      });
    },
    [],
  );

  return (
    <OnboardingContext.Provider value={{ data, setData }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}
