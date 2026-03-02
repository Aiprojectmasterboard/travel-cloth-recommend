import React, { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { OnboardingLayout } from "../components/travel-capsule/OnboardingLayout";
import { ProgressBar, BtnPrimary, BtnSecondary, Icon } from "../components/travel-capsule";
import { AestheticCard } from "../components/travel-capsule/AestheticCard";
import { useOnboarding } from "../context/OnboardingContext";
import { IMAGES } from "../constants/images";

const AESTHETICS = [
  { label: "Casual", img: IMAGES.casual },
  { label: "Minimalist", img: IMAGES.minimalist },
  { label: "Streetwear", img: IMAGES.streetwearCard },
  { label: "Classic", img: IMAGES.classic },
  { label: "Sporty", img: IMAGES.sporty },
  { label: "Bohemian", img: IMAGES.bohemian },
];

export function OnboardingStep3() {
  const navigate = useNavigate();
  const { data, setData } = useOnboarding();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const toggleAesthetic = (label: string) => {
    setData((prev) => ({
      ...prev,
      aesthetics: prev.aesthetics.includes(label)
        ? prev.aesthetics.filter((a) => a !== label)
        : [...prev.aesthetics, label],
    }));
  };

  /* ── Photo upload handler ── */
  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return; // 5 MB limit
    const reader = new FileReader();
    reader.onload = () => {
      setData((prev) => ({
        ...prev,
        photo: reader.result as string,
        photoName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const onDropHandler = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const removePhoto = () => {
    setData((prev) => ({ ...prev, photo: "", photoName: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <OnboardingLayout
      imageUrl={IMAGES.leatherSuitcase}
      quote="The joy of dressing is an art."
      attribution="John Galliano"
    >
      <ProgressBar currentStep={3} sublabel="Curating your vibe" />

      <div className="mt-10">
        <h1 className="text-[#292524]" style={{ fontSize: "clamp(36px, 4vw, 56px)", fontFamily: "var(--font-display)", lineHeight: 1.1 }}>
          Your Style <em>Profile</em>
        </h1>
        <p className="mt-4 text-[16px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
          Define your travel aesthetic so our AI can match outfits to your personal style.
        </p>
      </div>

      {/* Aesthetic Selection */}
      <div className="mt-10">
        <h4 className="text-[#292524] mb-1" style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 16 }}>
          Select Your Aesthetic
        </h4>
        <p className="text-[14px] text-[#57534e] mb-5" style={{ fontFamily: "var(--font-body)" }}>
          Choose the looks that best represent your travel personality.
        </p>

        <div className="grid grid-cols-3 gap-3">
          {AESTHETICS.map((a) => (
            <AestheticCard
              key={a.label}
              label={a.label}
              imageUrl={a.img}
              selected={data.aesthetics.includes(a.label)}
              onClick={() => toggleAesthetic(a.label)}
            />
          ))}
        </div>
      </div>

      {/* AI Personalization — Photo Upload */}
      <div className="mt-10 p-6 bg-[#C4613A]/5 rounded-xl border border-[#C4613A]/10">
        <div className="flex items-start gap-3">
          <Icon name="auto_awesome" size={24} className="text-[#C4613A] flex-shrink-0 mt-0.5" filled />
          <div className="flex-1">
            <h4 className="text-[#292524] mb-1" style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 16 }}>
              Personalize with AI
            </h4>
            <p className="text-[14px] text-[#57534e] mb-4" style={{ fontFamily: "var(--font-body)" }}>
              Upload a full-body photo so our AI can generate outfits tailored to your proportions and build.
            </p>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={onFileSelect}
            />

            {data.photo ? (
              /* ── Photo preview ── */
              <div className="relative rounded-xl overflow-hidden border border-[#E8DDD4] bg-white">
                <div className="flex items-center gap-4 p-4">
                  <img
                    src={data.photo}
                    alt="Your photo"
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[14px] text-[#292524] block truncate" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>
                      {data.photoName}
                    </span>
                    <span className="text-[12px] text-[#57534e] flex items-center gap-1 mt-1" style={{ fontFamily: "var(--font-body)" }}>
                      <Icon name="check_circle" size={14} className="text-green-600" filled />
                      Photo uploaded — AI will use this for outfit generation
                    </span>
                  </div>
                  <button
                    onClick={removePhoto}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#EFE8DF] transition-colors cursor-pointer"
                  >
                    <Icon name="close" size={18} className="text-[#57534e]" />
                  </button>
                </div>
              </div>
            ) : (
              /* ── Upload dropzone ── */
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDropHandler}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer bg-white/50 ${
                  dragOver ? "border-[#C4613A] bg-[#C4613A]/5" : "border-[#E8DDD4] hover:border-[#C4613A]/30"
                }`}
              >
                <Icon name="cloud_upload" size={32} className="text-[#57534e]/40 mx-auto" />
                <p className="mt-2 text-[14px] text-[#57534e]/60" style={{ fontFamily: "var(--font-body)" }}>
                  Drag & drop or click to upload
                </p>
                <p className="mt-1 text-[11px] text-[#57534e]/40" style={{ fontFamily: "var(--font-body)" }}>
                  Full-body photo recommended · PNG, JPG up to 5MB
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-12 flex items-center justify-between">
        <BtnSecondary size="sm" onClick={() => navigate("/onboarding/2")}>Back</BtnSecondary>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/onboarding/4")}
            className="text-[14px] text-[#57534e] hover:text-[#C4613A] transition-colors cursor-pointer underline underline-offset-4"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Skip for now
          </button>
          <BtnPrimary size="sm" onClick={() => navigate("/onboarding/4")}>
            <span className="flex items-center gap-2">
              Continue to Itinerary
              <Icon name="arrow_forward" size={16} className="text-white" />
            </span>
          </BtnPrimary>
        </div>
      </div>
    </OnboardingLayout>
  );
}