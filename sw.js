// Service Worker for Failure Logic Application
const CACHE_NAME = 'failure-logic-v1.0.6';
const BASE_PATH = (() => {
  const path = self.location.pathname;
  const m = path.match(/^(\/[^\/]+\/)/);
  return m ? m[1] : '/';
})();
const urlsToCache = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + 'manifest.json',
  BASE_PATH + '404.html',
  BASE_PATH + 'assets/css/normalize.css',
  BASE_PATH + 'assets/css/main.css',
  BASE_PATH + 'assets/css/components.css',
  BASE_PATH + 'assets/css/game-styles.css',
  BASE_PATH + 'assets/css/turn-based-game.css',
  BASE_PATH + 'assets/css/enhanced-interaction-styles.css',
  BASE_PATH + 'assets/js/api-config-manager.js',
  BASE_PATH + 'assets/js/app.js',
  BASE_PATH + 'assets/js/event-bus.js',
  BASE_PATH + 'assets/js/app-core.js',
  BASE_PATH + 'assets/js/html-sanitizer.js',
  BASE_PATH + 'assets/js/console-wrapper.js',
  BASE_PATH + 'assets/js/page-router-base.js',
  BASE_PATH + 'assets/js/training-stage-tracker.js',
  BASE_PATH + 'assets/js/historical-cases-data.js',
  BASE_PATH + 'assets/icons/icon-144x144.svg',
  BASE_PATH + 'assets/icons/icon-192x192.svg'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => cacheName !== CACHE_NAME)
                  .map(cacheName => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve cached content when offline, network-first for navigation
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  // Skip non-same-origin requests
  if (url.origin !== self.location.origin) return;

  // For navigation requests, try network first then fallback to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the fresh version
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedResponse));
          return response;
        })
        .catch(() => caches.match(event.request).then(r => r || caches.match(BASE_PATH + 'index.html')))
    );
    return;
  }

  // For other GETs, cache-first
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
