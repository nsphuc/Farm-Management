import { apiClient } from '../api/apiClient';
import { API_ENDPOINTS } from '../api/endpoints';

export const enterpriseService = {
  getProfile: async () => {
    const res = await apiClient.get(API_ENDPOINTS.ENTERPRISE.PROFILE);
    return res.data;
  },

  updateProfile: async (data) => {
    const res = await apiClient.put(API_ENDPOINTS.ENTERPRISE.PROFILE, data);
    return res.data;
  },
};
