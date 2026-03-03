import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  (import.meta.env as Record<string, string>).VITE_SUPABASE_URL ||
  'https://lmrrawhvjmuexajllint.supabase.co';

const SUPABASE_ANON_KEY =
  (import.meta.env as Record<string, string>).VITE_SUPABASE_ANON_KEY ||
  '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
