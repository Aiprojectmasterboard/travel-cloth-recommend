import { useEffect } from "react";
import { useLocation } from "react-router";

const SITE_URL = "https://travelscapsule.com";
const SITE_NAME = "Travel Capsule AI";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Dynamic SEO head management for SPA pages.
 * Updates document title, meta description, canonical, OG tags, and JSON-LD per route.
 */
export function SEO({
  title,
  description,
  canonical,
  ogImage,
  ogType = "website",
  noindex = false,
  jsonLd,
}: SEOProps) {
  const { pathname } = useLocation();
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Your AI Travel Stylist`;
  const fullUrl = canonical || `${SITE_URL}${pathname}`;
  const desc =
    description ||
    "AI-powered travel outfit planner. Tell us your destination — we analyze weather, city vibe, and your body profile to create personalized capsule wardrobes.";
  const image = ogImage || DEFAULT_OG_IMAGE;

  useEffect(() => {
    document.title = fullTitle;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    // Primary meta
    setMeta("name", "description", desc);
    setMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");

    // Open Graph
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:url", fullUrl);
    setMeta("property", "og:image", image);
    setMeta("property", "og:type", ogType);
    setMeta("property", "og:site_name", SITE_NAME);

    // Twitter
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", desc);
    setMeta("name", "twitter:image", image);

    // Canonical
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", fullUrl);

    // JSON-LD
    const existingScripts = document.querySelectorAll('script[data-seo-jsonld]');
    existingScripts.forEach((s) => s.remove());

    if (jsonLd) {
      const items = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      items.forEach((data) => {
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.setAttribute("data-seo-jsonld", "true");
        script.textContent = JSON.stringify(data);
        document.head.appendChild(script);
      });
    }
  }, [fullTitle, desc, fullUrl, image, ogType, noindex, jsonLd, pathname]);

  return null;
}

// ─── Pre-built JSON-LD helpers ───────────────────────────────────────────────

export function buildWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "AI-powered travel outfit planner that analyzes weather, city vibe, and your body profile to create personalized capsule wardrobes.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/onboarding/1?city={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/android-chrome-512x512.png`,
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      url: `${SITE_URL}/contact`,
    },
  };
}

export function buildWebAppSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "AI-powered travel outfit planner that analyzes weather, city vibe, and your body profile to create personalized capsule wardrobes.",
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    offers: [
      {
        "@type": "Offer",
        name: "Standard Plan",
        price: "5.00",
        priceCurrency: "USD",
        description: "1 clear outfit image + 3 unlocked, capsule list, daily plan",
      },
      {
        "@type": "Offer",
        name: "Pro Plan",
        price: "12.00",
        priceCurrency: "USD",
        description: "4-6 AI-generated outfit images per city, high-res, 1 regeneration",
      },
      {
        "@type": "Offer",
        name: "Annual Plan",
        price: "29.00",
        priceCurrency: "USD",
        description: "Full Pro features, up to 12 trips per year",
      },
    ],
    creator: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    featureList: [
      "AI-powered outfit generation",
      "Weather-adaptive styling",
      "City vibe analysis",
      "Body profile matching",
      "Capsule wardrobe packing list",
      "Multi-city trip planning",
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "1240",
      bestRating: "5",
    },
  };
}

export function buildFAQSchema(items: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildHowToSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Create a Travel Capsule Wardrobe with AI",
    description:
      "Use Travel Capsule AI to get a personalized, weather-optimized travel wardrobe in 3 simple steps.",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Enter Your Destination",
        text: "Choose up to 5 cities and your travel dates. Our AI will analyze weather data and local style culture.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "AI Analyzes Your Style",
        text: "Our AI considers weather forecasts, city vibes, your body profile, and style preferences to design outfits.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Get Your Capsule Wardrobe",
        text: "Receive AI-generated outfit images, a complete capsule packing list, and a day-by-day plan.",
      },
    ],
    totalTime: "PT2M",
    tool: { "@type": "HowToTool", name: "Travel Capsule AI web app" },
  };
}

export function buildBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
