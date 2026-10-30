import axios from 'axios';

// Resolve configured API base URL with local development fallback
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001').replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to resolve static/uploaded image URLs across local and deployed cloud hosts
export function resolveImageUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

// Interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to reject HTML rewrites returned for missing backend routes
api.interceptors.response.use(
  (response) => {
    const contentType = String(response.headers['content-type'] || '');
    if (
      (typeof response.data === 'string' &&
        (response.data.trim().startsWith('<!DOCTYPE') ||
         response.data.trim().startsWith('<html') ||
         response.data.trim().startsWith('<!'))) ||
      contentType.includes('text/html')
    ) {
      return Promise.reject(new Error('SPA rewrite returned HTML instead of API JSON'));
    }
    return response;
  },
  (error) => Promise.reject(error)
);

export default api;
