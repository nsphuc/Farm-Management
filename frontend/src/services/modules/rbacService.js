import { apiClient } from '../api/apiClient';

export const rbacService = {
  getRolesForFarm: async (farmId) => {
    const res = await apiClient.get(`/api/v1/farms/${farmId}/roles`);
    return res.data;
  },

  createCustomRole: async (farmId, payload) => {
    const res = await apiClient.post(`/api/v1/farms/${farmId}/roles`, payload);
    return res.data;
  },

  updateCustomRole: async (farmId, roleId, payload) => {
    const res = await apiClient.put(`/api/v1/farms/${farmId}/roles/${roleId}`, payload);
    return res.data;
  },

  deleteCustomRole: async (farmId, roleId) => {
    const res = await apiClient.delete(`/api/v1/farms/${farmId}/roles/${roleId}`);
    return res.data;
  },

  getAllPermissions: async () => {
    const res = await apiClient.get('/api/v1/system/permissions');
    return res.data;
  },

  getFarmMembers: async (farmId) => {
    const res = await apiClient.get(`/api/v1/farms/${farmId}/members`);
    return res.data;
  },

  upsertFarmMember: async (farmId, payload) => {
    const res = await apiClient.post(`/api/v1/farms/${farmId}/members`, payload);
    return res.data;
  },

  removeFarmMember: async (farmId, userId) => {
    const res = await apiClient.delete(`/api/v1/farms/${farmId}/members/${userId}`);
    return res.data;
  },

  getUsers: async (params = {}) => {
    const res = await apiClient.get('/api/v1/users', { params });
    return res.data;
  },

  getFarmAddons: async (farmId) => {
    const res = await apiClient.get(`/api/v1/farms/${farmId}/addons`);
    return res.data;
  },

  toggleFarmAddon: async (farmId, addonCode) => {
    const res = await apiClient.post(`/api/v1/farms/${farmId}/addons/${addonCode}/toggle`);
    return res.data;
  },
};

export default rbacService;
