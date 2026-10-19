import { apiClient } from '../api/apiClient';
import { API_ENDPOINTS } from '../api/endpoints';

export const masterDataService = {
  // 1. Crop Types
  getCropTypes: async (params = {}) => {
    const res = await apiClient.get(API_ENDPOINTS.MASTER_DATA.CROP_TYPES, { params });
    return res.data;
  },
  createCropType: async (data) => {
    const res = await apiClient.post(API_ENDPOINTS.MASTER_DATA.CROP_TYPES, data);
    return res.data;
  },
  updateCropType: async (id, data) => {
    const res = await apiClient.put(`${API_ENDPOINTS.MASTER_DATA.CROP_TYPES}/${id}`, data);
    return res.data;
  },
  deleteCropType: async (id) => {
    const res = await apiClient.delete(`${API_ENDPOINTS.MASTER_DATA.CROP_TYPES}/${id}`);
    return res.data;
  },

  // 2. Livestock Breeds
  getLivestockBreeds: async (params = {}) => {
    const res = await apiClient.get(API_ENDPOINTS.MASTER_DATA.LIVESTOCK_BREEDS, { params });
    return res.data;
  },
  createLivestockBreed: async (data) => {
    const res = await apiClient.post(API_ENDPOINTS.MASTER_DATA.LIVESTOCK_BREEDS, data);
    return res.data;
  },
  updateLivestockBreed: async (id, data) => {
    const res = await apiClient.put(`${API_ENDPOINTS.MASTER_DATA.LIVESTOCK_BREEDS}/${id}`, data);
    return res.data;
  },
  deleteLivestockBreed: async (id) => {
    const res = await apiClient.delete(`${API_ENDPOINTS.MASTER_DATA.LIVESTOCK_BREEDS}/${id}`);
    return res.data;
  },

  // 3. Material Categories
  getMaterialCategories: async (params = {}) => {
    const res = await apiClient.get(API_ENDPOINTS.MASTER_DATA.MATERIAL_CATEGORIES, { params });
    return res.data;
  },
  createMaterialCategory: async (data) => {
    const res = await apiClient.post(API_ENDPOINTS.MASTER_DATA.MATERIAL_CATEGORIES, data);
    return res.data;
  },
  updateMaterialCategory: async (id, data) => {
    const res = await apiClient.put(`${API_ENDPOINTS.MASTER_DATA.MATERIAL_CATEGORIES}/${id}`, data);
    return res.data;
  },
  deleteMaterialCategory: async (id) => {
    const res = await apiClient.delete(`${API_ENDPOINTS.MASTER_DATA.MATERIAL_CATEGORIES}/${id}`);
    return res.data;
  },

  // 4. Materials
  getMaterials: async (params = {}) => {
    const res = await apiClient.get(API_ENDPOINTS.MASTER_DATA.MATERIALS, { params });
    return res.data;
  },
  getMaterialById: async (id) => {
    const res = await apiClient.get(`${API_ENDPOINTS.MASTER_DATA.MATERIALS}/${id}`);
    return res.data;
  },
  createMaterial: async (data) => {
    const res = await apiClient.post(API_ENDPOINTS.MASTER_DATA.MATERIALS, data);
    return res.data;
  },
  updateMaterial: async (id, data) => {
    const res = await apiClient.put(`${API_ENDPOINTS.MASTER_DATA.MATERIALS}/${id}`, data);
    return res.data;
  },
  deleteMaterial: async (id) => {
    const res = await apiClient.delete(`${API_ENDPOINTS.MASTER_DATA.MATERIALS}/${id}`);
    return res.data;
  },
  addConversion: async (materialId, data) => {
    const res = await apiClient.post(API_ENDPOINTS.MASTER_DATA.MATERIAL_CONVERSIONS(materialId), data);
    return res.data;
  },
  deleteConversion: async (materialId, conversionId) => {
    const res = await apiClient.delete(`${API_ENDPOINTS.MASTER_DATA.MATERIAL_CONVERSIONS(materialId)}/${conversionId}`);
    return res.data;
  },
  lookupBarcode: async (farmId, code) => {
    const res = await apiClient.get(API_ENDPOINTS.MASTER_DATA.MATERIAL_LOOKUP_BARCODE(farmId, code));
    return res.data;
  },

  // 5. Warehouses
  getWarehouses: async (farmId, params = {}) => {
    const res = await apiClient.get(API_ENDPOINTS.INVENTORY.WAREHOUSES(farmId), { params });
    return res.data;
  },
  createWarehouse: async (farmId, data) => {
    const res = await apiClient.post(API_ENDPOINTS.INVENTORY.WAREHOUSES(farmId), data);
    return res.data;
  },
  updateWarehouse: async (farmId, id, data) => {
    const res = await apiClient.put(`${API_ENDPOINTS.INVENTORY.WAREHOUSES(farmId)}/${id}`, data);
    return res.data;
  },
  deleteWarehouse: async (farmId, id) => {
    const res = await apiClient.delete(`${API_ENDPOINTS.INVENTORY.WAREHOUSES(farmId)}/${id}`);
    return res.data;
  },

  // 6. Consumption Quotas
  getQuotas: async (params = {}) => {
    const res = await apiClient.get(API_ENDPOINTS.MASTER_DATA.CONSUMPTION_QUOTAS, { params });
    return res.data;
  },
  createQuota: async (data) => {
    const res = await apiClient.post(API_ENDPOINTS.MASTER_DATA.CONSUMPTION_QUOTAS, data);
    return res.data;
  },
  updateQuota: async (id, data) => {
    const res = await apiClient.put(`${API_ENDPOINTS.MASTER_DATA.CONSUMPTION_QUOTAS}/${id}`, data);
    return res.data;
  },
  deleteQuota: async (id) => {
    const res = await apiClient.delete(`${API_ENDPOINTS.MASTER_DATA.CONSUMPTION_QUOTAS}/${id}`);
    return res.data;
  },

  // 7. Work Shifts
  getWorkShifts: async (params = {}) => {
    const res = await apiClient.get(API_ENDPOINTS.HR.WORK_SHIFTS, { params });
    return res.data;
  },
  createWorkShift: async (data) => {
    const res = await apiClient.post(API_ENDPOINTS.HR.WORK_SHIFTS, data);
    return res.data;
  },
  updateWorkShift: async (id, data) => {
    const res = await apiClient.put(`${API_ENDPOINTS.HR.WORK_SHIFTS}/${id}`, data);
    return res.data;
  },
  deleteWorkShift: async (id) => {
    const res = await apiClient.delete(`${API_ENDPOINTS.HR.WORK_SHIFTS}/${id}`);
    return res.data;
  },

  // 8. Cost Categories
  getCostCategories: async (params = {}) => {
    const res = await apiClient.get(API_ENDPOINTS.MASTER_DATA.COST_CATEGORIES, { params });
    return res.data;
  },
  createCostCategory: async (data) => {
    const res = await apiClient.post(API_ENDPOINTS.MASTER_DATA.COST_CATEGORIES, data);
    return res.data;
  },
  updateCostCategory: async (id, data) => {
    const res = await apiClient.put(`${API_ENDPOINTS.MASTER_DATA.COST_CATEGORIES}/${id}`, data);
    return res.data;
  },
  deleteCostCategory: async (id) => {
    const res = await apiClient.delete(`${API_ENDPOINTS.MASTER_DATA.COST_CATEGORIES}/${id}`);
    return res.data;
  },
};
