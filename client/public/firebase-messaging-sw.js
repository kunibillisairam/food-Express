importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyAZP51AyL5iaiafWbXiwcUEgD1Xovg--YU",
    authDomain: "food-express-836ec.firebaseapp.com",
    projectId: "food-express-836ec",
    storageBucket: "food-express-836ec.firebasestorage.app",
    messagingSenderId: "839920814577",
    appId: "1:839920814577:web:9ab25d924be262ac241c50",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function (payload) {
    console.log("📩 [FCM] Background message received:", payload);

    const notificationTitle = payload.notification?.title || 'Food Express';
    const notificationOptions = {
        body: payload.notification?.body || 'New notification',
        icon: "/logo.png",
        badge: "/logo.png",
        data: payload.data
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Service Worker lifecycle events
self.addEventListener('install', (event) => {
    console.log('✅ [FCM SW] Service Worker installing...');
    self.skipWaiting(); // Activate immediately
});

self.addEventListener('activate', (event) => {
    console.log('✅ [FCM SW] Service Worker activated');
    event.waitUntil(clients.claim()); // Take control of all pages immediately
});

console.log('🔥 [FCM SW] Firebase messaging service worker loaded successfully');

