import axios from 'axios';
import { getAccessToken, setAccessToken, clearAccessToken } from './token-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // sends the httpOnly refresh-token cookie
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const isAuthRoute = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/refresh');

    if (status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;
      try {
        // De-duplicate concurrent refresh calls triggered by parallel requests
        if (!refreshPromise) {
          refreshPromise = axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true }).finally(() => {
            refreshPromise = null;
          });
        }
        const { data } = await refreshPromise;
        setAccessToken(data.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearAccessToken();
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/** Normalizes an Axios/API error into a friendly message string for UI display. */
export function getErrorMessage(error) {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return 'Something went wrong. Please try again.';
}

/** Extracts field-level validation error details, if present (from Joi via the backend). */
export function getFieldErrors(error) {
  const details = error?.response?.data?.data;
  if (Array.isArray(details)) return details;
  return [];
}
