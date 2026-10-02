import { apiClient } from './apiClient';

export const farmService = {
  // Farms
  getFarms: async (params = {}) => {
    const response = await apiClient.get('/farms', { params });
    return response.data.data;
  },

  getMyAccessibleFarms: async () => {
    const response = await apiClient.get('/farms/my-accessible');
    return response.data.data;
  },

  getFarmById: async (id) => {
    const response = await apiClient.get(`/farms/${id}`);
    return response.data.data;
  },

  createFarm: async (payload) => {
    const response = await apiClient.post('/farms', payload);
    return response.data.data;
  },

  updateFarm: async (id, payload) => {
    const response = await apiClient.put(`/farms/${id}`, payload);
    return response.data.data;
  },

  deleteFarm: async (id) => {
    const response = await apiClient.delete(`/farms/${id}`);
    return response.data.data;
  },

  // Zones
  getZones: async (farmId) => {
    const response = await apiClient.get(`/farms/${farmId}/zones`);
    return response.data.data;
  },

  getZoneById: async (farmId, zoneId) => {
    const response = await apiClient.get(`/farms/${farmId}/zones/${zoneId}`);
    return response.data.data;
  },

  createZone: async (farmId, payload) => {
    const response = await apiClient.post(`/farms/${farmId}/zones`, payload);
    return response.data.data;
  },

  updateZone: async (farmId, zoneId, payload) => {
    const response = await apiClient.put(`/farms/${farmId}/zones/${zoneId}`, payload);
    return response.data.data;
  },

  updateZoneStatus: async (farmId, zoneId, status) => {
    const response = await apiClient.patch(`/farms/${farmId}/zones/${zoneId}/status`, { status });
    return response.data.data;
  },

  deleteZone: async (farmId, zoneId) => {
    const response = await apiClient.delete(`/farms/${farmId}/zones/${zoneId}`);
    return response.data.data;
  },

  // Zone Locations
  getLocations: async (farmId, zoneId) => {
    const response = await apiClient.get(`/farms/${farmId}/zones/${zoneId}/locations`);
    return response.data.data;
  },

  createLocation: async (farmId, zoneId, payload) => {
    const response = await apiClient.post(`/farms/${farmId}/zones/${zoneId}/locations`, payload);
    return response.data.data;
  },

  updateLocation: async (farmId, zoneId, locId, payload) => {
    const response = await apiClient.put(`/farms/${farmId}/zones/${zoneId}/locations/${locId}`, payload);
    return response.data.data;
  },

  deleteLocation: async (farmId, zoneId, locId) => {
    const response = await apiClient.delete(`/farms/${farmId}/zones/${zoneId}/locations/${locId}`);
    return response.data.data;
  },

  // Assignments
  getAssignments: async (farmId) => {
    const response = await apiClient.get(`/farms/${farmId}/assignments`);
    return response.data.data;
  },

  createAssignment: async (farmId, payload) => {
    const response = await apiClient.post(`/farms/${farmId}/assignments`, payload);
    return response.data.data;
  },

  revokeAssignment: async (farmId, assignmentId) => {
    const response = await apiClient.delete(`/farms/${farmId}/assignments/${assignmentId}`);
    return response.data.data;
  },

  // Operational Cycles
  getCycles: async (farmId) => {
    const response = await apiClient.get(`/farms/${farmId}/cycles`);
    return response.data.data;
  },

  createCycle: async (farmId, payload) => {
    const response = await apiClient.post(`/farms/${farmId}/cycles`, payload);
    return response.data.data;
  },

  updateCycle: async (farmId, cycleId, payload) => {
    const response = await apiClient.put(`/farms/${farmId}/cycles/${cycleId}`, payload);
    return response.data.data;
  },

  updateCycleStatus: async (farmId, cycleId, status) => {
    const response = await apiClient.patch(`/farms/${farmId}/cycles/${cycleId}/status`, { status });
    return response.data.data;
  },

  deleteCycle: async (farmId, cycleId) => {
    const response = await apiClient.delete(`/farms/${farmId}/cycles/${cycleId}`);
    return response.data.data;
  },

  // Settings
  getSettings: async (farmId) => {
    const response = await apiClient.get(`/farms/${farmId}/settings`);
    return response.data.data;
  },

  updateSettings: async (farmId, payload) => {
    const response = await apiClient.put(`/farms/${farmId}/settings`, payload);
    return response.data.data;
  },
};
