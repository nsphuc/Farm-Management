import { apiClient } from './apiClient';

export const enterpriseService = {
  getMyEnterprise: async () => {
    const response = await apiClient.get('/enterprises/my');
    return response.data.data;
  },

  updateMyEnterprise: async (payload) => {
    const response = await apiClient.put('/enterprises/my', payload);
    return response.data.data;
  },
};
