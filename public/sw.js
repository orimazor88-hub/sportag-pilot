// Self-uninstalling service worker to rescue users trapped in the cache loop
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      // Unregister this service worker from the client scope
      return self.registration.unregister();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Directly pass all fetch requests through to the network
  return;
});
