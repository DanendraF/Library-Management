import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Ensure env is loaded before creating client (routes/services import this file at module-eval time)
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('[supabase] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in backend/.env');
}

export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);


