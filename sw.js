const CACHE_NAME = 'tablet-2026-v13';
const APP_VERSION = 'v13';

const CORE_ASSETS = [
  './index.html',
  './style.css',
  './css/style.css',
  './js/app.js',
  './js/data/products.json',
  './js/modules/quiz-data.js',
  './assets/xiaomi-logo-square.png',
  './assets/mi-logo.png',
  './assets/mi-logo.svg',
  './favicon.ico',
  './favicon-16x16.png',
  './favicon-32x32.png',
  './favicon.svg',
  './apple-touch-icon.png',
  './offline.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // 逐個緩存，失敗不影響整體安裝
        return Promise.allSettled(
          CORE_ASSETS.map(url => cache.add(url).catch(err => {
            console.warn('SW cache skip:', url, err.message);
          }))
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
  // 通知所有客戶端重新載入
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'SW_UPDATED', version: APP_VERSION });
      });
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'skip-waiting') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const isHTMLPage = event.request.mode === 'navigate'
    || (event.request.headers.get('accept') || '').includes('text/html');

  if (isHTMLPage) {
    // HTML: 網絡優先，失敗才用緩存
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match('./offline.html')))
    );
  } else {
    // 靜態資源: 緩存優先
    event.respondWith(
      caches.match(event.request)
        .then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') return response;
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
            return response;
          }).catch(() => new Response('Offline', { status: 503 }));
        })
    );
  }
});
