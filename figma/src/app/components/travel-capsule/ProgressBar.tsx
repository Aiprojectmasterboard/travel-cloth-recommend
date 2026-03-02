import React from "react";

interface ProgressBarProps {
  currentStep: number;
  totalSteps?: number;
  sublabel?: string;
}

export function ProgressBar({ currentStep, totalSteps = 4, sublabel }: ProgressBarProps) {
  const percent = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-[12px] uppercase tracking-[0.08em] text-[#292524]"
          style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
        >
          Step {currentStep} of {totalSteps}
        </span>
        <span
          className="text-[12px] uppercase tracking-[0.08em] text-[#57534e]"
          style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
        >
          {percent}% Complete
        </span>
      </div>
      <div className="w-full h-[6px] bg-[#E8DDD4] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#C4613A] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      {sublabel && (
        <p
          className="mt-2 text-[14px] italic text-[#C4613A]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {sublabel}
        </p>
      )}
    </div>
  );
}
