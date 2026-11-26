import apiClient from '../api/apiClient';

export const branchService = {
  getBranchesSummary: async (farmId) => {
    const res = await apiClient.get('/api/v1/branches/summary', { params: farmId ? { farmId } : {} });
    return res.data;
  },

  getBranches: async (farmId) => {
    const res = await apiClient.get(`/api/v1/farms/${farmId}/branches`);
    return res.data;
  },

  getBranchById: async (farmId, branchId) => {
    const res = await apiClient.get(`/api/v1/farms/${farmId}/branches/${branchId}`);
    return res.data;
  },

  createBranch: async (farmId, data) => {
    const res = await apiClient.post(`/api/v1/farms/${farmId}/branches`, data);
    return res.data;
  },

  updateBranch: async (farmId, branchId, data) => {
    const res = await apiClient.put(`/api/v1/farms/${farmId}/branches/${branchId}`, data);
    return res.data;
  },

  deleteBranch: async (farmId, branchId) => {
    await apiClient.delete(`/api/v1/farms/${farmId}/branches/${branchId}`);
  },

  setDefaultBranch: async (farmId, branchId) => {
    const res = await apiClient.post(`/api/v1/farms/${farmId}/branches/${branchId}/set-default`);
    return res.data;
  },
};
