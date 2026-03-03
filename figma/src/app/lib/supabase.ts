import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  (import.meta.env as Record<string, string>).VITE_SUPABASE_URL ||
  'https://lmrrawhvjmuexajllint.supabase.co';

// Publishable anon key — safe to include in client bundle (RLS protects data)
const SUPABASE_ANON_KEY =
  (import.meta.env as Record<string, string>).VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtcnJhd2h2am11ZXhhamxsaW50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwOTYyNTIsImV4cCI6MjA4NzY3MjI1Mn0.ykK91Agf2qTwLUr8NN_Zfya7TZucs9Xyyg9t1x_97ic';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
