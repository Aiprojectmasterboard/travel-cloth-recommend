import React from "react";

interface DayPlan {
  day: number;
  activity: string;
}

interface DayPlanStripProps {
  days: DayPlan[];
  activeDay: number;
  onDaySelect?: (day: number) => void;
}

export function DayPlanStrip({ days, activeDay, onDaySelect }: DayPlanStripProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {days.map(({ day, activity }) => {
        const isActive = day === activeDay;
        return (
          <button
            key={day}
            onClick={() => onDaySelect?.(day)}
            className={`
              flex flex-col items-start px-4 py-3 rounded-lg border
              min-w-[140px] transition-all cursor-pointer text-left
              ${
                isActive
                  ? "bg-[#C4613A]/10 border-[#C4613A] ring-1 ring-[#C4613A]"
                  : "bg-stone-50 border-stone-100 hover:border-[#E8DDD4]"
              }
            `}
          >
            <span
              className={`text-[12px] uppercase tracking-[0.08em] ${isActive ? "text-[#C4613A]" : "text-[#57534e]"}`}
              style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}
            >
              Day {day}
            </span>
            <span
              className={`text-[14px] mt-0.5 ${isActive ? "text-[#292524]" : "text-[#57534e]"}`}
              style={{ fontFamily: "var(--font-body)", fontWeight: 400 }}
            >
              {activity}
            </span>
          </button>
        );
      })}
    </div>
  );
}
