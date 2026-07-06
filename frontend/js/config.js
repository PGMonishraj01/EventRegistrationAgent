// Configuration for the Event Registration application
const CONFIG = {
    // This placeholder __API_BASE_URL__ will be replaced by the Vercel build script if present.
    // If not replaced (e.g., local development), it falls back to localhost or a default.
    API_BASE_URL: (function() {
        const injectedUrl = "__API_BASE_URL__";
        if (injectedUrl && !injectedUrl.startsWith("__")) {
            return injectedUrl.replace(/\/$/, ""); // Remove trailing slash if present
        }
        
        // Local development fallback
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:8081';
        }
        
        // Production fallback (please set API_BASE_URL environment variable in Vercel)
        return 'https://event-registration-backend.onrender.com';
    })()
};

console.log("[CONFIG] Active API Base URL:", CONFIG.API_BASE_URL);
