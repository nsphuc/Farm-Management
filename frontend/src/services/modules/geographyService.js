import { apiClient } from '../api/apiClient';
import { API_ENDPOINTS } from '../api/endpoints';

export const geographyService = {
  // Farms
  getFarms: async (params = {}) => {
    const res = await apiClient.get(API_ENDPOINTS.GEOGRAPHY.FARMS, { params });
    return res.data;
  },
  getFarmById: async (farmId) => {
    const res = await apiClient.get(API_ENDPOINTS.GEOGRAPHY.FARM_DETAIL(farmId));
    return res.data;
  },
  createFarm: async (data) => {
    const res = await apiClient.post(API_ENDPOINTS.GEOGRAPHY.FARMS, data);
    return res.data;
  },
  updateFarm: async (farmId, data) => {
    const res = await apiClient.put(API_ENDPOINTS.GEOGRAPHY.FARM_DETAIL(farmId), data);
    return res.data;
  },

  // Zones
  getZones: async (farmId, params = {}) => {
    const res = await apiClient.get(API_ENDPOINTS.GEOGRAPHY.ZONES(farmId), { params });
    return res.data;
  },
  createZone: async (farmId, data) => {
    const res = await apiClient.post(API_ENDPOINTS.GEOGRAPHY.ZONES(farmId), data);
    return res.data;
  },
  updateZone: async (farmId, zoneId, data) => {
    const res = await apiClient.put(API_ENDPOINTS.GEOGRAPHY.ZONE_DETAIL(farmId, zoneId), data);
    return res.data;
  },
  deleteZone: async (farmId, zoneId) => {
    const res = await apiClient.delete(API_ENDPOINTS.GEOGRAPHY.ZONE_DETAIL(farmId, zoneId));
    return res.data;
  },

  // Locations
  getLocations: async (farmId, zoneId, params = {}) => {
    const res = await apiClient.get(API_ENDPOINTS.GEOGRAPHY.ZONE_LOCATIONS(farmId, zoneId), { params });
    return res.data;
  },
  createLocation: async (farmId, zoneId, data) => {
    const res = await apiClient.post(API_ENDPOINTS.GEOGRAPHY.ZONE_LOCATIONS(farmId, zoneId), data);
    return res.data;
  },
  updateLocation: async (farmId, zoneId, locationId, data) => {
    const res = await apiClient.put(API_ENDPOINTS.GEOGRAPHY.LOCATION_DETAIL(farmId, zoneId, locationId), data);
    return res.data;
  },
  deleteLocation: async (farmId, zoneId, locationId) => {
    const res = await apiClient.delete(API_ENDPOINTS.GEOGRAPHY.LOCATION_DETAIL(farmId, zoneId, locationId));
    return res.data;
  },

  // Assignments
  getAssignments: async (farmId) => {
    const res = await apiClient.get(API_ENDPOINTS.GEOGRAPHY.ASSIGNMENTS(farmId));
    return res.data;
  },
  createAssignment: async (farmId, data) => {
    const res = await apiClient.post(API_ENDPOINTS.GEOGRAPHY.ASSIGNMENTS(farmId), data);
    return res.data;
  },
  deleteAssignment: async (farmId, assignmentId) => {
    const res = await apiClient.delete(`${API_ENDPOINTS.GEOGRAPHY.ASSIGNMENTS(farmId)}/${assignmentId}`);
    return res.data;
  },

  // Operational Cycles
  getCycles: async (farmId) => {
    const res = await apiClient.get(API_ENDPOINTS.GEOGRAPHY.CYCLES(farmId));
    return res.data;
  },
  createCycle: async (farmId, data) => {
    const res = await apiClient.post(API_ENDPOINTS.GEOGRAPHY.CYCLES(farmId), data);
    return res.data;
  },
  updateCycle: async (farmId, cycleId, data) => {
    const res = await apiClient.put(`${API_ENDPOINTS.GEOGRAPHY.CYCLES(farmId)}/${cycleId}`, data);
    return res.data;
  },

  // Operational Settings
  getSettings: async (farmId) => {
    const res = await apiClient.get(API_ENDPOINTS.GEOGRAPHY.SETTINGS(farmId));
    return res.data;
  },
  updateSettings: async (farmId, data) => {
    const res = await apiClient.put(API_ENDPOINTS.GEOGRAPHY.SETTINGS(farmId), data);
    return res.data;
  },
};
