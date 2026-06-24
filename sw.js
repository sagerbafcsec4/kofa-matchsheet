const CACHE = 'kofa-excel-v1';
const ASSETS = ['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(()=>{})).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  let url; try { url = new URL(req.url); } catch(_) { return; }
  // Live data (Google Sheets): always network, never cache
  if (url.hostname === 'docs.google.com') return;
  // HTML / navigation (same-origin): network-first so updates show immediately
  if (url.origin === location.origin && (req.mode === 'navigate' || (req.headers.get('accept')||'').includes('text/html'))) {
    e.respondWith(fetch(req).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put(req,cp));return r;}).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html'))));
    return;
  }
  // Other assets (same-origin + CDN libs/fonts): cache-first
  e.respondWith(caches.match(req).then(r=> r || fetch(req).then(rr=>{const cp=rr.clone();caches.open(CACHE).then(c=>c.put(req,cp));return rr;}).catch(()=>r)));
});
