// In production, use relative path (empty string) so requests go to the same domain.
// In development, default to localhost:5000.
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "" : "http://localhost:5000");

export default API_BASE_URL;
