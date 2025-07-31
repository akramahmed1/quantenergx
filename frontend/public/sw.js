// Service Worker for QuantEnergx Mobile App
// Provides offline caching and push notification support

const CACHE_NAME = 'quantenergx-v1';
const API_CACHE_NAME = 'quantenergx-api-v1';

// Files to cache for offline access
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/v1/market/prices',
  '/api/v1/trading/orders',
  '/api/v1/trading/positions'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        // Return cached version if available
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Otherwise fetch from network
        return fetch(request)
          .then(response => {
            // Cache successful responses
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(request, responseClone));
            }
            return response;
          })
          .catch(() => {
            // Fallback for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/');
            }
            throw new Error('Network request failed and no cache available');
          });
      })
  );
});

// Handle API requests with cache-first strategy for GET, network-first for others
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  
  // For GET requests, try cache first
  if (request.method === 'GET') {
    const cachedResponse = await cache.match(request);
    
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        // Update cache with fresh data
        cache.put(request, networkResponse.clone());
        return networkResponse;
      }
      throw new Error('Network response not ok');
    } catch (error) {
      // Return cached response if network fails
      if (cachedResponse) {
        console.log('Service Worker: Serving API request from cache:', request.url);
        return cachedResponse;
      }
      throw error;
    }
  }
  
  // For POST/PUT/DELETE requests, try network first
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    // For offline trading orders, store them locally
    if (request.url.includes('/trading/orders') && request.method === 'POST') {
      console.log('Service Worker: Storing offline order');
      await storeOfflineOrder(request);
      
      // Return a success response to the app
      return new Response(JSON.stringify({
        success: true,
        offline: true,
        message: 'Order queued for when online'
      }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    throw error;
  }
}

// Store offline orders in IndexedDB
async function storeOfflineOrder(request) {
  try {
    const orderData = await request.clone().json();
    const offlineOrder = {
      ...orderData,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      status: 'pending'
    };

    // Store in IndexedDB (simplified for this example)
    const existingOrders = JSON.parse(localStorage.getItem('quantenergx_offline_orders') || '[]');
    existingOrders.push(offlineOrder);
    localStorage.setItem('quantenergx_offline_orders', JSON.stringify(existingOrders));
    
    console.log('Service Worker: Offline order stored:', offlineOrder.id);
  } catch (error) {
    console.error('Service Worker: Failed to store offline order:', error);
  }
}

// Handle push notifications
self.addEventListener('push', event => {
  console.log('Service Worker: Push notification received');
  
  let notificationData = {
    title: 'QuantEnergx',
    body: 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/badge-72.png'
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('Service Worker: Failed to parse push data:', error);
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: [200, 100, 200],
    data: notificationData.data || {},
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icon-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icon-dismiss.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'view') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Sync event for background sync of offline orders
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-offline-orders') {
    event.waitUntil(syncOfflineOrders());
  }
});

// Sync offline orders when connection is restored
async function syncOfflineOrders() {
  try {
    const offlineOrders = JSON.parse(localStorage.getItem('quantenergx_offline_orders') || '[]');
    const pendingOrders = offlineOrders.filter(order => order.status === 'pending');
    
    if (pendingOrders.length === 0) {
      return;
    }

    console.log('Service Worker: Syncing offline orders:', pendingOrders.length);
    
    for (const order of pendingOrders) {
      try {
        const response = await fetch('/api/v1/trading/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(order)
        });

        if (response.ok) {
          // Mark order as synced
          order.status = 'synced';
          console.log('Service Worker: Order synced successfully:', order.id);
        } else {
          // Mark order as failed
          order.status = 'failed';
          console.error('Service Worker: Order sync failed:', order.id, response.status);
        }
      } catch (error) {
        console.error('Service Worker: Order sync error:', order.id, error);
        order.status = 'failed';
      }
    }

    // Update stored orders
    localStorage.setItem('quantenergx_offline_orders', JSON.stringify(offlineOrders));
    
    // Notify all clients about sync completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        syncedOrders: pendingOrders.filter(order => order.status === 'synced').length,
        failedOrders: pendingOrders.filter(order => order.status === 'failed').length
      });
    });

  } catch (error) {
    console.error('Service Worker: Sync failed:', error);
  }
}

// Message handler for communication with the main app
self.addEventListener('message', event => {
  console.log('Service Worker: Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log('Service Worker: Loaded successfully');