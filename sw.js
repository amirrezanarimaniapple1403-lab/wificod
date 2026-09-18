// Service Worker for P_Motor Admin (wificod)
const CACHE_NAME = 'pmotor-admin-v4';
const ASSETS_TO_CACHE = [
  '/wificod/',
  '/wificod/index.html',
  '/wificod/manifest.webmanifest',
  '/wificod/icon-192.png',
  '/wificod/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[SW wificod] Cache warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          // فقط کش‌های همین اپ را پاک کن، به بقیه کار نداشته باش
          if (key.startsWith('pmotor-admin-') && key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // درخواست‌های API و سایر ساب‌پوشه‌ها را نادیده بگیر
  if (event.request.url.includes('/api/')) return;
  if (event.request.method !== 'GET') return;

  // فقط درخواست‌های داخل /wificod/ را مدیریت کن
  const url = new URL(event.request.url);
  if (!url.pathname.startsWith('/wificod/')) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/wificod/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/wificod/index.html');
        }
      });
    })
  );
});
