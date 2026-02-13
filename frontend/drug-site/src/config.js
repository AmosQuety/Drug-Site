// Centralized configuration for the API URL
// Automatically switches between Local and Render based on the environment
export const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? 'https://drug-site.onrender.com' : 'http://localhost:5000');
