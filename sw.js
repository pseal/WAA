const CACHE = "waa-v3";
const STATIC = ["/", "/index.html", "/app.js", "/manifest.json", "/icon-192.png", "/icon-512.png"];

// ── INSTALL: cache static assets ──────────────────────────────────────────
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: wipe old caches immediately ─────────────────────────────────
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── FETCH strategy ────────────────────────────────────────────────────────
self.addEventListener("fetch", e => {
  const url = e.request.url;

  // 1. Never intercept WeatherAPI calls — always go network
  if (url.includes("weatherapi.com")) {
    e.respondWith(fetch(e.request));
    return;
  }

  // 2. Never intercept Google Fonts
  if (url.includes("fonts.googleapis.com") || url.includes("fonts.gstatic.com")) {
    e.respondWith(fetch(e.request));
    return;
  }

  // 3. Only handle GET requests for our own assets
  if (e.request.method !== "GET") return;

  // 4. Network-first for HTML (so updates always show)
  if (url.includes("index.html") || url.endsWith("/")) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // 5. Network-first for app.js too (so JS updates deploy instantly)
  if (url.includes("app.js")) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // 6. Cache-first for icons/manifest (rarely change)
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
