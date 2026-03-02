import React from "react";
import { ImageWithFallback } from "../figma/ImageWithFallback";

interface MoodCardProps {
  imageUrl: string;
  city: string;
  description: string;
  swatches: string[];
}

export function MoodCard({ imageUrl, city, description, swatches }: MoodCardProps) {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
      <div className="relative h-[200px]">
        <ImageWithFallback
          src={imageUrl}
          alt={city}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <span
          className="absolute bottom-3 left-4 text-white text-[20px]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
        >
          {city}
        </span>
      </div>
      <div className="p-5">
        <p className="text-[14px] text-[#57534e] leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
          {description}
        </p>
        <div className="flex items-center gap-2 mt-4">
          {swatches.map((color) => (
            <div
              key={color}
              className="w-8 h-8 rounded-full border border-[#E8DDD4]"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
