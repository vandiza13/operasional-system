// OPS Reimbursement - Service Worker
const CACHE_NAME = 'ops-cache-v1';
const OFFLINE_URL = '/offline.html';

// Asset statis yang akan di-precache saat install
const PRECACHE_ASSETS = [
  OFFLINE_URL,
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install: precache asset penting
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Langsung aktifkan SW baru tanpa menunggu tab lama ditutup
  self.skipWaiting();
});

// Activate: hapus cache lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Ambil kontrol semua tab yang sudah terbuka
  self.clients.claim();
});

// Fetch: Network-first untuk navigasi & API, Cache-first untuk asset statis
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Hanya handle GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension dan non-http requests
  if (!request.url.startsWith('http')) return;

  // Navigasi (halaman HTML) → Network first dengan offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache halaman yang berhasil di-fetch
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Coba ambil dari cache dulu
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // API requests (/api/*) → Network only, jangan di-cache
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Anda sedang offline' }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      })
    );
    return;
  }

  // Asset statis (gambar, CSS, JS, font) → Cache first
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Refresh cache di background
        fetch(request).then((response) => {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, response);
          });
        }).catch(() => {});
        return cachedResponse;
      }

      // Belum ada di cache, fetch dari network
      return fetch(request).then((response) => {
        // Cache response jika valid
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        // Fallback untuk gambar yang gagal
        if (request.destination === 'image') {
          return new Response('', { status: 404 });
        }
        return new Response('', { status: 503 });
      });
    })
  );
});
