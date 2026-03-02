import React, { useState, useRef, useEffect } from "react";
import { useLang, LANGUAGES } from "../../context/LanguageContext";
import { Icon } from "./Icon";

export function LanguageSelector({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = LANGUAGES.find((l) => l.code === lang)!;
  const isLight = variant === "light";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] uppercase tracking-[0.08em] transition-colors cursor-pointer border ${
          isLight
            ? "border-white/20 text-white/70 hover:text-white hover:border-white/40 bg-white/5"
            : "border-[#E8DDD4] text-[#57534e] hover:text-[#C4613A] hover:border-[#C4613A]/40 bg-white"
        }`}
        style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
      >
        <Icon name="language" size={14} className={isLight ? "text-white/70" : "text-[#57534e]"} />
        {current.nativeLabel}
        <Icon name={open ? "expand_less" : "expand_more"} size={14} className={isLight ? "text-white/50" : "text-[#57534e]/50"} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[180px] bg-white rounded-xl border border-[#E8DDD4] py-2 z-50"
          style={{ boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-[#FDF8F3] transition-colors cursor-pointer ${
                lang === l.code ? "text-[#C4613A]" : "text-[#292524]"
              }`}
            >
              <span className="text-[13px]" style={{ fontFamily: "var(--font-body)", fontWeight: lang === l.code ? 600 : 400 }}>
                {l.nativeLabel}
              </span>
              <span className="text-[11px] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>
                {l.code.toUpperCase()}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
