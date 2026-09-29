/* AdversaryAI service worker — app-shell caching for installability + resilience.
 *
 * Strategy:
 *  - /api/* and non-GET: network only, never cached.
 *  - /app/assets/* (Vite hashed, immutable): cache-first.
 *  - navigations + everything else: network-first, cache fallback (offline works).
 *
 * HTML is always revalidated from the network when online, so deploys
 * propagate immediately; the cache only ever serves as an offline fallback.
 */

const VERSION = 'adversaryai-31406be2f8';
const HASHED_ASSETS = /\/app\/assets\//;
// Big, rarely-changing files (3D models, vendored SDKs) live in a cache that survives deploys.
const STABLE = 'adversaryai-stable-v1';
const STABLE_PATHS = /^\/(models\/|app\/vendor\/)/;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== STABLE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return; // never cache API traffic

  if (HASHED_ASSETS.test(url.pathname) || STABLE_PATHS.test(url.pathname)) {
    event.respondWith(
      caches.open(STABLE_PATHS.test(url.pathname) ? STABLE : VERSION).then((cache) =>
        cache.match(request).then(
          (hit) =>
            hit ||
            fetch(request).then((res) => {
              if (res.ok) cache.put(request, res.clone());
              return res;
            }),
        ),
      ),
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((cache) => {
          if (res.ok) cache.put(request, copy);
        });
        return res;
      })
      .catch(() =>
        caches
          .match(request)
          .then((hit) => hit || caches.match('/app/')),
      ),
  );
});
