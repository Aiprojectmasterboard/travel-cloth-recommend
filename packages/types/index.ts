// ─── Scalar Union Types ───────────────────────────────────────────────────────

export type PlanType = 'standard' | 'pro' | 'annual';
export type TripStatus = 'pending' | 'processing' | 'completed' | 'expired';
export type JobType = 'teaser' | 'full';
export type ClimateBand = 'cold' | 'mild' | 'warm' | 'hot' | 'rainy';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type Gender = 'male' | 'female' | 'other';
export type AestheticStyle =
  | 'casual' | 'minimalist' | 'streetwear' | 'classic'
  | 'sporty' | 'bohemian' | 'business';

// ─── Input Types ──────────────────────────────────────────────────────────────

export interface CityInput {
  name: string;
  country: string;
  lat?: number;
  lon?: number;
  days?: number;
  start_date?: string;  // ISO date e.g. "2026-05-12"
  end_date?: string;    // ISO date e.g. "2026-05-18"
}

export interface TripInput {
  session_id: string;
  cities: CityInput[];
  month: number;
  face_url?: string;
  gender?: Gender;
  height_cm?: number;
  weight_kg?: number;
  aesthetic?: AestheticStyle[];
  cf_turnstile_token: string;
}

// ─── Agent Result Types ───────────────────────────────────────────────────────

export interface WeatherResult {
  city: string;
  /** Travel month (1–12) */
  month?: number;
  temperature_day_avg: number;
  temperature_night_avg: number;
  precipitation_prob: number;
  /** Optional: temperature swing between day and night highs */
  diurnal_swing?: number;
  climate_band: ClimateBand;
  style_hint: string;
}

export interface VibeResult {
  city: string;
  /** Combined label e.g. "Paris — Rainy Chic" */
  mood_label?: string;
  /** Short mood name e.g. "Rainy Chic" */
  mood_name: string;
  vibe_tags: string[];     // 3-5 adjective tags
  color_palette: string[]; // hex codes, 3-5 values
  avoid_note: string;
}

export interface TeaserResult {
  city: string;
  teaser_url: string;
  expires_at: string; // ISO 8601
  watermark: true;
}

export interface CapsuleItem {
  name: string;
  category: string;
  why: string;
  versatility_score: number;
}

export interface DayPlan {
  day: number;
  city: string;
  outfit: string[];
  note: string;
}

export interface CapsuleResult {
  // Free / teaser mode fields
  count?: number;
  principles?: string[];
  // Paid / full mode fields
  items?: CapsuleItem[];
  daily_plan?: DayPlan[];
}

export interface StylePrompts {
  city: string;
  mood: string;
  prompt: string;
  negative_prompt: string;
}

export interface GeneratedImage {
  city: string;
  url: string;
  index: number;
}

export interface GeneratedImages {
  trip_id: string;
  images: GeneratedImage[];
}

export interface GrowthResult {
  share_url: string;
  upgrade_token: string;
  social_copies: {
    instagram: string;
    twitter: string;
    kakao: string;
  };
}

export interface ShareResult {
  trip_id: string;
  share_url: string;
  og_title: string;
  og_description: string;
  teaser_url: string;
  mood_name: string;
}

export interface UsageRecord {
  id: string;
  user_email: string;
  plan: string;
  trip_count: number;
  period_start: string;
  period_end: string;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface PreviewResponse {
  trip_id: string;
  weather: WeatherResult[];
  vibes: VibeResult[];
  teaser: TeaserResult;
  capsule: CapsuleResult;
  expires_at: string;
}

export interface CheckoutResponse {
  checkout_url: string;
  checkout_id: string;
}

// ─── DB Row Types ─────────────────────────────────────────────────────────────

export interface Trip {
  id: string;
  session_id: string;
  cities: CityInput[];
  month: number;
  face_url?: string;
  gender?: Gender;
  height_cm?: number;
  weight_kg?: number;
  aesthetic?: AestheticStyle[];
  status: TripStatus;
  expires_at: string;
  created_at: string;
}

export interface Order {
  id: string;
  polar_order_id: string;
  trip_id: string;
  plan: PlanType;
  amount: number;
  upgrade_from?: string;
  status: string;
  created_at: string;
}

export interface GenerationJob {
  id: string;
  trip_id: string;
  city: string;
  job_type: JobType;
  prompt: string;
  status: JobStatus;
  image_url?: string;
  attempts: number;
  created_at: string;
}

export interface CityVibe {
  id: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  vibe_cluster: string;
  style_keywords: string[];
  mood_name: string;
}
