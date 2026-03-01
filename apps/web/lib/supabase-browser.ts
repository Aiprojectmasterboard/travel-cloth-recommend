import { createBrowserClient } from '@supabase/ssr'

// NEXT_PUBLIC_* values are public by design — safe to embed as fallbacks.
// @cloudflare/next-on-pages evaluates process.env at runtime (Cloudflare bindings),
// not at build time, so inlining from next build may not propagate.
// Fallback values ensure auth always initialises even when Pages env vars are unset.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lmrrawhvjmuexajllint.supabase.co'
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_3_Vzle5e2GXFtLG5d8F69Q_oznMxXm2'

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
