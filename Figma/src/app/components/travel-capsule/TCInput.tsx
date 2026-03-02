import React from "react";

interface TCInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  className?: string;
}

export function TCInput({ label, placeholder, value, onChange, type = "text", className = "" }: TCInputProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-[12px] uppercase tracking-[0.08em] text-[#57534e]" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="
          w-full h-[48px] px-4
          bg-white border border-[#E8DDD4]
          rounded-[12px]
          text-[16px] text-[#292524]
          placeholder:text-[#57534e]/50
          focus:border-[#C4613A] focus:outline-none focus:ring-1 focus:ring-[#C4613A]/20
          transition-colors
        "
        style={{ fontFamily: "var(--font-body)" }}
      />
    </div>
  );
}
