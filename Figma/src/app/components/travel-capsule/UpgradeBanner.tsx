import React, { useState, useEffect } from "react";

interface UpgradeBannerProps {
  initialMinutes?: number;
  initialSeconds?: number;
  onUpgrade?: () => void;
}

export function UpgradeBanner({ initialMinutes = 14, initialSeconds = 59, onUpgrade }: UpgradeBannerProps) {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60 + initialSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const secs = (timeLeft % 60).toString().padStart(2, "0");

  return (
    <div className="w-full bg-[#C4613A] py-3 px-6">
      <div className="mx-auto flex items-center justify-between" style={{ maxWidth: "var(--max-w)" }}>
        <div className="flex items-center gap-4">
          <span className="text-white/80 text-[12px] uppercase tracking-[0.08em]" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>
            Limited offer expires in
          </span>
          <span className="text-white text-[20px] tabular-nums" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
            {mins}:{secs}
          </span>
        </div>
        <button
          onClick={onUpgrade}
          className="h-[36px] px-5 bg-white text-[#C4613A] text-[12px] uppercase tracking-[0.08em] rounded-none hover:bg-white/90 transition-colors cursor-pointer"
          style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}
        >
          Upgrade to Pro
        </button>
      </div>
    </div>
  );
}
