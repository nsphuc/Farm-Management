import { apiClient } from '../api/apiClient';
import { API_ENDPOINTS } from '../api/endpoints';

const cleanParams = (params = {}) => {
  const cleaned = { ...params };
  if (
    cleaned.branchId === 'ALL' ||
    cleaned.branchId === '' ||
    cleaned.branchId === null ||
    cleaned.branchId === undefined
  ) {
    delete cleaned.branchId;
  } else if (!isNaN(Number(cleaned.branchId))) {
    cleaned.branchId = Number(cleaned.branchId);
  }
  if (
    cleaned.farmId === 'ALL' ||
    cleaned.farmId === '' ||
    cleaned.farmId === null ||
    cleaned.farmId === undefined
  ) {
    delete cleaned.farmId;
  } else if (!isNaN(Number(cleaned.farmId))) {
    cleaned.farmId = Number(cleaned.farmId);
  }
  return cleaned;
};

export const barnBatchService = {
  // Zones (Khu nuôi)
  getZones: async (params = {}) => {
    const res = await apiClient.get(API_ENDPOINTS.BARNS_BATCHES.ZONES, { params: cleanParams(params) });
    return res.data;
  },

  createZone: async (data, params = {}) => {
    const res = await apiClient.post(API_ENDPOINTS.BARNS_BATCHES.ZONES, data, { params: cleanParams(params) });
    return res.data;
  },

  updateZone: async (id, data, params = {}) => {
    const res = await apiClient.put(API_ENDPOINTS.BARNS_BATCHES.ZONE_DETAIL(id), data, { params: cleanParams(params) });
    return res.data;
  },

  deleteZone: async (id, params = {}) => {
    const res = await apiClient.delete(API_ENDPOINTS.BARNS_BATCHES.ZONE_DETAIL(id), { params: cleanParams(params) });
    return res.data;
  },

  // Barns (Chuồng nuôi)
  getBarns: async (params = {}) => {
    const res = await apiClient.get(API_ENDPOINTS.BARNS_BATCHES.BARNS, { params: cleanParams(params) });
    return res.data;
  },

  createBarn: async (data, params = {}) => {
    const res = await apiClient.post(API_ENDPOINTS.BARNS_BATCHES.BARNS, data, { params: cleanParams(params) });
    return res.data;
  },

  updateBarn: async (id, data, params = {}) => {
    const res = await apiClient.put(API_ENDPOINTS.BARNS_BATCHES.BARN_DETAIL(id), data, { params: cleanParams(params) });
    return res.data;
  },

  deleteBarn: async (id, params = {}) => {
    const res = await apiClient.delete(API_ENDPOINTS.BARNS_BATCHES.BARN_DETAIL(id), { params: cleanParams(params) });
    return res.data;
  },

  // Batches (Lứa nuôi)
  getBatchById: async (id) => {
    const res = await apiClient.get(API_ENDPOINTS.BARNS_BATCHES.BATCH_DETAIL(id));
    return res.data;
  },

  updateTargets: async (id, data) => {
    const res = await apiClient.put(API_ENDPOINTS.BARNS_BATCHES.BATCH_TARGETS(id), data);
    return res.data;
  },

  addGroup: async (id, data) => {
    const res = await apiClient.post(API_ENDPOINTS.BARNS_BATCHES.BATCH_GROUPS(id), data);
    return res.data;
  },

  applyProgram: async (id, data) => {
    const res = await apiClient.post(API_ENDPOINTS.BARNS_BATCHES.BATCH_PROGRAMS(id), data);
    return res.data;
  },

  removeProgram: async (id, programId) => {
    const res = await apiClient.delete(API_ENDPOINTS.BARNS_BATCHES.BATCH_PROGRAM_DETAIL(id, programId));
    return res.data;
  },

  addByProduct: async (id, data) => {
    const res = await apiClient.post(API_ENDPOINTS.BARNS_BATCHES.BATCH_BY_PRODUCTS(id), data);
    return res.data;
  },

  createBatch: async (data, params = {}) => {
    const res = await apiClient.post(API_ENDPOINTS.BARNS_BATCHES.BATCHES, data, { params });
    return res.data;
  },

  splitBatch: async (id, data) => {
    const res = await apiClient.post(API_ENDPOINTS.BARNS_BATCHES.BATCH_SPLIT(id), data);
    return res.data;
  },

  closeBatch: async (id) => {
    const res = await apiClient.post(API_ENDPOINTS.BARNS_BATCHES.BATCH_CLOSE(id));
    return res.data;
  },
};

export default barnBatchService;
