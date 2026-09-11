import axios from 'axios';
import { logout, setTokens } from '../features/auth/authSlice.js';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const api = axios.create({ baseURL: `${baseURL}/api/v1` });

// The Redux store is injected after it's created (see app/store.js) rather than
// imported directly here. A direct static import would create a circular
// dependency (store.js -> authSlice.js -> axiosInstance.js -> store.js),
// which crashes at load time with "Cannot access '...' before initialization".
let storeRef = null;
export function injectStore(store) {
  storeRef = store;
}

api.interceptors.request.use((config) => {
  const token = storeRef?.getState().auth.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let queue = [];

function processQueue(error, token = null) {
  queue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token)));
  queue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      const refreshToken = storeRef?.getState().auth.refreshToken;
      if (!refreshToken) {
        storeRef?.dispatch(logout());
        return Promise.reject(error);
      }
      if (isRefreshing) {
        return new Promise((resolve, reject) => queue.push({ resolve, reject })).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(`${baseURL}/api/v1/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = data.data;
        storeRef?.dispatch(setTokens({ accessToken, refreshToken: newRefresh }));
        processQueue(null, accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        storeRef?.dispatch(logout());
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
