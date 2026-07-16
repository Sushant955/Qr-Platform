import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const client = axios.create({ baseURL: `${API_BASE_URL}/api` });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('qr_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('qr_token');
      localStorage.removeItem('qr_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export { API_BASE_URL };
export default client;
