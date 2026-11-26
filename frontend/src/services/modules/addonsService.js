import apiClient from '../api/apiClient';

export const addonsService = {
  // 1. Lương & Chấm công KPI
  getPayrollSheets: async (params = {}) => {
    const res = await apiClient.get('/api/v1/addons/payroll/sheets', { params });
    return res.data;
  },

  updatePayrollSheet: async (id, data, params = {}) => {
    const res = await apiClient.put(`/api/v1/addons/payroll/sheets/${id}`, data, { params });
    return res.data;
  },

  closeAndPayPayroll: async (data, params = {}) => {
    const res = await apiClient.post('/api/v1/addons/payroll/close-and-pay', data, { params });
    return res.data;
  },

  // 2. Mở rộng vai trò (Custom Roles)
  getCustomRoles: async (params = {}) => {
    const res = await apiClient.get('/api/v1/addons/custom-roles', { params });
    return res.data;
  },

  getCustomRolePermissions: async (params = {}) => {
    const res = await apiClient.get('/api/v1/addons/custom-roles/permissions', { params });
    return res.data;
  },

  createCustomRole: async (data, params = {}) => {
    const res = await apiClient.post('/api/v1/addons/custom-roles', data, { params });
    return res.data;
  },

  updateCustomRole: async (id, data, params = {}) => {
    const res = await apiClient.put(`/api/v1/addons/custom-roles/${id}`, data, { params });
    return res.data;
  },

  deleteCustomRole: async (id, params = {}) => {
    await apiClient.delete(`/api/v1/addons/custom-roles/${id}`, { params });
  },

  // 3. Gia súc sinh sản
  getBreedingSummary: async (params = {}) => {
    const res = await apiClient.get('/api/v1/addons/breeding/summary', { params });
    return res.data;
  },

  getBreedingAnimals: async (params = {}) => {
    const res = await apiClient.get('/api/v1/addons/breeding/animals', { params });
    return res.data;
  },

  createBreedingAnimal: async (data, params = {}) => {
    const res = await apiClient.post('/api/v1/addons/breeding/animals', data, { params });
    return res.data;
  },

  updateBreedingAnimal: async (id, data, params = {}) => {
    const res = await apiClient.put(`/api/v1/addons/breeding/animals/${id}`, data, { params });
    return res.data;
  },

  recordBreedingEvent: async (id, data, params = {}) => {
    const res = await apiClient.post(`/api/v1/addons/breeding/animals/${id}/record-event`, data, { params });
    return res.data;
  },

  deleteBreedingAnimal: async (id, params = {}) => {
    await apiClient.delete(`/api/v1/addons/breeding/animals/${id}`, { params });
  },

  // 4. Ấp nở & Trứng giống
  getHatcherySummary: async (params = {}) => {
    const res = await apiClient.get('/api/v1/addons/hatchery/summary', { params });
    return res.data;
  },

  getHatcheryBatches: async (params = {}) => {
    const res = await apiClient.get('/api/v1/addons/hatchery/batches', { params });
    return res.data;
  },

  createHatcheryBatch: async (data, params = {}) => {
    const res = await apiClient.post('/api/v1/addons/hatchery/batches', data, { params });
    return res.data;
  },

  updateCandling: async (id, fertileEggs, params = {}) => {
    const res = await apiClient.put(`/api/v1/addons/hatchery/batches/${id}/candling`, null, {
      params: { ...params, fertileEggs },
    });
    return res.data;
  },

  finalizeHatch: async (id, data, params = {}) => {
    const res = await apiClient.post(`/api/v1/addons/hatchery/batches/${id}/finalize`, data, { params });
    return res.data;
  },

  deleteHatcheryBatch: async (id, params = {}) => {
    await apiClient.delete(`/api/v1/addons/hatchery/batches/${id}`, { params });
  },

  // 5. Sản xuất cám
  getFeedBoms: async (params = {}) => {
    const res = await apiClient.get('/api/v1/addons/feed-production/boms', { params });
    return res.data;
  },

  createFeedBom: async (data, params = {}) => {
    const res = await apiClient.post('/api/v1/addons/feed-production/boms', data, { params });
    return res.data;
  },

  updateFeedBom: async (id, data, params = {}) => {
    const res = await apiClient.put(`/api/v1/addons/feed-production/boms/${id}`, data, { params });
    return res.data;
  },

  deleteFeedBom: async (id, params = {}) => {
    await apiClient.delete(`/api/v1/addons/feed-production/boms/${id}`, { params });
  },

  getFeedOrders: async (params = {}) => {
    const res = await apiClient.get('/api/v1/addons/feed-production/orders', { params });
    return res.data;
  },

  executeFeedOrder: async (data, params = {}) => {
    const res = await apiClient.post('/api/v1/addons/feed-production/orders', data, { params });
    return res.data;
  },
};

export default addonsService;
