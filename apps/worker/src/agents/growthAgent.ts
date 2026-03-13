/**
 * growthAgent.ts
 *
 * Generates viral share copy + UTM-tagged URL + a short-lived upgrade token.
 *
 * Social copy:
 *   instagram — emoji-rich, hashtag
 *   twitter   — curiosity hook + link
 *   kakao     — Korean-language copy
 */

import type { Bindings, PlanType } from '../index';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GrowthResult {
  share_url: string;
  social_copy: {
    instagram: string;
    twitter: string;
    kakao: string;
  };
}

// ─── Main Exported Function ───────────────────────────────────────────────────

/**
 * Generates growth/sharing assets for a completed trip.
 *
 * @param input.tripId    - Trip UUID
 * @param input.moodName  - e.g. "Paris — Rainy Chic"
 * @param input.plan      - Current plan
 * @param env             - Cloudflare Worker bindings
 */
export async function growthAgent(
  input: { tripId: string; moodName: string; plan: PlanType },
  env: Bindings
): Promise<GrowthResult> {
  const { tripId, moodName, plan } = input;

  // UTM share link
  const shareUrl =
    `https://travelscapsule.com/share/${tripId}` +
    `?utm_source=share&utm_medium=direct&utm_campaign=${encodeURIComponent(moodName)}`;

  // Extract primary city name (everything before " — " if present)
  const primaryCity = moodName.includes(' — ')
    ? (moodName.split(' — ')[0] ?? moodName)
    : moodName;

  const social_copy = {
    instagram:
      `Just planned my ${primaryCity} wardrobe with AI ✈️ ${moodName} — swipe to see the full capsule! #TravelCapsule #AIFashion #TravelStyle`,
    twitter:
      `I asked AI to plan my ${primaryCity} wardrobe and this is what it came up with → ${shareUrl}`,
    kakao:
      `${primaryCity} 여행 짐싸기 AI한테 맡겼더니... ✈️ 나만의 캡슐 워드로브 완성! ${shareUrl}`,
  };

  return { share_url: shareUrl, social_copy };
}
