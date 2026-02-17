import axios from 'axios';

// Create axios instance
const axiosInstance = axios.create();

// Add response interceptor for production error masking
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // In development, log the full error
    if (import.meta.env.DEV) {
      console.error('Axios Error:', error);
    }
    
    // In production, suppress console output but still reject with error
    // This allows the app to handle errors (redirects, toasts) without exposing details
    return Promise.reject(error);
  }
);

export default axiosInstance;
