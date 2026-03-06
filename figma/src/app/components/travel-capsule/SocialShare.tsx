import React, { useState } from "react";
import { useLang } from "../../context/LanguageContext";
import { Icon } from "./Icon";

interface SocialShareButtonProps {
  /** Override the share URL. Defaults to building from sessionStorage tc_trip_id. */
  shareUrl?: string;
  /** Override the share title used in Web Share API and Twitter/Pinterest. */
  shareTitle?: string;
}

export function SocialShareButton({ shareUrl: shareUrlProp, shareTitle: shareTitleProp }: SocialShareButtonProps = {}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [instagramCopied, setInstagramCopied] = useState(false);
  const { t, displayFont, bodyFont } = useLang();

  const buildShareUrl = (): string => {
    if (shareUrlProp) return shareUrlProp;
    if (typeof window === "undefined") return "";
    const base = window.location.origin;
    return `${base}/?utm_source=share&utm_medium=direct&utm_campaign=capsule`;
  };

  const resolvedShareUrl = buildShareUrl();
  const resolvedTitle = shareTitleProp ?? "Check out my AI-curated travel capsule wardrobe!";

  // Web Share API — use native sheet on mobile
  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: resolvedTitle,
          text: "AI-powered travel outfit recommendations — city vibe, weather-adapted, ready to pack.",
          url: resolvedShareUrl,
        });
      } catch {
        // User cancelled or share failed — silently ignore
      }
      return;
    }
    // Fallback: open the share menu dropdown
    setOpen(true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resolvedShareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — no-op
    }
  };

  const handleInstagram = async () => {
    // Instagram doesn't support URL-based sharing; best UX is to copy the link
    try {
      await navigator.clipboard.writeText(resolvedShareUrl);
      setInstagramCopied(true);
      setTimeout(() => setInstagramCopied(false), 3000);
    } catch {
      // no-op
    }
  };

  const handleTwitter = () => {
    const text = encodeURIComponent(resolvedTitle);
    const url = encodeURIComponent(resolvedShareUrl);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      "_blank",
      "noopener,noreferrer,width=600,height=400"
    );
    setOpen(false);
  };

  const handlePinterest = () => {
    const url = encodeURIComponent(resolvedShareUrl);
    const description = encodeURIComponent(resolvedTitle);
    // Use the share URL itself as the media parameter; Pinterest will scrape the og:image
    const media = encodeURIComponent(resolvedShareUrl);
    window.open(
      `https://pinterest.com/pin/create/button/?url=${url}&media=${media}&description=${description}`,
      "_blank",
      "noopener,noreferrer,width=750,height=550"
    );
    setOpen(false);
  };

  // Determine if Web Share API is available (mobile / supported browsers)
  const hasNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div className="relative">
      <button
        onClick={hasNativeShare ? handleNativeShare : () => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#E8DDD4] hover:border-[#C4613A]/40 bg-white text-[12px] uppercase tracking-[0.08em] text-[#57534e] hover:text-[#C4613A] transition-all cursor-pointer"
        style={{ fontFamily: bodyFont, fontWeight: 500 }}
        aria-label="Share this style guide"
      >
        <Icon name="share" size={16} />
        Share
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-3 w-[300px] bg-white rounded-2xl border border-[#E8DDD4] p-6 z-50"
            style={{ boxShadow: "0 12px 40px rgba(0,0,0,.12)" }}
          >
            <h4 className="text-[18px] text-[#292524] not-italic mb-1" style={{ fontFamily: displayFont }}>
              {t("share.title")}
            </h4>
            <p className="text-[13px] text-[#57534e] mb-5" style={{ fontFamily: bodyFont }}>
              {t("share.subtitle")}
            </p>

            {/* Social platforms */}
            <div className="flex gap-3 mb-5">
              {/* Instagram */}
              <div className="relative flex-1">
                <button
                  onClick={handleInstagram}
                  className="w-full flex flex-col items-center gap-2 py-3 rounded-xl hover:bg-[#FDF8F3] transition-colors cursor-pointer border border-transparent hover:border-[#E8DDD4]"
                  aria-label="Copy link for Instagram"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#E1306C15" }}>
                    <Icon name="photo_camera" size={18} className="text-[#292524]" />
                  </div>
                  <span className="text-[10px] text-[#57534e]" style={{ fontFamily: bodyFont, fontWeight: 500 }}>
                    Instagram
                  </span>
                </button>
                {instagramCopied && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#292524] text-white text-[10px] px-2 py-1 rounded whitespace-nowrap" style={{ fontFamily: bodyFont }}>
                    Link copied!
                  </div>
                )}
              </div>

              {/* X / Twitter */}
              <button
                onClick={handleTwitter}
                className="flex-1 flex flex-col items-center gap-2 py-3 rounded-xl hover:bg-[#FDF8F3] transition-colors cursor-pointer border border-transparent hover:border-[#E8DDD4]"
                aria-label="Share on X / Twitter"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#1A141015" }}>
                  <Icon name="tag" size={18} className="text-[#292524]" />
                </div>
                <span className="text-[10px] text-[#57534e]" style={{ fontFamily: bodyFont, fontWeight: 500 }}>
                  X / Twitter
                </span>
              </button>

              {/* Pinterest */}
              <button
                onClick={handlePinterest}
                className="flex-1 flex flex-col items-center gap-2 py-3 rounded-xl hover:bg-[#FDF8F3] transition-colors cursor-pointer border border-transparent hover:border-[#E8DDD4]"
                aria-label="Share on Pinterest"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#E6002315" }}>
                  <Icon name="push_pin" size={18} className="text-[#292524]" />
                </div>
                <span className="text-[10px] text-[#57534e]" style={{ fontFamily: bodyFont, fontWeight: 500 }}>
                  Pinterest
                </span>
              </button>
            </div>

            {/* Copy link */}
            <button
              onClick={handleCopy}
              className="w-full h-[40px] flex items-center justify-center gap-2 bg-[#FDF8F3] border border-[#E8DDD4] rounded-lg text-[12px] uppercase tracking-[0.08em] text-[#57534e] hover:text-[#C4613A] hover:border-[#C4613A]/30 transition-all cursor-pointer"
              style={{ fontFamily: bodyFont, fontWeight: 500 }}
              aria-label="Copy share link to clipboard"
            >
              <Icon name={copied ? "check" : "link"} size={14} />
              {copied ? t("share.copied") : t("share.copyLink")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
