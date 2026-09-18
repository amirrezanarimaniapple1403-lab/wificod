// Service Worker اختصاصی P_Motor Admin (wificod)
const CACHE_NAME = 'pmotor-admin-v1';
const SCOPE_PATH = '/wificod/';
const ASSETS_TO_CACHE = [
  '/wificod/',
  '/wificod/index.html',
  '/wificod/manifest.json',
  '/wificod/icon-192.png',
  '/wificod/icon-512.png',
  '/wificod/icon.svg'
];

self.addEventListener('install', (event) => {
  console.log('[wificod SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[wificod SW] Some assets failed:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[wificod SW] Activating...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          // فقط کش‌های همین اپ (pmotor-admin-*) را پاک کن
          if (key.startsWith('pmotor-admin-') && key !== CACHE_NAME) {
            console.log('[wificod SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // به API و درخواست‌های خارج از محدوده کار نداشته باش
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;

  const url = new URL(event.request.url);
  // فقط درخواست‌های داخلی /wificod/ را مدیریت کن
  if (!url.pathname.startsWith(SCOPE_PATH)) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/wificod/index.html')
      )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, toCache);
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

// Web Push
self.addEventListener('push', (event) => {
  let data = {
    title: 'P_Motor Admin',
    body: 'اطلاعیه جدید از سامانه مدیریت دیاگ',
    icon: '/wificod/icon-192.png'
  };
  if (event.data) {
    try { data = Object.assign(data, event.data.json()); }
    catch { data.body = event.data.text(); }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      tag: 'pmotor-admin-notification'
    })
  );
});
