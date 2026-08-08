const CACHE_NAME = 'giti-cache-v2'; // قم بتغيير الرقم عند التحديث
const urlsToCache = [
  '/giti/',
  '/giti/index.html',
  '/giti/manifest.json'
  // أضف أي ملفات جديدة هنا (مثل ملفات التصميم أو الصور)
];

// تثبيت الـ Service Worker وحفظ الملفات
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// تفعيل الـ Service Worker وحذف الكاش القديم
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName); // حذف النسخ القديمة
          }
        })
      );
    })
  );
});

// جلب الملفات
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
