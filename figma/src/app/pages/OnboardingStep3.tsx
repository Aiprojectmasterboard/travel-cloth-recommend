import React, { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { OnboardingLayout } from "../components/travel-capsule/OnboardingLayout";
import { ProgressBar, BtnPrimary, BtnSecondary } from "../components/travel-capsule";
import { AestheticCard } from "../components/travel-capsule/AestheticCard";
import { Icon } from "../components/travel-capsule/Icon";
import { useOnboarding } from "../context/OnboardingContext";
import { useLang } from "../context/LanguageContext";
import { GA } from "../lib/analytics";
import { IMAGES } from "../constants/images";
import { SEO } from "../components/SEO";

const WORKER_URL =
  (import.meta.env as Record<string, string>).VITE_WORKER_URL ||
  "https://travel-capsule-worker.netson94.workers.dev";

const AESTHETICS = [
  { label: "Casual", img: IMAGES.casual },
  { label: "Minimalist", img: IMAGES.minimalist },
  { label: "Streetwear", img: IMAGES.streetwearCard },
  { label: "Classic", img: IMAGES.classic },
  { label: "Sporty", img: IMAGES.sporty },
  { label: "Bohemian", img: IMAGES.bohemian },
];

type UploadStatus = "idle" | "compressing" | "uploading" | "detecting" | "done" | "error";
type FaceWarning = null | "no_face" | "multiple_faces";

type UploadResult =
  | { success: true; face_url: string }
  | { success: false; errorMessage: string };

/**
 * Detect faces in an image using the browser's FaceDetector API.
 * Returns the number of faces found, or -1 if the API is not supported.
 * Only works in Chromium browsers (Chrome, Edge, Opera).
 */
async function detectFaces(imageSrc: string): Promise<number> {
  if (typeof (window as unknown as Record<string, unknown>).FaceDetector !== "function") {
    return -1; // API not supported — skip detection
  }
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Image load failed"));
      img.src = imageSrc;
    });
    const FD = (window as unknown as Record<string, new () => { detect(img: HTMLImageElement): Promise<unknown[]> }>).FaceDetector;
    const detector = new FD();
    const faces = await detector.detect(img);
    return faces.length;
  } catch {
    return -1; // Detection failed — skip
  }
}

const UPLOAD_ERROR_MESSAGES: Record<string, string> = {
  TOO_LARGE: "Your photo is too large. Please use an image under 5MB.",
  INVALID_TYPE: "Please upload a JPG, PNG, or WebP image.",
  UPLOAD_FAILED: "Upload failed. Please try again.",
};

async function uploadToR2(file: File): Promise<UploadResult> {
  const fd = new FormData();
  fd.append("photo", file, file.name);
  try {
    const res = await fetch(`${WORKER_URL}/api/upload-photo`, {
      method: "POST",
      body: fd,
    });
    if (!res.ok) {
      try {
        const body = (await res.json()) as { error?: string; code?: string };
        const msg =
          (body.code && UPLOAD_ERROR_MESSAGES[body.code]) ||
          body.error ||
          "Something went wrong. Please try again.";
        return { success: false, errorMessage: msg };
      } catch {
        return { success: false, errorMessage: "Something went wrong. Please try again." };
      }
    }
    const data = (await res.json()) as { face_url?: string };
    if (data.face_url) {
      return { success: true, face_url: data.face_url };
    }
    return { success: false, errorMessage: "Something went wrong. Please try again." };
  } catch {
    return { success: false, errorMessage: "Something went wrong. Please try again." };
  }
}

export function OnboardingStep3() {
  const navigate = useNavigate();
  const { data, setData } = useOnboarding();
  const { t } = useLang();
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [faceWarning, setFaceWarning] = useState<FaceWarning>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleAesthetic = (label: string) => {
    setData((prev) => ({
      ...prev,
      aesthetics: prev.aesthetics.includes(label)
        ? prev.aesthetics.filter((a) => a !== label)
        : [...prev.aesthetics, label],
    }));
  };

  /** Resize and compress image to fit under 5MB for upload. Iteratively reduces quality/size. */
  const resizeForAI = (file: File): Promise<File> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const TARGET = 5 * 1024 * 1024; // 5MB
        const QUALITY_STEPS = [0.85, 0.7, 0.5, 0.3];
        const MAX_SIZES = [1200, 800];

        const tryCompress = (maxDim: number, qualityIdx: number): void => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            const scale = maxDim / Math.max(width, height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
          const quality = QUALITY_STEPS[qualityIdx] ?? 0.3;
          canvas.toBlob(
            (blob) => {
              if (blob && blob.size <= TARGET) {
                resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
              } else if (qualityIdx + 1 < QUALITY_STEPS.length) {
                tryCompress(maxDim, qualityIdx + 1);
              } else if (maxDim === MAX_SIZES[0] && MAX_SIZES.length > 1) {
                tryCompress(MAX_SIZES[1], 0);
              } else if (blob) {
                // Best effort — return whatever we got
                resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            quality
          );
        };

        // If already small enough, just do a single pass at high quality
        if (file.size <= TARGET) {
          const MAX = 1200;
          let { width, height } = img;
          if (width > MAX || height > MAX) {
            const scale = MAX / Math.max(width, height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob && blob.size < file.size) {
                resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            0.85
          );
        } else {
          tryCompress(MAX_SIZES[0], 0);
        }
      };
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });

  const handleFile = async (file: File) => {
    setUploadError("");
    if (!file.type.startsWith("image/")) {
      setUploadError(t("onboarding3.invalidFileType"));
      return;
    }

    // Auto-compress if needed (iterative quality/size reduction)
    const needsCompression = file.size > 5 * 1024 * 1024;
    if (needsCompression) setUploadStatus("compressing");
    const resized = await resizeForAI(file);

    // Show preview immediately via FileReader
    const reader = new FileReader();
    reader.onload = () => {
      setData((prev) => ({
        ...prev,
        photo: reader.result as string,
        photoName: file.name,
        faceUrl: "",
      }));
    };
    reader.readAsDataURL(resized);

    // Upload resized version to R2
    setUploadStatus("uploading");
    const result = await uploadToR2(resized);
    if (result.success) {
      setData((prev) => ({ ...prev, faceUrl: result.face_url }));
      setUploadStatus("detecting");
      // Run face detection on the local preview
      const previewSrc = URL.createObjectURL(resized);
      const faceCount = await detectFaces(previewSrc);
      URL.revokeObjectURL(previewSrc);
      if (faceCount === 0) {
        setFaceWarning("no_face");
      } else if (faceCount > 1) {
        setFaceWarning("multiple_faces");
      } else {
        setFaceWarning(null);
      }
      setUploadStatus("done");
    } else {
      setUploadStatus("error");
      setUploadError(result.errorMessage);
      setData((prev) => ({ ...prev, photo: "", photoName: "", faceUrl: "" }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const removePhoto = () => {
    setData((prev) => ({ ...prev, photo: "", photoName: "", faceUrl: "" }));
    setUploadStatus("idle");
    setUploadError("");
    setFaceWarning(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleReupload = () => {
    setFaceWarning(null);
    removePhoto();
    // Trigger file picker after state reset
    setTimeout(() => fileInputRef.current?.click(), 100);
  };

  const handleUseDefault = () => {
    // Keep photo preview but clear faceUrl so Gemini generates without face reference
    setData((prev) => ({ ...prev, faceUrl: "" }));
    setFaceWarning(null);
  };

  return (
    <>
    <SEO title="Upload Your Photo" description="Upload a reference photo for personalized body-matched outfit recommendations." noindex={true} />
    <OnboardingLayout
      imageUrl={IMAGES.leatherSuitcase}
      quote="The joy of dressing is an art."
      attribution="John Galliano"
    >
      <ProgressBar currentStep={3} sublabel={t("onboarding3.sublabel")} />

      <div className="mt-10">
        <h1
          className="text-[#292524]"
          style={{
            fontSize: "clamp(36px, 4vw, 56px)",
            fontFamily: "var(--font-display)",
            lineHeight: 1.1,
          }}
        >
          {t("onboarding3.title")} <em>{t("onboarding3.titleEm")}</em>
        </h1>
        <p
          className="mt-4 text-[16px] text-[#57534e]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {t("onboarding3.subtitle")}
        </p>
      </div>

      {/* Aesthetic Selection */}
      <div className="mt-10">
        <h4
          className="text-[#292524] mb-1"
          style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 16 }}
        >
          {t("onboarding3.selectAesthetic")}
        </h4>
        <p
          className="text-[14px] text-[#57534e] mb-5"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {t("onboarding3.selectAestheticHint")}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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

      {/* Photo Upload — Personalize with AI */}
      <div className="mt-10">
        <h4
          className="text-[#292524] mb-1"
          style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 16 }}
        >
          {t("onboarding3.personalizeWithAI")}
        </h4>
        <p
          className="text-[14px] text-[#57534e] mb-3"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {t("onboarding3.personalizeHint")}
        </p>

        <div className="mb-5 rounded-lg bg-[#F5EFE6] px-4 py-3 flex flex-col gap-1.5">
          <p
            className="text-[13px] text-[#78716c] flex items-center gap-2"
            style={{ fontFamily: "var(--font-body)" }}
          >
            <Icon name="photo_camera" size={16} className="text-[#78716c] flex-shrink-0" />
            {t("onboarding3.photoTip1")}
          </p>
          <p
            className="text-[13px] text-[#78716c] flex items-center gap-2"
            style={{ fontFamily: "var(--font-body)" }}
          >
            <Icon name="lightbulb" size={16} className="text-[#78716c] flex-shrink-0" />
            {t("onboarding3.photoTip2")}
          </p>
        </div>

        {data.photo ? (
          /* Preview state */
          <div className="rounded-xl border border-[#E8DDD4] overflow-hidden bg-white">
            <div className="relative" style={{ aspectRatio: "3/2" }}>
              <img
                src={data.photo}
                alt="Your reference photo"
                className="w-full h-full object-cover"
              />
              <button
                onClick={removePhoto}
                aria-label="Remove photo"
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors cursor-pointer"
              >
                <Icon name="close" size={16} className="text-white" />
              </button>
            </div>
            <div className="px-4 py-3 flex items-center gap-2">
              {uploadStatus === "compressing" && (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping flex-shrink-0" />
                  <span
                    className="text-[13px] text-amber-600"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {t("onboarding3.compressing")}
                  </span>
                </>
              )}
              {uploadStatus === "uploading" && (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#C4613A] animate-ping flex-shrink-0" />
                  <span
                    className="text-[13px] text-[#57534e]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {t("onboarding3.uploading")}
                  </span>
                </>
              )}
              {uploadStatus === "done" && (
                <>
                  <Icon name="check_circle" size={16} className="text-green-600" filled />
                  <span
                    className="text-[13px] text-green-700"
                    style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
                  >
                    {t("onboarding3.uploadDone")}
                  </span>
                </>
              )}
              {uploadStatus === "detecting" && (
                <>
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping flex-shrink-0" />
                  <span
                    className="text-[13px] text-[#57534e]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {t("onboarding3.detecting")}
                  </span>
                </>
              )}
              {uploadStatus === "error" && (
                <>
                  <Icon name="error_outline" size={16} className="text-red-500" />
                  <span
                    className="text-[13px] text-red-600"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {uploadError || t("onboarding3.uploadFailed")}
                  </span>
                </>
              )}
            </div>

            {/* Face detection warning */}
            {faceWarning && (
              <div className="px-4 py-3 border-t border-[#E8DDD4] bg-amber-50">
                <div className="flex items-start gap-2 mb-3">
                  <Icon name="warning" size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p
                    className="text-[13px] text-amber-800"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {faceWarning === "no_face"
                      ? t("onboarding3.noFaceWarning")
                      : t("onboarding3.multipleFacesWarning")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReupload}
                    className="px-4 py-3 rounded-lg text-[13px] font-medium bg-[#C4613A] text-white hover:bg-[#a8502f] transition-colors cursor-pointer"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {t("onboarding3.reupload")}
                  </button>
                  <button
                    onClick={handleUseDefault}
                    className="px-4 py-3 rounded-lg text-[13px] font-medium border border-[#E8DDD4] text-[#57534e] hover:bg-[#F5EFE6] transition-colors cursor-pointer"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {t("onboarding3.continueDefault")}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Dropzone state */
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload reference photo"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`rounded-xl border-2 border-dashed p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
              dragOver
                ? "border-[#C4613A] bg-[#C4613A]/5"
                : "border-[#E8DDD4] hover:border-[#C4613A]/60 hover:bg-[#FDF8F3]"
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-[#C4613A]/10 flex items-center justify-center">
              <Icon name="upload_file" size={24} className="text-[#C4613A]" />
            </div>
            <div className="text-center">
              <p
                className="text-[14px] text-[#292524]"
                style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
              >
                {t("onboarding3.dropPhoto")}{" "}
                <label
                  htmlFor="photo-upload-input"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[#C4613A] underline underline-offset-2 font-medium cursor-pointer"
                  style={{ fontFamily: "var(--font-body)", fontSize: "14px" }}
                >
                  {t("onboarding3.browse")}
                </label>
              </p>
              <p
                className="mt-1 text-[12px] text-[#57534e]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {t("onboarding3.fileFormats")}
              </p>
            </div>
            {uploadError && (
              <p
                className="text-[13px] text-red-600 text-center"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {uploadError}
              </p>
            )}
          </div>
        )}

        <input
          id="photo-upload-input"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleInputChange}
        />

        {/* Default model image notice */}
        {!data.photo && (
          <div className="mt-4 rounded-xl border border-[#E8DDD4] bg-white p-4">
            <div className="flex items-start gap-2 mb-3">
              <Icon name="info" size={16} className="text-[#C4613A] flex-shrink-0 mt-0.5" />
              <p
                className="text-[13px] text-[#57534e]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {t("onboarding.photoDefaultNotice")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-20 rounded-lg overflow-hidden border border-[#E8DDD4] flex-shrink-0">
                <img
                  src="/defaults/default-male.png"
                  alt="Default male model"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0 inset-x-0 bg-black/40 text-white text-[9px] text-center py-0.5" style={{ fontFamily: "var(--font-mono)" }}>Male</span>
              </div>
              <div className="relative w-16 h-20 rounded-lg overflow-hidden border border-[#E8DDD4] flex-shrink-0">
                <img
                  src="/defaults/default-female.png"
                  alt="Default female model"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0 inset-x-0 bg-black/40 text-white text-[9px] text-center py-0.5" style={{ fontFamily: "var(--font-mono)" }}>Female</span>
              </div>
              <p className="text-[12px] text-[#78716c]" style={{ fontFamily: "var(--font-body)" }}>
                {t("onboarding.photoDefaultModelDesc")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-12 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BtnSecondary size="sm" onClick={() => navigate("/onboarding/2")}>
            {t("onboarding3.back")}
          </BtnSecondary>
          <button
            onClick={() => navigate("/onboarding/4")}
            className="text-[13px] text-[#57534e] hover:text-[#C4613A] transition-colors cursor-pointer underline underline-offset-4"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {t("onboarding3.skip")}
          </button>
        </div>
        <BtnPrimary
          size="sm"
          onClick={() => { GA.onboardingStep(3); navigate("/onboarding/4"); }}
          disabled={uploadStatus === "uploading" || uploadStatus === "compressing" || uploadStatus === "detecting"}
        >
          <span className="flex items-center justify-center gap-2">
            {t("onboarding3.continue")}
            <Icon name="arrow_forward" size={16} className="text-white" />
          </span>
        </BtnPrimary>
      </div>
    </OnboardingLayout>
    </>
  );
}
