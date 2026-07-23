const CACHE_NAME = 'tablet-2026-v15';
const APP_VERSION = 'v15';

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

  const url = new URL(event.request.url);

  // sw.js 永遠走網絡（確保新版 SW 能被下載）
  if (url.pathname.endsWith('/sw.js') || url.pathname === '/sw.js' || url.pathname.endsWith('sw.js')) {
    event.respondWith(fetch(event.request));
    return;
  }

  const isHTMLPage = event.request.mode === 'navigate'
    || (event.request.headers.get('accept') || '').includes('text/html');

  if (isHTMLPage) {
    // HTML: 永遠走網絡，不緩存 HTML
    event.respondWith(fetch(event.request));
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
