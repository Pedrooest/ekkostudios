const CACHE_NAME = 'ekko-v3-bypass';
const ASSETS_TO_CACHE = [];

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    return caches.delete(cacheName);
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Network Only strategy to permanently disable asset caching
    event.respondWith(fetch(event.request));
});
