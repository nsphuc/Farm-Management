import { apiClient } from '../api/apiClient';

export const financeService = {
  // 1. Bảng Thống Kê & So Sánh Chi Phí Giữa Các Trang Trại (Owner)
  getMultiFarmExpenseSummary: async (params = {}) => {
    const res = await apiClient.get('/expenses/summary/multi-farm', { params });
    return res.data;
  },

  // 2. Danh Sách Chứng Từ Chi Phí Vận Hành (farm_expenses)
  getExpenses: async (params = {}) => {
    const { farmId, ...rest } = params;
    const url = farmId && farmId !== 'ALL' ? `/farms/${farmId}/expenses` : '/expenses';
    const res = await apiClient.get(url, { params: rest });
    return res.data;
  },

  getExpenseById: async (farmId, id) => {
    const url = farmId && farmId !== 'ALL' ? `/farms/${farmId}/expenses/${id}` : `/expenses/${id}`;
    const res = await apiClient.get(url);
    return res.data;
  },

  createExpense: async (farmId, data) => {
    const url = farmId && farmId !== 'ALL' ? `/farms/${farmId}/expenses` : '/expenses';
    const res = await apiClient.post(url, data);
    return res.data;
  },

  confirmExpense: async (farmId, id) => {
    const url = farmId && farmId !== 'ALL' ? `/farms/${farmId}/expenses/${id}/confirm` : `/expenses/${id}/confirm`;
    const res = await apiClient.post(url);
    return res.data;
  },

  allocateCost: async (farmId, expenseId, data) => {
    const url = farmId && farmId !== 'ALL' ? `/farms/${farmId}/expenses/${expenseId}/allocate` : `/expenses/${expenseId}/allocate`;
    const res = await apiClient.post(url, data);
    return res.data;
  },

  // 3. Dự Toán Ngân Sách (budgets & budget_line_items)
  getBudgets: async (params = {}) => {
    const { farmId, ...rest } = params;
    const url = farmId && farmId !== 'ALL' ? `/farms/${farmId}/budgets` : '/budgets';
    const res = await apiClient.get(url, { params: rest });
    return res.data;
  },

  getBudgetById: async (id, farmId) => {
    const url = farmId && farmId !== 'ALL' ? `/farms/${farmId}/budgets/${id}` : `/budgets/${id}`;
    const res = await apiClient.get(url);
    return res.data;
  },

  createBudget: async (data, farmId) => {
    const targetFarmId = farmId || data.farmId;
    const url = targetFarmId && targetFarmId !== 'ALL' ? `/farms/${targetFarmId}/budgets` : '/budgets';
    const res = await apiClient.post(url, data);
    return res.data;
  },

  approveBudget: async (farmId, id) => {
    const url = farmId && farmId !== 'ALL' ? `/farms/${farmId}/budgets/${id}/approve` : `/budgets/${id}/approve`;
    const res = await apiClient.post(url);
    return res.data;
  },

  updateBudgetStatus: async (id, status, farmId) => {
    const url = farmId && farmId !== 'ALL' ? `/farms/${farmId}/budgets/${id}/status` : `/budgets/${id}/status`;
    const res = await apiClient.patch(url, null, { params: { status } });
    return res.data;
  },

  // 4. Danh Mục Khoản Mục Chi Phí (cost_categories)
  getCostCategories: async (params = {}) => {
    const res = await apiClient.get('/cost-categories', { params });
    return res.data;
  },

  // 5. Chu Kỳ Vận Hành (operational_cycles)
  getOperationalCycles: async (farmId) => {
    if (!farmId || farmId === 'ALL') {
      return [];
    }
    const res = await apiClient.get(`/farms/${farmId}/cycles`);
    return res.data;
  },

  // 6. Luồng Kết Toán Chu Kỳ Vận Hành (Cycle Profit Settlement - Owner)
  getCycleSettlements: async (params = {}) => {
    const res = await apiClient.get('/finance/cycle-settlements', { params });
    return res.data;
  },

  getCycleSettlementSummary: async (farmId, cycleId) => {
    const res = await apiClient.get(`/farms/${farmId}/cycles/${cycleId}/settlement-summary`);
    return res.data;
  },

  confirmSettlement: async (farmId, cycleId, data = {}) => {
    const res = await apiClient.post(`/farms/${farmId}/cycles/${cycleId}/confirm-settlement`, data);
    return res.data;
  },

  approveSettlement: async (farmId, cycleId, data = {}) => {
    const res = await apiClient.post(`/farms/${farmId}/cycles/${cycleId}/approve-settlement`, data);
    return res.data;
  },

  // 7. Giá Thành Đơn Vị (Costing)
  getUnitCost: async (farmId, targetType, targetId) => {
    const res = await apiClient.get(`/farms/${farmId}/costing/unit-cost`, {
      params: { targetType, targetId }
    });
    return res.data;
  },

  // 8. Đơn Bán Hàng & Tiến Độ Giao Hàng (Read-Only / Owner Monitor)
  getSalesOrders: async (params = {}) => {
    const { farmId, ...rest } = params;
    const url = farmId && farmId !== 'ALL' ? `/farms/${farmId}/sales-orders` : '/sales-orders';
    const res = await apiClient.get(url, { params: rest });
    return res.data;
  },

  getSalesOrderById: async (farmId, id) => {
    const url = farmId && farmId !== 'ALL' ? `/farms/${farmId}/sales-orders/${id}` : `/sales-orders/${id}`;
    const res = await apiClient.get(url);
    return res.data;
  },

  createSalesOrder: async (farmId, data) => {
    const url = farmId && farmId !== 'ALL' ? `/farms/${farmId}/sales-orders` : '/sales-orders';
    const res = await apiClient.post(url, data);
    return res.data;
  },

  confirmSalesOrder: async (farmId, id) => {
    const url = farmId && farmId !== 'ALL' ? `/farms/${farmId}/sales-orders/${id}/confirm` : `/sales-orders/${id}/confirm`;
    const res = await apiClient.post(url);
    return res.data;
  },

  cancelSalesOrder: async (farmId, id) => {
    const url = farmId && farmId !== 'ALL' ? `/farms/${farmId}/sales-orders/${id}/cancel` : `/sales-orders/${id}/cancel`;
    const res = await apiClient.post(url);
    return res.data;
  },

  // 9. Đợt Giao Hàng (Sales Deliveries)
  getDeliveries: async (farmId, params = {}) => {
    const res = await apiClient.get(`/farms/${farmId}/sales-deliveries`, { params });
    return res.data;
  },

  getDeliveryById: async (farmId, id) => {
    const res = await apiClient.get(`/farms/${farmId}/sales-deliveries/${id}`);
    return res.data;
  },

  createDelivery: async (farmId, data) => {
    const res = await apiClient.post(`/farms/${farmId}/sales-deliveries`, data);
    return res.data;
  },

  dispatchDelivery: async (farmId, id) => {
    const res = await apiClient.post(`/farms/${farmId}/sales-deliveries/${id}/dispatch`);
    return res.data;
  },

  updateDeliveryPod: async (farmId, id, data) => {
    const res = await apiClient.post(`/farms/${farmId}/sales-deliveries/${id}/pod`, data);
    return res.data;
  },

  // 10. Sổ Công Nợ (Debt Records) & Thanh Toán (Payments)
  getDebts: async (params = {}) => {
    const { farmId, ...rest } = params;
    const url = farmId && farmId !== 'ALL' ? `/farms/${farmId}/debts` : '/finance/debts';
    const res = await apiClient.get(url, { params: rest });
    return res.data;
  },

  getDebtById: async (id, farmId) => {
    const url = farmId && farmId !== 'ALL' ? `/farms/${farmId}/debts/${id}` : `/finance/debts/${id}`;
    const res = await apiClient.get(url);
    return res.data;
  },

  createPayment: async (farmId, data) => {
    const url = farmId && farmId !== 'ALL' ? `/farms/${farmId}/payments` : '/finance/payments';
    const res = await apiClient.post(url, data);
    return res.data;
  },

  confirmPayment: async (farmId, id) => {
    const url = farmId && farmId !== 'ALL' ? `/farms/${farmId}/payments/${id}/confirm` : `/finance/payments/${id}/confirm`;
    const res = await apiClient.post(url);
    return res.data;
  },

  allocatePayment: async (farmId, id, data) => {
    const url = farmId && farmId !== 'ALL' ? `/farms/${farmId}/payments/${id}/allocate` : `/finance/payments/${id}/allocate`;
    const res = await apiClient.post(url, data);
    return res.data;
  },

  offsetDebts: async (farmId, data) => {
    const url = farmId && farmId !== 'ALL' ? `/farms/${farmId}/debts/offset` : '/finance/debts/offset';
    const res = await apiClient.post(url, data);
    return res.data;
  },
};
