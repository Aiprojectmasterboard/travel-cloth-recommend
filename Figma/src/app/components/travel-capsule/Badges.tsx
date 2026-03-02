import React from "react";
import { Icon } from "./Icon";

interface PlanBadgeProps {
  label: string;
  className?: string;
}

export function PlanBadge({ label, className = "" }: PlanBadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center
        px-3 py-1
        bg-stone-200/50
        rounded-full
        text-[12px] uppercase tracking-[0.08em] text-[#57534e]
        ${className}
      `}
      style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
    >
      {label}
    </span>
  );
}

export function AnnualBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-3.5 py-1.5
        rounded-full
        text-[11px] uppercase tracking-[0.1em] text-white
        gold-gradient
        whitespace-nowrap
        ${className}
      `}
      style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}
    >
      <Icon name="workspace_premium" size={14} className="text-white" />
      Annual Member
    </span>
  );
}

export function TagChip({ label, className = "" }: { label: string; className?: string }) {
  return (
    <span
      className={`
        inline-flex items-center
        px-3 py-1
        bg-[#C4613A]/10
        text-[#C4613A]
        rounded-full
        text-[10px] uppercase tracking-[0.1em]
        ${className}
      `}
      style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}
    >
      {label}
    </span>
  );
}