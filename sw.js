const CACHE_NAME = 'giti-cache-v1';
const urlsToCache = [
  '/giti/',
  '/giti/index.html',
  '/giti/manifest.json'
];

// تثبيت الـ Service Worker وحفظ الملفات في الذاكرة المؤقتة
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// جلب الملفات من الذاكرة المؤقتة عند انقطاع الاتصال أو لتسريع التحميل
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
