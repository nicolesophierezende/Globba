// Service worker: makes Globba installable and lets it open without a connection
// (pages and stores already visited). Map tiles are not stored.
const VERSION = 'globba-v1';
const SHELL = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/favicon.svg'];
const CDN = ['cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (url.pathname.startsWith('/admin')) return;
    if (url.pathname.startsWith('/_astro/')) { e.respondWith(cacheFirst(req)); return; }
    e.respondWith(networkFirst(req));
  } else if (CDN.includes(url.hostname)) {
    e.respondWith(cacheFirst(req));
  }
});
async function cacheFirst(req) {
  const hit = await caches.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') (await caches.open(VERSION)).put(req, res.clone());
  return res;
}
async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.ok) (await caches.open(VERSION)).put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await caches.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === 'navigate') return (await caches.match('/')) || Response.error();
    throw err;
  }
}
