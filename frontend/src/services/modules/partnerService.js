import { apiClient } from '../api/apiClient';
import { API_ENDPOINTS } from '../api/endpoints';

export const partnerService = {
  getPartners: async (params = {}) => {
    const res = await apiClient.get(API_ENDPOINTS.PARTNERS.LIST, { params });
    return res.data;
  },

  getPartnerById: async (id) => {
    const res = await apiClient.get(API_ENDPOINTS.PARTNERS.DETAIL(id));
    return res.data;
  },

  createPartner: async (data) => {
    const res = await apiClient.post(API_ENDPOINTS.PARTNERS.LIST, data);
    return res.data;
  },

  updatePartner: async (id, data) => {
    const res = await apiClient.put(API_ENDPOINTS.PARTNERS.DETAIL(id), data);
    return res.data;
  },

  updatePartnerStatus: async (id, status) => {
    const res = await apiClient.patch(API_ENDPOINTS.PARTNERS.STATUS(id), { status });
    return res.data;
  },

  deletePartner: async (id) => {
    const res = await apiClient.delete(API_ENDPOINTS.PARTNERS.DETAIL(id));
    return res.data;
  },
};
