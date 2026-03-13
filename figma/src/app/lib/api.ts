import { supabase } from './supabase'

export const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'https://travel-capsule-worker.netson94.workers.dev'

/** Get the current Supabase access token if user is logged in */
async function getAuthToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  } catch {
    return null
  }
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const token = await getAuthToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(WORKER_URL + path, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API error ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export async function apiGet<T>(path: string): Promise<T> {
  const token = await getAuthToken()
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(WORKER_URL + path, { headers })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API error ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

// ─── API Types ──────────────────────────────────────────────────────────────

export interface DailyForecast {
  date: string
  temperature_max: number
  temperature_min: number
  precipitation_mm: number
  climate_band: 'cold' | 'mild' | 'warm' | 'hot' | 'rainy'
}

export interface WeatherData {
  city: string
  month: number
  temperature_day_avg: number
  temperature_night_avg: number
  precipitation_prob: number
  climate_band: 'cold' | 'mild' | 'warm' | 'hot' | 'rainy'
  style_hint: string
  daily_forecast?: DailyForecast[]
}

export interface VibeData {
  city?: string
  mood_label: string   // "Paris — Rainy Chic"
  mood_name: string    // "Rainy Chic"
  vibe_tags: string[]
  color_palette: string[]
  avoid_note: string
}

export interface CapsuleItem {
  name: string
  category: string
  color?: string
  material?: string
  fit?: string
  formality?: string
  water_resistant?: boolean
  why: string
  versatility_score: number
}

export interface DayPlan {
  day: number
  city: string
  outfit: string[]
  note: string
}

export interface CapsuleData {
  count?: number
  principles?: string[]
  items: CapsuleItem[]
  daily_plan: DayPlan[]
}

export interface ResultImage {
  city: string
  url: string
  index: number
}

export interface GrowthData {
  share_url: string
  social_copies: { instagram: string; twitter: string; kakao: string }
}

// Response from POST /api/preview
export interface PreviewResponse {
  trip_id: string
  teaser_url: string
  mood_label: string
  capsule: { count: number; principles: string[] }
  vibes: VibeData[]
  weather: WeatherData[]
  /** Non-null if teaser AI generation failed (diagnostic info) */
  teaser_error?: string | null
}

// Response from GET /api/result/:tripId
export interface GridImage {
  city: string
  image_url: string
}

export interface ResultData {
  trip_id: string
  plan: 'pro' | 'annual'
  cities: Array<{ name: string; country: string; lat?: number; lon?: number; days?: number }>
  month: number
  weather: WeatherData[]
  vibes: VibeData[]
  capsule: CapsuleData
  images: ResultImage[]
  /** 2x2 grid images generated per city (Pro/Annual plans) */
  grid_images?: GridImage[]
  teaser_url: string
  growth: GrowthData
  status?: string
  gallery_url?: string
  gender?: string
  height_cm?: number
  weight_kg?: number
  aesthetics?: string[]
}

// Request for POST /api/preview
export interface PreviewRequest {
  session_id: string
  cities: Array<{ name: string; country: string; lat?: number; lon?: number; days?: number }>
  month: number
  face_url?: string
  cf_turnstile_token?: string
  gender?: string
  height_cm?: number
  weight_kg?: number
  style_preferences?: string[]
  lang?: string
}

// ─── Typed API functions ────────────────────────────────────────────────────

export function submitPreview(data: PreviewRequest): Promise<PreviewResponse> {
  return apiPost<PreviewResponse>('/api/preview', data)
}

export function fetchResult(tripId: string): Promise<ResultData> {
  return apiGet<ResultData>(`/api/result/${tripId}`)
}

export function captureEmail(tripId: string, email: string): Promise<{ ok: boolean }> {
  return apiPost<{ ok: boolean }>('/api/preview/email', { trip_id: tripId, email })
}

export interface RegenResponse {
  ok: boolean
  image_url: string
  city: string
}

export function regenerateOutfit(tripId: string, city: string): Promise<RegenResponse> {
  return apiPost<RegenResponse>('/api/regenerate', { trip_id: tripId, city })
}

export interface TeaserStatus {
  status: 'pending' | 'ready' | 'fallback' | 'partial'
  teaser_url: string | null
  teaser_urls?: string[]
  total_expected?: number
  completed?: number
}

export function pollTeaser(tripId: string): Promise<TeaserStatus> {
  return apiGet<TeaserStatus>(`/api/teaser/${tripId}`)
}

/** Fire-and-forget: trigger teaser generation (long request ~30-50s) */
export function triggerTeaserGeneration(tripId: string): void {
  // Use raw fetch with no timeout — Gemini takes 30-50s
  // Don't use apiPost (has auth headers that may complicate things)
  fetch(WORKER_URL + '/api/teaser/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trip_id: tripId }),
  }).then(res => {
    if (!res.ok) {
      res.text().then(t => console.error('[triggerTeaserGeneration] Error:', res.status, t.slice(0, 200)));
    } else {
      console.log('[triggerTeaserGeneration] Completed for trip:', tripId);
    }
  }).catch(err => {
    console.error('[triggerTeaserGeneration] Network error:', err.message);
  })
}
