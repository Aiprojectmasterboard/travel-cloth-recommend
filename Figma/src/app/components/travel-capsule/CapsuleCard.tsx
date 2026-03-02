import React from "react";
import { ImageWithFallback } from "../figma/ImageWithFallback";

interface CapsuleCardProps {
  name: string;
  imageUrl: string;
  onClick?: () => void;
}

export function CapsuleCard({ name, imageUrl, onClick }: CapsuleCardProps) {
  return (
    <button onClick={onClick} className="flex flex-col items-start gap-2 cursor-pointer group">
      <div className="w-full aspect-square overflow-hidden rounded-lg bg-[#EFE8DF]">
        <ImageWithFallback
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <span
        className="text-[14px] text-[#292524] group-hover:text-[#C4613A] transition-colors"
        style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
      >
        {name}
      </span>
    </button>
  );
}
