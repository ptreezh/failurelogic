// Service Worker for Failure Logic Application
const CACHE_NAME = 'failure-logic-v1.0.1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/404.html',
  '/assets/css/normalize.css',
  '/assets/css/main.css',
  '/assets/css/components.css',
  '/assets/css/game-styles.css',
  '/assets/css/turn-based-game.css',
  '/assets/css/enhanced-interaction-styles.css',
  '/assets/js/api-config-manager.js',
  '/assets/js/app.js',
  '/assets/js/event-bus.js',
  '/assets/js/app-core.js',
  '/assets/js/html-sanitizer.js',
  '/assets/js/console-wrapper.js',
  '/assets/js/page-router-base.js',
  '/assets/js/training-stage-tracker.js',
  '/assets/js/historical-cases-data.js',
  '/assets/icons/icon-144x144.svg',
  '/assets/icons/icon-192x192.svg'
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
        .catch(() => caches.match(event.request).then(r => r || caches.match('/index.html')))
    );
    return;
  }

  // For other GETs, cache-first
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
