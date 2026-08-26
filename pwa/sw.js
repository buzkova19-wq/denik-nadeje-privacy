const CACHE = 'denik-nadeje-ios-pwa-v1';
const CORE = ['./', './index.html', './manifest.json', './icon.png', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const u = new URL(event.request.url);
  if (u.hostname === 'upload.wikimedia.org') {
    event.respondWith(caches.open(CACHE).then(async cache => {
      const cached = await cache.match(event.request);
      const network = fetch(event.request).then(resp => { cache.put(event.request, resp.clone()); return resp; }).catch(() => cached);
      return cached || network;
    }));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
