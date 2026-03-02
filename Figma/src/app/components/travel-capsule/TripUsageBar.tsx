import React from "react";

interface TripUsageBarProps {
  used: number;
  total?: number;
  renewMonth?: string;
}

export function TripUsageBar({ used, total = 12, renewMonth = "January" }: TripUsageBarProps) {
  const remaining = total - used;
  const percent = (used / total) * 100;

  return (
    <div className="w-full">
      <div className="w-full h-[6px] bg-[#EFE8DF] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#C4613A] rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[14px] text-[#292524]" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>
          {remaining} of {total} trips remaining
        </span>
        <span className="text-[12px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
          Renews {renewMonth}
        </span>
      </div>
    </div>
  );
}
