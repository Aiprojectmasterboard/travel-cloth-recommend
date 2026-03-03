import React from "react";
import { Icon } from "./Icon";
import { ImageWithFallback } from "../figma/ImageWithFallback";

interface CityRowProps {
  city: string;
  country: string;
  imageUrl: string;
  fromDate?: string;
  toDate?: string;
  onDelete?: () => void;
  onFromChange?: (val: string) => void;
  onToChange?: (val: string) => void;
}

export function CityRow({ city, country, imageUrl, fromDate = "", toDate = "", onDelete, onFromChange, onToChange }: CityRowProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white border border-[#E8DDD4] rounded-lg hover:border-[#C4613A]/30 transition-colors group">
      <ImageWithFallback
        src={imageUrl}
        alt={city}
        className="w-[64px] h-[64px] rounded-lg object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-[18px] text-[#292524] truncate" style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>{city}</span>
          <span className="text-[14px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>{country}</span>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => onFromChange?.(e.target.value)}
            className="h-[36px] px-3 bg-[#FDF8F3] border border-[#E8DDD4] rounded-[4px] text-[14px] text-[#292524] focus:border-[#C4613A] focus:outline-none"
            style={{ fontFamily: "var(--font-body)" }}
          />
          <span className="text-[12px] text-[#57534e] uppercase tracking-wider" style={{ fontFamily: "var(--font-body)" }}>to</span>
          <input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(e) => onToChange?.(e.target.value)}
            className="h-[36px] px-3 bg-[#FDF8F3] border border-[#E8DDD4] rounded-[4px] text-[14px] text-[#292524] focus:border-[#C4613A] focus:outline-none"
            style={{ fontFamily: "var(--font-body)" }}
          />
        </div>
      </div>
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-2 text-[#57534e] hover:text-[#d4183d] transition-all cursor-pointer"
      >
        <Icon name="delete" size={20} />
      </button>
    </div>
  );
}
