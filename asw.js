const CACHE_NAME = 'space-cinema-v10.5-cache';
const assetsToCache = [
  './index.html',
  './manifest.json'
];

// تثبيت الـ Service Worker وتخزين الأصول الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(assetsToCache);
    })
  );
  self.skipWaiting();
});

// تفعيل الـ Service Worker وتنظيف النسخ القديمة
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// التعامل مع طلبات الشبكة (استراتيجية الشبكة أولاً مع العودة للكاش للملفات المحلية)
self.addEventListener('fetch', (event) => {
  // استثناء طلبات فايربيس السحابية لضمان حداثة بيانات تسجيل الدخول والـ VIP
  if (event.request.url.includes('firestore.googleapis.com') || event.request.url.includes('firebase') || event.request.url.includes('googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // إذا وجدنا الملف في الكاش نعيده، وإلا نجلبه من الشبكة
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        // يمكنك هنا تخزين الملفات الجديدة ديناميكياً إذا رغبت
        return response;
      }).catch(() => {
        // في حال انقطاع الإنترنت تماماً ولم يتم العثور على الملف
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
