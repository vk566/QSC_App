import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zpunedwsgzijpezpwuih.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwdW5lZHdzZ3ppanBlenB3dWloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIxMDI2MywiZXhwIjoyMDgwNzg2MjYzfQ.OlND0tzmojUIWwzbLrkcYIRGlIuzOGQn-E05zzw00ig";

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Supabase env vars missing");
}

export const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey,
  { auth: { persistSession: false } }
);
