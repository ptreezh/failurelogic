// Service Worker for Failure Logic Application
const CACHE_NAME = 'failure-logic-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/css/normalize.css',
  '/assets/css/main.css',
  '/assets/css/components.css',
  '/assets/css/game-styles.css',
  '/assets/css/turn-based-game.css',
  '/assets/css/scenarios/relationship-time-delay.css',
  '/assets/js/api-config-manager.js',
  '/assets/js/app.js',
  '/assets/icons/icon-144x144.svg',
  '/assets/icons/icon-192x192.svg'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version if available, otherwise fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
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
    })
  );
});
