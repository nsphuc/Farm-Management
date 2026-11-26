import apiClient from '../api/apiClient';

export const settingsService = {
  // Mục 1: Thông tin dịch vụ & Add-ons
  getServiceSettings: async (farmId) => {
    const res = await apiClient.get('/api/v1/settings/service', { params: farmId ? { farmId } : {} });
    return res.data;
  },

  updateServiceSettings: async (farmId, data) => {
    const res = await apiClient.put('/api/v1/settings/service', data, { params: farmId ? { farmId } : {} });
    return res.data;
  },

  getAddons: async (farmId) => {
    const res = await apiClient.get('/api/v1/subscriptions/add-ons', { params: farmId ? { farmId } : {} });
    return res.data;
  },

  checkoutAddon: async (farmId, data) => {
    const res = await apiClient.post('/api/v1/subscriptions/checkout', data, { params: farmId ? { farmId } : {} });
    return res.data;
  },

  simulateWebhook: async (orderNo) => {
    const res = await apiClient.post(`/api/v1/subscriptions/${orderNo}/simulate-webhook`);
    return res.data;
  },

  // Mục 2: Quyền hạn người dùng (Members)
  getMembers: async (farmId) => {
    const res = await apiClient.get('/api/v1/settings/members', { params: farmId ? { farmId } : {} });
    return res.data;
  },

  upsertMember: async (farmId, data) => {
    const res = await apiClient.post('/api/v1/settings/members', data, { params: farmId ? { farmId } : {} });
    return res.data;
  },

  deleteMember: async (farmId, userId) => {
    await apiClient.delete(`/api/v1/settings/members/${userId}`, { params: farmId ? { farmId } : {} });
  },

  // Mục 3, 4, 5: Quản lý 3 Kho Vai trò SCRUD
  getRoles: async (farmId) => {
    const res = await apiClient.get('/api/v1/settings/roles', { params: farmId ? { farmId } : {} });
    return res.data;
  },

  createRole: async (farmId, data) => {
    const res = await apiClient.post('/api/v1/settings/roles', data, { params: farmId ? { farmId } : {} });
    return res.data;
  },

  updateRole: async (farmId, roleId, data) => {
    const res = await apiClient.put(`/api/v1/settings/roles/${roleId}`, data, { params: farmId ? { farmId } : {} });
    return res.data;
  },

  deleteRole: async (farmId, roleId) => {
    await apiClient.delete(`/api/v1/settings/roles/${roleId}`, { params: farmId ? { farmId } : {} });
  },

  // Mục 6: Master data (Đối tác, VietQR, Quy tắc vận hành)
  getPartners: async (params = {}) => {
    const res = await apiClient.get('/api/v1/partners', { params });
    return res.data;
  },

  createPartner: async (data) => {
    const res = await apiClient.post('/api/v1/partners', data);
    return res.data;
  },

  updatePartner: async (id, data) => {
    const res = await apiClient.put(`/api/v1/partners/${id}`, data);
    return res.data;
  },

  deletePartner: async (id) => {
    await apiClient.delete(`/api/v1/partners/${id}`);
  },

  getFinancialSettings: async (farmId) => {
    const res = await apiClient.get(`/api/v1/farms/${farmId}/financial-settings`);
    return res.data;
  },

  updateFinancialSettings: async (farmId, data) => {
    const res = await apiClient.put(`/api/v1/farms/${farmId}/financial-settings`, data);
    return res.data;
  },

  getDataRules: async (farmId) => {
    const res = await apiClient.get(`/api/v1/farms/${farmId}/data-rules`);
    return res.data;
  },

  updateDataRules: async (farmId, data) => {
    const res = await apiClient.put(`/api/v1/farms/${farmId}/data-rules`, data);
    return res.data;
  },
};

export default settingsService;
