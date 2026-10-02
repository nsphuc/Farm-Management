import { apiClient } from './apiClient';

export const cropService = {
  // Giống cây trồng (Crop Types)
  getCropTypes: async () => {
    const response = await apiClient.get('/crop-types');
    return response.data.data;
  },

  getCropTypeById: async (id) => {
    const response = await apiClient.get(`/crop-types/${id}`);
    return response.data.data;
  },

  createCropType: async (payload) => {
    const response = await apiClient.post('/crop-types', payload);
    return response.data.data;
  },

  updateCropType: async (id, payload) => {
    const response = await apiClient.put(`/crop-types/${id}`, payload);
    return response.data.data;
  },

  deleteCropType: async (id) => {
    const response = await apiClient.delete(`/crop-types/${id}`);
    return response.data.data;
  },

  // Vụ mùa canh tác (Crop Seasons)
  getSeasons: async (farmId, params = {}) => {
    const response = await apiClient.get(`/farms/${farmId}/seasons`, { params });
    return response.data.data;
  },

  getSeasonById: async (farmId, seasonId) => {
    const response = await apiClient.get(`/farms/${farmId}/seasons/${seasonId}`);
    return response.data.data;
  },

  createSeason: async (farmId, payload) => {
    const response = await apiClient.post(`/farms/${farmId}/seasons`, payload);
    return response.data.data;
  },

  updateSeason: async (farmId, seasonId, payload) => {
    const response = await apiClient.put(`/farms/${farmId}/seasons/${seasonId}`, payload);
    return response.data.data;
  },

  harvestSeason: async (farmId, seasonId, payload) => {
    const response = await apiClient.patch(`/farms/${farmId}/seasons/${seasonId}/harvest`, payload);
    return response.data.data;
  },

  updateSeasonStatus: async (farmId, seasonId, status) => {
    const response = await apiClient.patch(`/farms/${farmId}/seasons/${seasonId}/status`, null, {
      params: { status },
    });
    return response.data.data;
  },

  deleteSeason: async (farmId, seasonId) => {
    const response = await apiClient.delete(`/farms/${farmId}/seasons/${seasonId}`);
    return response.data.data;
  },

  // Nhật ký canh tác VietGAP (Farming Logs)
  getFarmingLogs: async (farmId, seasonId, params = {}) => {
    const response = await apiClient.get(`/farms/${farmId}/seasons/${seasonId}/logs`, { params });
    return response.data.data;
  },

  getFarmingLogById: async (farmId, seasonId, logId) => {
    const response = await apiClient.get(`/farms/${farmId}/seasons/${seasonId}/logs/${logId}`);
    return response.data.data;
  },

  createFarmingLog: async (farmId, seasonId, payload) => {
    const response = await apiClient.post(`/farms/${farmId}/seasons/${seasonId}/logs`, payload);
    return response.data.data;
  },

  deleteFarmingLog: async (farmId, seasonId, logId) => {
    const response = await apiClient.delete(`/farms/${farmId}/seasons/${seasonId}/logs/${logId}`);
    return response.data.data;
  },
};
