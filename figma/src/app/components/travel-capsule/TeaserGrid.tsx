import React from "react";
import { ImageWithFallback } from "../figma/ImageWithFallback";

interface TeaserGridProps {
  imageUrl: string;
  alt?: string;
  className?: string;
}

export function TeaserGrid({ imageUrl, alt = "AI Generated Style", className = "" }: TeaserGridProps) {
  const cells = [
    { objectPosition: "center top", borderRadius: "12px 4px 4px 4px" },     // tl-xl tr-sm bl-sm br-sm → full body
    { objectPosition: "center center", borderRadius: "4px 12px 4px 4px" },  // upper body
    { objectPosition: "center 70%", borderRadius: "4px 4px 4px 12px" },     // detail
    { objectPosition: "center bottom", borderRadius: "4px 4px 12px 4px" },  // accessory
  ];

  return (
    <div className={`grid grid-cols-2 gap-1.5 ${className}`} style={{ aspectRatio: "3/4" }}>
      {cells.map((cell, i) => (
        <div key={i} className="relative overflow-hidden" style={{ borderRadius: cell.borderRadius }}>
          <ImageWithFallback
            src={imageUrl}
            alt={`${alt} - crop ${i + 1}`}
            className="w-full h-full object-cover"
            style={{ objectPosition: cell.objectPosition }}
          />
        </div>
      ))}
    </div>
  );
}
