
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Only initialize if variables are present. This stops the "supabaseUrl is required" error.
export const supabase = (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'undefined') 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
