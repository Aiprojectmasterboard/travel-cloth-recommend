import React from "react";
import { QuoteCard } from "./QuoteCard";
import { ImageWithFallback } from "../figma/ImageWithFallback";

interface OnboardingLayoutProps {
  children: React.ReactNode;
  imageUrl: string;
  quote: string;
  attribution: string;
}

export function OnboardingLayout({ children, imageUrl, quote, attribution }: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FDF8F3]">
      {/* Left — Form */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-screen">
        <div className="flex-1 px-6 sm:px-10 lg:px-16 py-10 lg:py-14 overflow-y-auto">
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
