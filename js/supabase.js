// Supabase client singleton (uses the vendored UMD build loaded in index.html).
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
let client = null;
export function getClient() {
  if (!client) {
    if (!window.supabase) throw new Error('Supabase library not loaded');
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' } });
  }
  return client;
}
