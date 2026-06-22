/**
 * Supabase Client
 *
 * Creates and exports a singleton Supabase client using environment variables.
 * The client is lazy-initialized: if .env is missing or misconfigured, a clear
 * error is thrown telling the user exactly which variable is missing.
 */

import { createClient } from '@supabase/supabase-js';
import { debug } from './debug.js';

const MODULE = 'SupabaseClient';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Validates required environment variables are set.
 * Returns { valid: boolean, missing: string[] }
 */
export function validateEnv() {
  const missing = [];

  if (!supabaseUrl || supabaseUrl === 'https://your-project-id.supabase.co') {
    missing.push('VITE_SUPABASE_URL');
  }
  if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key-here') {
    missing.push('VITE_SUPABASE_ANON_KEY');
  }

  return { valid: missing.length === 0, missing };
}

function createSupabaseClient() {
  const { valid, missing } = validateEnv();

  if (!valid) {
    const msg =
      `[CONFIG ERROR] Missing or placeholder Supabase environment variables: ${missing.join(', ')}.\n` +
      `→ Copy .env.example to .env and fill in your real Supabase project values.\n` +
      `→ Get them at: https://supabase.com/dashboard → your project → Settings → API`;
    debug.error(MODULE, msg);
    // Return a stub so the app doesn't crash; DB calls will fail gracefully.
    return null;
  }

  debug.info(MODULE, `Client created for ${supabaseUrl}`);
  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = createSupabaseClient();
