import React from "react";
import { Icon } from "./Icon";
import { ImageWithFallback } from "../figma/ImageWithFallback";

interface AestheticCardProps {
  label: string;
  imageUrl: string;
  selected?: boolean;
  onClick?: () => void;
}

export function AestheticCard({ label, imageUrl, selected = false, onClick }: AestheticCardProps) {
  return (
    <button onClick={onClick} className="flex flex-col items-start gap-2 cursor-pointer group">
      <div
        className={`
          relative w-full aspect-square overflow-hidden rounded-lg
          border-2 transition-all
          ${selected ? "border-[#C4613A]" : "border-transparent hover:border-[#E8DDD4]"}
        `}
      >
        <ImageWithFallback
          src={imageUrl}
          alt={label}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {selected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-[#C4613A] rounded-full flex items-center justify-center">
            <Icon name="check" size={16} className="text-white" />
          </div>
        )}
      </div>
      <span
        className={`text-[14px] ${selected ? "text-[#C4613A]" : "text-[#292524]"}`}
        style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
      >
        {label}
      </span>
    </button>
  );
}
