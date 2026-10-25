// Service Worker for Failure Logic Application
// P0: bump on every code change — the activate handler below deletes every
// cache whose name differs, so a new version here is what evicts last week's
// JS. v1.0.9 = Loop 1 (justification box / number formatting / rich feedback /
// transparent climate band / real home stats). v1.0.12 = Loop 1 收尾
// (API 探测关闭 / 完成局数落盘 / 终局不再出现"未填写")。v1.0.14 = Sprint 0
// (终局契约 final_outcome / 结局归一 / 【代价清算】过程记账 / 选项槽位与结算同源)。
// v1.0.15 = V3 概念命中可信化（解析器全或无 / 五态口径 / 派生三指标 / 可见门禁）。
const CACHE_NAME = 'failure-logic-v1.0.15';
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
  // CSS (8, matches index.html)
  BASE_PATH + 'assets/css/normalize.css',
  BASE_PATH + 'assets/css/main.css',
  BASE_PATH + 'assets/css/components.css',
  BASE_PATH + 'assets/css/game-styles.css',
  BASE_PATH + 'assets/css/turn-based-game.css',
  BASE_PATH + 'assets/css/scenarios/relationship-time-delay.css',
  BASE_PATH + 'assets/css/enhanced-interaction-styles.css',
  BASE_PATH + 'assets/css/challenger.css',
  // Core JS (14, matches index.html script tags)
  BASE_PATH + 'assets/js/scenario-illustrations.js',
  BASE_PATH + 'assets/js/illustration-prompts.js',
  BASE_PATH + 'assets/js/ai-illustration-generator.js',
  BASE_PATH + 'assets/js/api-config-manager.js',
  BASE_PATH + 'assets/js/offline-engine.js',
  BASE_PATH + 'assets/js/event-bus.js',
  BASE_PATH + 'assets/js/app-core.js',
  BASE_PATH + 'assets/js/html-sanitizer.js',
  BASE_PATH + 'assets/js/safe-render.js',
  BASE_PATH + 'assets/js/console-wrapper.js',
  BASE_PATH + 'assets/js/page-router-base.js',
  BASE_PATH + 'assets/js/challenger-router.js',
  BASE_PATH + 'assets/js/app.js',
  BASE_PATH + 'assets/js/training-stage-tracker.js',
  BASE_PATH + 'assets/js/home-stats.js',
  // Scenario data (5)
  BASE_PATH + 'assets/data/scenarios/challenger_launch.json',
  BASE_PATH + 'assets/data/scenarios/climate_change.json',
  BASE_PATH + 'assets/data/scenarios/enron_collapse.json',
  BASE_PATH + 'assets/data/scenarios/noodle_shop_community.json',
  BASE_PATH + 'assets/data/scenarios/chip_ai_supplychain.json',
  // Thumbnails (5)
  BASE_PATH + 'assets/images/challenger.svg',
  BASE_PATH + 'assets/images/climate.svg',
  BASE_PATH + 'assets/images/enron.svg',
  BASE_PATH + 'assets/images/noodle-shop.svg',
  BASE_PATH + 'assets/images/chip-ai.svg',
  // Icons
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

  // P0: JS/CSS are code, not images. Plain cache-first meant a returning
  // visitor kept executing the previous bundle until the cache was cleared;
  // serve the cached copy for speed but refresh it in the background
  // (stale-while-revalidate), so the next load is already current.
  const isCode = /\/assets\/(js|css)\//.test(url.pathname);
  if (isCode) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        const network = fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedResponse));
          }
          return response;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // For other GETs, cache-first
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
