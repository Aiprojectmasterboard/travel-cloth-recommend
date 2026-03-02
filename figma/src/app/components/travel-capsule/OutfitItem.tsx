import React from "react";
import { ImageWithFallback } from "../figma/ImageWithFallback";

interface OutfitItemProps {
  name: string;
  description: string;
  imageUrl: string;
  onClick?: () => void;
}

export function OutfitItem({ name, description, imageUrl, onClick }: OutfitItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#EFE8DF]/50 transition-all group cursor-pointer w-full text-left"
    >
      <ImageWithFallback
        src={imageUrl}
        alt={name}
        className="w-[64px] h-[64px] rounded-lg object-cover flex-shrink-0 group-hover:scale-105 transition-transform duration-300"
      />
      <div className="flex-1 min-w-0">
        <span
          className="text-[18px] text-[#292524] block truncate"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
        >
          {name}
        </span>
        <span
          className="text-[14px] text-[#57534e] block truncate"
          style={{ fontFamily: "var(--font-body)", fontWeight: 400 }}
        >
          {description}
        </span>
      </div>
    </button>
  );
}
