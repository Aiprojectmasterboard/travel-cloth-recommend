import React from "react";
import { Icon } from "./Icon";

interface WeatherWidgetProps {
  temp: number;
  unit?: "C" | "F";
  rain: number;
  wind: number;
  heatIndex?: number;
  className?: string;
}

export function WeatherWidget({ temp, unit = "C", rain, wind, heatIndex, className = "" }: WeatherWidgetProps) {
  return (
    <div className={`flex items-center gap-6 ${className}`}>
      <span
        className="text-[48px] text-[#292524]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
      >
        {temp}°{unit}
      </span>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <Icon name="water_drop" size={16} className="text-[#57534e]" />
          <span className="text-[14px] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>{rain}%</span>
          <span className="text-[12px] text-[#57534e]/60" style={{ fontFamily: "var(--font-body)" }}>Rain</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Icon name="air" size={16} className="text-[#57534e]" />
          <span className="text-[14px] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>{wind} km/h</span>
          <span className="text-[12px] text-[#57534e]/60" style={{ fontFamily: "var(--font-body)" }}>Wind</span>
        </div>
        {heatIndex !== undefined && (
          <div className="flex items-center gap-1.5">
            <Icon name="thermostat" size={16} className="text-[#57534e]" />
            <span className="text-[14px] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>{heatIndex}°</span>
            <span className="text-[12px] text-[#57534e]/60" style={{ fontFamily: "var(--font-body)" }}>Heat</span>
          </div>
        )}
      </div>
    </div>
  );
}
