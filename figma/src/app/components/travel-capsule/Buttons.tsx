import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  type?: "button" | "submit";
}

export function BtnPrimary({ children, onClick, className = "", size = "md", disabled, type = "button" }: ButtonProps) {
  const heights = { sm: "h-[44px]", md: "h-[56px]", lg: "h-[64px]" };
  const paddings = { sm: "px-5", md: "px-8", lg: "px-10" };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center
        bg-[#C4613A] text-white
        text-[14px] uppercase tracking-[0.08em]
        ${heights[size]} ${paddings[size]}
        rounded-none
        hover:bg-[#A84A25] active:bg-[#8E3D1D]
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        cursor-pointer
        ${className}
      `}
      style={{
        fontFamily: "var(--font-body)",
        fontWeight: 600,
        boxShadow: "0 4px 16px rgba(196,97,58,.25)",
      }}
    >
      {children}
    </button>
  );
}

export function BtnSecondary({ children, onClick, className = "", size = "md", disabled, type = "button" }: ButtonProps) {
  const heights = { sm: "h-[44px]", md: "h-[56px]", lg: "h-[64px]" };
  const paddings = { sm: "px-5", md: "px-8", lg: "px-10" };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center
        bg-white text-[#C4613A]
        border border-[#C4613A]/20
        text-[14px] uppercase tracking-[0.08em]
        ${heights[size]} ${paddings[size]}
        rounded-none
        hover:border-[#C4613A]/40 hover:bg-[#C4613A]/5
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        cursor-pointer
        ${className}
      `}
      style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}
    >
      {children}
    </button>
  );
}

export function BtnDark({ children, onClick, className = "", size = "md", disabled, type = "button" }: ButtonProps) {
  const heights = { sm: "h-[44px]", md: "h-[56px]", lg: "h-[64px]" };
  const paddings = { sm: "px-5", md: "px-8", lg: "px-10" };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center
        bg-[#1A1410] text-white
        text-[14px] uppercase tracking-[0.08em]
        ${heights[size]} ${paddings[size]}
        rounded-lg
        hover:bg-[#C4613A]
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        cursor-pointer
        ${className}
      `}
      style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}
    >
      {children}
    </button>
  );
}
