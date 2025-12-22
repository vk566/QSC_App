import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zpunedwsgzijpezpwuih.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwdW5lZHdzZ3ppanBlenB3dWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMTAyNjMsImV4cCI6MjA4MDc4NjI2M30.BuuRuutYeavlC_iSckS_dCoxzpBAGtIqL9HBpV7586I';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // VERY IMPORTANT for mobile
    },
  }
);
