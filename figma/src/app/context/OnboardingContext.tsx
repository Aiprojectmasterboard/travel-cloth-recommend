import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface CityEntry {
  id: string;
  city: string;
  country: string;
  imageUrl: string;
  fromDate: string;
  toDate: string;
  lat?: number;
  lon?: number;
}

export type Silhouette = "petite" | "standard" | "tall" | "plus" | "";

export interface OnboardingData {
  cities: CityEntry[];
  gender: string;
  /** @deprecated Use silhouette instead */
  height: string;
  /** @deprecated Use silhouette instead */
  weight: string;
  silhouette: Silhouette;
  aesthetics: string[];
  /** Base64 data-URL of user's uploaded reference photo — NOT persisted (too large) */
  photo: string;
  /** Original filename of the uploaded photo */
  photoName: string;
  /** R2 CDN URL returned after uploading the photo to the Worker — persisted in sessionStorage */
  faceUrl: string;
}

interface OnboardingContextType {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

const ONBOARDING_KEY = "tc_onboarding_data";
const ONBOARDING_BACKUP_KEY = "tc_onboarding_backup";

const DEFAULT_DATA: OnboardingData = {
  cities: [],
  gender: "",
  height: "",
  weight: "",
  silhouette: "",
  aesthetics: [],
  photo: "",
  photoName: "",
  faceUrl: "",
};

/**
 * Map silhouette to approximate height_cm / weight_kg for backward-compatible API calls.
 * Keeps all Worker agent prompt logic (heightDesc, bmiNote) working unchanged.
 */
export function silhouetteToBodyMetrics(s: Silhouette): { height_cm?: number; weight_kg?: number } {
  switch (s) {
    case "petite":   return { height_cm: 158, weight_kg: 50 };
    case "standard": return { height_cm: 170, weight_kg: 65 };
    case "tall":     return { height_cm: 183, weight_kg: 75 };
    case "plus":     return { height_cm: 170, weight_kg: 95 };
    default:         return {};
  }
}

function readStoredOnboarding(): OnboardingData {
  try {
    // Try sessionStorage first (primary)
    const raw = sessionStorage.getItem(ONBOARDING_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<OnboardingData>;
      return { ...DEFAULT_DATA, ...parsed, photo: "" };
    }
    // Fall back to localStorage backup (survives payment redirects)
    const backup = localStorage.getItem(ONBOARDING_BACKUP_KEY);
    if (backup) {
      const parsed = JSON.parse(backup) as Partial<OnboardingData>;
      return { ...DEFAULT_DATA, ...parsed, photo: "" };
    }
  } catch {
    // storage unavailable or JSON parse failed — fall through to default
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
          // Exclude only photo (base64 — too large for storage); photoName and faceUrl are safe to persist
          const { photo: _p, ...toStore } = next;
          const json = JSON.stringify(toStore);
          sessionStorage.setItem(ONBOARDING_KEY, json);
          // Also persist to localStorage as backup (survives payment redirect / tab close)
          localStorage.setItem(ONBOARDING_BACKUP_KEY, json);
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
