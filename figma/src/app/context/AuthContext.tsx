import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

export type PlanKey = "standard" | "pro" | "annual";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  initials: string;
}

export type LoginModalContext = "default" | "onboarding_gate";

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  showLoginModal: boolean;
  setShowLoginModal: (v: boolean) => void;
  showSignupPrompt: boolean;
  setShowSignupPrompt: (v: boolean) => void;
  purchasedPlan: PlanKey | null;
  setPurchasedPlan: (plan: PlanKey | null) => void;
  authLoading: boolean;
  loginModalContext: LoginModalContext;
  setLoginModalContext: (v: LoginModalContext) => void;
  showPasswordReset: boolean;
  setShowPasswordReset: (v: boolean) => void;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const PLAN_KEY = "tc_purchased_plan";

function readStoredPlan(): PlanKey | null {
  try {
    const v = sessionStorage.getItem(PLAN_KEY);
    if (v === "standard" || v === "pro" || v === "annual") return v;
  } catch {}
  return null;
}

function mapSupabaseUser(su: SupabaseUser): User {
  const meta = su.user_metadata || {};
  const email = su.email || "";
  const name = meta.full_name || meta.name || email.split("@")[0] || "";
  const avatar = meta.avatar_url || meta.picture || "";
  const initials = name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";
  return { id: su.id, name, email, avatar, initials };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [purchasedPlan, setPurchasedPlanState] = useState<PlanKey | null>(readStoredPlan);
  const [loginModalContext, setLoginModalContext] = useState<LoginModalContext>("default");
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  // Listen for Supabase auth state changes
  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      }
      setAuthLoading(false);
    });

    // Subscribe to auth changes (login, logout, token refresh, password recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          setShowPasswordReset(true);
        }
        if (session?.user) {
          setUser(mapSupabaseUser(session.user));
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        throw new Error("Invalid email or password.");
      }
      throw new Error(error.message);
    }
    setShowLoginModal(false);
    setShowSignupPrompt(false);
  }, []);

  const signUpWithEmail = useCallback(async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });
    if (error) {
      if (error.message.includes("already registered")) {
        throw new Error("This email is already registered. Please sign in.");
      }
      throw new Error(error.message);
    }
    // If Supabase returns no session, email confirmation is required
    if (!data.session) {
      // onAuthStateChange will handle login once confirmed; close modal and inform user
      setShowLoginModal(false);
      setShowSignupPrompt(false);
      throw new Error("Please check your email to confirm your account.");
    }
    // Session returned — user is auto-logged in via onAuthStateChange
    setShowLoginModal(false);
    setShowSignupPrompt(false);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) {
      throw new Error(error.message);
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      throw new Error(error.message);
    }
    setShowPasswordReset(false);
  }, []);

  const setPurchasedPlan = useCallback((plan: PlanKey | null) => {
    setPurchasedPlanState(plan);
    try {
      if (plan) sessionStorage.setItem(PLAN_KEY, plan);
      else sessionStorage.removeItem(PLAN_KEY);
    } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn: !!user,
      loginWithEmail,
      signUpWithEmail,
      logout,
      showLoginModal,
      setShowLoginModal,
      showSignupPrompt,
      setShowSignupPrompt,
      purchasedPlan,
      setPurchasedPlan,
      authLoading,
      loginModalContext,
      setLoginModalContext,
      showPasswordReset,
      setShowPasswordReset,
      resetPassword,
      updatePassword,
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
