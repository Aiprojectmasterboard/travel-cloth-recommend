/**
 * Cloudflare Pages Functions Middleware
 * Injects per-route <title>, <meta description>, <canonical>, OG tags
 * so that Google bot sees unique content per page BEFORE JS executes.
 */

interface RouteMetadata {
  title: string;
  description: string;
  canonical: string;
  ogTitle?: string;
  ogDescription?: string;
}

const SITE_URL = "https://travelscapsule.com";

const ROUTE_META: Record<string, RouteMetadata> = {
  "/": {
    title: "Travel Capsule AI — Your AI Travel Stylist | Pack Less, Look Better",
    description:
      "AI-powered travel outfit planner. Enter your destination — we analyze weather, city vibe, and your body profile to create personalized capsule wardrobes for Paris, Tokyo, Barcelona & 100+ cities.",
    canonical: `${SITE_URL}/`,
  },
  "/onboarding/1": {
    title: "Plan Your Trip — Choose Destination & Dates | Travel Capsule AI",
    description:
      "Start planning your travel wardrobe. Choose from 100+ cities worldwide, set your travel dates, and let AI create the perfect capsule wardrobe for your trip.",
    canonical: `${SITE_URL}/onboarding/1`,
  },
  "/examples/pro": {
    title: "Pro Plan Example — AI-Generated Travel Outfits | Travel Capsule AI",
    description:
      "See what the Pro plan delivers: 4 AI-generated outfit images per city, personalized capsule wardrobe, day-by-day styling plan, and weather-adaptive recommendations.",
    canonical: `${SITE_URL}/examples/pro`,
    ogTitle: "See AI-Generated Travel Outfits — Pro Plan Example",
    ogDescription:
      "4 AI outfit images, capsule wardrobe, and daily styling plan tailored to your destination's weather and vibe.",
  },
  "/examples/annual": {
    title: "Annual Plan Example — Unlimited AI Travel Styling | Travel Capsule AI",
    description:
      "Explore the Annual plan: full Pro features for up to 12 trips per year. AI-generated outfits, capsule wardrobes, and daily plans for every journey.",
    canonical: `${SITE_URL}/examples/annual`,
    ogTitle: "Annual Plan — AI Travel Styling for Every Trip",
    ogDescription:
      "12 trips per year with full AI outfit generation, capsule wardrobes, and personalized daily plans.",
  },
  "/privacy": {
    title: "Privacy Policy | Travel Capsule AI",
    description:
      "Learn how Travel Capsule AI handles your data. We prioritize your privacy — photos are deleted after processing, and we never share personal information.",
    canonical: `${SITE_URL}/privacy`,
  },
  "/terms": {
    title: "Terms of Service | Travel Capsule AI",
    description:
      "Terms and conditions for using Travel Capsule AI. Read about our service policies, payment terms, and user responsibilities.",
    canonical: `${SITE_URL}/terms`,
  },
  "/contact": {
    title: "Contact Us | Travel Capsule AI",
    description:
      "Get in touch with the Travel Capsule AI team. Questions about AI styling, billing, or partnerships? We're here to help.",
    canonical: `${SITE_URL}/contact`,
  },
  "/sitemap": {
    title: "Sitemap | Travel Capsule AI",
    description:
      "Browse all pages on Travel Capsule AI. Find AI travel styling tools, example results, pricing plans, and support pages.",
    canonical: `${SITE_URL}/sitemap`,
  },
};

export const onRequest: PagesFunction = async (context) => {
  const response = await context.next();

  // Only modify HTML responses (not JS, CSS, images, etc.)
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return response;
  }

  const url = new URL(context.request.url);
  const pathname = url.pathname.replace(/\/$/, "") || "/";

  // Dynamic routes: /share/:tripId
  let meta = ROUTE_META[pathname];
  if (!meta && pathname.startsWith("/share/")) {
    meta = {
      title: "My AI Travel Capsule — See My Outfit Plan | Travel Capsule AI",
      description:
        "Check out my AI-generated travel capsule wardrobe! Weather-adapted outfits, city vibe styling, and a complete packing list — all created by AI.",
      canonical: `${SITE_URL}${pathname}`,
      ogTitle: "My AI Travel Capsule Wardrobe",
      ogDescription:
        "AI created a personalized travel wardrobe for my trip. See the outfits, packing list, and daily plan!",
    };
  }
  if (!meta) {
    return response;
  }

  // Use HTMLRewriter to inject per-route meta tags
  return new HTMLRewriter()
    .on("title", {
      element(element) {
        element.setInnerContent(meta.title);
      },
    })
    .on('meta[name="title"]', {
      element(element) {
        element.setAttribute("content", meta.title);
      },
    })
    .on('meta[name="description"]', {
      element(element) {
        element.setAttribute("content", meta.description);
      },
    })
    .on('link[rel="canonical"]', {
      element(element) {
        element.setAttribute("href", meta.canonical);
      },
    })
    .on('meta[property="og:title"]', {
      element(element) {
        element.setAttribute("content", meta.ogTitle || meta.title);
      },
    })
    .on('meta[property="og:description"]', {
      element(element) {
        element.setAttribute("content", meta.ogDescription || meta.description);
      },
    })
    .on('meta[property="og:url"]', {
      element(element) {
        element.setAttribute("content", meta.canonical);
      },
    })
    .on('meta[name="twitter:title"]', {
      element(element) {
        element.setAttribute("content", meta.ogTitle || meta.title);
      },
    })
    .on('meta[name="twitter:description"]', {
      element(element) {
        element.setAttribute("content", meta.ogDescription || meta.description);
      },
    })
    .on('meta[name="twitter:url"]', {
      element(element) {
        element.setAttribute("content", meta.canonical);
      },
    })
    .transform(response);
};
