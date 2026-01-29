// In production, use VITE_API_URL if set, otherwise default to dynamic detection.
// Detecting if we are on a remote host or local network host.
const getBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

    const hostname = window.location.hostname;

    // If running on localhost or local network IP, assume local backend
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
        return "http://localhost:5000";
    }

    // PRODUCTION BACKEND
    return "https://food-express-1-00az.onrender.com";
};

const API_BASE_URL = getBaseUrl();

console.log("API_BASE_URL detected:", API_BASE_URL);

export default API_BASE_URL;
