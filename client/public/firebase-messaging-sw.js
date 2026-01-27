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

messaging.onBackgroundMessage(function (payload) {
    console.log("📩 Background message received:", payload);

    self.registration.showNotification(payload.notification.title, {
        body: payload.notification.body,
        icon: "/logo.png",
    });
});
