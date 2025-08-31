import axios from 'axios';
import { showError } from './toast';

// API Client Configuration
// Development: Use localhost
// Production: Use environment variable or production IP (uncomment when deploying)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3008';

// PRODUCTION CONFIGURATION (COMMENTED OUT)
// Uncomment the line below and comment out the localhost line when deploying to production
// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://210.212.246.131:3009';

console.log('🌐 Frontend API Configuration:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  API_BASE_URL: API_BASE_URL,
  NODE_ENV: import.meta.env.MODE,
  Environment: 'Development (Local)'
});

// Global flag to prevent multiple simultaneous redirects
let isRedirecting = false;

// Create a shared axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle auth errors (centralized)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isRedirecting) {
      // Check if it's a session invalidation
      if (error.response?.data?.code === 'SESSION_INVALID') {
        showError('Your session has been invalidated because another user logged into this account.');
      }
      
      // Only clear storage and redirect if we're not on the login page
      // and if this is not a login attempt
      const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/';
      const isLoginAttempt = error.config?.url?.includes('/auth/login');
      
      if (!isLoginPage && !isLoginAttempt) {
        isRedirecting = true;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_profile');
        // Use a small delay to prevent race conditions
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
