/**
 * Dynamic Worlds - Service Worker
 * PWA功能：离线缓存、后台同步、推送通知
 */

const CACHE_NAME = 'dynamic-worlds-v2.0.0';
const STATIC_CACHE = 'dynamic-worlds-static-v2.0.0';
const RUNTIME_CACHE = 'dynamic-worlds-runtime-v2.0.0';

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/css/main.css',
  '/assets/css/components.css',
  '/assets/js/app.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
];

// API缓存策略
const API_CACHE_STRATEGIES = {
  '/api/v1/scenarios': 'cache-first',
  '/api/v1/users/profile': 'network-first',
  '/api/v1/games': 'network-first',
  '/api/v1/sync': 'network-only',
};

// 安装事件
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v2.0.0');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// 激活事件
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v2.0.0');

  event.waitUntil(
    Promise.all([
      // 清理旧缓存
      cleanupOldCaches(),
      // 立即控制所有页面
      self.clients.claim(),
    ])
  );
});

// 清理旧缓存
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name =>
    name.startsWith('dynamic-worlds-') && name !== CACHE_NAME
  );

  console.log('[SW] Cleaning up old caches:', oldCaches);

  return Promise.all(
    oldCaches.map(name => {
      console.log('[SW] Deleting old cache:', name);
      return caches.delete(name);
    })
  );
}

// 网络请求拦截
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过Chrome扩展请求
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // 处理不同类型的请求
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else {
    event.respondWith(handleNavigationRequest(request));
  }
});

// 判断是否为静态资源
function isStaticAsset(request) {
  return STATIC_ASSETS.some(asset =>
    new URL(asset, self.location.origin).href === request.url
  ) || request.url.includes('/assets/') || request.url.includes('fonts.googleapis.com');
}

// 判断是否为API请求
function isAPIRequest(request) {
  return request.url.includes('/api/v1/');
}

// 处理静态资源请求
async function handleStaticAsset(request) {
  try {
    // 首先尝试从缓存获取
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving static asset from cache:', request.url);
      return cachedResponse;
    }

    // 缓存未命中，从网络获取
    console.log('[SW] Fetching static asset from network:', request.url);
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // 缓存响应
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Failed to fetch static asset:', request.url, error);

    // 返回离线页面或错误页面
    return new Response('离线模式下无法访问此资源', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// 处理API请求
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  const strategy = getCacheStrategy(url.pathname);

  try {
    switch (strategy) {
      case 'cache-first':
        return await cacheFirst(request);
      case 'network-first':
        return await networkFirst(request);
      case 'network-only':
        return await networkOnly(request);
      case 'stale-while-revalidate':
        return await staleWhileRevalidate(request);
      default:
        return await networkFirst(request);
    }
  } catch (error) {
    console.error('[SW] API request failed:', request.url, error);

    // 对于API请求失败，返回缓存的响应（如果有）
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving stale API response from cache:', request.url);
      return cachedResponse;
    }

    throw error;
  }
}

// 获取缓存策略
function getCacheStrategy(pathname) {
  for (const [pattern, strategy] of Object.entries(API_CACHE_STRATEGIES)) {
    if (pathname.startsWith(pattern)) {
      return strategy;
    }
  }
  return 'network-first';
}

// Cache First策略
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    console.log('[SW] Cache first - serving from cache:', request.url);
    return cachedResponse;
  }

  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, networkResponse.clone());
  }

  return networkResponse;
}

// Network First策略
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
      console.log('[SW] Network first - cached response:', request.url);
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network first - serving from cache:', request.url);
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('网络请求失败', { status: 503 });
  }
}

// Network Only策略
async function networkOnly(request) {
  return fetch(request);
}

// Stale While Revalidate策略
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });

  return cachedResponse || fetchPromise;
}

// 处理导航请求
async function handleNavigationRequest(request) {
  try {
    // 尝试从网络获取
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // 网络失败，返回缓存的首页
    console.log('[SW] Navigation failed, serving cached index.html');
    const cachedResponse = await caches.match('/index.html');
    return cachedResponse || new Response('离线模式下无法访问', {
      status: 503,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

// 后台同步
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'sync-pending-data') {
    event.waitUntil(syncPendingData());
  }
});

// 同步待处理数据
async function syncPendingData() {
  try {
    // 从IndexedDB获取待同步数据
    const pendingData = await getPendingSyncData();

    if (pendingData.length === 0) {
      console.log('[SW] No pending data to sync');
      return;
    }

    console.log('[SW] Syncing pending data:', pendingData.length, 'items');

    for (const data of pendingData) {
      try {
        await syncDataItem(data);
        // 同步成功，从待同步列表移除
        await removePendingSyncData(data.id);
      } catch (error) {
        console.error('[SW] Failed to sync data item:', data.id, error);
      }
    }

    console.log('[SW] Background sync completed');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// 推送通知
self.addEventListener('push', (event) => {
  console.log('[SW] Push message received');

  let pushData = {
    title: 'Dynamic Worlds',
    body: '您有新的学习进度更新',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-72x72.png',
    tag: 'learning-update',
    data: {},
  };

  if (event.data) {
    try {
      pushData = { ...pushData, ...event.data.json() };
    } catch (error) {
      console.error('[SW] Failed to parse push data:', error);
    }
  }

  const options = {
    body: pushData.body,
    icon: pushData.icon,
    badge: pushData.badge,
    tag: pushData.tag,
    data: pushData.data,
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: '查看详情',
      },
      {
        action: 'dismiss',
        title: '忽略',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(pushData.title, options)
  );
});

// 通知点击处理
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'open') {
    // 打开应用到特定页面
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  } else if (event.action === 'dismiss') {
    // 忽略通知
    return;
  } else {
    // 默认行为：打开应用
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// 通知关闭处理
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
});

// 辅助函数：IndexedDB操作
async function getPendingSyncData() {
  // 这里应该实现从IndexedDB获取待同步数据的逻辑
  // 为了简化，返回空数组
  return [];
}

async function removePendingSyncData(id) {
  // 这里应该实现从IndexedDB移除已同步数据的逻辑
  console.log('[SW] Removing synced data item:', id);
}

async function syncDataItem(data) {
  // 这里应该实现具体的数据同步逻辑
  console.log('[SW] Syncing data item:', data);

  // 模拟API调用
  const response = await fetch('/api/v1/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status}`);
  }

  return response.json();
}

// 消息处理
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'SYNC_NOW':
      syncPendingData();
      break;
    case 'CLEAR_CACHE':
      clearAllCaches();
      break;
    default:
      console.warn('[SW] Unknown message type:', event.data.type);
  }
});

// 清理所有缓存
async function clearAllCaches() {
  console.log('[SW] Clearing all caches');

  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(name => caches.delete(name))
  );

  console.log('[SW] All caches cleared');
}

// 定期缓存清理
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync triggered:', event.tag);

  if (event.tag === 'cleanup-cache') {
    event.waitUntil(cleanupOldCaches());
  }
});

console.log('[SW] Service worker script loaded');