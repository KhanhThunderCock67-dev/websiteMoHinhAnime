import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hobby_vault_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle token expiration or unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired, clear from local storage
      const currentToken = localStorage.getItem('hobby_vault_token');
      if (currentToken && !error.config.url.includes('/auth/login')) {
        localStorage.removeItem('hobby_vault_token');
        localStorage.removeItem('hobby_vault_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
