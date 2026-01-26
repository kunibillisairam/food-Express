// In production, use VITE_API_URL if set, otherwise default to localhost (which will likely fail in prod if not set).
// You must set VITE_API_URL in your Vercel project settings to your backend URL (e.g., your Render URL).
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

console.log("API_BASE_URL:", API_BASE_URL);

export default API_BASE_URL;
