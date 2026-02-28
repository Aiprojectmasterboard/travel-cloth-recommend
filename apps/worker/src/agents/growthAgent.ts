/**
 * growthAgent.ts
 *
 * Generates viral share copy + UTM-tagged URL + a short-lived upgrade token.
 *
 * upgrade_token format: HMAC-SHA256({tripId}-{timestampMs}, POLAR_WEBHOOK_SECRET)
 * expressed as "{timestampMs}.{hex}" — valid for 3 minutes.
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
  upgrade_token?: string; // only generated for Standard plan
  social_copy: {
    instagram: string;
    twitter: string;
    kakao: string;
  };
}

// ─── HMAC Helper ─────────────────────────────────────────────────────────────

async function hmacHex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const buf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── Token Functions ──────────────────────────────────────────────────────────

/**
 * Generates a 3-minute upgrade token for Standard → Pro upsell.
 * Format: "{timestampMs}.{hmac}"
 */
export async function generateUpgradeToken(tripId: string, env: Bindings): Promise<string> {
  const ts = Date.now().toString();
  const hex = await hmacHex(`${tripId}-${ts}`, env.POLAR_WEBHOOK_SECRET);
  return `${ts}.${hex}`;
}

/**
 * Verifies an upgrade token for the given tripId.
 * Returns false if the token is expired (>3 min) or the HMAC is invalid.
 */
export async function verifyUpgradeToken(
  tripId: string,
  token: string,
  env: Bindings
): Promise<boolean> {
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const ts = parts[0] ?? '';
  const providedHex = parts[1] ?? '';

  const timestamp = parseInt(ts, 10);
  if (isNaN(timestamp)) return false;

  // 3-minute expiry
  const THREE_MINUTES_MS = 3 * 60 * 1000;
  if (Date.now() - timestamp > THREE_MINUTES_MS) return false;

  const expectedHex = await hmacHex(`${tripId}-${ts}`, env.POLAR_WEBHOOK_SECRET);

  // Timing-safe comparison
  if (expectedHex.length !== providedHex.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expectedHex.length; i++) {
    mismatch |= expectedHex.charCodeAt(i) ^ providedHex.charCodeAt(i);
  }
  return mismatch === 0;
}

// ─── Main Exported Function ───────────────────────────────────────────────────

/**
 * Generates growth/sharing assets for a completed trip.
 *
 * @param input.tripId    - Trip UUID
 * @param input.moodName  - e.g. "Paris — Rainy Chic"
 * @param input.plan      - Current plan (upgrade token only generated for "standard")
 * @param env             - Cloudflare Worker bindings
 */
export async function growthAgent(
  input: { tripId: string; moodName: string; plan: PlanType },
  env: Bindings
): Promise<GrowthResult> {
  const { tripId, moodName, plan } = input;

  // UTM share link
  const shareUrl =
    `https://travelcapsule.com/share/${tripId}` +
    `?utm_source=share&utm_medium=direct&utm_campaign=${encodeURIComponent(moodName)}`;

  // Upgrade token (Standard plan only — valid 3 min for upsell flow)
  let upgradeToken: string | undefined;
  if (plan === 'standard') {
    upgradeToken = await generateUpgradeToken(tripId, env);
  }

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

  return { share_url: shareUrl, upgrade_token: upgradeToken, social_copy };
}
