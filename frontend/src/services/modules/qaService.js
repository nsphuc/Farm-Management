import { apiClient } from '../api/apiClient';

export const qaService = {
  /**
   * Lập biên bản thu hoạch (ROLE_FIELD_STAFF / ROLE_FARM_MANAGER)
   */
  createHarvestRecord: async (farmId, data) => {
    const targetFarmId = typeof farmId === 'object' && farmId !== null ? farmId.farmId : farmId;
    const response = await apiClient.post(`/farms/${targetFarmId}/harvest-records`, data);
    return response.data?.data || response.data;
  },

  /**
   * Lấy danh sách biên bản thu hoạch
   */
  getHarvestRecords: async (farmId, params = {}) => {
    const targetFarmId = typeof farmId === 'object' && farmId !== null ? farmId.farmId : farmId;
    const response = await apiClient.get(`/farms/${targetFarmId}/harvest-records`, { params });
    return response.data?.data || response.data;
  },
};

export default qaService;
