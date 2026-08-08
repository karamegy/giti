// استيراد مكتبات Firebase اللازمة للعمل في الخلفية
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

// تهيئة Firebase في Service Worker باستخدام بيانات مشروعك
firebase.initializeApp({
    apiKey: "AIzaSyDn-rNJ2ak3I0DdfzTZmXKjePDdgxhfyIY",
    authDomain: "n2la-642d3.firebaseapp.com",
    projectId: "n2la-642d3",
    storageBucket: "n2la-642d3.firebasestorage.app",
    messagingSenderId: "1085749997466",
    appId: "1:1085749997466:web:13e5535dc6d2312397d423",
    measurementId: "G-KH4ZYFB8LC"
});

const messaging = firebase.messaging();

// التعامل مع الإشعارات الواردة عندما يكون التطبيق في الخلفية
messaging.onBackgroundMessage(function(payload) {
    console.log('[sw.js] Received background message ', payload);
    
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icons/icon-192x192.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
