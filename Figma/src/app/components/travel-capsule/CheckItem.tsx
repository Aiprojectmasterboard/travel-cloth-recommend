import React from "react";
import { Icon } from "./Icon";

interface CheckItemProps {
  label: string;
  className?: string;
}

export function CheckItem({ label, className = "" }: CheckItemProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Icon name="check_circle" size={20} filled className="text-[#C4613A]" />
      <span
        className="text-[14px] text-[#292524]"
        style={{ fontFamily: "var(--font-body)", fontWeight: 400 }}
      >
        {label}
      </span>
    </div>
  );
}
