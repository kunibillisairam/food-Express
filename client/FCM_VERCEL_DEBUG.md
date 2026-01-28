# Firebase Cloud Messaging (FCM) Verification Guide for Vercel

## 🚀 After Deploying to Vercel

### Step 1: Verify Service Worker Registration

1. Open your Vercel deployed website
2. Open Browser Console (F12 → Console tab)
3. Type and run:
```javascript
navigator.serviceWorker.getRegistrations().then(r => console.log(r));
```

**Expected Result:**
```
[ServiceWorkerRegistration]
```

**If you see `[]`**, the service worker is NOT registered. Check the console for errors.

### Step 2: Check Service Worker File Access

1. In your browser, navigate to:
```
https://your-vercel-domain.vercel.app/firebase-messaging-sw.js
```

2. You should see the Firebase service worker JavaScript code.

**If you get a 404 error**, the file is not being served correctly.

### Step 3: Verify FCM Token Generation

1. Login to your app
2. Allow notifications when prompted
3. Open Console and check for:
```
✅ [SW] Service Worker registered successfully
🔥 [FCM SW] Firebase messaging service worker loaded successfully
```

4. In your app code where FCM token is requested, you should see:
```
[FCM Debug] User has FCM token: true
```

### Step 4: Test Notification

1. Place an order
2. Check the console for:
```
[FCM Sending] Notification sent
```

3. You should receive a push notification on your device

## 🔧 Common Issues & Fixes

### Issue 1: Service Worker 404 Error

**Symptoms:** 
- Console shows: `❌ [SW] Service Worker registration failed`
- Error: `Failed to register service worker: NotFoundError`

**Fix:**
1. Verify `firebase-messaging-sw.js` exists in `public/` folder
2. Clear Vercel build cache:
   - Go to Vercel Dashboard → Your Project → Settings → General
   - Scroll to "Build & Development Settings"
   - Add environment variable: `DISABLE_BUILD_CACHE=1`
3. Redeploy

### Issue 2: Service Worker Registered but No Token

**Symptoms:**
- Service Worker shows as registered
- But FCM token is not generated

**Fix:**
1. Check Firebase config in `firebase-messaging-sw.js` matches `.env` values
2. Verify VAPID key is correct in `.env`
3. Ensure notifications are allowed in browser settings

### Issue 3: HTTPS Required Error

**Symptoms:**
- Console shows: `Service workers require HTTPS`

**Fix:**
Vercel automatically provides HTTPS. Make sure you're accessing via `https://` not `http://`

## ✅ Debug Checklist

Run this in console to get a full debug report:

```javascript
// Firebase Service Worker Debug Report
console.log("=== FCM DEBUG REPORT ===");

// 1. Check Service Worker Support
console.log("1. Service Worker Supported:", "serviceWorker" in navigator);

// 2. Check HTTPS
console.log("2. HTTPS Enabled:", window.location.protocol === "https:");

// 3. Check Service Worker Registrations
navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log("3. Service Workers Registered:", registrations.length);
    registrations.forEach((reg, index) => {
        console.log(`   SW ${index + 1}:`, reg.scope);
        console.log(`   Active:`, reg.active !== null);
    });
});

// 4. Check Notification Permission
console.log("4. Notification Permission:", Notification.permission);

// 5. Test Service Worker File
fetch('/firebase-messaging-sw.js')
    .then(response => {
        console.log("5. SW File Accessible:", response.ok);
        console.log("   Status:", response.status);
    })
    .catch(err => {
        console.log("5. SW File Accessible: false");
        console.error("   Error:", err);
    });

console.log("======================");
```

## 📱 Testing on Mobile

1. **Chrome (Android):**
   - Open DevTools via `chrome://inspect`
   - Select your device
   - Check console logs

2. **Safari (iOS):**
   - Settings → Safari → Advanced → Web Inspector
   - Connect device and inspect from Mac

## 🎯 Success Indicators

When everything is working correctly, you should see:

1. ✅ Service Worker registered on page load
2. ✅ FCM token generated after login
3. ✅ Token saved to user document
4. ✅ Notification received when order is placed
5. ✅ Background notifications work even when app is not open

---

**Last Updated:** 2026-01-28
**For Support:** Check Firebase Console → Cloud Messaging for delivery reports
