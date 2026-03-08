/**
 * orchestrator.ts
 *
 * Two exported pipeline functions:
 *
 *   runPreview(input, env) — free-tier pipeline:
 *     trips INSERT → annual limit check → weather (parallel) → vibe (parallel)
 *     → teaser (first city) → capsule free mode → generation_jobs INSERT → return PreviewResponse
 *
 *   runResult(tripId, plan, email, env) — post-payment pipeline:
 *     usage_records update → [pro/annual: styleAgent + imageGenAgent]
 *     → [standard: teaser unblur] → capsuleAgent paid → fulfillmentAgent → growthAgent
 */

import type { Bindings, PlanType } from '../index';
import { weatherAgent, type WeatherResult } from './weatherAgent';
import { vibeAgent, type VibeResult } from './vibeAgent';
import { teaserAgent } from './teaserAgent';
import { capsuleAgent, type CapsuleResult } from './capsuleAgent';
import { styleAgent, type UserProfile } from './styleAgent';
import { imageGenAgent } from './imageGenAgent';
import { fulfillmentAgent } from './fulfillmentAgent';
import { growthAgent } from './growthAgent';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TripInput {
  trip_id: string;
  session_id: string;
  cities: unknown[]; // raw JSONB from DB — cast to CityInput[] below
  month: number;
  face_url?: string;
  /** UI language code for localized responses (e.g. "ko", "ja", "en") */
  lang?: string;
  /** Optional traveller profile from the trip form (step 2 / step 3) */
  user_profile?: {
    gender?: string;
    height_cm?: number;
    weight_kg?: number;
    aesthetics?: string[];
  };
}

interface CityInput {
  name: string;
  country: string;
  days: number;
  lat?: number;
  lon?: number;
  fromDate?: string;  // YYYY-MM-DD
  toDate?: string;    // YYYY-MM-DD
}

export interface PreviewResponse {
  trip_id: string;
  status: 'completed' | 'processing';
  teaser_url: string | null;
  mood_label: string | null;       // e.g. "Paris — Rainy Chic"
  capsule: CapsuleResult;
  vibes: VibeResult[];
  weather: WeatherResult[];
  /** Non-null if teaser AI generation failed (diagnostic info) */
  teaser_error?: string | null;
}

// ─── Face Cleanup Helper ──────────────────────────────────────────────────────

/**
 * Deletes the original face photo from R2 and nulls face_url in the DB.
 * Called immediately after image generation completes (success or failure).
 * Non-throwing — any errors are logged and suppressed.
 */
async function cleanupFace(tripId: string, faceUrl: string, env: Bindings): Promise<void> {
  try {
    const faceKey = faceUrl.startsWith('http')
      ? new URL(faceUrl).pathname.replace(/^\//, '')
      : faceUrl;
    await env.R2.delete(faceKey);
    console.log(`[orchestrator] Face image deleted from R2 for trip ${tripId}`);
  } catch (err) {
    console.error(`[orchestrator] R2 face deletion failed for trip ${tripId}:`, (err as Error).message);
  }
  // Always null face_url in DB regardless of R2 outcome
  try {
    await sbPatch(env, `/trips?id=eq.${tripId}`, { face_url: null });
    console.log(`[orchestrator] face_url nulled in DB for trip ${tripId}`);
  } catch (err) {
    console.error(`[orchestrator] DB face_url null failed for trip ${tripId}:`, (err as Error).message);
  }
}

// ─── Supabase Helper ──────────────────────────────────────────────────────────

async function sbFetch(
  env: Bindings,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  return fetch(`${env.SUPABASE_URL}/rest/v1${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: 'return=representation',
      ...(init.headers as Record<string, string> | undefined),
    },
  });
}

async function sbPatch(env: Bindings, path: string, body: Record<string, unknown>): Promise<void> {
  await sbFetch(env, path, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  });
}

// ─── Annual Limit Check ───────────────────────────────────────────────────────

/**
 * Throws an error with message "AnnualLimitReached" if the user_email has
 * consumed >= 12 trips in the current annual billing period.
 * Only applies to the "annual" plan.
 * Checks period_end to ensure the record is still within the active billing cycle.
 */
async function checkAnnualLimit(
  userEmail: string,
  env: Bindings
): Promise<void> {
  if (!userEmail) return; // anonymous previews are not tracked

  const res = await sbFetch(
    env,
    `/usage_records?user_email=eq.${encodeURIComponent(userEmail)}&plan=eq.annual&order=period_end.desc&limit=1`
  );

  if (!res.ok) {
    console.warn('[Orchestrator] Could not check annual usage — proceeding');
    return;
  }

  const rows = (await res.json()) as Array<{ trip_count: number; period_start: string; period_end: string }>;
  if (rows.length === 0) return; // no record yet → first trip, allow

  const row = rows[0];
  if (!row) return;

  // If the billing period has expired, treat as fresh (allow)
  const today = new Date().toISOString().slice(0, 10);
  if (row.period_end && today > row.period_end) return;

  if (row.trip_count >= 12) {
    throw new Error('AnnualLimitReached');
  }
}

/**
 * Increments usage_records.trip_count for an annual-plan user.
 * If an active period record exists, increments trip_count.
 * If no record or period expired, creates a new record with 1-year period.
 */
async function incrementAnnualUsage(userEmail: string, env: Bindings): Promise<void> {
  if (!userEmail) return;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

  // Find the most recent annual usage record
  const existing = await sbFetch(
    env,
    `/usage_records?user_email=eq.${encodeURIComponent(userEmail)}&plan=eq.annual&order=period_end.desc&limit=1`
  );

  if (existing.ok) {
    const rows = (await existing.json()) as Array<{ id: string; trip_count: number; period_end: string }>;
    if (rows.length > 0 && rows[0]) {
      // If period is still active, increment
      if (rows[0].period_end && todayStr <= rows[0].period_end) {
        await sbPatch(env, `/usage_records?id=eq.${rows[0].id}`, {
          trip_count: rows[0].trip_count + 1,
        });
        return;
      }
      // Period expired — fall through to create new record
    }
  }

  // Create new usage record (first trip or new billing period)
  const periodStart = todayStr;
  const nextYear = new Date(now);
  nextYear.setUTCFullYear(nextYear.getUTCFullYear() + 1);
  const periodEnd = nextYear.toISOString().slice(0, 10);

  await sbFetch(env, '/usage_records', {
    method: 'POST',
    body: JSON.stringify({
      user_email: userEmail,
      plan: 'annual',
      trip_count: 1,
      period_start: periodStart,
      period_end: periodEnd,
    }),
  });
}

// ─── Localized Vibe & Capsule Strings ─────────────────────────────────────────

type VibeEntry = { mood: string; tags: string[]; colors: string[]; avoid: string };
type VibeDb = Record<string, VibeEntry>;

/** Returns a complete vibe database for the given language */
function getVibeDb(lang: string, isWarm: boolean): VibeDb {
  // English is the base — other languages override mood and avoid_note
  const en: VibeDb = {
    paris: { mood: isWarm ? 'Sunlit Parisian Ease' : 'Parisian Twilight Layers', tags: ['effortless', 'refined', 'romantic', 'layered'], colors: ['#C9B99A', '#4A4E5A', '#D6CFC4'], avoid: isWarm ? 'Avoid heavy coats — light layers work best.' : 'Avoid thin fabrics without layering options.' },
    rome: { mood: isWarm ? 'Roman Golden Hour' : 'Roman Terracotta Warmth', tags: ['sun-kissed', 'Mediterranean', 'relaxed', 'warm-toned'], colors: ['#C2956B', '#E8C9A0', '#8B6E4E'], avoid: isWarm ? 'Avoid dark heavy fabrics in the heat.' : 'Pack a light jacket for cool evenings.' },
    barcelona: { mood: isWarm ? 'Coastal Barcelona Glow' : 'Barcelona Urban Breeze', tags: ['coastal', 'vibrant', 'casual', 'colorful'], colors: ['#E2A76F', '#5BA3C2', '#F5DEB3'], avoid: isWarm ? 'Avoid overdressing — coastal casual is key.' : 'Layer for variable Mediterranean weather.' },
    tokyo: { mood: isWarm ? 'Tokyo Neon Minimal' : 'Tokyo Urban Layer', tags: ['structured', 'minimal', 'urban', 'clean'], colors: ['#2C2C2C', '#E8E0D5', '#8B7355'], avoid: isWarm ? 'Avoid bulky items — clean lines work best.' : 'Pack warm layers for chilly evenings.' },
    london: { mood: isWarm ? 'London Garden Party' : 'London Understated Layer', tags: ['classic', 'tailored', 'understated', 'polished'], colors: ['#4A5568', '#C4A882', '#2C3E50'], avoid: 'Always pack a waterproof layer.' },
    'new york': { mood: isWarm ? 'NYC Street Edge' : 'NYC Dark Minimal', tags: ['edgy', 'street', 'bold', 'urban'], colors: ['#1A1A1A', '#C4613A', '#E8DDD4'], avoid: 'Comfortable shoes are essential for walking.' },
    seoul: { mood: isWarm ? 'Seoul Fresh Contemporary' : 'Seoul Clean Layer', tags: ['contemporary', 'clean', 'trendy', 'minimal'], colors: ['#E8E0D5', '#4A4E5A', '#A0C4B8'], avoid: isWarm ? 'Lightweight breathable fabrics recommended.' : 'Smart layering for variable temperatures.' },
    milan: { mood: isWarm ? 'Milan Luxe Ease' : 'Milan Tailored Elegance', tags: ['luxurious', 'tailored', 'refined', 'designer'], colors: ['#8B7355', '#2C2C2C', '#D4C5B2'], avoid: 'Avoid overly casual looks — Milan appreciates style.' },
    bali: { mood: 'Bali Coastal Ease', tags: ['tropical', 'relaxed', 'earthy', 'flowy'], colors: ['#8B6E4E', '#4A7C59', '#F0E0C8'], avoid: 'Pack light breathable fabrics only.' },
    bangkok: { mood: isWarm ? 'Bangkok Tropical Heat' : 'Bangkok Golden Temple', tags: ['tropical', 'vibrant', 'cultural', 'colorful'], colors: ['#D4AF37', '#E85D3A', '#4A7C59'], avoid: 'Lightweight loose clothing for extreme humidity.' },
    'ho chi minh': { mood: 'Saigon Street Chic', tags: ['eclectic', 'vibrant', 'casual', 'warm'], colors: ['#C2956B', '#4A7C59', '#E8DDD4'], avoid: 'Breathable fabrics essential — avoid heavy layers.' },
    singapore: { mood: 'Singapore Modern Tropic', tags: ['modern', 'sleek', 'tropical', 'polished'], colors: ['#2C2C2C', '#4A7C59', '#E8E0D5'], avoid: 'Air conditioning is cold — carry a light layer.' },
    osaka: { mood: isWarm ? 'Osaka Street Food Style' : 'Osaka Cozy Layer', tags: ['playful', 'casual', 'food-culture', 'urban'], colors: ['#E85D3A', '#E8E0D5', '#4A4E5A'], avoid: isWarm ? 'Comfortable walking shoes for food markets.' : 'Layer for cool temple visits.' },
    kyoto: { mood: isWarm ? 'Kyoto Garden Zen' : 'Kyoto Autumn Elegance', tags: ['serene', 'traditional', 'refined', 'nature'], colors: ['#8B7355', '#4A7C59', '#C9B99A'], avoid: 'Modest clothing for temple visits.' },
    lisbon: { mood: isWarm ? 'Lisbon Coastal Sun' : 'Lisbon Tiled Charm', tags: ['coastal', 'relaxed', 'artistic', 'sun-soaked'], colors: ['#5BA3C2', '#E2A76F', '#F5DEB3'], avoid: 'Comfortable shoes for hilly cobblestone streets.' },
    amsterdam: { mood: isWarm ? 'Amsterdam Canal Breeze' : 'Amsterdam Cozy Layer', tags: ['casual', 'creative', 'layered', 'cycling'], colors: ['#4A5568', '#E8C9A0', '#5BA3C2'], avoid: 'Rain jacket essential — weather changes fast.' },
    vienna: { mood: isWarm ? 'Vienna Imperial Garden' : 'Vienna Classical Elegance', tags: ['classical', 'elegant', 'refined', 'cultural'], colors: ['#D4AF37', '#4A4E5A', '#C9B99A'], avoid: 'Smart casual for concert halls and cafés.' },
    prague: { mood: isWarm ? 'Prague Golden Summer' : 'Prague Gothic Romance', tags: ['romantic', 'historic', 'bohemian', 'layered'], colors: ['#C2956B', '#4A4E5A', '#D4AF37'], avoid: 'Cobblestone streets — comfortable shoes needed.' },
    'san francisco': { mood: isWarm ? 'SF Foggy Cool' : 'SF Urban Layer', tags: ['casual', 'layered', 'tech', 'relaxed'], colors: ['#4A5568', '#E8DDD4', '#C4613A'], avoid: 'Always bring layers — SF fog is unpredictable.' },
    sydney: { mood: isWarm ? 'Sydney Beach Glow' : 'Sydney Harbour Breeze', tags: ['coastal', 'active', 'relaxed', 'sun-kissed'], colors: ['#5BA3C2', '#F0E0C8', '#E2A76F'], avoid: 'High SPF and breathable fabrics for beach days.' },
    dubai: { mood: 'Dubai Luxe Heat', tags: ['luxurious', 'modern', 'glamorous', 'desert'], colors: ['#D4AF37', '#C2956B', '#2C2C2C'], avoid: 'Modest coverage in public — lightweight luxury fabrics.' },
    istanbul: { mood: isWarm ? 'Istanbul Bazaar Glow' : 'Istanbul Layered Mystique', tags: ['cultural', 'vibrant', 'layered', 'warm-toned'], colors: ['#C2956B', '#E85D3A', '#4A4E5A'], avoid: 'Modest layers for mosque visits.' },
    florence: { mood: isWarm ? 'Florentine Sun' : 'Florentine Renaissance', tags: ['artistic', 'warm-toned', 'elegant', 'Mediterranean'], colors: ['#C2956B', '#D4AF37', '#8B6E4E'], avoid: isWarm ? 'Light breathable fabrics for gallery days.' : 'Smart layers for cooler gallery interiors.' },
  };

  if (lang === 'en') return en;

  // Localized avoid_note overrides (mood names stay in English as brand styling)
  const avoidOverrides: Record<string, Record<string, { avoid: string }>> = {
    ko: {
      paris: { avoid: isWarm ? '두꺼운 코트는 피하세요 — 가벼운 레이어링이 최적입니다.' : '레이어링 없이 얇은 원단만 입는 것은 피하세요.' },
      rome: { avoid: isWarm ? '더운 날씨에 어두운 두꺼운 원단은 피하세요.' : '서늘한 저녁을 위해 가벼운 재킷을 챙기세요.' },
      barcelona: { avoid: isWarm ? '과하게 차려입지 마세요 — 해안가 캐주얼이 핵심입니다.' : '변덕스러운 지중해 날씨에 대비해 레이어링하세요.' },
      tokyo: { avoid: isWarm ? '부피 큰 아이템은 피하세요 — 깔끔한 라인이 최적입니다.' : '쌀쌀한 저녁을 위해 따뜻한 레이어를 챙기세요.' },
      london: { avoid: '방수 레이어를 항상 챙기세요.' },
      'new york': { avoid: '걷기 편한 신발이 필수입니다.' },
      seoul: { avoid: isWarm ? '가볍고 통기성 좋은 원단을 추천합니다.' : '변덕스러운 기온에 대비한 스마트 레이어링이 필요합니다.' },
      milan: { avoid: '너무 캐주얼한 룩은 피하세요 — 밀라노는 스타일을 중시합니다.' },
      bali: { avoid: '가볍고 통기성 좋은 원단만 챙기세요.' },
      bangkok: { avoid: '극심한 습도에 대비해 가볍고 헐렁한 옷을 입으세요.' },
      'ho chi minh': { avoid: '통기성 좋은 원단 필수 — 두꺼운 레이어는 피하세요.' },
      singapore: { avoid: '에어컨이 춥습니다 — 가벼운 겉옷을 챙기세요.' },
      osaka: { avoid: isWarm ? '먹거리 시장 탐방을 위해 편한 워킹화를 신으세요.' : '서늘한 사찰 방문을 위해 레이어링하세요.' },
      kyoto: { avoid: '사찰 방문 시 단정한 옷차림이 필요합니다.' },
      lisbon: { avoid: '언덕진 자갈길을 위해 편한 신발을 신으세요.' },
      amsterdam: { avoid: '비옷 필수 — 날씨가 빠르게 변합니다.' },
      vienna: { avoid: '콘서트홀과 카페를 위한 스마트 캐주얼을 추천합니다.' },
      prague: { avoid: '자갈길이 많으니 편한 신발이 필요합니다.' },
      'san francisco': { avoid: '항상 레이어를 챙기세요 — SF 안개는 예측 불가합니다.' },
      sydney: { avoid: '비치 데이를 위해 높은 SPF와 통기성 좋은 원단을 준비하세요.' },
      dubai: { avoid: '공공장소에서는 단정한 옷차림 — 가벼운 고급 원단을 추천합니다.' },
      istanbul: { avoid: '모스크 방문 시 단정한 레이어가 필요합니다.' },
      florence: { avoid: isWarm ? '갤러리 탐방을 위해 가볍고 통기성 좋은 원단을 입으세요.' : '서늘한 갤러리 내부를 위해 스마트 레이어링하세요.' },
    },
    ja: {
      paris: { avoid: isWarm ? '厚手のコートは避けて — 軽いレイヤリングが最適です。' : '重ね着オプションのない薄い生地は避けてください。' },
      rome: { avoid: isWarm ? '暑い日に暗い厚手の生地は避けましょう。' : '涼しい夜のために軽いジャケットを持参してください。' },
      barcelona: { avoid: isWarm ? '着飾りすぎないで — 海岸沿いのカジュアルがポイントです。' : '変わりやすい地中海の天候に備えてレイヤリングを。' },
      tokyo: { avoid: isWarm ? 'かさばるアイテムは避けて — クリーンなラインが最適です。' : '肌寒い夜のために暖かいレイヤーを持参してください。' },
      london: { avoid: '防水レイヤーを必ず持参してください。' },
      'new york': { avoid: '歩きやすい靴が必須です。' },
      seoul: { avoid: isWarm ? '軽くて通気性の良い生地がおすすめです。' : '変わりやすい気温に対応するスマートなレイヤリングを。' },
      milan: { avoid: 'カジュアルすぎる装いは避けて — ミラノはスタイルを重視します。' },
      bali: { avoid: '軽くて通気性の良い生地だけを持参してください。' },
      bangkok: { avoid: '極度の湿気に対応する軽くてゆったりした服装を。' },
      'ho chi minh': { avoid: '通気性の良い生地が必須 — 厚いレイヤーは避けてください。' },
      singapore: { avoid: 'エアコンが寒いです — 軽い上着を持参してください。' },
      osaka: { avoid: isWarm ? 'フードマーケット散策に歩きやすい靴を。' : '涼しい寺院訪問のためにレイヤリングを。' },
      kyoto: { avoid: '寺院訪問には控えめな服装が必要です。' },
      lisbon: { avoid: '坂道の石畳のために歩きやすい靴を履いてください。' },
      amsterdam: { avoid: 'レインジャケット必須 — 天気が急変します。' },
      vienna: { avoid: 'コンサートホールやカフェにはスマートカジュアルを。' },
      prague: { avoid: '石畳が多いので歩きやすい靴が必要です。' },
      'san francisco': { avoid: '常にレイヤーを持参して — SF の霧は予測不能です。' },
      sydney: { avoid: 'ビーチデイには高SPFと通気性の良い生地を準備してください。' },
      dubai: { avoid: '公共の場では控えめな服装を — 軽い高級素材がおすすめです。' },
      istanbul: { avoid: 'モスク訪問には控えめなレイヤーが必要です。' },
      florence: { avoid: isWarm ? 'ギャラリー巡りには軽くて通気性の良い生地を。' : '涼しいギャラリー内部のためにスマートなレイヤリングを。' },
    },
    zh: {
      paris: { avoid: isWarm ? '避免厚重外套——轻薄叠穿最合适。' : '避免只穿薄面料而不叠穿。' },
      rome: { avoid: isWarm ? '炎热天气避免深色厚重面料。' : '准备一件轻薄夹克应对凉爽夜晚。' },
      barcelona: { avoid: isWarm ? '不要过度打扮——海岸休闲风是关键。' : '应对多变的地中海天气需要叠穿。' },
      tokyo: { avoid: isWarm ? '避免笨重单品——简洁线条最合适。' : '准备保暖层应对寒冷夜晚。' },
      london: { avoid: '一定要带防水外层。' },
      'new york': { avoid: '舒适的步行鞋是必需品。' },
      seoul: { avoid: isWarm ? '推荐轻薄透气面料。' : '应对多变气温需要智能叠穿。' },
      milan: { avoid: '避免过于随意的穿搭——米兰重视时尚。' },
      bali: { avoid: '只带轻薄透气面料。' },
      bangkok: { avoid: '极度潮湿天气穿轻薄宽松的衣服。' },
      'ho chi minh': { avoid: '透气面料必备——避免厚重叠穿。' },
      singapore: { avoid: '空调很冷——带一件轻薄外套。' },
      osaka: { avoid: isWarm ? '逛美食市场请穿舒适的步行鞋。' : '参拜寺庙请注意叠穿保暖。' },
      kyoto: { avoid: '参拜寺庙需要端庄的着装。' },
      lisbon: { avoid: '爬坡的鹅卵石路需要舒适的鞋子。' },
      amsterdam: { avoid: '雨衣必备——天气变化很快。' },
      vienna: { avoid: '音乐厅和咖啡馆推荐智能休闲装。' },
      prague: { avoid: '鹅卵石路多——需要舒适的鞋子。' },
      'san francisco': { avoid: '一定要带叠穿衣物——旧金山的雾不可预测。' },
      sydney: { avoid: '海滩日准备高SPF防晒和透气面料。' },
      dubai: { avoid: '公共场所着装要端庄——轻薄高档面料。' },
      istanbul: { avoid: '参观清真寺需要端庄的叠穿。' },
      florence: { avoid: isWarm ? '参观画廊穿轻薄透气面料。' : '应对凉爽的画廊内部需要智能叠穿。' },
    },
    fr: {
      paris: { avoid: isWarm ? 'Évitez les manteaux lourds — les couches légères sont idéales.' : 'Évitez les tissus fins sans options de superposition.' },
      rome: { avoid: isWarm ? 'Évitez les tissus sombres et lourds par cette chaleur.' : 'Prévoyez une veste légère pour les soirées fraîches.' },
      barcelona: { avoid: isWarm ? 'Ne vous habillez pas trop — le style côtier décontracté est la clé.' : 'Superposez les couches pour le temps méditerranéen variable.' },
      tokyo: { avoid: isWarm ? 'Évitez les articles volumineux — les lignes épurées sont préférables.' : 'Prévoyez des couches chaudes pour les soirées fraîches.' },
      london: { avoid: 'Emportez toujours une couche imperméable.' },
      'new york': { avoid: 'Des chaussures confortables sont indispensables pour marcher.' },
      seoul: { avoid: isWarm ? 'Tissus légers et respirants recommandés.' : 'Superposition intelligente pour les températures variables.' },
      milan: { avoid: 'Évitez les looks trop décontractés — Milan apprécie le style.' },
      bali: { avoid: 'N\'emportez que des tissus légers et respirants.' },
      bangkok: { avoid: 'Vêtements légers et amples pour l\'humidité extrême.' },
      'ho chi minh': { avoid: 'Tissus respirants essentiels — évitez les couches lourdes.' },
      singapore: { avoid: 'La climatisation est froide — prévoyez une couche légère.' },
      osaka: { avoid: isWarm ? 'Chaussures confortables pour les marchés alimentaires.' : 'Superposez pour les visites de temples en fraîcheur.' },
      kyoto: { avoid: 'Tenue modeste requise pour les visites de temples.' },
      lisbon: { avoid: 'Chaussures confortables pour les rues pavées en pente.' },
      amsterdam: { avoid: 'Veste de pluie indispensable — le temps change vite.' },
      vienna: { avoid: 'Smart casual pour les salles de concert et cafés.' },
      prague: { avoid: 'Rues pavées — chaussures confortables nécessaires.' },
      'san francisco': { avoid: 'Apportez toujours des couches — le brouillard de SF est imprévisible.' },
      sydney: { avoid: 'SPF élevé et tissus respirants pour les journées plage.' },
      dubai: { avoid: 'Tenue modeste en public — tissus de luxe légers.' },
      istanbul: { avoid: 'Couches modestes requises pour les visites de mosquées.' },
      florence: { avoid: isWarm ? 'Tissus légers et respirants pour les journées galerie.' : 'Couches élégantes pour les intérieurs frais des galeries.' },
    },
    es: {
      paris: { avoid: isWarm ? 'Evita abrigos pesados — las capas ligeras son lo mejor.' : 'Evita telas finas sin opciones de capas.' },
      rome: { avoid: isWarm ? 'Evita telas oscuras y pesadas con el calor.' : 'Lleva una chaqueta ligera para las noches frescas.' },
      barcelona: { avoid: isWarm ? 'No te vistas de más — el estilo costero casual es clave.' : 'Usa capas para el clima mediterráneo variable.' },
      tokyo: { avoid: isWarm ? 'Evita prendas voluminosas — las líneas limpias son lo mejor.' : 'Lleva capas abrigadas para las noches frescas.' },
      london: { avoid: 'Siempre lleva una capa impermeable.' },
      'new york': { avoid: 'Zapatos cómodos son esenciales para caminar.' },
      seoul: { avoid: isWarm ? 'Se recomiendan telas ligeras y transpirables.' : 'Capas inteligentes para temperaturas variables.' },
      milan: { avoid: 'Evita looks demasiado casuales — Milán aprecia el estilo.' },
      bali: { avoid: 'Solo lleva telas ligeras y transpirables.' },
      bangkok: { avoid: 'Ropa ligera y suelta para la humedad extrema.' },
      'ho chi minh': { avoid: 'Telas transpirables esenciales — evita capas pesadas.' },
      singapore: { avoid: 'El aire acondicionado es frío — lleva una capa ligera.' },
      osaka: { avoid: isWarm ? 'Zapatos cómodos para los mercados de comida.' : 'Usa capas para las visitas frescas a templos.' },
      kyoto: { avoid: 'Ropa modesta requerida para visitas a templos.' },
      lisbon: { avoid: 'Zapatos cómodos para las calles empedradas con pendiente.' },
      amsterdam: { avoid: 'Chaqueta impermeable esencial — el clima cambia rápido.' },
      vienna: { avoid: 'Smart casual para salas de conciertos y cafés.' },
      prague: { avoid: 'Calles empedradas — se necesitan zapatos cómodos.' },
      'san francisco': { avoid: 'Siempre lleva capas — la niebla de SF es impredecible.' },
      sydney: { avoid: 'SPF alto y telas transpirables para días de playa.' },
      dubai: { avoid: 'Vestimenta modesta en público — telas de lujo ligeras.' },
      istanbul: { avoid: 'Capas modestas requeridas para visitas a mezquitas.' },
      florence: { avoid: isWarm ? 'Telas ligeras y transpirables para días de galería.' : 'Capas elegantes para interiores frescos de galerías.' },
    },
  };

  const overrides = avoidOverrides[lang];
  if (!overrides) return en;

  // Merge: use English base, override avoid_note per city
  const result: VibeDb = {};
  for (const [key, entry] of Object.entries(en)) {
    const ov = overrides[key];
    result[key] = ov ? { ...entry, avoid: ov.avoid } : entry;
  }
  return result;
}

/** Default avoid note for unknown cities */
function getDefaultAvoid(lang: string): string {
  const defaults: Record<string, string> = {
    ko: '다양하게 믹스 앤 매치할 수 있는 아이템을 챙기세요.',
    ja: 'ミックス&マッチできる多用途なアイテムを持参してください。',
    zh: '准备可以混搭的多用途单品。',
    fr: 'Emportez des pièces polyvalentes qui se combinent facilement.',
    es: 'Lleva prendas versátiles que combinen entre sí.',
  };
  return defaults[lang] || 'Pack versatile pieces that mix and match.';
}

/** Capsule principles localized by language */
function getCapsulePrinciples(
  lang: string,
  cityName: string,
  totalDays: number,
  cityCount: number,
  colorCount: number,
  isWarm: boolean,
): string[] {
  if (lang === 'ko') {
    return [
      isWarm
        ? `가벼운 통기성 레이어를 챙기세요 — 린넨 셔츠나 면 티셔츠는 ${cityName}의 따뜻한 낮부터 선선한 저녁까지 자연스럽게 전환됩니다.`
        : `${cityName}의 변덕스러운 기온을 부피 없이 소화할 수 있는 다용도 아우터 하나를 중심으로 구성하세요.`,
      `${totalDays}일 동안 아이템 조합을 극대화할 수 있도록 ${Math.min(3, cityCount)}가지 뉴트럴 베이스 컬러를 선택하세요.`,
      cityCount > 1
        ? `${cityCount}개 도시 모두에서 활용할 수 있는 아이템을 선택하세요 — 도시 산책과 식사 모두 가능한 다용도 신발 한 켤레와 가방 하나면 충분합니다.`
        : `${totalDays}일 여행 중 예상치 못한 날씨 변화에 대비해 접이식 레이어를 챙기세요.`,
    ];
  }
  if (lang === 'ja') {
    return [
      isWarm
        ? `軽くて通気性の良いレイヤーを持参してください — リネンシャツやコットンTシャツは${cityName}の暖かい日中から涼しい夜まで自然に対応します。`
        : `${cityName}の変わりやすい気温に対応できる多用途なアウター1着を軸にコーディネートを組みましょう。`,
      `${totalDays}日間でコーディネートの組み合わせを最大化するために、${Math.min(3, cityCount)}色のニュートラルベースカラーを選びましょう。`,
      cityCount > 1
        ? `${cityCount}都市すべてで活躍するアイテムを選びましょう — 街歩きとディナーの両方に対応する靴1足とバッグ1つで十分です。`
        : `${totalDays}日間の旅行中の予期せぬ天候変化に備えて、コンパクトに畳めるレイヤーを持参してください。`,
    ];
  }
  if (lang === 'zh') {
    return [
      isWarm
        ? `准备轻薄透气的叠穿单品——亚麻衬衫或棉质T恤可以从${cityName}温暖的白天自然过渡到凉爽的夜晚。`
        : `以一件多功能外套为核心搭配，应对${cityName}多变的气温，同时避免行李过重。`,
      `选择${Math.min(3, cityCount)}种中性基础色，在${totalDays}天内最大化搭配组合。`,
      cityCount > 1
        ? `选择适合所有${cityCount}个目的地的单品——一双百搭鞋和一个包就能应对城市漫步和用餐。`
        : `准备一件可折叠的轻便外层，应对${totalDays}天旅途中的意外天气变化。`,
    ];
  }
  if (lang === 'fr') {
    return [
      isWarm
        ? `Emportez des couches légères et respirantes — une chemise en lin ou un t-shirt en coton s'adapte parfaitement des journées chaudes de ${cityName} aux soirées plus fraîches.`
        : `Construisez votre garde-robe autour d'une pièce extérieure polyvalente pour gérer les températures variables de ${cityName} sans encombrement.`,
      `Choisissez ${Math.min(3, cityCount)} couleurs neutres de base qui se combinent pendant les ${totalDays} jours, maximisant les tenues avec moins de pièces.`,
      cityCount > 1
        ? `Sélectionnez des pièces qui fonctionnent dans les ${cityCount} destinations — une paire de chaussures polyvalentes et un sac suffisent pour la marche en ville et les dîners.`
        : `Emportez une couche pliable compacte pour les changements météo imprévus pendant votre voyage de ${totalDays} jours.`,
    ];
  }
  if (lang === 'es') {
    return [
      isWarm
        ? `Lleva capas ligeras y transpirables — una camisa de lino o camiseta de algodón se adapta perfectamente de los días cálidos de ${cityName} a las noches más frescas.`
        : `Construye tu vestuario alrededor de una prenda exterior versátil que maneje las temperaturas variables de ${cityName} sin añadir volumen.`,
      `Elige ${Math.min(3, cityCount)} colores neutros base que combinen durante los ${totalDays} días, maximizando los conjuntos con menos prendas.`,
      cityCount > 1
        ? `Selecciona prendas que funcionen en los ${cityCount} destinos — un par de zapatos versátiles y un bolso que sirvan tanto para caminar como para cenar.`
        : `Lleva una capa compacta y plegable para cambios climáticos inesperados durante tu viaje de ${totalDays} días.`,
    ];
  }
  // English (default)
  return [
    isWarm
      ? `Pack lightweight breathable layers — a linen shirt or cotton tee transitions effortlessly from ${cityName}'s warm days to cooler evenings.`
      : `Build around one versatile outerwear piece that handles ${cityName}'s variable temperatures without adding bulk.`,
    `Choose ${Math.min(3, cityCount)} neutral base colors that mix and match across all ${totalDays} days, maximizing outfit combinations with fewer items.`,
    cityCount > 1
      ? `Select pieces that work across all ${cityCount} destinations — one pair of versatile shoes and one bag that handle both city walks and dining.`
      : `Carry a compact packable layer for unexpected weather changes throughout your ${totalDays}-day trip.`,
  ];
}

// ─── CityInput Parser ─────────────────────────────────────────────────────────

function parseCities(raw: unknown[]): CityInput[] {
  const results: CityInput[] = [];
  for (const c of raw) {
    if (typeof c !== 'object' || c === null) continue;
    const obj = c as Record<string, unknown>;
    if (!obj.name || typeof obj.name !== 'string') continue;
    results.push({
      name: obj.name,
      country: typeof obj.country === 'string' ? obj.country : '',
      days: typeof obj.days === 'number' ? obj.days : 1,
      lat: typeof obj.lat === 'number' ? obj.lat : undefined,
      lon: typeof obj.lon === 'number' ? obj.lon : undefined,
      fromDate: typeof obj.fromDate === 'string' ? obj.fromDate : undefined,
      toDate: typeof obj.toDate === 'string' ? obj.toDate : undefined,
    });
  }
  return results;
}

// ─── runPreview ───────────────────────────────────────────────────────────────

/**
 * Runs the free-tier preview pipeline for a newly created trip.
 *
 * Writes to: generation_jobs (teaser row), trips.status
 * Returns:   PreviewResponse (teaser URL, mood, free capsule, weather/vibe arrays)
 */
export async function runPreview(
  input: TripInput,
  env: Bindings
): Promise<PreviewResponse> {
  const { trip_id, cities: rawCities, month, face_url, user_profile, lang = 'en' } = input;

  console.log(`[runPreview] Starting free preview for trip ${trip_id}`);

  // Mark trip as processing
  await sbPatch(env, `/trips?id=eq.${trip_id}`, { status: 'processing' });

  const cities = parseCities(rawCities);
  if (cities.length === 0) {
    throw new Error(`Trip ${trip_id} has no valid cities in the payload`);
  }

  try {
    // ── 1. Vibe — STATIC (no API call, instant) ─────────────────────────────
    const isWarmMonth = month >= 5 && month <= 9;
    const vibeDb = getVibeDb(lang, isWarmMonth);
    const vibeResults: VibeResult[] = cities.map((city) => {
      const aliases: Record<string, string> = {
        'denpasar': 'bali', 'ubud': 'bali', 'seminyak': 'bali', 'kuta': 'bali', 'canggu': 'bali',
        'nyc': 'new york', 'manhattan': 'new york', 'brooklyn': 'new york',
        'saigon': 'ho chi minh', 'hcmc': 'ho chi minh',
        'firenze': 'florence',
        'sf': 'san francisco',
        'milano': 'milan',
      };
      const key = city.name.toLowerCase().trim();
      const resolvedKey = aliases[key] || key;
      const match = vibeDb[resolvedKey] || { mood: `${city.name} Style`, tags: ['versatile', 'travel-ready', 'stylish'], colors: ['#8B7355', '#C4A882', '#4A5568'], avoid: getDefaultAvoid(lang) };
      return {
        city: city.name,
        mood_label: `${city.name} — ${match.mood}`,
        mood_name: match.mood,
        vibe_tags: match.tags,
        color_palette: match.colors,
        avoid_note: match.avoid,
      };
    });

    const firstVibe = vibeResults[0];
    const gender = user_profile?.gender || 'female';
    const staticBase = 'https://travel-cloth-recommend.pages.dev/examples';
    const fallbackTeaser = gender === 'male'
      ? `${staticBase}/annual-outfit-1.png`
      : `${staticBase}/pro-outfit-1.png`;

    // ── 2. Weather — fast API call (~2s), uses exact travel dates when available ──
    const weatherResults = await Promise.all(
      cities.map(async (city): Promise<WeatherResult> => {
        if (!city.lat || !city.lon) {
          return {
            city: city.name, month,
            temperature_day_avg: 20, temperature_night_avg: 13,
            precipitation_prob: 0.3, climate_band: 'warm',
            style_hint: 'Pack versatile layers for mixed conditions.',
          };
        }
        try {
          return await weatherAgent({
            city: city.name,
            lat: city.lat,
            lon: city.lon,
            month,
            fromDate: city.fromDate,
            toDate: city.toDate,
          }, env);
        } catch (err) {
          console.warn(`[runPreview] Weather failed for ${city.name}:`, (err as Error).message);
          return {
            city: city.name, month,
            temperature_day_avg: 20, temperature_night_avg: 13,
            precipitation_prob: 0.3, climate_band: 'warm',
            style_hint: 'Pack versatile layers for mixed conditions.',
          };
        }
      })
    );

    // NOTE: Teaser generation is NOT awaited here.
    // Gemini takes ~30-40s which exceeds Workers wall-clock timeout.
    // Instead, teaserAgent runs in the background via waitUntil() —
    // see runTeaserBackground() below, called from index.ts.

    // ── 5. Capsule — DETERMINISTIC (no Claude API call) ──────────────────
    // Cost savings: ~$0.006 per preview → $0
    const totalDays = cities.reduce((s, c) => s + c.days, 0);
    const capsuleCount = Math.min(15, Math.max(8, Math.round(totalDays * 1.5)));
    const capsule: CapsuleResult = {
      plan: 'free',
      count: capsuleCount,
      principles: getCapsulePrinciples(
        lang,
        cities[0]?.name || 'the city',
        totalDays,
        cities.length,
        Math.min(3, cities.length),
        isWarmMonth,
      ),
    };

    // ── 6. Mark trip as completed (free stage) ───────────────────────────────
    // teaser_url starts null — will be set by runTeaserBackground() via waitUntil()
    await sbPatch(env, `/trips?id=eq.${trip_id}`, {
      status: 'completed',
      vibe_data: vibeResults,
      weather_data: weatherResults,
      capsule_free: capsule,
    });

    console.log(`[runPreview] Free preview complete for trip ${trip_id} (teaser generating in background)`);

    return {
      trip_id,
      status: 'completed',
      teaser_url: fallbackTeaser,  // immediate response uses fallback; real teaser arrives via polling
      mood_label: firstVibe?.mood_label ?? null,
      capsule,
      vibes: vibeResults,
      weather: weatherResults,
      teaser_error: null,
    };
  } catch (err) {
    await sbPatch(env, `/trips?id=eq.${trip_id}`, { status: 'failed' });
    throw err;
  }
}

// ─── runResult ────────────────────────────────────────────────────────────────

/**
 * Runs the post-payment pipeline after a Polar `order.paid` event.
 *
 * standard → unblur teaser + full capsule + email
 * pro/annual → style prompts + multi-image generation + full capsule + email
 */
export async function runResult(
  tripId: string,
  plan: PlanType,
  userEmail: string,
  env: Bindings
): Promise<void> {
  console.log(`[runResult] Starting ${plan} pipeline for trip ${tripId}`);

  // ── 1. Fetch trip data (vibes + weather stored from runPreview) ─────────────
  const tripRes = await sbFetch(env, `/trips?id=eq.${tripId}&limit=1`);
  if (!tripRes.ok) throw new Error(`[runResult] Failed to fetch trip ${tripId}`);

  const trips = (await tripRes.json()) as Array<Record<string, unknown>>;
  if (trips.length === 0) throw new Error(`[runResult] Trip ${tripId} not found`);

  const trip = trips[0];
  const rawCities = Array.isArray(trip.cities) ? trip.cities : [];
  const cities = parseCities(rawCities);
  // PostgREST may return NUMERIC columns as strings — coerce to number safely
  const month = Number(trip.month) || 1;
  const faceUrl = typeof trip.face_url === 'string' ? trip.face_url : undefined;

  // ── Read user profile from trip row (written by /api/preview on insert) ──
  // PostgREST returns NUMERIC(5,1) as strings (e.g. "180.0") — parse with Number()
  const tripGender   = typeof trip.gender === 'string' ? trip.gender : 'female';
  const tripAesthetics: string[] = Array.isArray(trip.aesthetics) ? (trip.aesthetics as string[]) : [];
  const rawHeight = Number(trip.height_cm);
  const rawWeight = Number(trip.weight_kg);
  const userProfile: UserProfile = {
    gender: (tripGender === 'male' || tripGender === 'non-binary')
      ? (tripGender as 'male' | 'non-binary')
      : 'female',
    height_cm: rawHeight > 0 ? rawHeight : undefined,
    weight_kg: rawWeight > 0 ? rawWeight : undefined,
    aesthetics: tripAesthetics,
  };

  console.log(`[runResult] User profile: gender=${userProfile.gender}, height=${userProfile.height_cm}, weight=${userProfile.weight_kg}, aesthetics=${userProfile.aesthetics.join(',')}, face=${faceUrl ? 'yes' : 'no'}`);

  // Retrieve cached vibe/weather from trip row (set by runPreview)
  const vibeResults: VibeResult[] = Array.isArray(trip.vibe_data)
    ? (trip.vibe_data as VibeResult[])
    : [];
  const weatherResults: WeatherResult[] = Array.isArray(trip.weather_data)
    ? (trip.weather_data as WeatherResult[])
    : [];

  // If vibes are missing (edge case), re-run weather+vibe pipeline
  const finalVibes: VibeResult[] = vibeResults.length > 0
    ? vibeResults
    : await Promise.all(
        cities.map(async (city, i) => {
          const weather = weatherResults[i] ?? {
            city: city.name,
            month,
            temperature_day_avg: 20,
            temperature_night_avg: 13,
            precipitation_prob: 0.3,
            climate_band: 'warm' as const,
            style_hint: '',
          };
          const r = await vibeAgent({ city: city.name, country: city.country, weather }, env);
          return { ...r, city: city.name };
        })
      );

  const finalWeather: WeatherResult[] = weatherResults.length > 0
    ? weatherResults
    : await Promise.all(
        cities.map((city) =>
          city.lat && city.lon
            ? weatherAgent({ city: city.name, lat: city.lat, lon: city.lon, month, fromDate: city.fromDate, toDate: city.toDate }, env)
            : Promise.resolve<WeatherResult>({
                city: city.name,
                month,
                temperature_day_avg: 20,
                temperature_night_avg: 13,
                precipitation_prob: 0.3,
                climate_band: 'warm',
                style_hint: '',
              })
        )
      );

  // ── 2. Annual limit check + usage increment ──────────────────────────────
  if (plan === 'annual') {
    await checkAnnualLimit(userEmail, env);
    await incrementAnnualUsage(userEmail, env);
  }

  // ── 3. Full capsule wardrobe (run BEFORE images so prompts reference actual items) ──
  const totalDays = cities.reduce((s, c) => s + c.days, 0);

  // Non-fatal: capsule errors use a fallback so fulfillmentAgent always runs
  let capsule: Awaited<ReturnType<typeof capsuleAgent>>;
  try {
    capsule = await capsuleAgent(
      {
        vibeResults: finalVibes,
        weather: finalWeather,
        plan,
        cities: cities.map((c) => ({ name: c.name, days: c.days })),
        month,
        tripDays: totalDays,
        userProfile: {
          gender: userProfile.gender,
          height_cm: userProfile.height_cm,
          weight_kg: userProfile.weight_kg,
          aesthetics: userProfile.aesthetics,
        },
      },
      env
    );
  } catch (err) {
    console.error('[runResult] Capsule agent failed — using fallback:', (err as Error).message);
    capsule = {
      plan,
      items: [],
      daily_plan: [],
    } as Awaited<ReturnType<typeof capsuleAgent>>;
  }

  // ── 4. Plan-specific image pipeline ──────────────────────────────────────

  if (plan === 'pro' || plan === 'annual') {
    // Extract per-outfit item lists from capsule daily_plan (for image prompt accuracy)
    const paidCapsule = capsule as import('./capsuleAgent').PaidCapsuleResult;
    const dailyOutfits = paidCapsule.daily_plan ?? [];
    const capsuleItems = paidCapsule.items ?? [];

    // Build outfit descriptions keyed by day index (for styleAgent)
    const outfitDescriptions: Array<{ day: number; city: string; items: string[] }> = dailyOutfits.map((d) => ({
      day: d.day,
      city: d.city,
      items: d.outfit,
    }));

    // a. Generate style prompts via Claude — now includes capsule item references
    const stylePrompts = await styleAgent(
      {
        vibeResults: finalVibes,
        cities: cities.map((c) => c.name),
        weather: finalWeather,
        userProfile,
        outfitDescriptions,
        capsuleItems: capsuleItems.map((i) => ({ name: i.name, category: i.category })),
      },
      env
    );

    // b. Insert generation_jobs rows for each prompt
    const jobInsertRows = stylePrompts.map((sp) => ({
      trip_id: tripId,
      city: sp.city,
      mood: sp.mood,
      prompt: sp.prompt,
      status: 'pending',
      job_type: 'full',
    }));

    let jobIds: Record<string, string> = {};
    try {
      const insertRes = await sbFetch(env, '/generation_jobs', {
        method: 'POST',
        body: JSON.stringify(jobInsertRows),
      });
      if (insertRes.ok) {
        const savedJobs = (await insertRes.json()) as Array<{ id: string; city: string; mood: string }>;
        for (const job of savedJobs) {
          jobIds[`${job.city}/${job.mood}`] = job.id;
        }
      }
    } catch (err) {
      console.warn('[runResult] Failed to insert generation_jobs:', (err as Error).message);
    }

    // c. Use default model image when user hasn't uploaded a photo.
    // Professional model photos produce body-matched outfit looks with Gemini.
    const effectiveFaceUrl = getEffectiveFaceUrl(faceUrl, userProfile.gender);

    // d. Generate images (Promise.allSettled internally — never throws)
    await imageGenAgent(
      {
        prompts: stylePrompts,
        tripId,
        jobIds,
        faceUrl: effectiveFaceUrl,
      },
      env
    );

    // e. Privacy cleanup: delete user-uploaded face only (not default images)
    if (faceUrl) {
      await cleanupFace(tripId, faceUrl, env);
    }
  } else {
    // Standard plan: teaser is already completed — no further image generation.
    // Face cleanup is handled by fulfillmentAgent below.
  }

  // Save capsule_results
  try {
    await sbFetch(env, '/capsule_results', {
      method: 'POST',
      body: JSON.stringify({
        trip_id: tripId,
        ...(capsule.plan !== 'free' ? capsule : {}),
        plan: capsule.plan,
      }),
    });
  } catch (err) {
    console.error('[runResult] Failed to save capsule_results:', (err as Error).message);
  }

  // ── 5. Fulfillment (email + face cleanup + temp R2 cleanup) ──────────────
  //       fulfillmentAgent checks face_url; if already nulled above (pro/annual),
  //       it skips R2 deletion (face_url is null) — safe to call in all cases.
  const galleryUrl = `https://travelscapsule.com/result/${tripId}`;
  await fulfillmentAgent({ tripId, email: userEmail, galleryUrl }, env);

  // ── 6. Growth (share copy + upgrade token) ────────────────────────────────
  const firstVibe = finalVibes[0];
  const moodLabel = firstVibe?.mood_label ?? cities[0]?.name ?? 'Travel Capsule';

  const growth = await growthAgent({ tripId, moodName: moodLabel, plan }, env);

  // Persist growth data on trip row
  await sbPatch(env, `/trips?id=eq.${tripId}`, {
    share_url: growth.share_url,
    upgrade_token: growth.upgrade_token ?? null,
    status: 'completed',
  });

  console.log(`[runResult] ${plan} pipeline complete for trip ${tripId}. Share: ${growth.share_url}`);
}

// ─── City-specific fallback images (used when Gemini fails) ──────────────────
// These are generic fashion editorial images per city — NOT city-landmark photos.
// Ensures users never see a wrong-city fallback (e.g. Paris image for London).
const CITY_FALLBACK_IMAGES: Record<string, { male: string; female: string }> = {
  london:        { male: 'https://images.unsplash.com/photo-1660686935418-22edff8f0625?w=1080', female: 'https://images.unsplash.com/photo-1677592737288-5ffcf72770d1?w=1080' },
  paris:         { male: 'https://images.unsplash.com/photo-1767871893110-f9afbac26294?w=1080', female: 'https://images.unsplash.com/photo-1677592737288-5ffcf72770d1?w=1080' },
  tokyo:         { male: 'https://images.unsplash.com/photo-1609561812031-24e3312230f4?w=1080', female: 'https://images.unsplash.com/photo-1717167172685-374de9c948dd?w=1080' },
  rome:          { male: 'https://images.unsplash.com/photo-1643574546768-05ef9943b25e?w=1080', female: 'https://images.unsplash.com/photo-1536967674045-00c29460c1a7?w=1080' },
  barcelona:     { male: 'https://images.unsplash.com/photo-1624353656309-8be1a6c457be?w=1080', female: 'https://images.unsplash.com/photo-1572030712991-5d489429598a?w=1080' },
  'new york':    { male: 'https://images.unsplash.com/photo-1765816839382-1cc1486398d7?w=1080', female: 'https://images.unsplash.com/photo-1653152987833-1c1aa09ab3dd?w=1080' },
  seoul:         { male: 'https://images.unsplash.com/photo-1609561812031-24e3312230f4?w=1080', female: 'https://images.unsplash.com/photo-1717167172685-374de9c948dd?w=1080' },
  milan:         { male: 'https://images.unsplash.com/photo-1730338022783-0c1410a6989c?w=1080', female: 'https://images.unsplash.com/photo-1551374332-2c48196ae690?w=1080' },
  bali:          { male: 'https://images.unsplash.com/photo-1627361673902-c80df14aecdd?w=1080', female: 'https://images.unsplash.com/photo-1590493298956-fbfef69619ff?w=1080' },
  bangkok:       { male: 'https://images.unsplash.com/photo-1627361673902-c80df14aecdd?w=1080', female: 'https://images.unsplash.com/photo-1590493298956-fbfef69619ff?w=1080' },
  _default:      { male: 'https://images.unsplash.com/photo-1673173044501-0d75c4f8de62?w=1080', female: 'https://images.unsplash.com/photo-1603045720683-5c6840a8eeca?w=1080' },
};

export function getCityFallbackImage(city: string, gender: string): string {
  const key = city.toLowerCase().trim();
  const entry = CITY_FALLBACK_IMAGES[key] || CITY_FALLBACK_IMAGES._default;
  return gender === 'male' ? entry.male : entry.female;
}

// ─── Default Model Images ────────────────────────────────────────────────────
// When user doesn't upload a photo, use these professional model images as
// face references for Gemini. This produces body-matched outfit looks.
const DEFAULT_MODEL_IMAGES = {
  male: 'https://travel-cloth-recommend.pages.dev/defaults/default-male.png',
  female: 'https://travel-cloth-recommend.pages.dev/defaults/default-female.png',
};

/**
 * Returns the effective face URL for image generation.
 * - If user uploaded a photo → use their photo
 * - If no photo → use default model image based on gender
 * - For non-binary → randomly pick male or female model
 */
export function getEffectiveFaceUrl(userFaceUrl: string | undefined, gender: string): string {
  if (userFaceUrl) return userFaceUrl;
  if (gender === 'male') return DEFAULT_MODEL_IMAGES.male;
  if (gender === 'female') return DEFAULT_MODEL_IMAGES.female;
  // non-binary / unknown → random pick
  return Math.random() < 0.5 ? DEFAULT_MODEL_IMAGES.male : DEFAULT_MODEL_IMAGES.female;
}

// ─── runTeaserBackground ──────────────────────────────────────────────────────

/**
 * Generates a teaser image in the background (called via waitUntil).
 * Gemini takes ~30-40s which exceeds Workers' response deadline.
 * waitUntil() allows this to run AFTER the HTTP response is sent.
 *
 * On success: updates trips.teaser_url + inserts generation_jobs row.
 * On failure: inserts generation_jobs with 'failed_fallback' status.
 * Frontend polls GET /api/teaser/:tripId to detect when the image is ready.
 */
export async function runTeaserBackground(
  input: {
    trip_id: string;
    vibeResult: VibeResult;
    face_url?: string;
    gender: string;
    user_profile?: {
      gender?: string;
      height_cm?: number;
      weight_kg?: number;
      aesthetics?: string[];
    };
    fallbackTeaser: string;
  },
  env: Bindings
): Promise<void> {
  const { trip_id, vibeResult, face_url, gender, user_profile, fallbackTeaser } = input;

  // Use default model image when user hasn't uploaded a photo.
  // Professional model photos work well with Gemini and produce body-matched looks.
  const effectiveFaceUrl = getEffectiveFaceUrl(face_url, gender);

  console.log(`[runTeaserBackground] Starting for trip ${trip_id}, city=${vibeResult.city}, gender=${gender}, face=${face_url ? 'user' : 'default'}`);

  let teaserUrl: string | null = null;
  let teaserError: string | null = null;

  try {
    const teaser = await teaserAgent(
      {
        tripId: trip_id,
        vibeResult,
        faceUrl: effectiveFaceUrl,
        userProfile: user_profile
          ? {
              gender: user_profile.gender as 'male' | 'female' | 'non-binary' | undefined,
              height_cm: user_profile.height_cm,
              weight_kg: user_profile.weight_kg,
              aesthetics: user_profile.aesthetics,
            }
          : undefined,
      },
      env
    );
    teaserUrl = teaser.image_url;
    console.log(`[runTeaserBackground] Success for trip ${trip_id}: ${teaserUrl}`);
  } catch (err) {
    teaserError = (err as Error).message;
    // Use city-specific fallback instead of empty string or generic fallback
    teaserUrl = fallbackTeaser || getCityFallbackImage(vibeResult.city ?? '', gender);
    console.error(`[runTeaserBackground] FAILED for trip ${trip_id}:`, teaserError, `| fallback: ${teaserUrl}`);
  }

  // Insert generation_jobs tracking row (frontend polls this via GET /api/teaser/:tripId)
  // This INSERT is critical — if it fails, frontend polls forever. Retry once.
  const jobPayload = {
    trip_id,
    city: vibeResult.city ?? '',
    mood: vibeResult.mood_name ?? '',
    prompt: teaserError
      ? `FAILED: ${teaserError.slice(0, 200)} | mood: ${vibeResult.mood_label ?? 'teaser'}`
      : (vibeResult.mood_label ?? 'teaser'),
    status: teaserError ? 'failed_fallback' : 'completed',
    image_url: teaserUrl,
    job_type: 'teaser',
    attempts: 1,
  };

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await sbFetch(env, '/generation_jobs', {
        method: 'POST',
        body: JSON.stringify(jobPayload),
      });
      if (res.ok) {
        console.log(`[runTeaserBackground] generation_jobs saved for trip ${trip_id} (status=${jobPayload.status})`);
        break;
      }
      const detail = await res.text();
      console.warn(`[runTeaserBackground] generation_jobs INSERT HTTP ${res.status}: ${detail.slice(0, 200)}`);
    } catch (err) {
      console.warn(`[runTeaserBackground] generation_jobs INSERT attempt ${attempt + 1} failed:`, (err as Error).message);
      if (attempt === 0) await new Promise(r => setTimeout(r, 1000)); // retry after 1s
    }
  }
}
