// ─── Enums ───────────────────────────────────────────────────────────────────

export type TripStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type OrderStatus = 'pending' | 'paid' | 'refunded';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ClimateBand = 'cold' | 'mild' | 'warm' | 'hot' | 'rainy';

// ─── Core Domain Types ────────────────────────────────────────────────────────

export interface CityInput {
  name: string;
  country: string;
  days: number;
  lat?: number;
  lon?: number;
}

export interface Trip {
  id: string;
  session_id: string;
  cities: CityInput[];
  month: number;
  face_url?: string;
  status: TripStatus;
  created_at: string;
  updated_at?: string;
}

export interface Order {
  id: string;
  polar_order_id: string;
  trip_id: string;
  status: OrderStatus;
  amount: number;
  created_at?: string;
}

export interface GenerationJob {
  id: string;
  trip_id: string;
  city: string;
  mood: string;
  prompt: string;
  status: JobStatus;
  image_url?: string;
  attempts: number;
  created_at?: string;
  updated_at?: string;
}

export interface CapsuleItem {
  name: string;
  category: string;
  why: string;
  versatility_score: number;
}

export interface DailyPlan {
  day: number;
  city: string;
  outfit: string[];
  note: string;
}

export interface CapsuleResult {
  id: string;
  trip_id: string;
  items: CapsuleItem[];
  daily_plan: DailyPlan[];
  created_at?: string;
}

export interface CityVibe {
  city: string;
  country: string;
  lat: number;
  lon: number;
  vibe_cluster: string;
  style_keywords: string[];
}

export interface ClimateData {
  city: string;
  month: number;
  temp_min: number;
  temp_max: number;
  precipitation: number;
  vibe_band: ClimateBand;
}

export interface StylePrompt {
  city: string;
  mood: string;
  prompt_en: string;
  negative_prompt: string;
}
