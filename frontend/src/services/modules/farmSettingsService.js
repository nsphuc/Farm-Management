import apiClient from '../api/apiClient';

export const farmSettingsService = {
  getDataRules: async (farmId) => {
    const res = await apiClient.get(`/api/v1/farms/${farmId}/data-rules`);
    return res.data;
  },

  updateDataRules: async (farmId, data) => {
    const res = await apiClient.put(`/api/v1/farms/${farmId}/data-rules`, data);
    return res.data;
  },

  getFinancialSettings: async (farmId) => {
    const res = await apiClient.get(`/api/v1/farms/${farmId}/financial-settings`);
    return res.data;
  },

  updateFinancialSettings: async (farmId, data) => {
    const res = await apiClient.put(`/api/v1/farms/${farmId}/financial-settings`, data);
    return res.data;
  },

  checkoutSubscription: async (farmId, data) => {
    const res = await apiClient.post(`/api/v1/farms/${farmId}/addons/checkout`, data);
    return res.data;
  },

  getSubscriptionOrders: async (farmId) => {
    const res = await apiClient.get(`/api/v1/farms/${farmId}/addons/orders`);
    return res.data;
  },

  mockSuccessPayment: async (orderCode) => {
    const res = await apiClient.post('/api/webhooks/mock-success', { orderCode });
    return res.data;
  },
};
