// Small persistent cache + offline write queue backed by localStorage.
const PREFIX = 'avicenna:';
const safe = (fn, fallback) => { try { return fn(); } catch (_) { return fallback; } };

export const cache = {
  get(key, maxAgeMs = Infinity) {
    const raw = safe(() => localStorage.getItem(PREFIX + key), null);
    if (!raw) return null;
    const { t, v } = safe(() => JSON.parse(raw), {});
    if (!t || Date.now() - t > maxAgeMs) return null;
    return v;
  },
  set(key, v) { safe(() => localStorage.setItem(PREFIX + key, JSON.stringify({ t: Date.now(), v }))); return v; },
  del(key) { safe(() => localStorage.removeItem(PREFIX + key)); },
  clear() { safe(() => Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).forEach((k) => localStorage.removeItem(k))); },
};

// Stale-while-revalidate: return cached value immediately (if any) and refresh in the background.
export async function swr(key, fetcher, { maxAge = 6 * 3600 * 1000, onUpdate } = {}) {
  const cached = cache.get(key, maxAge);
  const refresh = fetcher().then((v) => { cache.set(key, v); onUpdate?.(v); return v; }).catch((err) => { if (cached == null) throw err; return cached; });
  return cached != null ? cached : refresh;
}

// Offline queue: writes that can be replayed later (RSVP, likes, comments…).
const QKEY = 'queue';
export const queue = {
  list() { return cache.get(QKEY) || []; },
  push(item) { const q = queue.list(); q.push({ ...item, id: crypto.randomUUID(), at: Date.now() }); cache.set(QKEY, q); },
  remove(id) { cache.set(QKEY, queue.list().filter((i) => i.id !== id)); },
  async flush(handler) {
    for (const item of queue.list()) {
      try { await handler(item); queue.remove(item.id); } catch (_) { /* keep for next time */ }
    }
  },
};

export const prefs = {
  get(key, fallback = null) { const v = cache.get('pref:' + key); return v == null ? fallback : v; },
  set(key, v) { cache.set('pref:' + key, v); },
};
