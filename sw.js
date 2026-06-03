const CACHE = 'almb-v1';
const SHELL = [
  './index.html',
  './manifest.json',
  './icon.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Let cross-origin requests (e.g. frankfurter API) pass through untouched
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(e.request).then(hit => {
      if (hit) return hit;

      return fetch(e.request).then(res => {
        // Cache successful same-origin responses
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      });
    }).catch(() => caches.match('./index.html'))
  );
});
