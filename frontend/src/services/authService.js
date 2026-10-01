import { apiClient } from './apiClient';

export const authService = {
  login: async (payload) => {
    const response = await apiClient.post('/auth/login', payload);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  refreshToken: async () => {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  },
};
