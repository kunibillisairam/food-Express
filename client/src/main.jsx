import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Register Service Worker for Firebase Cloud Messaging
if ("serviceWorker" in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register("/firebase-messaging-sw.js", {
        scope: '/',
        updateViaCache: 'none'
      })
      .then((registration) => {
        console.log("✅ [SW] Service Worker registered successfully:", registration);
        console.log("[SW] Scope:", registration.scope);
        console.log("[SW] Active:", registration.active);
      })
      .catch((err) => {
        console.error("❌ [SW] Service Worker registration failed:", err);
        console.error("[SW] Error details:", err.message);
      });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
