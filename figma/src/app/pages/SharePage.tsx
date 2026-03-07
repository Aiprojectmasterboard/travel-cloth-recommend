import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Icon, BtnPrimary, TagChip } from "../components/travel-capsule";
import { SocialShareButton } from "../components/travel-capsule/SocialShare";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { WORKER_URL } from "../lib/api";
import { SEO } from "../components/SEO";

interface ShareData {
  trip_id: string;
  share_url: string;
  og_title: string;
  og_description: string;
  teaser_url: string;
  mood_name: string;
}

const FALLBACK_HERO = "https://images.unsplash.com/photo-1659003505996-d5d7ca66bb25?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080";

const STYLE_FEATURES = [
  { icon: "wb_sunny", label: "Weather-adapted outfit recommendations" },
  { icon: "palette", label: "City vibe & color palette analysis" },
  { icon: "checkroom", label: "Complete capsule wardrobe with packing list" },
  { icon: "auto_awesome", label: "AI-generated outfit visualizations" },
];

const SOCIAL_PROOF_STATS = [
  { value: "12,400+", label: "Trips styled" },
  { value: "94%", label: "Packing accuracy" },
  { value: "4.9 / 5", label: "User satisfaction" },
];

export function SharePage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) return;
    async function fetchShare() {
      try {
        const res = await fetch(`${WORKER_URL}/api/share/${tripId}`);
        if (!res.ok) throw new Error("Not found");
        const json = await res.json() as ShareData;
        setData(json);
      } catch {
        setError("This style guide is no longer available.");
      } finally {
        setLoading(false);
      }
    }
    fetchShare();
  }, [tripId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#C4613A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[14px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>Loading style guide...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center">
        <div className="text-center max-w-[400px] px-6">
          <Icon name="explore_off" size={48} className="text-[#E8DDD4] mx-auto mb-4" />
          <h2 className="text-[24px] text-[#292524] mb-2" style={{ fontFamily: "var(--font-display)" }}>Style Guide Not Found</h2>
          <p className="text-[14px] text-[#57534e] mb-6" style={{ fontFamily: "var(--font-body)" }}>{error}</p>
          <BtnPrimary onClick={() => navigate("/")}>Create Your Own</BtnPrimary>
        </div>
      </div>
    );
  }

  const heroImage = data.teaser_url || FALLBACK_HERO;
  const cleanTitle = data.og_title.replace(" | Travel Capsule AI", "");
  // Use the share_url from the API response (already includes UTM params set by backend)
  const shareUrl = data.share_url || `${window.location.origin}/share/${data.trip_id}`;

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      <SEO title="Shared Travel Capsule" description="Check out this AI-styled travel outfit! Create your own personalized capsule wardrobe with Travel Capsule AI." />
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#E8DDD4]/50" style={{ backgroundColor: "rgba(253,248,243,0.8)", backdropFilter: "blur(16px)" }}>
        <div className="mx-auto flex items-center justify-between px-6 py-4" style={{ maxWidth: "var(--max-w)" }}>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Icon name="luggage" size={22} className="text-[#C4613A]" />
            <span
              className="text-[15px] sm:text-[18px] tracking-tight text-[#1A1410] whitespace-nowrap"
              style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
            >
              Travel Capsule AI
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Allow visitors to reshare this page */}
            <SocialShareButton shareUrl={shareUrl} shareTitle={cleanTitle} />
            <BtnPrimary onClick={() => navigate("/onboarding/1")} className="text-[11px]">
              Create Yours
            </BtnPrimary>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="mx-auto px-6 pt-8 pb-12" style={{ maxWidth: "var(--max-w)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Image */}
          <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: "3/4", maxHeight: "600px" }}>
            <ImageWithFallback src={heroImage} alt={data.mood_name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute top-4 left-4">
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-[10px] uppercase tracking-[0.1em]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                <Icon name="auto_awesome" size={12} className="text-white" /> AI Styled
              </span>
            </div>
            <div className="absolute bottom-5 left-5 right-5">
              <p className="text-white/70 text-[11px] uppercase tracking-[0.12em] mb-1.5" style={{ fontFamily: "var(--font-mono)" }}>
                Mood
              </p>
              <TagChip label={data.mood_name} className="bg-white/20 text-white backdrop-blur-sm" />
            </div>
          </div>

          {/* Text content */}
          <div className="flex flex-col justify-center">
            <span
              className="text-[10px] uppercase tracking-[0.15em] text-[#C4613A] mb-3"
              style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}
            >
              Shared Style Guide
            </span>
            <h1
              className="text-[#292524] italic mb-4"
              style={{ fontSize: "clamp(28px, 3.5vw, 44px)", fontFamily: "var(--font-display)", lineHeight: 1.15 }}
            >
              {cleanTitle}
            </h1>
            <p className="text-[16px] text-[#57534e] mb-8 leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
              {data.og_description}
            </p>

            {/* Feature highlights */}
            <div className="space-y-4 mb-8">
              {STYLE_FEATURES.map((f) => (
                <div key={f.label} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#C4613A]/10 flex items-center justify-center flex-shrink-0">
                    <Icon name={f.icon} size={18} className="text-[#C4613A]" />
                  </div>
                  <span className="text-[14px] text-[#292524]" style={{ fontFamily: "var(--font-body)" }}>{f.label}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3">
              <BtnPrimary onClick={() => navigate("/onboarding/1")} className="text-[13px] px-8 py-3">
                Create Your Style Guide
              </BtnPrimary>
              <button
                onClick={() => navigate("/")}
                className="h-[44px] px-6 border border-[#E8DDD4] rounded-full text-[13px] text-[#57534e] hover:border-[#C4613A]/30 hover:text-[#C4613A] transition-colors cursor-pointer"
                style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof Strip */}
      <div className="border-y border-[#E8DDD4] bg-white py-8">
        <div className="mx-auto px-6" style={{ maxWidth: "var(--max-w)" }}>
          <div className="grid grid-cols-3 gap-6 text-center">
            {SOCIAL_PROOF_STATS.map((stat) => (
              <div key={stat.label}>
                <p
                  className="text-[28px] sm:text-[32px] text-[#C4613A] mb-1"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
                >
                  {stat.value}
                </p>
                <p className="text-[12px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Share This Look Section */}
      <div className="bg-[#FDF8F3] py-12">
        <div className="mx-auto px-6 text-center" style={{ maxWidth: "640px" }}>
          <div className="w-12 h-12 rounded-full bg-[#C4613A]/10 flex items-center justify-center mx-auto mb-4">
            <Icon name="share" size={22} className="text-[#C4613A]" />
          </div>
          <h2
            className="text-[#292524] mb-3"
            style={{ fontSize: "clamp(20px, 2.5vw, 28px)", fontFamily: "var(--font-display)", lineHeight: 1.2 }}
          >
            Love this look?
          </h2>
          <p className="text-[15px] text-[#57534e] mb-6" style={{ fontFamily: "var(--font-body)" }}>
            Share this style guide with friends planning their next trip, or save it for inspiration.
          </p>
          <div className="flex justify-center">
            <SocialShareButton shareUrl={shareUrl} shareTitle={cleanTitle} />
          </div>
        </div>
      </div>

      {/* Bottom CTA Section */}
      <div className="bg-[#1A1410] py-16">
        <div className="mx-auto px-6 text-center" style={{ maxWidth: "600px" }}>
          <h2
            className="text-white italic mb-3"
            style={{ fontSize: "clamp(24px, 3vw, 36px)", fontFamily: "var(--font-display)", lineHeight: 1.2 }}
          >
            Your Perfect Travel Wardrobe, AI-Curated
          </h2>
          <p className="text-white/60 text-[15px] mb-8" style={{ fontFamily: "var(--font-body)" }}>
            Get weather-adapted, culture-aware outfit recommendations for any city. Start free.
          </p>
          <BtnPrimary onClick={() => navigate("/onboarding/1")} className="text-[13px] px-10 py-3">
            Get Started Free
          </BtnPrimary>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#E8DDD4] py-8">
        <div className="mx-auto px-6 text-center" style={{ maxWidth: "var(--max-w)" }}>
          <span className="text-[12px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
            Travel Capsule AI — AI-powered travel styling
          </span>
        </div>
      </footer>
    </div>
  );
}
