import axios from 'axios';
import { useAuthStore } from '../store/auth/useAuthStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Bắt buộc để tự động gửi HttpOnly Cookie chứa Refresh Token
});

let isRefreshing = false;
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

// 1. Request Interceptor: Tự động lấy Bearer Access JWT in-memory từ Zustand Store
axiosClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Xử lý 401 và tự động refresh token qua HttpOnly Cookie
axiosClient.interceptors.response.use(
  (response) => {
    // Trả về data của ApiResponse
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Không xử lý refresh nếu chính request login hoặc refresh bị 401
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/auth/logout');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Trình duyệt tự động đính kèm HttpOnly Cookie chứa Refresh Token
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = response.data?.data?.accessToken;
        if (!newAccessToken) {
          throw new Error('Không nhận được Access Token mới');
        }

        // Cập nhật Access Token in-memory
        useAuthStore.getState().setAccessToken(newAccessToken);

        // Gán token mới vào request bị lỗi ban đầu và retry
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        return axiosClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh token không hợp lệ hoặc đã hết hạn -> Xóa session và chuyển hướng login
        useAuthStore.getState().clearAuth();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?expired=true';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const errorData = error.response?.data || {
      status: error.response?.status || 500,
      code: 'NETWORK_ERROR',
      message: error.message || 'Không thể kết nối đến máy chủ',
    };

    return Promise.reject(errorData);
  }
);

export default axiosClient;
