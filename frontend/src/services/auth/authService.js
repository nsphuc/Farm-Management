import axiosClient from '../axiosClient';

/**
 * Service giao tiếp với các API xác thực Backend (/api/v1/auth).
 */
export const authService = {
  login: async (username, password) => {
    return axiosClient.post('/auth/login', { username, password });
  },

  refreshToken: async () => {
    return axiosClient.post('/auth/refresh');
  },

  logout: async () => {
    return axiosClient.post('/auth/logout');
  },

  getCurrentUser: async () => {
    return axiosClient.get('/auth/me');
  },
};

export default authService;
