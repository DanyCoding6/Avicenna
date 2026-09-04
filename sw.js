/* Avicenna service worker — app shell precache + stale-while-revalidate for data. */
const VERSION = 'v1.2.0';
const SHELL = `avicenna-shell-${VERSION}`;
const DATA = `avicenna-data-${VERSION}`;
const IMAGES = 'avicenna-images';

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/brand.css', './css/tokens.css', './css/base.css', './css/components.css', './css/views.css',
  './js/app.js', './js/config.js', './js/brand.js', './js/router.js', './js/store.js', './js/ui.js', './js/format.js', './js/icons.js',
  './js/data.js', './js/data/demo.js', './js/data/supabase.js', './js/demo-data.js', './js/supabase.js', './js/auth.js',
  './js/components/index.js',
  './js/views/signin.js', './js/views/home.js', './js/views/events.js', './js/views/event.js', './js/views/opportunities.js',
  './js/views/programme.js', './js/views/coaching.js', './js/views/curriculum.js', './js/views/project.js',
  './js/views/mentorship.js', './js/views/chaplaincy.js', './js/views/hub.js', './js/views/directory.js',
  './js/views/feed.js', './js/views/space.js', './js/views/journal.js', './js/views/profile.js', './js/views/scholar.js',
  './js/views/post.js', './js/views/thread.js', './js/views/staff.js', './js/views/scholarship.js', './js/components/form.js',
  './js/views/staff/shared.js', './js/views/staff/inbox.js', './js/views/staff/events.js', './js/views/staff/announcements.js', './js/views/staff/opportunities.js', './js/views/staff/journal.js', './js/views/staff/scholars.js', './js/views/staff/coaching.js',
  './js/vendor/supabase.js',
  './fonts/cormorant-garamond-latin-600-normal.woff2', './fonts/cormorant-garamond-latin-600-italic.woff2',
  './fonts/ibm-plex-sans-latin-400-normal.woff2', './fonts/ibm-plex-sans-latin-500-normal.woff2', './fonts/ibm-plex-sans-latin-600-normal.woff2',
  './fonts/ibm-plex-mono-latin-500-normal.woff2',
  './icons/favicon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    // Add individually so one missing optional file does not fail the whole install.
    await Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => null)));
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => (k.startsWith('avicenna-shell-') && k !== SHELL) || (k.startsWith('avicenna-data-') && k !== DATA)).map((k) => caches.delete(k)));
    if (self.registration.navigationPreload) { try { await self.registration.navigationPreload.enable(); } catch (_) {} }
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

const isSupabase = (url) => /\.supabase\.(co|in)$/.test(url.hostname);

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Navigations: shell first, network to refresh.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL);
      const cached = await cache.match('./index.html');
      try {
        const preload = await event.preloadResponse;
        const fresh = preload || await fetch(req);
        if (fresh && fresh.ok) cache.put('./index.html', fresh.clone());
        return cached || fresh;
      } catch (_) {
        return cached || Response.error();
      }
    })());
    return;
  }

  // Same-origin static: cache first.
  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const fresh = await fetch(req);
        if (fresh.ok) cache.put(req, fresh.clone());
        return fresh;
      } catch (_) { return Response.error(); }
    })());
    return;
  }

  // Supabase REST/storage GETs: stale-while-revalidate (auth endpoints excluded).
  if (isSupabase(url) && !url.pathname.startsWith('/auth/')) {
    const bucket = url.pathname.startsWith('/storage/') ? IMAGES : DATA;
    event.respondWith((async () => {
      const cache = await caches.open(bucket);
      const cached = await cache.match(req);
      const network = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
      return cached || (await network) || Response.error();
    })());
  }
});
