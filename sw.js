/* Service worker: hanya menyimpan cangkang aplikasi.
   Data TIDAK pernah di-cache di sini — data mengalir lewat POST/JSONP
   dan antrian IndexedDB, supaya tidak ada angka stok basi yang
   tersaji seolah-olah terbaru.

   PENTING: strateginya JARINGAN DULU, cache hanya cadangan saat luring.
   Versi sebelumnya memakai cache dulu, akibatnya index.html yang sudah
   diperbarui di GitHub tidak pernah sampai ke HP — aplikasi lama terus
   berjalan walau berkasnya sudah diganti. */

const CACHE = 'stok-kain-v2';
const CANGKANG = ['./', './index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(CANGKANG))
      .then(() => self.skipWaiting())      // versi baru langsung berlaku
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
    fetch(e.request)
      .then(resp => {
        // Berhasil dari jaringan: pakai yang ini, sekaligus perbarui cache.
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const salinan = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, salinan));
        }
        return resp;
      })
      .catch(() => caches.match(e.request))  // luring: pakai simpanan terakhir
  );
});
