// In production, use VITE_API_URL if set, otherwise default to dynamic detection.
// Detecting if we are on a remote host or local network host.
const getBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

    const hostname = window.location.hostname;
    // If we're on mobile accessing via IP, or just not on localhost, use that IP/host
    if (hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '') {
        return `http://${hostname}:5000`;
    }

    return "http://127.0.0.1:5000";
};

const API_BASE_URL = getBaseUrl();

console.log("API_BASE_URL detected:", API_BASE_URL);

export default API_BASE_URL;
