const CACHE_NAME = 'ekko-pwa-v1';
const urlsToCache = [
  '/',
  '/index.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  // Ignorar chamadas de API (Supabase) pra não viciar o banco em cache velho offline
  if (event.request.url.includes('supabase.co')) {
      return fetch(event.request);
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se estiver no cache, devolve logo
        if (response) {
          return response;
        }
        // Se não, busca na rede
        return fetch(event.request).then(
          function(response) {
            // Checa se recebemos uma requisição válida
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clona pra salvar no Cache interceptado
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});
