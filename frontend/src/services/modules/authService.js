import { apiClient } from '../api/apiClient';
import { API_ENDPOINTS } from '../api/endpoints';

/**
 * authService - Toàn bộ API xác thực chuẩn hóa duy nhất tiền tố /api/v1/auth/*
 */
export const authService = {
  login: async (credentials) => {
    const res = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    return res.data;
  },

  register: async (data) => {
    const res = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, data);
    return res.data;
  },

  sendOtp: async (data) => {
    const res = await apiClient.post(API_ENDPOINTS.AUTH.SEND_OTP, data);
    return res.data;
  },

  forgotPasswordWithOtp: async (data) => {
    const res = await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD_WITH_OTP, data);
    return res.data;
  },

  getMe: async () => {
    const res = await apiClient.get(API_ENDPOINTS.AUTH.ME);
    return res.data;
  },

  getMyPermissions: async () => {
    const res = await apiClient.get(API_ENDPOINTS.AUTH.MY_PERMISSIONS);
    return res.data;
  },

  changePassword: async (data) => {
    const res = await apiClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data);
    return res.data;
  },

  logout: async () => {
    const res = await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    return res.data;
  },
};

export default authService;
