import type { Trip } from '../../../../packages/types/index';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShareContent {
  message_ko: string;
  message_en: string;
  share_url: string;
}

// ─── UTM Builder ──────────────────────────────────────────────────────────────

function buildShareUrl(tripId: string): string {
  const base = `https://travelcapsule.ai/result/${tripId}`;
  const params = new URLSearchParams({
    utm_source: 'share',
    utm_medium: 'user',
    utm_campaign: 'trip_share',
  });
  return `${base}?${params.toString()}`;
}

// ─── City List Formatter ──────────────────────────────────────────────────────

function formatCityList(trip: Trip): { en: string; ko: string } {
  const cities = trip.cities.map((c) => c.name);

  if (cities.length === 0) return { en: 'my destination', ko: '여행지' };

  const first = cities[0] ?? 'my destination';
  if (cities.length === 1) return { en: first, ko: first };

  const second = cities[1] ?? '';
  if (cities.length === 2) return { en: `${first} & ${second}`, ko: `${first} & ${second}` };

  const allButLast = cities.slice(0, -1).join(', ');
  const last = cities[cities.length - 1] ?? '';
  return {
    en: `${allButLast} & ${last}`,
    ko: `${allButLast} & ${last}`,
  };
}

// ─── Main Function ────────────────────────────────────────────────────────────

/**
 * Generates localized share copy and a UTM-tagged share URL for a completed trip.
 * Produces both English and Korean messages for international reach.
 */
export function generateShareContent(trip: Trip): ShareContent {
  const shareUrl = buildShareUrl(trip.id);
  const { en: citiesEn, ko: citiesKo } = formatCityList(trip);

  const message_en =
    `My AI-styled trip to ${citiesEn} is ready! ` +
    `Check out my personalized capsule wardrobe and outfit plan. ` +
    `Get yours for just $5 at ${shareUrl}`;

  const message_ko =
    `${citiesKo} 여행을 위한 AI 스타일링이 완성됐어요! ` +
    `나만을 위한 캡슐 워드로브와 데일리 아웃핏 플랜을 확인해보세요. ` +
    `단 $5로 나만의 여행 스타일링 받기: ${shareUrl}`;

  return {
    message_ko,
    message_en,
    share_url: shareUrl,
  };
}
