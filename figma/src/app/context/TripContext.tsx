import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import {
  submitPreview,
  fetchResult,
  type PreviewResponse,
  type ResultData,
  type PreviewRequest,
} from "../lib/api";
import { getTurnstileToken } from "../lib/turnstile";
import { useOnboarding } from "./OnboardingContext";
import { useLang } from "./LanguageContext";

// ─── State ─────────────────────────────────────────────────────────────────

interface TripState {
  tripId: string | null;
  preview: PreviewResponse | null;
  result: ResultData | null;
  loading: boolean;
  error: string | null;
  phase: "idle" | "previewing" | "preview_done" | "paid" | "generating" | "ready" | "error";
}

interface TripContextType extends TripState {
  /** Submit onboarding data → run free preview pipeline → returns trip_id */
  startPreview: () => Promise<string>;
  /** Fetch paid result (call after payment) — polls until ready */
  loadResult: (tripId: string) => Promise<ResultData | null>;
  /** Reset state for a new trip */
  reset: () => void;
}

const TripContext = createContext<TripContextType | null>(null);

const TRIP_KEY = "tc_trip_id";
const PREVIEW_KEY = "tc_preview_data";

// ─── Provider ──────────────────────────────────────────────────────────────

export function TripProvider({ children }: { children: ReactNode }) {
  const { data: onboarding } = useOnboarding();
  const { lang } = useLang();

  const [state, setState] = useState<TripState>(() => {
    const savedId = sessionStorage.getItem(TRIP_KEY) || null;
    let savedPreview: PreviewResponse | null = null;
    try {
      const raw = sessionStorage.getItem(PREVIEW_KEY);
      if (raw) savedPreview = JSON.parse(raw);
    } catch { /* ignore */ }

    return {
      tripId: savedId,
      preview: savedPreview,
      result: null,
      loading: false,
      error: null,
      phase: savedPreview ? "preview_done" : savedId ? "paid" : "idle",
    };
  });

  // Persist tripId
  useEffect(() => {
    if (state.tripId) sessionStorage.setItem(TRIP_KEY, state.tripId);
  }, [state.tripId]);

  // ─── startPreview ──────────────────────────────────────────────────────

  const startPreview = useCallback(async (): Promise<string> => {
    setState((s) => ({ ...s, loading: true, error: null, phase: "previewing" }));

    try {
      // Build request from onboarding data
      const cities = onboarding.cities.map((c) => {
        const from = c.fromDate ? new Date(c.fromDate) : new Date();
        const to = c.toDate ? new Date(c.toDate) : new Date(from.getTime() + 7 * 86400000);
        const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000));
        return {
          name: c.city,
          country: c.country,
          days,
          ...(c.lat != null ? { lat: c.lat } : {}),
          ...(c.lon != null ? { lon: c.lon } : {}),
        };
      });

      // Derive month from first city's date
      const firstFrom = onboarding.cities[0]?.fromDate;
      const month = firstFrom ? new Date(firstFrom).getMonth() + 1 : new Date().getMonth() + 1;

      const ht = parseFloat(onboarding.height);
      const wt = parseFloat(onboarding.weight);

      // Get Turnstile token (invisible challenge)
      let turnstileToken: string | undefined;
      try {
        turnstileToken = await getTurnstileToken();
      } catch {
        // Continue without token — worker will reject if required
      }

      const req: PreviewRequest = {
        session_id: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        cities,
        month,
        face_url: onboarding.faceUrl || undefined,
        cf_turnstile_token: turnstileToken,
        gender: onboarding.gender || undefined,
        height_cm: !isNaN(ht) && ht > 0 ? ht : undefined,
        weight_kg: !isNaN(wt) && wt > 0 ? wt : undefined,
        style_preferences: onboarding.aesthetics.length > 0 ? onboarding.aesthetics : undefined,
        lang: lang || "en",
      };

      const preview = await submitPreview(req);

      sessionStorage.setItem(PREVIEW_KEY, JSON.stringify(preview));
      setState((s) => ({
        ...s,
        tripId: preview.trip_id,
        preview,
        loading: false,
        error: null,
        phase: "preview_done",
      }));

      return preview.trip_id;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setState((s) => ({ ...s, loading: false, error: msg, phase: "error" }));
      throw err;
    }
  }, [onboarding]);

  // ─── loadResult ────────────────────────────────────────────────────────

  const loadResult = useCallback(async (tripId: string): Promise<ResultData | null> => {
    setState((s) => ({ ...s, loading: true, error: null, phase: "generating" }));

    const MAX_POLLS = 30;
    const POLL_INTERVAL = 3000;

    for (let i = 0; i < MAX_POLLS; i++) {
      try {
        const result = await fetchResult(tripId);

        // Check if result is ready (has capsule items or images)
        if (
          result.capsule?.items?.length > 0 ||
          result.images?.length > 0 ||
          result.teaser_url
        ) {
          setState((s) => ({
            ...s,
            tripId,
            result,
            loading: false,
            error: null,
            phase: "ready",
          }));
          return result;
        }
      } catch (err) {
        // 402 = payment required (not paid yet), keep waiting
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("402") && i < MAX_POLLS - 1) {
          await new Promise((r) => setTimeout(r, POLL_INTERVAL));
          continue;
        }
        // Other errors on early polls — retry
        if (i < 5) {
          await new Promise((r) => setTimeout(r, POLL_INTERVAL));
          continue;
        }
        setState((s) => ({ ...s, loading: false, error: msg, phase: "error" }));
        return null;
      }

      await new Promise((r) => setTimeout(r, POLL_INTERVAL));
    }

    setState((s) => ({
      ...s,
      loading: false,
      error: "Result generation is taking longer than expected. Please refresh.",
      phase: "error",
    }));
    return null;
  }, []);

  // ─── reset ─────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    sessionStorage.removeItem(TRIP_KEY);
    sessionStorage.removeItem(PREVIEW_KEY);
    setState({
      tripId: null,
      preview: null,
      result: null,
      loading: false,
      error: null,
      phase: "idle",
    });
  }, []);

  return (
    <TripContext.Provider value={{ ...state, startPreview, loadResult, reset }}>
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error("useTrip must be used within TripProvider");
  return ctx;
}
