/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'craven-cooling-v2';
const OFFLINE_URL = '/offline.html';
const DB_NAME = 'CravenCoolingEngineerDB';
const MUTATION_STORE = 'mutationQueue';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/engineer',
  '/engineer/jobs',
];

const API_CACHE_ROUTES = [
  '/api/jobs/my-jobs',
  '/api/customers',
  '/api/sites',
  '/api/assets',
  '/api/parts',
];

const STATIC_EXTENSIONS = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching resources');
        return cache.addAll(PRECACHE_URLS.map(url => {
          return new Request(url, { cache: 'reload' });
        })).catch(err => {
          console.log('[SW] Precache failed for some resources:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('craven-cooling-') && name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
    return;
  }

  const isStaticAsset = STATIC_EXTENSIONS.some(ext => url.pathname.endsWith(ext));
  
  if (isStaticAsset) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  event.respondWith(handleNavigationRequest(request));
});

async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    fetchAndCache(request);
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

async function fetchAndCache(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
  } catch (error) {
    // Silently fail - we already have a cached version
  }
}

async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    if (request.mode === 'navigate') {
      const indexResponse = await caches.match('/index.html');
      if (indexResponse) {
        return indexResponse;
      }
      return caches.match(OFFLINE_URL);
    }
    
    return new Response('Offline', { status: 503 });
  }
}

async function handleAPIRequest(request) {
  const url = new URL(request.url);
  const shouldCache = API_CACHE_ROUTES.some(route => url.pathname.includes(route));

  try {
    const response = await fetch(request);
    
    if (response.ok && shouldCache) {
      const responseClone = response.clone();
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, responseClone);
    }
    
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-From-Cache', 'true');
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers
      });
    }
    
    return new Response(
      JSON.stringify({ error: 'Offline', cached: false }),
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event received:', event.tag);
  
  if (event.tag === 'sync-job-completions') {
    event.waitUntil(syncJobCompletions());
  }
});

async function syncJobCompletions() {
  console.log('[SW] Starting job completions sync');
  
  try {
    const db = await openIndexedDB();
    const mutations = await getPendingMutations(db);
    
    console.log('[SW] Found pending mutations:', mutations.length);
    
    for (const mutation of mutations) {
      try {
        let response;
        
        if (mutation.type === 'UPDATE_JOB_STATUS') {
          response = await fetch(`/api/jobs/${mutation.jobId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await getAuthToken()}`
            },
            body: JSON.stringify(mutation.payload)
          });
        } else if (mutation.type === 'COMPLETE_JOB') {
          response = await fetch(`/api/jobs/${mutation.jobId}/complete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await getAuthToken()}`
            },
            body: JSON.stringify(mutation.payload)
          });
        }
        
        if (response && response.ok) {
          await deleteMutation(db, mutation.id);
          console.log('[SW] Successfully synced mutation:', mutation.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync mutation:', mutation.id, error);
      }
    }
    
    await notifyClients('sync-complete', { count: mutations.length });
    
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function getPendingMutations(db) {
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([MUTATION_STORE], 'readonly');
      const store = transaction.objectStore(MUTATION_STORE);
      const index = store.index('status');
      const request = index.getAll('pending');
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    } catch (error) {
      resolve([]);
    }
  });
}

function deleteMutation(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MUTATION_STORE], 'readwrite');
    const store = transaction.objectStore(MUTATION_STORE);
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function getAuthToken() {
  const allClients = await self.clients.matchAll();
  for (const client of allClients) {
    try {
      const response = await new Promise((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => resolve(event.data);
        client.postMessage({ type: 'GET_AUTH_TOKEN' }, [channel.port2]);
        setTimeout(() => resolve(null), 1000);
      });
      if (response?.token) {
        return response.token;
      }
    } catch (error) {
      // Continue to next client
    }
  }
  return null;
}

async function notifyClients(type, data) {
  const allClients = await self.clients.matchAll();
  allClients.forEach(client => {
    client.postMessage({ type, data });
  });
}

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body || 'New notification',
    icon: '/craven-logo.png',
    badge: '/craven-logo.png',
    data: data.url || '/engineer',
    vibrate: [100, 50, 100],
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Craven Cooling', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes('/engineer') && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(event.notification.data);
        }
      })
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
