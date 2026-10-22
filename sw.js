// ============================================================================
// BOOKINGS — SERVICE WORKER (OFFLINE PWA CACHE)
// ============================================================================
const CACHE_NAME = 'bookings-v9';

// Support manual skipWaiting trigger from app update bar
self.addEventListener('message', (event) => {
  if (event.data && (event.data.action === 'skipWaiting' || event.data.type === 'SKIP_WAITING')) {
    self.skipWaiting();
  }
});

const STATIC_ASSETS = [
  './',
  './index.html',
  './config.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600..800&family=DM+Sans:ital,opsz,wght@0,9..40,400..700;1,9..40,400..700&display=swap'
];

// Install: Cache core app shell and fonts
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[ServiceWorker] Pre-caching offline app shell');
      // Cache each asset safely
      for (const url of STATIC_ASSETS) {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn('[ServiceWorker] Pre-cache asset skipped:', url, err);
        }
      }
    })
  );
});

// Activate: Purge old cache versions and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache version:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-first for app shell with offline cache fallback;
// Cache-first for fonts & static libraries.
// Never intercept Supabase REST API or WebSocket calls (handled by app IndexedDB).
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Allow Supabase REST & Auth API calls to pass directly through to network
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  // Google fonts and jsdelivr: Cache-first with network fallback
  if (url.origin.includes('fonts.gstatic.com') || url.origin.includes('jsdelivr.net')) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // App Shell & Local Assets: Network-first with offline cache fallback
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', clone));
          }
          return response;
        })
        .catch(() => {
          console.log('[ServiceWorker] Network offline, serving cached index.html');
          return caches.match('./index.html').then((cached) => {
            return cached || caches.match('./');
          });
        })
    );
    return;
  }

  // Default asset handler: Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkResponse;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});

// Message listener for skipWaiting trigger
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
