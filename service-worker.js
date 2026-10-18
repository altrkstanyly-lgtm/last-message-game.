const CACHE = 'last-message-web-v2';
const APP_CACHE_PREFIX = 'last-message-web-';
const LEGACY_CACHE = 'last-message-v1';
const FILES = [
  './', 'index.html', 'manifest.webmanifest',
  'styles/main.css', 'styles/responsive.css',
  'scripts/data.js', 'scripts/audio.js', 'scripts/game.js', 'scripts/pwa.js',
  'assets/icons/icon.svg',
  'assets/characters/adam.svg', 'assets/characters/lian.svg',
  'assets/characters/mother.svg', 'assets/characters/nora.svg',
  'assets/backgrounds/home-night.svg', 'assets/backgrounds/living-room.svg',
  'assets/backgrounds/lian-room.svg', 'assets/backgrounds/warehouse.svg',
  'assets/backgrounds/clinic-exterior.svg', 'assets/backgrounds/clinic-archive.svg',
  'assets/backgrounds/memory.svg', 'assets/backgrounds/ending-seek.svg',
  'assets/backgrounds/ending-respect.svg', 'assets/backgrounds/archive-letter.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key === LEGACY_CACHE || (key.startsWith(APP_CACHE_PREFIX) && key !== CACHE))
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    } catch (error) {
      if (request.mode === 'navigate') {
        const appShell = new URL('./index.html', self.registration.scope);
        const fallback = await cache.match(appShell);
        if (fallback) return fallback;
      }
      throw error;
    }
  })());
});
