# Firebase Setup Guide

To enable OTPs and Notifications, you need to configure Firebase.

## 1. Create Firebase Project
Go to [Firebase Console](https://console.firebase.google.com/) and create a new project.

## 2. Client Setup (Frontend)
1. In your project settings, look for "Your apps" > "Web" (</> icon).
2. Register the app (you can use "FoodExpress").
3. You will see a `firebaseConfig` object. You need to add these values to your `client/.env` file. (Create one if it doesn't exist).

**client/.env**:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key_from_cloud_messaging_tab
```

*Note: To get the `VITE_FIREBASE_VAPID_KEY`, go to Project Settings > Cloud Messaging > Web Push certificates > Generate Key.*

## 3. Server Setup (Backend)
To send notifications from the server, we need the `serviceAccountKey.json`.

1. Go to Project Settings > Service accounts.
2. Click **Generate new private key**.
3. Save the downloaded file as `serviceAccountKey.json` inside the `server/` directory.

## 4. Enable Services
1. **Authentication**: Go to Build > Authentication > Sign-in method. Enable **Phone**.
2. **Cloud Messaging**: Go to Build > Cloud Messaging can check it is enabled.

Once you have done these steps, restart your development server:
```bash
npm run dev
```
