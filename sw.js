// Offline cache. Strategie: síť napřed (ať máš vždy nejnovější témata),
// při výpadku se sáhne do cache.
const CACHE = 'mathgym-v2';
const CORE = [
  './', './index.html', './css/clay.css', './manifest.webmanifest',
  './js/app.js', './icons/icon.svg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Cizí domény (GitHub API, KaTeX z CDN, fonty) necháváme plně na prohlížeči.
  // Kdyby je cache obsloužila, dostala by synchronizace místo odpovědi API
  // uloženou stránku – a spadla by na neplatném JSONu.
  if (new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(async () => {
        const hit = await caches.match(req);
        if (hit) return hit;
        // Náhradní stránka dává smysl jen pro navigaci, ne pro skripty a data.
        if (req.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      }),
  );
});
