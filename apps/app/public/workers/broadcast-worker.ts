const CACHE_NAME = 'broadcast-cache-v1';

self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
  );
});

self.addEventListener('activate', (event: any) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event: any) => {
  // Keep the service worker alive
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
}); 