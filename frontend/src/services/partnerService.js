import { apiClient } from './apiClient';

export const partnerService = {
  getPartners: async (params = {}) => {
    const response = await apiClient.get('/partners', { params });
    return response.data.data;
  },

  getPartnerById: async (id) => {
    const response = await apiClient.get(`/partners/${id}`);
    return response.data.data;
  },

  createPartner: async (payload) => {
    const response = await apiClient.post('/partners', payload);
    return response.data.data;
  },

  updatePartner: async (id, payload) => {
    const response = await apiClient.put(`/partners/${id}`, payload);
    return response.data.data;
  },

  deletePartner: async (id) => {
    const response = await apiClient.delete(`/partners/${id}`);
    return response.data.data;
  },
};
