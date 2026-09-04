// Auth helpers over Supabase: OTP code + magic link in one email.
import { getClient } from './supabase.js';
export async function getSession() { const { data } = await getClient().auth.getSession(); return data.session; }
export function onAuthChange(fn) { return getClient().auth.onAuthStateChange((_e, session) => fn(session)); }
export async function sendCode(email) {
  const { error } = await getClient().auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: location.origin + location.pathname } });
  return { error };
}
export async function verifyCode(email, token) {
  const { data, error } = await getClient().auth.verifyOtp({ email, token, type: 'email' });
  return { session: data?.session, error };
}
export async function signOut() { await getClient().auth.signOut(); }
