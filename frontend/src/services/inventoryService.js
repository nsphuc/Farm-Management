import { apiClient } from './apiClient';

export const inventoryService = {
  // Warehouses
  getWarehouses: async (farmId) => {
    const response = await apiClient.get(`/farms/${farmId}/warehouses`);
    return response.data.data;
  },

  getWarehouseById: async (farmId, warehouseId) => {
    const response = await apiClient.get(`/farms/${farmId}/warehouses/${warehouseId}`);
    return response.data.data;
  },

  createWarehouse: async (farmId, payload) => {
    const response = await apiClient.post(`/farms/${farmId}/warehouses`, payload);
    return response.data.data;
  },

  updateWarehouse: async (farmId, warehouseId, payload) => {
    const response = await apiClient.put(`/farms/${farmId}/warehouses/${warehouseId}`, payload);
    return response.data.data;
  },

  deleteWarehouse: async (farmId, warehouseId) => {
    const response = await apiClient.delete(`/farms/${farmId}/warehouses/${warehouseId}`);
    return response.data.data;
  },

  // Materials & Categories
  getCategories: async () => {
    const response = await apiClient.get('/materials/categories');
    return response.data.data;
  },

  createCategory: async (payload) => {
    const response = await apiClient.post('/materials/categories', payload);
    return response.data.data;
  },

  searchMaterials: async (params = {}) => {
    const response = await apiClient.get('/materials', { params });
    return response.data.data;
  },

  getMaterials: async (params = {}) => {
    const response = await apiClient.get('/materials', { params: { size: 100, ...params } });
    return response.data.data;
  },

  getMaterialById: async (id) => {
    const response = await apiClient.get(`/materials/${id}`);
    return response.data.data;
  },

  createMaterial: async (payload) => {
    const response = await apiClient.post('/materials', payload);
    return response.data.data;
  },

  updateMaterial: async (id, payload) => {
    const response = await apiClient.put(`/materials/${id}`, payload);
    return response.data.data;
  },

  // Inventory Stocks & Transactions
  getStocksByWarehouse: async (farmId, warehouseId) => {
    const response = await apiClient.get(`/farms/${farmId}/inventory/stocks`, {
      params: { warehouseId },
    });
    return response.data.data;
  },

  getExpiringBatches: async (farmId, days = 30) => {
    const response = await apiClient.get(`/farms/${farmId}/inventory/expiring`, {
      params: { days },
    });
    return response.data.data;
  },

  createReceipt: async (farmId, payload) => {
    const response = await apiClient.post(`/farms/${farmId}/inventory/receipts`, payload);
    return response.data.data;
  },

  searchReceipts: async (farmId, params = {}) => {
    const response = await apiClient.get(`/farms/${farmId}/inventory/receipts`, { params });
    return response.data.data;
  },

  createIssue: async (farmId, payload) => {
    const response = await apiClient.post(`/farms/${farmId}/inventory/issues`, payload);
    return response.data.data;
  },

  searchIssues: async (farmId, params = {}) => {
    const response = await apiClient.get(`/farms/${farmId}/inventory/issues`, { params });
    return response.data.data;
  },

  createTransfer: async (farmId, payload) => {
    const response = await apiClient.post(`/farms/${farmId}/inventory/transfers`, payload);
    return response.data.data;
  },

  dispatchTransfer: async (farmId, transferId) => {
    const response = await apiClient.put(`/farms/${farmId}/inventory/transfers/${transferId}/dispatch`);
    return response.data.data;
  },

  receiveTransfer: async (farmId, transferId) => {
    const response = await apiClient.put(`/farms/${farmId}/inventory/transfers/${transferId}/receive`);
    return response.data.data;
  },

  cancelTransfer: async (farmId, transferId) => {
    const response = await apiClient.put(`/farms/${farmId}/inventory/transfers/${transferId}/cancel`);
    return response.data.data;
  },

  createStocktake: async (farmId, payload) => {
    const response = await apiClient.post(`/farms/${farmId}/inventory/stocktakes`, payload);
    return response.data.data;
  },

  reconcileStocktake: async (farmId, stocktakeId) => {
    const response = await apiClient.put(`/farms/${farmId}/inventory/stocktakes/${stocktakeId}/reconcile`);
    return response.data.data;
  },
};
