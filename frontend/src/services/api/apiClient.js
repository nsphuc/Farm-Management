import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import { API_ENDPOINTS } from './endpoints';

/**
 * Generate standard UUID v4 for X-Idempotency-Key
 */
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Axios instance configured with baseURL and withCredentials for HttpOnly cookie
 */
export const apiClient = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
});

// Flag to prevent multiple concurrent refresh calls
let isRefreshing = false;
// Queue to hold requests while token is refreshing
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Request Interceptor:
 * 1. Attaches Bearer Access Token in-memory
 * 2. Generates X-Idempotency-Key for mutating methods
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Idempotency key for mutating requests
    const mutatingMethods = ['post', 'put', 'patch', 'delete'];
    if (
      mutatingMethods.includes(config.method?.toLowerCase()) &&
      !config.headers['X-Idempotency-Key']
    ) {
      config.headers['X-Idempotency-Key'] = generateUUID();
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor:
 * 1. Silent Refresh Token Rotation on 401 Unauthorized without clearing form state
 * 2. Force password change detection on 403 Forbidden
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response ? error.response.status : null;
    const errorCode = error.response?.data?.errorCode;

    // 1. Force Password Change Required check (403 or specific error code)
    if (
      status === 403 &&
      (errorCode === 'FORCE_PASSWORD_CHANGE_REQUIRED' ||
        errorCode === 'MUST_CHANGE_PASSWORD')
    ) {
      useAuthStore.getState().setMustChangePassword(true);
      return Promise.reject(error);
    }

    // 2. Silent Refresh Token Rotation on 401 Unauthorized
    const isAuthEndpoint =
      originalRequest.url?.includes(API_ENDPOINTS.AUTH.LOGIN) ||
      originalRequest.url?.includes(API_ENDPOINTS.AUTH.REFRESH);

    if (status === 401 && !isAuthEndpoint && !originalRequest._retry) {
      if (isRefreshing) {
        // Enqueue request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Backend reads HttpOnly refresh_token cookie
        const response = await axios.post(
          '/api/v1/auth/refresh',
          {},
          { withCredentials: true }
        );

        const newAccessToken = response.data?.accessToken;
        const userInfo = response.data?.userInfo;

        if (newAccessToken) {
          useAuthStore.getState().setAccessToken(newAccessToken);
          if (userInfo) {
            useAuthStore.getState().setUserInfo(userInfo);
          }
          apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);
          return apiClient(originalRequest);
        } else {
          throw new Error('No access token returned in refresh response');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().clearAuth();
        // Redirect to login only if not public route
        if (
          !window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/trace')
        ) {
          window.location.href = `/login?redirect=${encodeURIComponent(
            window.location.pathname + window.location.search
          )}`;
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
