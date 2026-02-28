// api.ts — Worker API call helpers (all business logic goes to Cloudflare Worker)
// SECURITY: Only NEXT_PUBLIC_* variables used here — no secrets.

import type {
  CityInput,
  PreviewResponse,
  CheckoutResponse,
  CapsuleItem,
  DayPlan,
  VibeResult,
  WeatherResult,
  TeaserResult,
  GrowthResult,
} from '../../../packages/types'

const BASE_URL = process.env.NEXT_PUBLIC_WORKER_URL ?? ''

// ─── Generic helpers ──────────────────────────────────────────────────────────

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

// ─── Domain Types ─────────────────────────────────────────────────────────────

export type { CityInput }

export interface ResultData {
  trip_id: string
  plan: 'standard' | 'pro' | 'annual'
  cities: CityInput[]
  month: number
  weather: WeatherResult[]
  vibes: VibeResult[]
  capsule: {
    items: CapsuleItem[]
    daily_plan: DayPlan[]
  }
  images: Array<{
    city: string
    url: string
    index: number
  }>
  growth: GrowthResult
  created_at: string
}

export interface TripPreviewInput {
  cities: CityInput[]
  month: number
  cf_turnstile_token: string
}

// ─── Typed API calls ──────────────────────────────────────────────────────────

/**
 * Submit trip preview request. Returns trip_id plus free preview data.
 * Called from app/trip/page.tsx on form submit.
 */
export async function submitPreview(
  body: TripPreviewInput
): Promise<PreviewResponse> {
  return apiPost<PreviewResponse>('/api/preview', body)
}

/**
 * Capture user email after viewing free preview.
 * Enables future style update emails.
 */
export async function submitEmail(tripId: string, email: string): Promise<void> {
  await apiPost<{ ok: boolean }>('/api/email', { trip_id: tripId, email })
}

/**
 * Initiate Polar checkout. Returns checkout_url to redirect the user.
 */
export async function createCheckout(
  tripId: string,
  plan: 'standard' | 'pro' | 'annual'
): Promise<CheckoutResponse> {
  return apiPost<CheckoutResponse>('/api/checkout', { trip_id: tripId, plan })
}

/**
 * Fetch full paid results for a completed trip.
 */
export async function getResult(tripId: string): Promise<ResultData> {
  return apiGet<ResultData>(`/api/result/${tripId}`)
}

/**
 * Upgrade Standard → Pro using the HMAC upgrade_token from the growth agent.
 */
export async function upgradeTrip(
  tripId: string,
  upgradeToken: string
): Promise<void> {
  await apiPost<{ ok: boolean }>('/api/upgrade', {
    trip_id: tripId,
    upgrade_token: upgradeToken,
  })
}

/**
 * Fetch preview data for an existing trip (free tier, no auth needed).
 */
export async function getPreview(tripId: string): Promise<PreviewResponse> {
  return apiGet<PreviewResponse>(`/api/preview/${tripId}`)
}

/**
 * Upload user photo directly to Worker (which stores in R2 temp path).
 * Returns the face_url for use in the trip submission.
 * SECURITY: Photo is treated as sensitive — no client-side caching.
 */
export async function uploadPhoto(file: File): Promise<{ face_url: string }> {
  const formData = new FormData()
  formData.append('photo', file)

  const res = await fetch(`${BASE_URL}/api/upload-photo`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error(`Photo upload error ${res.status}`)
  return res.json() as Promise<{ face_url: string }>
}
