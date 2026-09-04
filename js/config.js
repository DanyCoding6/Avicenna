// Supabase project settings. The anon key is safe to ship in the client: row-level security protects data.
// Leave both empty to run the app in demo mode with local sample data.
export const SUPABASE_URL = '';
export const SUPABASE_ANON_KEY = '';
export const APP_VERSION = '1.0.0';
export const DEMO = !SUPABASE_URL || !SUPABASE_ANON_KEY;
