import apiClient from '../api/apiClient';

export const platformAdminService = {
  // 1. Dashboard metrics & overview
  getDashboard: async () => {
    const res = await apiClient.get('/api/v1/platform/dashboard');
    return res.data;
  },

  // 2. Tenants management
  getTenants: async () => {
    const res = await apiClient.get('/api/v1/platform/tenants');
    return res.data;
  },

  updateTenantStatus: async (id, status, reason = '') => {
    const res = await apiClient.put(`/api/v1/platform/tenants/${id}/status`, { status, reason });
    return res.data;
  },

  renewTenant: async (id, months, reason = '') => {
    const res = await apiClient.post(`/api/v1/platform/tenants/${id}/renew`, { months, reason });
    return res.data;
  },

  // 3. Packages & Addons pricing
  getPackages: async () => {
    const res = await apiClient.get('/api/v1/platform/packages');
    return res.data;
  },

  updatePackage: async (code, data) => {
    const res = await apiClient.put(`/api/v1/platform/packages/${code}`, data);
    return res.data;
  },

  // 4. Transactions & Webhook IPN logs
  getTransactions: async () => {
    const res = await apiClient.get('/api/v1/platform/transactions');
    return res.data;
  },

  manualActivateTransaction: async (id) => {
    const res = await apiClient.post(`/api/v1/platform/transactions/${id}/manual-activate`);
    return res.data;
  },
};

export default platformAdminService;
