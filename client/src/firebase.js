import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app, messaging, auth, analytics;

if (firebaseConfig.apiKey) {
    try {
        app = initializeApp(firebaseConfig);
        messaging = getMessaging(app);
        auth = getAuth(app);
        analytics = getAnalytics(app);
    } catch (error) {
        console.error("Firebase Initialization Error:", error);
    }
} else {
    console.error("Firebase API Key is missing! Check your .env setup.");
}

export const requestForToken = async () => {
    if (!messaging) return null;

    // Check if browser supports notifications
    if (!('Notification' in window)) {
        console.warn('This browser does not support notifications.');
        return null;
    }

    try {
        // 1. Request Permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Notification permission not granted.');
            return null;
        }

        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        if (!vapidKey || vapidKey === 'REPLACE_WITH_YOUR_VAPID_KEY') {
            console.warn('VAPID Key is missing! Notifications will fail.');
            return null;
        }

        // 2. Generate FCM token
        // Ensure Service Worker is ready before getting token
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            const currentToken = await getToken(messaging, {
                vapidKey,
                serviceWorkerRegistration: registration
            });

            if (currentToken) {
                console.log('✅ FCM Token retrieved successfully');
                return currentToken;
            }
        }

        // Fallback to default behavior if SW logic fails
        const currentToken = await getToken(messaging, { vapidKey });
        return currentToken;
    } catch (err) {
        console.log('An error occurred while retrieving token. ', err);
        return null;
    }
};

export const onMessageListener = (callback) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
        callback(payload);
    });
};

export { auth, messaging };
