import React, { createContext, useContext, useState, ReactNode } from "react";

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

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>({
    cities: [],
    gender: "",
    height: "",
    weight: "",
    aesthetics: [],
    photo: "",
    photoName: "",
  });

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
