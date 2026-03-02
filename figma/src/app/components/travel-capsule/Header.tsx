import React from "react";
import { Icon } from "./Icon";
import { BtnPrimary } from "./Buttons";

interface HeaderProps {
  onCtaClick?: () => void;
  ctaLabel?: string;
  navItems?: string[];
}

export function Header({
  onCtaClick,
  ctaLabel = "Start Planning",
  navItems = ["How It Works", "Pricing", "Examples"],
}: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-[#E8DDD4]/50"
      style={{
        backgroundColor: "rgba(253, 248, 243, 0.8)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div className="mx-auto flex items-center justify-between px-6 py-4" style={{ maxWidth: "var(--max-w)" }}>
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Icon name="luggage" size={28} className="text-[#C4613A]" />
          <span
            className="text-[20px] tracking-tight text-[#1A1410]"
            style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
          >
            Travel Capsule
          </span>
        </div>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item}
              href="#"
              className="text-[12px] tracking-[0.08em] uppercase text-[#57534e] hover:text-[#C4613A] transition-colors"
              style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
            >
              {item}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <BtnPrimary onClick={onCtaClick} size="sm">
          {ctaLabel}
        </BtnPrimary>
      </div>
    </header>
  );
}
