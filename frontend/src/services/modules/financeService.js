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

  // 7. Đơn Bán Hàng & Tiến Độ Giao Hàng (Read-Only / Owner Monitor)
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

  // 8. Sổ Công Nợ (Debt Records - Read-Only / Owner Monitor)
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
};
