import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Add response interceptor to suppress 401 errors in console (expected when not logged in)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't log 401 errors to console - they're expected when user is not authenticated
    if (error.response?.status !== 401) {
      console.error('API Error:', error);
    }
    return Promise.reject(error);
  }
);

export default api;








