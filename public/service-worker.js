// v2: sebelumnya app shell (index.html) di-cache dengan strategi cache-first,
// yang menyebabkan browser SELAMANYA menyajikan index.html versi lama setelah
// deploy baru (karena nama file JS/CSS ber-hash berubah tiap build, tapi
// index.html lama di cache tetap merujuk ke hash lama yang sudah tidak ada
// di server -> 404 -> layar putih). Sekarang navigasi HTML pakai
// network-first, cache hanya dipakai sebagai fallback saat offline.
const CACHE_NAME = 'kantin-dwp-v2';
const APP_SHELL = ['/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin.includes('supabase.co')) return; // jangan cache data realtime/API

  // Navigasi halaman (index.html / SPA shell): network-first.
  // Selalu coba ambil versi terbaru dari server dulu; cache cuma fallback offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Aset statis ber-hash (JS/CSS/gambar hasil build): cache-first, karena nama
  // filenya selalu berubah tiap build sehingga aman di-cache permanen.
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
