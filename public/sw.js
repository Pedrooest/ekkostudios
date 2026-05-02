// ============================================================
// EKKO PWA Service Worker
// Estratégia:
//   - HTML (navegação): Network-first → sempre pega versão mais recente
//   - Assets com hash (JS/CSS): Cache-first → hash muda a cada deploy
//   - APIs Supabase: bypass total, nunca cachear
// ============================================================

const CACHE_VERSION = 'v3';
const CACHE_NAME = `ekko-pwa-${CACHE_VERSION}`;

// Ativa imediatamente sem esperar fechar outras abas
self.addEventListener('install', event => {
  self.skipWaiting();
});

// Remove caches antigas de versões anteriores
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith('ekko-pwa-') && key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Removendo cache antiga:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Ignorar Supabase e outras APIs externas
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('google.com') ||
    !url.protocol.startsWith('http')
  ) {
    return; // deixa o browser fazer normalmente
  }

  // 2. Navegação (index.html) → Network-first
  //    Garante que o usuário sempre receba a versão mais recente do app
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline fallback: entrega do cache se houver
          return caches.match(request).then(cached => cached || caches.match('/'));
        })
    );
    return;
  }

  // 3. Assets estáticos com hash no nome (ex: index-ABC123.js) → Cache-first
  //    Hash muda a cada deploy, então cache-first é seguro aqui
  const hasHashInName = /\.[a-f0-9]{8,}\.(js|css)$/.test(url.pathname);
  if (hasHashInName) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // 4. Outros recursos (fontes, imagens, etc.) → Network-first com fallback
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
