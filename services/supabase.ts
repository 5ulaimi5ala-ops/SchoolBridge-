import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// We ensure the client is only initialized if credentials exist to avoid crashing on boot
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

if (!supabase) {
  console.warn('Supabase credentials (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing. Authentication and database features will be disabled. Please set them in the app settings.');
}
