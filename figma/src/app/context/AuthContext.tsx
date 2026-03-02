import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";

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
}

const AuthContext = createContext<AuthContextType | null>(null);

const MOCK_USER: User = {
  name: "Alex Kim",
  email: "alex.kim@gmail.com",
  avatar: "",
  initials: "AK",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

  const loginWithGoogle = useCallback(() => {
    // Mock Google OAuth
    setUser(MOCK_USER);
    setShowLoginModal(false);
    setShowSignupPrompt(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
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
