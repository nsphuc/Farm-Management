import { apiClient } from '../api/apiClient';
import { API_ENDPOINTS } from '../api/endpoints';

/**
 * Helper to safely extract farmId and params regardless of whether caller passes:
 * (farmId, params) OR ({ farmId, ...params })
 */
function resolveFarmArgs(farmIdOrOptions, maybeParams = {}) {
  if (typeof farmIdOrOptions === 'object' && farmIdOrOptions !== null) {
    const { farmId, ...rest } = farmIdOrOptions;
    return {
      farmId: farmId ? Number(farmId) : null,
      params: { ...rest, ...maybeParams },
    };
  }
  return {
    farmId: farmIdOrOptions ? Number(farmIdOrOptions) : null,
    params: maybeParams,
  };
}

export const farmingService = {
  // ==========================================
  // 1. CROP SEASONS (Mùa vụ trồng trọt)
  // ==========================================
  getCropSeasons: async (farmIdOrOptions, params = {}) => {
    const { farmId, params: resolvedParams } = resolveFarmArgs(farmIdOrOptions, params);
    if (!farmId) return { content: [] };
    const res = await apiClient.get(API_ENDPOINTS.OPERATIONS.CROP_SEASONS(farmId), { params: resolvedParams });
    return res.data;
  },

  getCropSeasonById: async (farmId, id) => {
    const targetFarmId = typeof farmId === 'object' && farmId !== null ? farmId.farmId : farmId;
    if (!targetFarmId || !id) return null;
    const res = await apiClient.get(`${API_ENDPOINTS.OPERATIONS.CROP_SEASONS(targetFarmId)}/${id}`);
    return res.data;
  },

  createCropSeason: async (farmId, data) => {
    const targetFarmId = typeof farmId === 'object' && farmId !== null ? farmId.farmId : farmId;
    const res = await apiClient.post(API_ENDPOINTS.OPERATIONS.CROP_SEASONS(targetFarmId), data);
    return res.data;
  },

  updateCropSeason: async (farmId, id, data) => {
    const targetFarmId = typeof farmId === 'object' && farmId !== null ? farmId.farmId : farmId;
    const res = await apiClient.put(`${API_ENDPOINTS.OPERATIONS.CROP_SEASONS(targetFarmId)}/${id}`, data);
    return res.data;
  },

  closeCropSeason: async (farmId, id) => {
    const targetFarmId = typeof farmId === 'object' && farmId !== null ? farmId.farmId : farmId;
    const res = await apiClient.post(API_ENDPOINTS.OPERATIONS.CROP_SEASON_CLOSE(targetFarmId, id));
    return res.data;
  },

  deleteCropSeason: async (farmId, id) => {
    const targetFarmId = typeof farmId === 'object' && farmId !== null ? farmId.farmId : farmId;
    const res = await apiClient.delete(`${API_ENDPOINTS.OPERATIONS.CROP_SEASONS(targetFarmId)}/${id}`);
    return res.data;
  },

  // ==========================================
  // 2. LIVESTOCK GROUPS (Đàn / Lứa vật nuôi)
  // ==========================================
  getLivestockGroups: async (farmIdOrOptions, params = {}) => {
    const { farmId, params: resolvedParams } = resolveFarmArgs(farmIdOrOptions, params);
    if (!farmId) return { content: [] };
    const res = await apiClient.get(API_ENDPOINTS.OPERATIONS.LIVESTOCK_GROUPS(farmId), { params: resolvedParams });
    return res.data;
  },

  getLivestockGroupById: async (farmId, id) => {
    const targetFarmId = typeof farmId === 'object' && farmId !== null ? farmId.farmId : farmId;
    if (!targetFarmId || !id) return null;
    const res = await apiClient.get(`${API_ENDPOINTS.OPERATIONS.LIVESTOCK_GROUPS(targetFarmId)}/${id}`);
    return res.data;
  },

  createLivestockGroup: async (farmId, data) => {
    const targetFarmId = typeof farmId === 'object' && farmId !== null ? farmId.farmId : farmId;
    const res = await apiClient.post(API_ENDPOINTS.OPERATIONS.LIVESTOCK_GROUPS(targetFarmId), data);
    return res.data;
  },

  updateLivestockGroup: async (farmId, id, data) => {
    const targetFarmId = typeof farmId === 'object' && farmId !== null ? farmId.farmId : farmId;
    const res = await apiClient.put(`${API_ENDPOINTS.OPERATIONS.LIVESTOCK_GROUPS(targetFarmId)}/${id}`, data);
    return res.data;
  },

  closeLivestockGroup: async (farmId, id) => {
    const targetFarmId = typeof farmId === 'object' && farmId !== null ? farmId.farmId : farmId;
    const res = await apiClient.post(`${API_ENDPOINTS.OPERATIONS.LIVESTOCK_GROUPS(targetFarmId)}/${id}/close`);
    return res.data;
  },

  deleteLivestockGroup: async (farmId, id) => {
    const targetFarmId = typeof farmId === 'object' && farmId !== null ? farmId.farmId : farmId;
    const res = await apiClient.delete(`${API_ENDPOINTS.OPERATIONS.LIVESTOCK_GROUPS(targetFarmId)}/${id}`);
    return res.data;
  },

  deleteLivestockIndividual: async (farmId, id) => {
    const targetFarmId = typeof farmId === 'object' && farmId !== null ? farmId.farmId : farmId;
    const res = await apiClient.delete(`${API_ENDPOINTS.OPERATIONS.LIVESTOCK_INDIVIDUALS(targetFarmId)}/${id}`);
    return res.data;
  },

  // ==========================================
  // 3. NHẬT KÝ CANH TÁC & SỰ KIỆN THÚ Y
  // ==========================================
  getFarmingLogs: async (farmIdOrOptions, params = {}) => {
    const { farmId, params: resolvedParams } = resolveFarmArgs(farmIdOrOptions, params);
    if (!farmId) return { content: [] };
    const res = await apiClient.get(API_ENDPOINTS.OPERATIONS.FARMING_LOGS(farmId), { params: resolvedParams });
    return res.data;
  },

  createFarmingLog: async (farmId, data) => {
    const targetFarmId = typeof farmId === 'object' && farmId !== null ? farmId.farmId : farmId;
    const res = await apiClient.post(API_ENDPOINTS.OPERATIONS.FARMING_LOGS(targetFarmId), data);
    return res.data;
  },

  getLivestockEvents: async (farmIdOrOptions, params = {}) => {
    const { farmId, params: resolvedParams } = resolveFarmArgs(farmIdOrOptions, params);
    if (!farmId) return { content: [] };
    const res = await apiClient.get(API_ENDPOINTS.OPERATIONS.LIVESTOCK_EVENTS(farmId), { params: resolvedParams });
    return res.data;
  },

  createLivestockEvent: async (farmId, data) => {
    const targetFarmId = typeof farmId === 'object' && farmId !== null ? farmId.farmId : farmId;
    const res = await apiClient.post(API_ENDPOINTS.OPERATIONS.LIVESTOCK_EVENTS(targetFarmId), data);
    return res.data;
  },

  getLivestockWeightLogs: async (farmId, groupId) => {
    const targetFarmId = typeof farmId === 'object' && farmId !== null ? farmId.farmId : farmId;
    const targetGroupId = typeof farmId === 'object' && farmId !== null ? farmId.groupId || groupId : groupId;
    if (!targetFarmId || !targetGroupId) return [];
    const res = await apiClient.get(API_ENDPOINTS.OPERATIONS.LIVESTOCK_WEIGHT_LOGS(targetFarmId, targetGroupId));
    return res.data;
  },

  recordLivestockWeight: async (farmId, groupId, data) => {
    const targetFarmId = typeof farmId === 'object' && farmId !== null ? farmId.farmId : farmId;
    const targetGroupId = typeof farmId === 'object' && farmId !== null ? farmId.groupId || groupId : groupId;
    const res = await apiClient.post(API_ENDPOINTS.OPERATIONS.LIVESTOCK_WEIGHT_LOGS(targetFarmId, targetGroupId), data);
    return res.data;
  },

  getHarvestRecords: async (farmIdOrOptions, params = {}) => {
    const { farmId, params: resolvedParams } = resolveFarmArgs(farmIdOrOptions, params);
    if (!farmId) return { content: [] };
    const res = await apiClient.get(API_ENDPOINTS.OPERATIONS.HARVEST_RECORDS(farmId), { params: resolvedParams });
    return res.data;
  },

  createHarvestRecord: async (farmId, data) => {
    const targetFarmId = typeof farmId === 'object' && farmId !== null ? farmId.farmId : farmId;
    const res = await apiClient.post(API_ENDPOINTS.OPERATIONS.HARVEST_RECORDS(targetFarmId), data);
    return res.data;
  },

  createProductBatch: async (farmId, data) => {
    const targetFarmId = typeof farmId === 'object' && farmId !== null ? farmId.farmId : farmId;
    const res = await apiClient.post(API_ENDPOINTS.QA.BATCHES(targetFarmId), data);
    return res.data;
  },

  // ==========================================
  // 4. CÔNG VIỆC CỐ ĐỊNH HÀNG NGÀY & LỊCH THU HOẠCH
  // ==========================================
  getRoutineTasks: async (farmIdOrOptions, zoneId) => {
    const { farmId, params } = resolveFarmArgs(farmIdOrOptions);
    if (!farmId) return { content: [] };
    const requestParams = { isRoutine: true, size: 100, ...params };
    if (zoneId) requestParams.zoneId = zoneId;
    const res = await apiClient.get(API_ENDPOINTS.HR.TASKS(farmId), { params: requestParams });
    return res.data;
  },

  createRoutineTask: async (farmId, data) => {
    const targetFarmId = typeof farmId === 'object' && farmId !== null ? farmId.farmId : farmId;
    const res = await apiClient.post(API_ENDPOINTS.HR.TASKS(targetFarmId), data);
    return res.data;
  },

  deleteRoutineTask: async (farmId, taskId) => {
    const targetFarmId = typeof farmId === 'object' && farmId !== null ? farmId.farmId : farmId;
    const res = await apiClient.delete(API_ENDPOINTS.HR.TASK_DETAIL(targetFarmId, taskId));
    return res.data;
  },

  scheduleHarvestTask: async (farmId, data) => {
    const targetFarmId = typeof farmId === 'object' && farmId !== null ? farmId.farmId : farmId;
    const res = await apiClient.post(API_ENDPOINTS.HR.TASKS(targetFarmId), data);
    return res.data;
  },
};

export default farmingService;
