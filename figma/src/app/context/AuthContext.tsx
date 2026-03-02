import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";

export type PlanKey = "standard" | "pro" | "annual";

export interface User {
  name: string;
  email: string;
  avatar: string;
  initials: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  loginWithGoogle: () => void;
  logout: () => void;
  showLoginModal: boolean;
  setShowLoginModal: (v: boolean) => void;
  showSignupPrompt: boolean;
  setShowSignupPrompt: (v: boolean) => void;
  /** null = not yet paid; set after successful checkout */
  purchasedPlan: PlanKey | null;
  setPurchasedPlan: (plan: PlanKey | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const MOCK_USER: User = {
  name: "Alex Kim",
  email: "alex.kim@gmail.com",
  avatar: "",
  initials: "AK",
};

const SESSION_KEY = "tc_purchased_plan";

function readStoredPlan(): PlanKey | null {
  try {
    const v = sessionStorage.getItem(SESSION_KEY);
    if (v === "standard" || v === "pro" || v === "annual") return v;
  } catch {}
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [purchasedPlan, setPurchasedPlanState] = useState<PlanKey | null>(readStoredPlan);

  const loginWithGoogle = useCallback(() => {
    setUser(MOCK_USER);
    setShowLoginModal(false);
    setShowSignupPrompt(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const setPurchasedPlan = useCallback((plan: PlanKey | null) => {
    setPurchasedPlanState(plan);
    try {
      if (plan) sessionStorage.setItem(SESSION_KEY, plan);
      else sessionStorage.removeItem(SESSION_KEY);
    } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn: !!user,
      loginWithGoogle,
      logout,
      showLoginModal,
      setShowLoginModal,
      showSignupPrompt,
      setShowSignupPrompt,
      purchasedPlan,
      setPurchasedPlan,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be within AuthProvider");
  return ctx;
}
