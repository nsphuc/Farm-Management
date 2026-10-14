import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../../config/api.config';

const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor: add Correlation ID & Auth header if present
httpClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: unwrap ApiResponse or format ErrorResponse
httpClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const errorData = error.response?.data || {
      status: error.response?.status || 500,
      code: 'NETWORK_ERROR',
      message: 'Không thể kết nối đến máy chủ hoặc máy chủ gặp lỗi.',
    };
    return Promise.reject(errorData);
  }
);

export default httpClient;
