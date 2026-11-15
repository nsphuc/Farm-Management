import { apiClient } from '../api/apiClient';
import { API_ENDPOINTS } from '../api/endpoints';

const resolveFarmId = (farmId) => {
  if (typeof farmId === 'object' && farmId !== null) {
    return farmId.farmId ? Number(farmId.farmId) : null;
  }
  return farmId && farmId !== 'ALL' ? Number(farmId) : null;
};

const isValidFarmId = (farmId) => {
  const resolved = resolveFarmId(farmId);
  return Boolean(resolved && !Number.isNaN(resolved));
};

export const geographyService = {
  // Farms
  getFarms: async (params = {}) => {
    const res = await apiClient.get(API_ENDPOINTS.GEOGRAPHY.FARMS, { params });
    return res.data;
  },
  getFarmById: async (farmId) => {
    const targetFarmId = resolveFarmId(farmId);
    if (!isValidFarmId(targetFarmId)) return null;
    const res = await apiClient.get(API_ENDPOINTS.GEOGRAPHY.FARM_DETAIL(targetFarmId));
    return res.data;
  },
  createFarm: async (data) => {
    const res = await apiClient.post(API_ENDPOINTS.GEOGRAPHY.FARMS, data);
    return res.data;
  },
  updateFarm: async (farmId, data) => {
    const targetFarmId = resolveFarmId(farmId);
    if (!isValidFarmId(targetFarmId)) return null;
    const res = await apiClient.put(API_ENDPOINTS.GEOGRAPHY.FARM_DETAIL(targetFarmId), data);
    return res.data;
  },
  updateFarmStatus: async (farmId, statusOrPayload) => {
    const targetFarmId = resolveFarmId(farmId);
    if (!isValidFarmId(targetFarmId)) return null;
    const statusVal = typeof statusOrPayload === 'object' && statusOrPayload !== null
      ? statusOrPayload.status
      : statusOrPayload;
    const res = await apiClient.patch(
      `${API_ENDPOINTS.GEOGRAPHY.FARMS}/${targetFarmId}/status`,
      { status: statusVal },
      { params: { status: statusVal } }
    );
    return res.data;
  },

  // Zones
  getZones: async (farmId, params = {}) => {
    const targetFarmId = resolveFarmId(farmId);
    if (!isValidFarmId(targetFarmId)) {
      return [];
    }
    const cleanParams = typeof farmId === 'object' && farmId !== null ? { ...farmId, ...params } : params;
    delete cleanParams.farmId;
    const res = await apiClient.get(API_ENDPOINTS.GEOGRAPHY.ZONES(targetFarmId), { params: cleanParams });
    return res.data;
  },
  createZone: async (farmId, data) => {
    if (!isValidFarmId(farmId)) return null;
    const res = await apiClient.post(API_ENDPOINTS.GEOGRAPHY.ZONES(farmId), data);
    return res.data;
  },
  updateZone: async (farmId, zoneId, data) => {
    if (!isValidFarmId(farmId)) return null;
    const res = await apiClient.put(API_ENDPOINTS.GEOGRAPHY.ZONE_DETAIL(farmId, zoneId), data);
    return res.data;
  },
  deleteZone: async (farmId, zoneId) => {
    if (!isValidFarmId(farmId)) return null;
    const res = await apiClient.delete(API_ENDPOINTS.GEOGRAPHY.ZONE_DETAIL(farmId, zoneId));
    return res.data;
  },

  // Locations
  getLocations: async (farmId, zoneId, params = {}) => {
    const targetFarmId = resolveFarmId(farmId);
    if (!isValidFarmId(targetFarmId) || !zoneId) {
      return [];
    }
    const res = await apiClient.get(API_ENDPOINTS.GEOGRAPHY.ZONE_LOCATIONS(targetFarmId, zoneId), { params });
    return res.data;
  },
  createLocation: async (farmId, zoneId, data) => {
    if (!isValidFarmId(farmId)) return null;
    const res = await apiClient.post(API_ENDPOINTS.GEOGRAPHY.ZONE_LOCATIONS(farmId, zoneId), data);
    return res.data;
  },
  updateLocation: async (farmId, zoneId, locationId, data) => {
    if (!isValidFarmId(farmId)) return null;
    const res = await apiClient.put(API_ENDPOINTS.GEOGRAPHY.LOCATION_DETAIL(farmId, zoneId, locationId), data);
    return res.data;
  },
  deleteLocation: async (farmId, zoneId, locationId) => {
    if (!isValidFarmId(farmId)) return null;
    const res = await apiClient.delete(API_ENDPOINTS.GEOGRAPHY.LOCATION_DETAIL(farmId, zoneId, locationId));
    return res.data;
  },

  // Assignments
  getAssignments: async (farmId) => {
    if (!isValidFarmId(farmId)) {
      return [];
    }
    const res = await apiClient.get(API_ENDPOINTS.GEOGRAPHY.ASSIGNMENTS(farmId));
    return res.data;
  },
  createAssignment: async (farmId, data) => {
    if (!isValidFarmId(farmId)) return null;
    const res = await apiClient.post(API_ENDPOINTS.GEOGRAPHY.ASSIGNMENTS(farmId), data);
    return res.data;
  },
  deleteAssignment: async (farmId, assignmentId, params = {}) => {
    if (!isValidFarmId(farmId)) return null;
    const res = await apiClient.delete(`${API_ENDPOINTS.GEOGRAPHY.ASSIGNMENTS(farmId)}/${assignmentId}`, { params });
    return res.data;
  },

  // Operational Cycles
  getCycles: async (farmId) => {
    if (!isValidFarmId(farmId)) {
      return [];
    }
    const res = await apiClient.get(API_ENDPOINTS.GEOGRAPHY.CYCLES(farmId));
    return res.data;
  },
  createCycle: async (farmId, data) => {
    if (!isValidFarmId(farmId)) return null;
    const res = await apiClient.post(API_ENDPOINTS.GEOGRAPHY.CYCLES(farmId), data);
    return res.data;
  },
  updateCycle: async (farmId, cycleId, data) => {
    if (!isValidFarmId(farmId)) return null;
    const res = await apiClient.put(`${API_ENDPOINTS.GEOGRAPHY.CYCLES(farmId)}/${cycleId}`, data);
    return res.data;
  },
  deleteCycle: async (farmId, cycleId) => {
    if (!isValidFarmId(farmId)) return null;
    const res = await apiClient.delete(`${API_ENDPOINTS.GEOGRAPHY.CYCLES(farmId)}/${cycleId}`);
    return res.data;
  },

  // Operational Settings
  getSettings: async (farmId) => {
    if (!isValidFarmId(farmId)) {
      return null;
    }
    const res = await apiClient.get(API_ENDPOINTS.GEOGRAPHY.SETTINGS(farmId));
    return res.data;
  },
  updateSettings: async (farmId, data) => {
    if (!isValidFarmId(farmId)) return null;
    const res = await apiClient.put(API_ENDPOINTS.GEOGRAPHY.SETTINGS(farmId), data);
    return res.data;
  },
};
