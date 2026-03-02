import React from "react";

interface QuoteCardProps {
  quote: string;
  attribution: string;
  className?: string;
}

export function QuoteCard({ quote, attribution, className = "" }: QuoteCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl p-8 ${className}`}
      style={{ backgroundColor: "rgba(26, 20, 16, 0.85)" }}
    >
      <p
        className="text-[20px] text-white/90 italic leading-relaxed"
        style={{ fontFamily: "var(--font-display)" }}
      >
        "{quote}"
      </p>
      <span
        className="mt-4 block text-[11px] text-white/50 uppercase tracking-[0.2em]"
        style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
      >
        {attribution}
      </span>
    </div>
  );
}
