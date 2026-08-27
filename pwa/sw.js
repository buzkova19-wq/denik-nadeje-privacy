const CACHE = 'denik-nadeje-ios-pwa-v2';
const CORE = ['./', './index.html', './manifest.json', './icon.png', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const u = new URL(event.request.url);

  if (u.hostname === 'upload.wikimedia.org') {
    event.respondWith(caches.open(CACHE).then(async cache => {
      const cached = await cache.match(event.request);
      const network = fetch(event.request)
        .then(resp => { if (resp && resp.ok) cache.put(event.request, resp.clone()); return resp; })
        .catch(() => cached);
      return cached || network;
    }));
    return;
  }

  // U vlastní aplikace zkus nejdřív síť, aby testeři dostali aktualizaci rychle.
  if (u.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .then(resp => {
          if (resp && resp.ok) {
            const copy = resp.clone();
            caches.open(CACHE).then(cache => cache.put(event.request, copy));
          }
          return resp;
        })
        .catch(() => caches.match(event.request).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
