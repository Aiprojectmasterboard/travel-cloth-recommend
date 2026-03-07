import React, { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Icon, BtnSecondary, BtnDark, CheckItem, LanguageSelector } from "../components/travel-capsule";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useOnboarding } from "../context/OnboardingContext";
import { useTrip } from "../context/TripContext";
import { useLang } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { createCheckoutSession, type PlanKey } from "../services/polarCheckout";
import { pollTeaser, triggerTeaserGeneration } from "../lib/api";
import { GA } from "../lib/analytics";
import { SEO } from "../components/SEO";

// ─── Image Lightbox with Branding + Share ─────────────────────────────────────

function ImageLightbox({
  src,
  moodLabel,
  onClose,
}: {
  src: string;
  moodLabel: string;
  onClose: () => void;
}) {
  const { t, displayFont, bodyFont } = useLang();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}?utm_source=share&utm_medium=image` : "";
  const shareText = t("lightbox.shareText") + ` ${shareUrl}`;

  /** Draw branded image on canvas and return blob */
  const renderBrandedImage = useCallback(async (): Promise<Blob | null> => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Image load failed"));
    });

    const canvas = canvasRef.current;
    if (!canvas) return null;

    const w = img.naturalWidth || 1080;
    const h = img.naturalHeight || 1440;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Draw original image
    ctx.drawImage(img, 0, 0, w, h);

    // Bottom gradient overlay for branding
    const grad = ctx.createLinearGradient(0, h * 0.82, 0, h);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(0.4, "rgba(0,0,0,0.4)");
    grad.addColorStop(1, "rgba(0,0,0,0.7)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, h * 0.82, w, h * 0.18);

    // Brand text
    const fontSize = Math.max(16, Math.round(w * 0.028));
    ctx.font = `600 ${fontSize}px "DM Sans", "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.textBaseline = "bottom";

    // Luggage icon substitute: ✈ + brand name
    const brandText = "Travel Capsule AI";
    ctx.fillText(`✈  ${brandText}`, w * 0.04, h * 0.96);

    // Mood label (smaller)
    const moodSize = Math.max(12, Math.round(w * 0.02));
    ctx.font = `italic 300 ${moodSize}px "Playfair Display", serif`;
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText(moodLabel, w * 0.04, h * 0.96 - fontSize * 1.4);

    // travelscapsule.com URL (right side)
    const urlSize = Math.max(11, Math.round(w * 0.018));
    ctx.font = `500 ${urlSize}px "JetBrains Mono", monospace`;
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.textAlign = "right";
    ctx.fillText("travelscapsule.com", w * 0.96, h * 0.96);
    ctx.textAlign = "left";

    return new Promise((resolve) => canvas.toBlob(resolve, "image/png", 1));
  }, [src, moodLabel]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const blob = await renderBrandedImage();
      if (!blob) throw new Error("Failed to render");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `travel-capsule-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleNativeShare = async () => {
    try {
      const blob = await renderBrandedImage();
      if (blob && navigator.share && navigator.canShare) {
        const file = new File([blob], "travel-capsule-outfit.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text: t("lightbox.shareText"), url: shareUrl });
          return;
        }
      }
      // Fallback: share without image
      if (navigator.share) {
        await navigator.share({ text: t("lightbox.shareText"), url: shareUrl });
      }
    } catch {
      // User cancelled or not supported — ignore
    }
  };

  const socialLinks = [
    { name: "X", icon: "X", url: `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}` },
    { name: "Facebook", icon: "FB", url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(t("lightbox.shareText"))}` },
    { name: "Reddit", icon: "Re", url: `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(t("lightbox.shareText"))}` },
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      {/* Hidden canvas for rendering branded image */}
      <canvas ref={canvasRef} className="hidden" />

      <div
        className="relative w-full max-w-[520px] mx-4 flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer z-10"
          aria-label={t("lightbox.close")}
        >
          <Icon name="close" size={22} className="text-white" />
        </button>

        {/* Image with branding overlay */}
        <div className="relative w-full rounded-2xl overflow-hidden" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
          <img src={src} alt="AI outfit" className="w-full h-auto block" />
          {/* Brand watermark overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)" }}>
            <p className="text-white/70 text-[12px] sm:text-[14px] italic mb-1" style={{ fontFamily: displayFont }}>{moodLabel}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="luggage" size={16} className="text-white/90" />
                <span className="text-white/90 text-[13px] sm:text-[15px]" style={{ fontFamily: bodyFont, fontWeight: 600 }}>Travel Capsule AI</span>
              </div>
              <span className="text-white/40 text-[10px]" style={{ fontFamily: "var(--font-mono)" }}>travelscapsule.com</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-5 w-full flex flex-col gap-3">
          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-[48px] w-full bg-white text-[#1A1410] rounded-xl flex items-center justify-center gap-2 hover:bg-white/90 transition-colors cursor-pointer disabled:opacity-60"
            style={{ fontFamily: bodyFont, fontWeight: 600 }}
          >
            <Icon name={saved ? "check_circle" : "download"} size={20} className={saved ? "text-green-600" : "text-[#1A1410]"} filled={saved} />
            <span className="text-[14px]">{saving ? "..." : saved ? t("lightbox.saved") : t("lightbox.saveImage")}</span>
          </button>

          {/* Social share row */}
          <div className="flex items-center gap-2">
            {/* Native share (mobile) */}
            {"share" in navigator && (
              <button
                onClick={handleNativeShare}
                className="flex-1 h-[44px] bg-[#C4613A] text-white rounded-xl flex items-center justify-center gap-2 hover:bg-[#A84A25] transition-colors cursor-pointer"
                style={{ fontFamily: bodyFont, fontWeight: 600 }}
              >
                <Icon name="share" size={18} className="text-white" />
                <span className="text-[13px]">{t("lightbox.shareOn")}</span>
              </button>
            )}

            {/* Social platform buttons */}
            {socialLinks.map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="h-[44px] w-[44px] flex-shrink-0 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors"
                title={`${t("lightbox.shareOn")} ${s.name}`}
              >
                <span className="text-white text-[13px]" style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{s.icon}</span>
              </a>
            ))}

            {/* Copy link */}
            <button
              onClick={handleCopyLink}
              className="h-[44px] w-[44px] flex-shrink-0 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
              title={t("lightbox.copyLink")}
            >
              <Icon name={linkCopied ? "check" : "link"} size={18} className={linkCopied ? "text-green-400" : "text-white"} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Fallback: generic travel image (source.unsplash.com is deprecated) */
function getCityFallbackImg(_cityName: string): string {
  return GENERIC_FALLBACK;
}
const GENERIC_FALLBACK = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080";

/** Format a date string as "Mon DD" using locale-aware short month */
function fmtShort(dateStr: string, locale: string): string {
  if (!dateStr) return "\u2014";
  const d = new Date(dateStr);
  return d.toLocaleDateString(locale, { month: "short", day: "numeric" });
}

async function downloadImage(url: string, filename: string) {
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch {
    window.open(url, "_blank");
  }
}

export function PreviewPage() {
  const navigate = useNavigate();
  const { data } = useOnboarding();
  const { preview, tripId, loading: tripLoading, error: tripError } = useTrip();
  const { t, displayFont, bodyFont, lang } = useLang();
  const { isLoggedIn, user, setShowLoginModal, setLoginModalContext } = useAuth();

  const city = data.cities[0]?.city || "Paris";
  const country = data.cities[0]?.country || "";
  const aestheticLabel = data.aesthetics.length > 0 ? data.aesthetics.join(", ") : "Classic, Minimalist";

  // Real data from AI preview — fall back to city-specific or onboarding image
  const cityFallback = data.cities[0]?.imageUrl || getCityFallbackImg(city);
  const initialTeaserUrl = preview?.teaser_url || cityFallback;
  const moodLabel = preview?.mood_label || `${city} \u2014 Style Analysis`;

  // Poll for AI-generated teaser image + trigger generation via dedicated endpoint
  const [polledTeaserUrl, setPolledTeaserUrl] = useState<string | null>(null);
  const [teaserReady, setTeaserReady] = useState(false);
  const [teaserProgress, setTeaserProgress] = useState(0); // 0-100 for progress UX
  const triggerSentRef = useRef(false);

  useEffect(() => {
    if (!tripId || teaserReady) return;

    // Check if the initial teaser_url is already an AI-generated R2 image (not a fallback)
    if (initialTeaserUrl && initialTeaserUrl.includes('/temp/')) {
      setTeaserReady(true);
      return;
    }

    // Fire-and-forget: trigger teaser generation via dedicated endpoint
    // This is more reliable than waitUntil() which may have platform time limits
    if (!triggerSentRef.current) {
      triggerSentRef.current = true;
      triggerTeaserGeneration(tripId);
    }

    let cancelled = false;
    let attempts = 0;
    const MAX_POLLS = 25; // ~75s total (3s intervals) — enough for Gemini ~40s + overhead

    const poll = async () => {
      // Wait 5s before first poll to give Gemini time to start
      await new Promise((r) => setTimeout(r, 5000));

      while (!cancelled && attempts < MAX_POLLS) {
        attempts++;
        // Progressive UX: smoothly increase progress bar during generation
        if (!cancelled) setTeaserProgress(Math.min(90, Math.round((attempts / MAX_POLLS) * 100)));
        try {
          const result = await pollTeaser(tripId);
          if (cancelled) return;
          if (result.status === 'ready' && result.teaser_url) {
            setTeaserProgress(100);
            setPolledTeaserUrl(result.teaser_url);
            setTeaserReady(true);
            // Persist teaser_url to sessionStorage so it survives checkout redirect
            try {
              const raw = sessionStorage.getItem("tc_preview_data");
              if (raw) {
                const saved = JSON.parse(raw);
                saved.teaser_url = result.teaser_url;
                sessionStorage.setItem("tc_preview_data", JSON.stringify(saved));
              }
            } catch { /* ignore */ }
            return;
          }
          if (result.status === 'fallback') {
            // Fallback means Gemini failed — use server-provided city-specific fallback
            setTeaserProgress(100);
            if (result.teaser_url) {
              setPolledTeaserUrl(result.teaser_url);
            }
            setTeaserReady(true);
            return;
          }
        } catch {
          // Ignore polling errors — keep trying
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
      // After max polls, stop trying
      setTeaserReady(true);
    };

    poll();
    return () => { cancelled = true; };
  }, [tripId, teaserReady, initialTeaserUrl]);

  const teaserUrl = polledTeaserUrl || initialTeaserUrl;

  // All 4 slots use the same teaser image — slot 0 clear, slots 1-3 CSS-blurred
  // Per spec: "[1][2][3] 동일 이미지 + CSS blur(8px) + tint overlay + lock icon"
  const vibes = preview?.vibes || [];
  const weatherData = preview?.weather || [];
  const capsuleCount = preview?.capsule?.count || 9;
  const capsulePrinciples = preview?.capsule?.principles || [];

  // Weather display from real data
  const primaryWeather = weatherData[0];
  const weatherDisplay = primaryWeather
    ? `${Math.round(primaryWeather.temperature_day_avg)}\u00B0C, ${Math.round(primaryWeather.precipitation_prob * 100)}% rain`
    : t("preview.processing");

  // Vibe color palette
  const vibeColors = vibes[0]?.color_palette || ["#8B7355", "#C4A882", "#4A5568", "#D4C5B2"];
  const vibeTags = vibes[0]?.vibe_tags || [];

  const [checkoutLoading, setCheckoutLoading] = useState<PlanKey | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [showCityLimitModal, setShowCityLimitModal] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const cityCount = data.cities.length;

  // Duration display: "Aug 15 - Aug 20 (5 nights)"
  const fromDate = data.cities[0]?.fromDate || "";
  const toDate = data.cities[0]?.toDate || "";
  const nightCount = fromDate && toDate
    ? Math.max(1, Math.round((new Date(toDate).getTime() - new Date(fromDate).getTime()) / 86400000))
    : 7;
  const durationValue = fromDate && toDate
    ? `${fmtShort(fromDate, lang)} - ${fmtShort(toDate, lang)} (${nightCount} ${t("general.nights")})`
    : `${nightCount} ${t("general.nights")}`;

  const doCheckout = async (plan: PlanKey) => {
    GA.checkoutStart(plan);
    setCheckoutLoading(plan);
    setCheckoutError(null);
    try {
      const session = await createCheckoutSession({
        plan,
        customerEmail: user?.email,
        tripId: tripId || undefined,
        successUrl: `${window.location.origin}/checkout/success?plan=${plan}`,
      });

      if (!session.url) {
        throw new Error("No checkout URL received. Please try again.");
      }

      // Save checkout context before redirecting to Polar
      sessionStorage.setItem("tc_pending_checkout", JSON.stringify({
        plan, tripId, checkoutId: session.id, ts: Date.now(),
      }));
      sessionStorage.setItem("tc_pending_plan", plan);

      // Redirect directly to Polar checkout (same tab).
      // After payment, Polar redirects back to /checkout/success with params.
      // sessionStorage persists across same-tab navigations.
      window.location.href = session.url;
    } catch (err) {
      setCheckoutLoading(null);
      setCheckoutError(err instanceof Error ? err.message : "Checkout failed. Please try again.");
    }
  };

  const handleCheckout = (plan: PlanKey) => {
    if (plan === "standard") {
      if (cityCount > 1) {
        setShowCityLimitModal(true);
        return;
      }
      if (isLoggedIn) {
        navigate("/dashboard/standard");
        return;
      }
      setLoginModalContext("onboarding_gate");
      setShowLoginModal(true);
      return;
    }
    doCheckout(plan);
  };

  // If no preview data and not loading, redirect to onboarding
  if (!preview && !tripLoading && !tripError) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center px-6">
        <div className="text-center max-w-[400px]">
          <Icon name="auto_awesome" size={40} className="text-[#C4613A] mx-auto mb-4" />
          <h2 className="text-[24px] text-[#292524]" style={{ fontFamily: displayFont }}>
            {t("preview.noPreview")}
          </h2>
          <p className="mt-3 text-[15px] text-[#57534e]" style={{ fontFamily: bodyFont }}>
            {t("preview.noPreviewBody")}
          </p>
          <button
            onClick={() => navigate("/onboarding/1")}
            className="mt-6 h-[48px] px-8 bg-[#C4613A] text-white text-[13px] uppercase tracking-[0.08em] rounded-none hover:bg-[#A84A25] transition-colors cursor-pointer"
            style={{ fontFamily: bodyFont, fontWeight: 600 }}
          >
            {t("preview.startTrip")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      <SEO title="Your AI Style Preview" description="Preview your AI-generated travel outfit and city vibe analysis. Unlock the full capsule wardrobe to pack less and look better." noindex={true} />
      {/* Image Lightbox */}
      {lightboxOpen && teaserUrl && (
        <ImageLightbox
          src={teaserUrl}
          moodLabel={moodLabel}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* City limit modal — Standard plan only supports 1 city */}
      {showCityLimitModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ backgroundColor: "rgba(26,20,16,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowCityLimitModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-[420px] w-full"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center flex-shrink-0">
                <Icon name="warning" size={22} className="text-[#D97706]" />
              </div>
              <h3 className="text-[20px] text-[#292524]" style={{ fontFamily: displayFont }}>
                Standard plan supports 1 city only
              </h3>
            </div>
            <p className="text-[15px] text-[#57534e] leading-relaxed mb-6" style={{ fontFamily: bodyFont }}>
              You've selected {cityCount} cities. To get AI outfits for all your cities, upgrade to Pro.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setShowCityLimitModal(false); doCheckout("pro"); }}
                className="h-[52px] w-full bg-[#C4613A] text-white text-[13px] uppercase tracking-[0.08em] rounded-none hover:bg-[#A84A25] transition-colors cursor-pointer"
                style={{ fontFamily: bodyFont, fontWeight: 600 }}
              >
                Select Pro Plan ($3.99)
              </button>
              <button
                onClick={() => { setShowCityLimitModal(false); doCheckout("standard"); }}
                className="h-[52px] w-full border border-[#E8DDD4] text-[#57534e] text-[13px] uppercase tracking-[0.08em] rounded-none hover:bg-[#FDF8F3] transition-colors cursor-pointer"
                style={{ fontFamily: bodyFont, fontWeight: 600 }}
              >
                Continue with 1 city (Free)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#E8DDD4]/50" style={{ backgroundColor: "rgba(253,248,243,0.8)", backdropFilter: "blur(16px)" }}>
        <div className="mx-auto flex items-center justify-between px-6 py-4" style={{ maxWidth: "var(--max-w)" }}>
          <div className="flex items-center gap-1.5 cursor-pointer flex-shrink-0" onClick={() => navigate("/")}>
            <Icon name="luggage" size={22} className="text-[#C4613A]" />
            <span className="text-[15px] sm:text-[20px] tracking-tight text-[#1A1410] whitespace-nowrap" style={{ fontFamily: displayFont, fontWeight: 700 }}>
              Travel Capsule AI
            </span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector variant="dark" />
            {isLoggedIn ? (
              <div className="w-8 h-8 rounded-full bg-[#C4613A] flex items-center justify-center">
                <span className="text-white text-[12px]" style={{ fontFamily: bodyFont, fontWeight: 600 }}>{user?.initials}</span>
              </div>
            ) : (
              <button onClick={() => setShowLoginModal(true)} className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-[#EFE8DF] transition-colors cursor-pointer">
                <Icon name="person" size={22} className="text-[#57534e]" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto px-6 py-12" style={{ maxWidth: 1200 }}>
        <span className="text-[10px] uppercase tracking-[0.15em] text-[#C4613A]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
          {t("preview.step")}
        </span>

        <h1 className="mt-4 text-[#292524] italic whitespace-pre-line break-words" style={{ fontSize: "clamp(40px, 5vw, 72px)", fontFamily: displayFont, lineHeight: 1.05 }}>
          {moodLabel}
        </h1>
        <p className="mt-4 text-[18px] text-[#57534e] max-w-[600px]" style={{ fontFamily: bodyFont, fontWeight: 300 }}>
          {t("preview.body")}
        </p>

        {/* Preview Card — Real AI Teaser */}
        <div className="mt-10 relative rounded-2xl overflow-hidden aspect-[16/9] sm:aspect-[21/9]">
          {!teaserReady ? (
            /* Loading state: blurred gradient + shimmer animation */
            <>
              <div
                className="w-full h-full animate-pulse"
                style={{
                  background: `linear-gradient(135deg, ${vibeColors[0] || '#8B7355'}40, ${vibeColors[1] || '#C4A882'}30, ${vibeColors[2] || '#4A5568'}40)`,
                  filter: 'blur(0px)',
                }}
              />
              {/* Shimmer sweep */}
              <div className="absolute inset-0 overflow-hidden">
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                    animation: 'shimmer 2s infinite',
                  }}
                />
              </div>
              <style>{`@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`}</style>
              {/* Centered loading indicator */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full border-3 border-white/20 border-t-[#C4613A] animate-spin" style={{ borderWidth: 3 }} />
                <span className="text-[12px] text-white/80 uppercase tracking-[0.15em]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                  {teaserProgress < 20 ? "Analyzing your style profile..." :
                   teaserProgress < 50 ? "AI generating your look..." :
                   teaserProgress < 80 ? "Styling your outfit..." :
                   "Almost ready..."}
                </span>
                <span className="text-[10px] text-white/50" style={{ fontFamily: "var(--font-mono)" }}>
                  {teaserProgress}%
                </span>
              </div>
            </>
          ) : (
            /* Ready state: show the actual image */
            <ImageWithFallback src={teaserUrl} alt="Trip preview" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/20" />
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-[360px] p-4 sm:p-6 rounded-2xl" style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(20px)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#C4613A] flex items-center justify-center">
                <Icon name="auto_awesome" size={20} className="text-white" filled />
              </div>
              <span className="text-[20px] text-white italic" style={{ fontFamily: displayFont }}>
                {preview ? t("preview.analysisComplete") : t("preview.generating")}
              </span>
            </div>
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className={`h-full bg-[#C4613A] rounded-full transition-all duration-1000 ${preview ? "w-full" : "w-[40%]"}`} />
            </div>
            <span className="mt-2 block text-[10px] uppercase tracking-[0.12em] text-white/70" style={{ fontFamily: "var(--font-mono)" }}>
              {preview ? t("preview.analysisPercent") : t("preview.processing")}
            </span>
          </div>
        </div>

        {/* AI-Generated Vibe Tags & Color Palette */}
        {vibes.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {vibeTags.map((tag) => (
              <span key={tag} className="px-3 py-1.5 bg-white border border-[#E8DDD4] rounded-full text-[12px] text-[#57534e]" style={{ fontFamily: bodyFont }}>
                {tag}
              </span>
            ))}
            <div className="flex items-center gap-1.5 ml-2">
              {vibeColors.map((color) => (
                <div key={color} className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>
        )}

        {/* AI Outfit Preview — Teaser Grid (1 real + 3 blurred) */}
        <div className="mt-12">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-[#292524]" style={{ fontSize: "clamp(24px, 3vw, 36px)", fontFamily: displayFont }}>
              {t("preview.outfitPreview")}
            </h2>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1410] rounded-full">
              <span className="material-symbols-outlined text-white" style={{ fontSize: 14 }}>lock</span>
              <span className="text-[10px] uppercase tracking-[0.12em] text-white" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                {t("preview.previewLocked")}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((idx) => {
              const isUnlocked = idx === 0 && teaserReady && !!(polledTeaserUrl || preview?.teaser_url);
              const imgSrc = teaserUrl;
              const isSlot0Loading = idx === 0 && !teaserReady;
              // Each locked slot gets a unique CSS treatment so they look like different images
              const lockedStyles: React.CSSProperties[] = [
                {},
                { filter: "blur(14px) brightness(0.55) hue-rotate(40deg) saturate(1.4) contrast(1.1)", transform: "scale(1.4) scaleX(-1) translateY(-8%)", objectPosition: "20% 0%" },
                { filter: "blur(16px) brightness(0.5) sepia(0.4) saturate(1.6) hue-rotate(-15deg)", transform: "scale(1.5) rotate(5deg) translateX(10%)", objectPosition: "80% 100%" },
                { filter: "blur(13px) brightness(0.45) hue-rotate(-50deg) contrast(1.2) saturate(1.3)", transform: "scale(1.45) scaleX(-1) rotate(-4deg) translateY(10%)", objectPosition: "50% 30%" },
              ];
              return (
                <div
                  key={idx}
                  className="group"
                  onClick={isUnlocked ? () => setLightboxOpen(true) : undefined}
                  style={isUnlocked ? { cursor: "pointer" } : undefined}
                >
                  <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "3/4" }}>
                    {isSlot0Loading ? (
                      /* Slot 0 loading: gradient shimmer instead of fallback image */
                      <div className="w-full h-full animate-pulse" style={{
                        background: `linear-gradient(135deg, ${vibeColors[0] || '#8B7355'}50, ${vibeColors[1] || '#C4A882'}40, ${vibeColors[2] || '#4A5568'}50)`,
                      }} />
                    ) : (
                      <ImageWithFallback
                        src={imgSrc}
                        alt={`Outfit ${idx + 1}`}
                        className={`w-full h-full object-cover transition-transform duration-500 ${isUnlocked ? "group-hover:scale-105" : ""}`}
                        style={isUnlocked ? { transform: "scale(1)" } : lockedStyles[idx]}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    {!isUnlocked && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                          <span className="material-symbols-outlined text-white" style={{ fontSize: 22 }}>lock</span>
                        </div>
                        <span className="text-white/80 text-[10px] uppercase tracking-[0.12em]" style={{ fontFamily: "var(--font-mono)" }}>
                          {t("preview.unlock")}
                        </span>
                      </div>
                    )}
                    {isUnlocked && (
                      <>
                        <div className="absolute top-2 left-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C4613A]/90 text-white text-[9px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)" }}>
                            <Icon name="auto_awesome" size={10} className="text-white" filled /> {t("examples.aiGenerated")}
                          </span>
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1.5">
                          {/* Download button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); downloadImage(imgSrc, `travel-capsule-look-${idx + 1}.png`); }}
                            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer"
                            title={t("dashboard.downloadImage")}
                          >
                            <Icon name="download" size={16} className="text-white" />
                          </button>
                          {/* Expand button */}
                          <button
                            onClick={() => setLightboxOpen(true)}
                            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Icon name="open_in_full" size={16} className="text-white" />
                          </button>
                        </div>
                      </>
                    )}
                    <div className="absolute bottom-3 left-3 right-3">
                      <span className="text-white/70 text-[10px] uppercase tracking-[0.1em] block" style={{ fontFamily: "var(--font-mono)" }}>
                        {t("preview.dayLook").replace("{n}", String(idx + 1))}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex items-center justify-between px-1">
            <span className="text-[14px] text-[#57534e]" style={{ fontFamily: bodyFont }}>
              4 {t("preview.looksWaiting")}
            </span>
            <button
              onClick={() => document.getElementById("pricing-section")?.scrollIntoView({ behavior: "smooth" })}
              className="flex items-center gap-1.5 text-[12px] uppercase tracking-[0.08em] text-[#C4613A] hover:text-[#A84A25] transition-colors cursor-pointer"
              style={{ fontFamily: bodyFont, fontWeight: 600 }}
            >
              {t("preview.unlockAll")}
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_downward</span>
            </button>
          </div>
        </div>

        {/* Trip Summary — Real AI data */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[#292524]" style={{ fontSize: "clamp(28px, 3vw, 40px)", fontFamily: displayFont }}>
              {t("preview.tripSummary")}
            </h2>
            <button onClick={() => navigate("/onboarding/1")} className="text-[12px] uppercase tracking-[0.08em] text-[#C4613A] hover:text-[#A84A25] transition-colors cursor-pointer" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
              {t("preview.editDetails")}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
              { labelKey: "preview.destination", value: country ? `${city}, ${country}` : city },
              { labelKey: "preview.duration", value: durationValue },
              { labelKey: "preview.aesthetic", value: aestheticLabel },
              { labelKey: "preview.weather", value: weatherDisplay },
            ].map((item) => (
              <div key={item.labelKey}>
                <span className="text-[10px] uppercase tracking-[0.12em] text-[#C4613A] block mb-1" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
                  {t(item.labelKey)}
                </span>
                <span className="text-[15px] sm:text-[20px] text-[#292524] truncate block" style={{ fontFamily: bodyFont, fontWeight: 500 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Capsule Estimate (from AI) */}
        {capsulePrinciples.length > 0 && (
          <div className="mt-12 bg-white rounded-2xl border border-[#E8DDD4] p-8" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
            <div className="flex items-center gap-3 mb-6">
              <Icon name="checkroom" size={24} className="text-[#C4613A]" />
              <h3 className="text-[22px] text-[#292524]" style={{ fontFamily: displayFont }}>
                {t("preview.capsuleEstimate")}: {capsuleCount} {t("preview.capsulePieces")}
              </h3>
            </div>
            <div className="space-y-3">
              {capsulePrinciples.map((p, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#C4613A]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[11px] text-[#C4613A]" style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{i + 1}</span>
                  </span>
                  <p className="text-[15px] text-[#57534e] leading-relaxed" style={{ fontFamily: bodyFont }}>{p}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-[#EFE8DF]">
              <p className="text-[13px] text-[#57534e]/70 italic" style={{ fontFamily: displayFont }}>
                {t("preview.capsuleNote")}
              </p>
            </div>
          </div>
        )}

        {/* Avoid Note from Vibe */}
        {vibes[0]?.avoid_note && (
          <div className="mt-6 p-4 bg-[#FEF3C7] border border-[#FCD34D]/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="info" size={16} className="text-[#D97706]" />
              <span className="text-[11px] uppercase tracking-[0.1em] text-[#D97706]" style={{ fontFamily: bodyFont, fontWeight: 600 }}>{t("preview.styleTip")}</span>
            </div>
            <p className="text-[14px] text-[#92400E]" style={{ fontFamily: bodyFont }}>{vibes[0].avoid_note}</p>
          </div>
        )}

        {/* Choose Your Experience — Pricing */}
        <div id="pricing-section" className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-[#292524]" style={{ fontSize: "clamp(28px, 3vw, 40px)", fontFamily: displayFont }}>
              {t("pricing.title")}
            </h2>
            <p className="mt-2 text-[16px] text-[#57534e]" style={{ fontFamily: bodyFont }}>
              {t("preview.selectPlan")}
            </p>
          </div>

          {checkoutError && (
            <div className="mb-6 max-w-[1000px] mx-auto p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <Icon name="error" size={20} className="text-red-500 flex-shrink-0" />
              <p className="text-[14px] text-red-700" style={{ fontFamily: bodyFont }}>{checkoutError}</p>
              <button onClick={() => setCheckoutError(null)} className="ml-auto text-red-400 hover:text-red-600 cursor-pointer">
                <Icon name="close" size={18} />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1000px] mx-auto">
            {/* Standard */}
            <div className="relative flex flex-col p-8 bg-white border border-[#C4613A]/10 rounded-2xl">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#C4613A] to-[#e0734a] text-white text-[10px] uppercase tracking-[0.12em] rounded-full animate-pulse" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
                {t("pricing.promoBadge")}
              </span>
              <h3 className="not-italic text-[28px] text-[#292524]" style={{ fontFamily: displayFont }}>Standard</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-[24px] text-[#57534e] line-through opacity-60" style={{ fontFamily: displayFont, fontWeight: 500 }}>{t("pricing.originalPrice")}</span>
                <span className="text-[36px] sm:text-[48px] text-[#C4613A]" style={{ fontFamily: displayFont, fontWeight: 700 }}>{t("pricing.promoFree")}</span>
              </div>
              <span className="text-[12px] text-[#C4613A] mt-1 block" style={{ fontFamily: bodyFont, fontWeight: 500 }}>{t("pricing.promoNote")}</span>
              <div className="mt-6 flex flex-col gap-3 flex-1">
                {[1,2,3,4,5].map((n) => (
                  <CheckItem key={n} label={t(`pricing.standard.features.${n}`)} />
                ))}
              </div>
              <div className="mt-8">
                <BtnSecondary onClick={() => handleCheckout("standard")} className="w-full">
                  {t("pricing.standard.cta")}
                </BtnSecondary>
              </div>
            </div>

            {/* Pro */}
            <div className="relative flex flex-col p-8 bg-[#C4613A] text-white rounded-2xl" style={{ boxShadow: "0 4px 16px rgba(196,97,58,.25)" }}>
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#1A1410] text-white text-[10px] uppercase tracking-[0.12em] rounded-full" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
                {t("pricing.pro.badge")}
              </span>
              <h3 className="text-white not-italic text-[28px]" style={{ fontFamily: displayFont }}>Pro</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-[36px] sm:text-[48px] text-white" style={{ fontFamily: displayFont, fontWeight: 700 }}>$3.99</span>
                <span className="text-[14px] text-white/70" style={{ fontFamily: bodyFont }}>{t("pricing.oneTime")}</span>
              </div>
              <span className="mt-1 text-[11px] text-white/40" style={{ fontFamily: "var(--font-mono)" }}>
                {t("pricing.noAccountNeeded")}
              </span>
              <div className="mt-6 flex flex-col gap-3 flex-1">
                {[1,2,3,4,5].map((n) => (
                  <div key={n} className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-white" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span className="text-[14px] text-white/90" style={{ fontFamily: bodyFont }}>{t(`pricing.pro.features.${n}`)}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => handleCheckout("pro")} className="mt-8 h-[56px] w-full bg-white text-[#C4613A] text-[14px] uppercase tracking-[0.08em] rounded-none hover:bg-white/90 transition-colors cursor-pointer" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
                {checkoutLoading === "pro" ? t("preview.processing") : t("pricing.pro.cta")}
              </button>
            </div>

            {/* Annual */}
            <div className="relative flex flex-col p-8 bg-white border border-[#C4613A]/10 rounded-2xl">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 gold-gradient text-white text-[10px] uppercase tracking-[0.12em] rounded-full whitespace-nowrap" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
                {t("pricing.annual.badge")}
              </span>
              <h3 className="not-italic text-[28px] text-[#292524]" style={{ fontFamily: displayFont }}>Annual</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-[36px] sm:text-[48px] text-[#292524]" style={{ fontFamily: displayFont, fontWeight: 700 }}>$9.99</span>
                <span className="text-[14px] text-[#57534e]" style={{ fontFamily: bodyFont }}>{t("pricing.perYear")}</span>
              </div>
              <div className="mt-6 flex flex-col gap-3 flex-1">
                {[1,2,3,4].map((n) => (
                  <CheckItem key={n} label={t(`pricing.annual.features.${n}`)} />
                ))}
              </div>
              <div className="mt-8">
                <BtnDark onClick={() => handleCheckout("annual")} className="w-full">
                  {checkoutLoading === "annual" ? t("preview.processing") : t("pricing.annual.cta")}
                </BtnDark>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-24 text-center">
          <p className="text-[18px] text-[#57534e] italic" style={{ fontFamily: displayFont }}>
            "{t("footer.quote")}"
          </p>
          <span className="mt-2 block text-[11px] uppercase tracking-[0.15em] text-[#57534e]/60" style={{ fontFamily: bodyFont, fontWeight: 500 }}>
            \u2014 {t("footer.quoteAuthor")}
          </span>
        </div>

        <div className="mt-12 pt-8 border-t border-[#EFE8DF] flex items-center justify-center gap-6 flex-wrap">
          {[
            { key: "footer.privacy", path: "/privacy" },
            { key: "footer.terms", path: "/terms" },
            { key: "footer.contact", path: "/contact" },
          ].map((item) => (
            <button key={item.key} onClick={() => navigate(item.path)} className="text-[11px] uppercase tracking-[0.1em] text-[#57534e] hover:text-[#C4613A] transition-colors cursor-pointer" style={{ fontFamily: bodyFont, fontWeight: 500 }}>
              {t(item.key)}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
