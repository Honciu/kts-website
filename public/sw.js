// Service Worker pentru notificări push
const CACHE_NAME = 'lacatus-bucuresti-v1';
const urlsToCache = [
  '/',
  '/admin/dashboard',
  '/worker/dashboard',
  '/client/dashboard'
];

// Install event
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Push event pentru notificări
self.addEventListener('push', function(event) {
  console.log('Push notification received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Nouă notificare de la Lăcătuș București',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Vezi detalii',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Închide',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Lăcătuș București', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', function(event) {
  console.log('Notification click received:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync pentru funcționalități offline
self.addEventListener('sync', function(event) {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'job-sync') {
    event.waitUntil(
      // Aici s-ar sincroniza datele cu serverul
      console.log('Syncing jobs data...')
    );
  }
});

// Message event pentru comunicarea cu aplicația principală
self.addEventListener('message', function(event) {
  console.log('Service Worker received message:', event.data);
  
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});