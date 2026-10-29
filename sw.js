/* Spots service worker — makes the board work with no network after first load.
   Bump CACHE whenever you change index.html, so phones pick the new version up. */
const CACHE = 'spots-v4';

const SHELL = [
  '.',
  'index.html',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png'
];

// Read sounds.json at install time so every audio file gets precached by name.
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(SHELL).catch(() => {});
    try {
      const res = await fetch('sounds/sounds.json', { cache: 'reload' });
      await cache.put('sounds/sounds.json', res.clone());
      const list = await res.json();
      await Promise.all(
        list.map(s => cache.add('sounds/' + s.file).catch(() => {}))
      );
    } catch (_) { /* first load offline — runtime caching will fill in later */ }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  const url = new URL(req.url);
  const isAudio = url.pathname.includes('/sounds/') && !url.pathname.endsWith('.json');

  if (isAudio) {
    // Audio never changes under a given filename — serve from cache instantly.
    e.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      const res = await fetch(req);
      if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
      return res;
    })());
    return;
  }

  // Everything else: try the network so edits show up, fall back to cache offline.
  e.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
      return res;
    } catch (_) {
      return (await caches.match(req)) || (await caches.match('index.html'));
    }
  })());
});
