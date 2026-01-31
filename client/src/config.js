// In production, use VITE_API_URL if set, otherwise default to dynamic detection.
// Detecting if we are on a remote host or local network host.
const getBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

    const hostname = window.location.hostname;

    // LOCAL NETWORK & DEVELOPMENT
    // This allows mobile devices on the same Wi-Fi to connect automatically
    if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.endsWith('.local')
    ) {
        return `http://${hostname}:5000`;
    }

    // PRODUCTION BACKEND
    return "https://food-express-1-00az.onrender.com";
};

const API_BASE_URL = getBaseUrl();

console.log("API_BASE_URL detected:", API_BASE_URL);

export default API_BASE_URL;
