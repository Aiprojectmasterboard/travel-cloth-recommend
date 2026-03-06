import React from "react";
import { Icon } from "./Icon";
import { useLang } from "../../context/LanguageContext";

interface ProfileBadgeProps {
  gender: string;
  height: string;
  weight: string;
  aesthetics: string[];
  photo: string;
  /** R2 CDN URL of uploaded face photo — survives payment redirect */
  faceUrl?: string;
  bodyFitLabel: string;
}

/**
 * Displays the user's profile summary that was used for AI outfit generation.
 * Shows gender, body info, aesthetics, and photo status.
 */
export function ProfileBadge({ gender, height, weight, aesthetics, photo, faceUrl, bodyFitLabel }: ProfileBadgeProps) {
  const { t } = useLang();
  const hasPhoto = !!(photo || faceUrl);
  const genderIcon = gender === "male" ? "male" : gender === "non-binary" ? "transgender" : "female";
  const genderLabel = gender === "male" ? t("dashboard.male") : gender === "non-binary" ? t("dashboard.nonBinary") : t("dashboard.female");

  return (
    <div className="bg-white rounded-xl border border-[#E8DDD4] p-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-full bg-[#C4613A]/10 flex items-center justify-center">
          <Icon name="auto_awesome" size={16} className="text-[#C4613A]" filled />
        </div>
        <div>
          <span className="text-[14px] text-[#292524] block" style={{ fontFamily: "var(--font-display)" }}>
            {t("dashboard.aiGenProfile")}
          </span>
          <span className="text-[10px] uppercase tracking-[0.1em] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>
            {t("dashboard.outfitsTailored")}
          </span>
        </div>
      </div>

      {/* Body Fit Label */}
      <div className="px-3 py-2 bg-[#C4613A]/5 rounded-lg mb-4">
        <span className="text-[12px] text-[#C4613A] flex items-center gap-1.5" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>
          <Icon name="person" size={14} className="text-[#C4613A]" />
          {bodyFitLabel}
        </span>
      </div>

      {/* Profile details */}
      <div className="space-y-2.5">
        {/* Gender */}
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[#57534e] flex items-center gap-1.5" style={{ fontFamily: "var(--font-body)" }}>
            <Icon name={genderIcon} size={14} className="text-[#57534e]" /> {t("dashboard.gender")}
          </span>
          <span className="text-[12px] text-[#292524]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
            {genderLabel}
          </span>
        </div>

        {/* Height */}
        {height && (
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#57534e] flex items-center gap-1.5" style={{ fontFamily: "var(--font-body)" }}>
              <Icon name="straighten" size={14} className="text-[#57534e]" /> {t("dashboard.height")}
            </span>
            <span className="text-[12px] text-[#292524]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
              {height} cm
            </span>
          </div>
        )}

        {/* Weight */}
        {weight && (
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#57534e] flex items-center gap-1.5" style={{ fontFamily: "var(--font-body)" }}>
              <Icon name="fitness_center" size={14} className="text-[#57534e]" /> {t("dashboard.weight")}
            </span>
            <span className="text-[12px] text-[#292524]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
              {weight} kg
            </span>
          </div>
        )}

        {/* Photo status */}
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[#57534e] flex items-center gap-1.5" style={{ fontFamily: "var(--font-body)" }}>
            <Icon name="photo_camera" size={14} className="text-[#57534e]" /> {t("dashboard.refPhoto")}
          </span>
          {hasPhoto ? (
            <div className="flex items-center gap-2">
              {faceUrl && (
                <img src={faceUrl} alt="Reference" className="w-6 h-6 rounded-full object-cover border border-green-300" />
              )}
              <span className="text-[11px] text-green-600 flex items-center gap-1" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                <Icon name="check_circle" size={12} className="text-green-600" filled /> {t("dashboard.uploaded")}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-[#57534e]/50" style={{ fontFamily: "var(--font-mono)" }}>
              {t("dashboard.notProvided")}
            </span>
          )}
        </div>

        {/* Aesthetics */}
        {aesthetics.length > 0 && (
          <div className="pt-2 border-t border-[#EFE8DF]">
            <span className="text-[10px] uppercase tracking-[0.1em] text-[#57534e] block mb-2" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>
              {t("dashboard.stylePrefs")}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {aesthetics.map((a) => (
                <span key={a} className="px-2 py-0.5 bg-[#FDF8F3] border border-[#E8DDD4] rounded-full text-[10px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Inline badge shown on each outfit card to indicate AI personalization.
 */
export function AiGeneratedBadge({ confidence, bodyFitLabel }: { confidence: number; bodyFitLabel: string }) {
  const { t } = useLang();
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C4613A]/10 text-[#C4613A] text-[9px] uppercase tracking-[0.1em]"
        style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}
      >
        <Icon name="auto_awesome" size={10} className="text-[#C4613A]" filled />
        {t("dashboard.aiGenerated")} · {confidence}% {t("dashboard.match")}
      </span>
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EFE8DF] text-[#57534e] text-[9px] tracking-[0.05em]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {bodyFitLabel}
      </span>
    </div>
  );
}

/**
 * Size recommendation chip shown next to each item.
 */
export function SizeChip({ size }: { size: string }) {
  if (!size) return null;
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#C4613A]/10 text-[#C4613A] text-[9px] uppercase tracking-[0.05em]"
      style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}
    >
      {size}
    </span>
  );
}
