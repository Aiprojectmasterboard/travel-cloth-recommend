import React from "react";
import { useNavigate } from "react-router";
import { QuoteCard } from "./QuoteCard";
import { Icon } from "./Icon";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { useAuth } from "../../context/AuthContext";

interface OnboardingLayoutProps {
  children: React.ReactNode;
  imageUrl: string;
  quote: string;
  attribution: string;
}

export function OnboardingLayout({ children, imageUrl, quote, attribution }: OnboardingLayoutProps) {
  const navigate = useNavigate();
  const { isLoggedIn, user, setShowLoginModal } = useAuth();

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FDF8F3]">
      {/* Left — Form */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-10 lg:px-16 pt-6 pb-2">
          {/* Logo */}
          <div
            className="flex items-center gap-1.5 cursor-pointer"
            onClick={() => navigate("/")}
            role="button"
            aria-label="Go to home"
          >
            <Icon name="luggage" size={22} className="text-[#C4613A]" />
            <span
              className="text-[16px] tracking-tight text-[#1A1410] whitespace-nowrap"
              style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
            >
              Travel Capsule AI
            </span>
          </div>

          {/* Account icon */}
          {isLoggedIn ? (
            <div
              className="w-9 h-9 rounded-full bg-[#C4613A] flex items-center justify-center cursor-pointer"
              onClick={() => navigate("/mypage")}
              role="button"
              aria-label="My account"
              title={user?.name || user?.email}
            >
              <span
                className="text-white text-[13px]"
                style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}
              >
                {user?.initials}
              </span>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="w-9 h-9 rounded-full border border-[#E8DDD4] bg-white flex items-center justify-center hover:bg-[#EFE8DF] transition-colors cursor-pointer"
              aria-label="Sign in"
              title="Sign in"
            >
              <Icon name="person" size={20} className="text-[#57534e]" />
            </button>
          )}
        </div>

        <div className="flex-1 px-6 sm:px-10 lg:px-16 py-6 lg:py-10 overflow-y-auto">
          <div className="max-w-[540px] mx-auto w-full">
            {children}
          </div>
        </div>
      </div>

      {/* Right — Editorial Photo */}
      <div className="hidden lg:block w-1/2 relative">
        <div className="sticky top-0 h-screen">
          <ImageWithFallback
            src={imageUrl}
            alt="Editorial"
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
          {/* Quote at bottom-left */}
          <div className="absolute bottom-8 left-8 right-8 z-10">
            <QuoteCard quote={quote} attribution={attribution} />
          </div>
        </div>
      </div>
    </div>
  );
}
