import { apiClient } from './apiClient';

export const financeService = {
  // --- Danh mục chi phí (Cost Categories) ---
  getCostCategories: async (farmId, params = {}) => {
    const response = await apiClient.get(`/farms/${farmId}/cost-categories`, { params });
    return response.data.data;
  },

  createCostCategory: async (farmId, payload) => {
    const response = await apiClient.post(`/farms/${farmId}/cost-categories`, payload);
    return response.data.data;
  },

  updateCostCategory: async (farmId, id, payload) => {
    const response = await apiClient.put(`/farms/${farmId}/cost-categories/${id}`, payload);
    return response.data.data;
  },

  deleteCostCategory: async (farmId, id) => {
    const response = await apiClient.delete(`/farms/${farmId}/cost-categories/${id}`);
    return response.data.data;
  },

  // --- Chi phí phát sinh (Expenses) ---
  getExpenses: async (farmId, params = {}) => {
    const response = await apiClient.get(`/farms/${farmId}/expenses`, { params });
    return response.data.data;
  },

  getExpenseById: async (farmId, id) => {
    const response = await apiClient.get(`/farms/${farmId}/expenses/${id}`);
    return response.data.data;
  },

  createExpense: async (farmId, payload) => {
    const response = await apiClient.post(`/farms/${farmId}/expenses`, payload);
    return response.data.data;
  },

  backflushMaterialExpense: async (farmId, transactionId) => {
    const response = await apiClient.post(`/farms/${farmId}/expenses/backflush?transactionId=${transactionId}`);
    return response.data.data;
  },

  deleteExpense: async (farmId, id) => {
    const response = await apiClient.delete(`/farms/${farmId}/expenses/${id}`);
    return response.data.data;
  },

  // --- Phân bổ chi phí chung (Cost Allocation) ---
  getAllocations: async (farmId, params = {}) => {
    const response = await apiClient.get(`/farms/${farmId}/cost-allocations`, { params });
    return response.data.data;
  },

  createAllocation: async (farmId, payload) => {
    const response = await apiClient.post(`/farms/${farmId}/cost-allocations`, payload);
    return response.data.data;
  },

  deleteAllocation: async (farmId, id) => {
    const response = await apiClient.delete(`/farms/${farmId}/cost-allocations/${id}`);
    return response.data.data;
  },

  // --- Công cụ Tính Giá thành Đơn vị (Unit Cost Calculation) ---
  calculateCropSeasonCost: async (farmId, seasonId) => {
    const response = await apiClient.get(`/farms/${farmId}/cost-calculation/crop-season/${seasonId}`);
    return response.data.data;
  },

  calculateLivestockGroupCost: async (farmId, groupId) => {
    const response = await apiClient.get(`/farms/${farmId}/cost-calculation/livestock-group/${groupId}`);
    return response.data.data;
  },

  // --- Đơn hàng bán nông sản (Sales Orders) ---
  getSalesOrders: async (farmId, params = {}) => {
    const response = await apiClient.get(`/farms/${farmId}/sales-orders`, { params });
    return response.data.data;
  },

  getSalesOrderById: async (farmId, id) => {
    const response = await apiClient.get(`/farms/${farmId}/sales-orders/${id}`);
    return response.data.data;
  },

  createSalesOrder: async (farmId, payload) => {
    const response = await apiClient.post(`/farms/${farmId}/sales-orders`, payload);
    return response.data.data;
  },

  updateSalesOrderStatus: async (farmId, id, payload) => {
    const response = await apiClient.patch(`/farms/${farmId}/sales-orders/${id}/status`, payload);
    return response.data.data;
  },

  deleteSalesOrder: async (farmId, id) => {
    const response = await apiClient.delete(`/farms/${farmId}/sales-orders/${id}`);
    return response.data.data;
  },

  // --- Sổ công nợ & Aging Report ---
  getDebts: async (farmId, params = {}) => {
    const response = await apiClient.get(`/farms/${farmId}/debts`, { params });
    return response.data.data;
  },

  createDebtRecord: async (farmId, payload) => {
    const response = await apiClient.post(`/farms/${farmId}/debts`, payload);
    return response.data.data;
  },

  recordDebtPayment: async (farmId, debtId, payload) => {
    const response = await apiClient.post(`/farms/${farmId}/debts/${debtId}/payments`, payload);
    return response.data.data;
  },

  getAgingReport: async (farmId) => {
    const response = await apiClient.get(`/farms/${farmId}/debts/aging-report`);
    return response.data.data;
  },

  // --- Ngân sách mùa vụ (Budgets) ---
  getBudgets: async (farmId, params = {}) => {
    const response = await apiClient.get(`/farms/${farmId}/budgets`, { params });
    return response.data.data;
  },

  getBudgetById: async (farmId, id) => {
    const response = await apiClient.get(`/farms/${farmId}/budgets/${id}`);
    return response.data.data;
  },

  createBudget: async (farmId, payload) => {
    const response = await apiClient.post(`/farms/${farmId}/budgets`, payload);
    return response.data.data;
  },

  getBudgetVsActual: async (farmId, id) => {
    const response = await apiClient.get(`/farms/${farmId}/budgets/vs-actual/${id}`);
    return response.data.data;
  },

  deleteBudget: async (farmId, id) => {
    const response = await apiClient.delete(`/farms/${farmId}/budgets/${id}`);
    return response.data.data;
  }
};
