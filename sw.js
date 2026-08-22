/* Service worker: hanya menyimpan cangkang aplikasi.
   Data TIDAK pernah di-cache di sini — data mengalir lewat JSONP
   dan antrian IndexedDB, supaya tidak ada angka stok basi yang
   tersaji seolah-olah terbaru. */

const CACHE = 'stok-kain-v1';
const CANGKANG = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(CANGKANG))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Panggilan ke Apps Script selalu langsung ke jaringan.
  if (url.hostname.indexOf('script.google') !== -1) return;
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(tersimpan => {
      const dariJaringan = fetch(e.request).then(resp => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const salinan = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, salinan));
        }
        return resp;
      }).catch(() => tersimpan);

      return tersimpan || dariJaringan;
    })
  );
});
