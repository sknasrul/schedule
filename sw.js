/* ============================================================================
   Service Worker -- Shift Dashboard
   ----------------------------------------------------------------------------
   What this caches (the "app shell"):
     - The dashboard page itself (HTML/CSS/JS -- all inline in one file)
     - The self-hosted background image
   What this NEVER caches:
     - /shift  -- always goes straight to the network / your database.
                  Every request for it bypasses the cache completely, and
                  the response is never written to any cache storage.

   Strategy for the app shell: "stale-while-revalidate"
     - Serve instantly from cache if we have it (this is what makes repeat
       loads instant and lets the page open offline).
     - At the same time, fetch the real network version in the background
       and quietly update the cache, so the *next* load has the latest
       version. You never get stuck on a stale copy forever.
   ============================================================================ */

// Bump this version string any time you change index.html or the background
// image, so old cached copies get thrown out on the next activate.
const CACHE_NAME = 'shift-dashboard-shell-v1';

// Adjust these paths to match wherever you actually serve them from.
const APP_SHELL = [
  '/',                          // if your server serves index.html at root
  '/index.html',
  '/assets/background.jpg'      // <-- your self-hosted background image
];

/* ---------------------------- install ---------------------------- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()) // activate this SW immediately, don't wait for old tabs to close
  );
});

/* ---------------------------- activate ---------------------------- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME) // drop any previous cache version
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim()) // take control of open tabs right away
  );
});

/* ---------------------------- fetch ---------------------------- */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only ever intercept GET requests -- let POST/PUT/etc. (logins, form
  // submits, etc.) pass straight through untouched.
  if (req.method !== 'GET') return;

  // ---- HARD RULE: /shift is never cached, ever. ----
  // Always hit the network directly so shift data always comes live from
  // the database. If the network is unavailable, this request simply fails
  // (as it should) rather than silently serving old schedule data.
  if (url.pathname === '/shift') {
    event.respondWith(fetch(req));
    return;
  }

  // Only manage caching for same-origin app-shell assets (our HTML/CSS/JS
  // and our self-hosted image). Leave any other third-party requests alone.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const networkFetch = fetch(req)
        .then((networkResponse) => {
          // Only cache good, complete responses.
          if (networkResponse && networkResponse.ok) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse); // offline and no fresh response? fall back to cache.

      // Cache hit -> return instantly, network update happens quietly behind it.
      // Cache miss -> wait for the network (first-ever load).
      return cachedResponse || networkFetch;
    })
  );
});
