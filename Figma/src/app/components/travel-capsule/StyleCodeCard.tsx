import React from "react";
import { TagChip } from "./Badges";
import { Icon } from "./Icon";

interface StyleCodeCardProps {
  description: string;
  city: string;
  temp: number;
  rain: number;
  uv: number;
}

export function StyleCodeCard({ description, city, temp, rain, uv }: StyleCodeCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
      <p className="text-[16px] text-[#292524] leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
        {description}
      </p>
      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <TagChip label={city} />
        <div className="flex items-center gap-3 text-[12px] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>
          <span className="flex items-center gap-1">
            <Icon name="thermostat" size={14} className="text-[#57534e]" />
            {temp}°C
          </span>
          <span className="flex items-center gap-1">
            <Icon name="water_drop" size={14} className="text-[#57534e]" />
            {rain}%
          </span>
          <span className="flex items-center gap-1">
            <Icon name="wb_sunny" size={14} className="text-[#57534e]" />
            UV {uv}
          </span>
        </div>
      </div>
    </div>
  );
}
