// Ma'rifat Cup — Service Worker (offline cache + PWA support)
const CACHE_NAME = 'marifat-cup-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './404.html'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // GA, GitHub API kabi tashqi so'rovlar uchun cache ishlatmaymiz
  if (!e.request.url.startsWith(self.location.origin)) return;
  if (e.request.method !== 'GET') return;
  // marifat-content.json — har doim yangi (admin kontentni yangilaganda darhol ko'rinishi uchun)
  if (e.request.url.includes('marifat-content.json')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(resp => {
        if (resp && resp.status === 200) {
          const respClone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, respClone));
        }
        return resp;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// Push notification qabul qilish (kelajakda)
self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title || "Ma'rifat Cup", {
      body: data.body || '',
      icon: data.icon || '/icon.png',
      badge: data.badge || '/badge.png',
      data: data.url || './'
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data || './'));
});
