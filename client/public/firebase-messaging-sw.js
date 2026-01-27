importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
    apiKey: "AIzaSyAZP51AyL5iaiafWbXiwcUEgD1Xovg--YU",
    authDomain: "food-express-836ec.firebaseapp.com",
    projectId: "food-express-836ec",
    storageBucket: "food-express-836ec.firebasestorage.app",
    messagingSenderId: "839920814577",
    appId: "1:839920814577:web:9ab25d924be262ac241c50",
    measurementId: "G-3VJ0YE9GCX"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
