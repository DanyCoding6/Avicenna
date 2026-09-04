// Data facade. Demo mode when config.js has no Supabase credentials.
import { DEMO } from './config.js';
export let api = null;
export async function initData() {
  if (DEMO) { ({ api } = await import('./data/demo.js')); }
  else { ({ api } = await import('./data/supabase.js')); }
  return api;
}
