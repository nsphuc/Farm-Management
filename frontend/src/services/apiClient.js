import axios from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '../stores/useAuthStore';
import { useTenantStore } from '../stores/useTenantStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true, // Cho phép truyền và nhận HttpOnly Cookie (Refresh Token)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cơ chế Mutex Queue để xử lý đồng thời nhiều request khi Refresh Token đang diễn ra
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 1. Request Interceptor: Tự động gắn Access Token và X-Tenant-ID
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    const currentTenantId = useTenantStore.getState().currentTenantId;
    if (currentTenantId && config.headers) {
      config.headers['X-Tenant-ID'] = String(currentTenantId);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Xử lý 401 Silent Refresh, 403, 404, 500 Toast
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      toast.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.');
      return Promise.reject(error);
    }

    const { status, data } = error.response;
    const errorMessage = data?.message || 'Đã có lỗi xảy ra.';

    // Xử lý lỗi 401 Unauthorized (Hết hạn Access Token)
    if (status === 401) {
      // Nếu chính endpoint auth gặp lỗi 401 thì không refresh nữa để tránh loop
      const isAuthUrl =
        originalRequest.url?.includes('/auth/refresh') ||
        originalRequest.url?.includes('/auth/login');

      if (isAuthUrl) {
        useAuthStore.getState().clearAuth();
        return Promise.reject(error);
      }

      if (originalRequest._retry) {
        useAuthStore.getState().clearAuth();
        toast.error('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Đưa request vào hàng đợi chờ refresh hoàn tất
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Gọi silent refresh token (Refresh token được tự động gửi qua HttpOnly cookie)
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data?.data?.accessToken;
        if (!newAccessToken) {
          throw new Error('Không nhận được token mới');
        }

        useAuthStore.getState().setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        useAuthStore.getState().clearAuth();
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Xử lý các mã lỗi phổ biến khác
    switch (status) {
      case 403:
        toast.error(errorMessage || 'Bạn không có quyền thực hiện thao tác này.');
        break;
      case 404:
        toast.error(errorMessage || 'Không tìm thấy dữ liệu yêu cầu.');
        break;
      case 500:
        toast.error(errorMessage || 'Lỗi hệ thống nội bộ. Vui lòng thử lại sau.');
        break;
      default:
        if (status >= 400 && status < 500 && status !== 401) {
          toast.error(errorMessage);
        }
        break;
    }

    return Promise.reject(error);
  }
);
