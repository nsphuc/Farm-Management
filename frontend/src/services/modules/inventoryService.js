import { apiClient } from '../api/apiClient';

const resolveFarmId = (farmId) => {
  if (!farmId || farmId === 'ALL' || farmId === 'null') return undefined;
  const num = Number(farmId);
  return Number.isInteger(num) && num > 0 ? num : undefined;
};

export const inventoryService = {
  // 1. Tồn Kho Thời Gian Thực
  getInventory: async (params = {}) => {
    const { farmId, ...rest } = params;
    const fId = resolveFarmId(farmId);
    const url = fId ? `/farms/${fId}/inventory` : '/inventory';
    const res = await apiClient.get(url, { params: rest });
    return res.data;
  },

  // 2. Thống Kê KPI Kho
  getInventorySummary: async (params = {}) => {
    const { farmId, ...rest } = params;
    const fId = resolveFarmId(farmId);
    const url = fId ? `/farms/${fId}/inventory/summary` : '/inventory/summary';
    const res = await apiClient.get(url, { params: rest });
    return res.data;
  },

  // 3. Sổ Thẻ Kho & Lịch Sử Giao Dịch
  getTransactions: async (params = {}) => {
    const { farmId, ...rest } = params;
    const fId = resolveFarmId(farmId);
    const url = fId ? `/farms/${fId}/inventory/transactions` : '/inventory/transactions';
    const res = await apiClient.get(url, { params: rest });
    return res.data;
  },

  // 4. Phiếu Nhập Kho (Warehouse Receipts)
  getReceipts: async (params = {}) => {
    const { farmId, ...rest } = params;
    const fId = resolveFarmId(farmId);
    const url = fId ? `/farms/${fId}/inventory/receipts` : '/inventory/receipts';
    const res = await apiClient.get(url, { params: rest });
    return res.data;
  },
  getReceiptById: async (farmId, id) => {
    const fId = resolveFarmId(farmId);
    const url = fId ? `/farms/${fId}/inventory/receipts/${id}` : `/inventory/receipts/${id}`;
    const res = await apiClient.get(url);
    return res.data;
  },
  createReceipt: async (farmId, data) => {
    const res = await apiClient.post(`/farms/${farmId}/inventory/receipts`, data);
    return res.data;
  },
  completeReceipt: async (farmId, id) => {
    const res = await apiClient.post(`/farms/${farmId}/inventory/receipts/${id}/complete`);
    return res.data;
  },
  cancelReceipt: async (farmId, id, data = {}) => {
    const res = await apiClient.post(`/farms/${farmId}/inventory/receipts/${id}/cancel`, data);
    return res.data;
  },

  // 5. Phiếu Xuất Kho (Warehouse Issues)
  getIssues: async (params = {}) => {
    const { farmId, ...rest } = params;
    const fId = resolveFarmId(farmId);
    const url = fId ? `/farms/${fId}/inventory/issues` : '/inventory/issues';
    const res = await apiClient.get(url, { params: rest });
    return res.data;
  },
  getIssueById: async (farmId, id) => {
    const fId = resolveFarmId(farmId);
    const url = fId ? `/farms/${fId}/inventory/issues/${id}` : `/inventory/issues/${id}`;
    const res = await apiClient.get(url);
    return res.data;
  },
  createIssue: async (farmId, data) => {
    const res = await apiClient.post(`/farms/${farmId}/inventory/issues`, data);
    return res.data;
  },
  completeIssue: async (farmId, id) => {
    const res = await apiClient.post(`/farms/${farmId}/inventory/issues/${id}/complete`);
    return res.data;
  },
  cancelIssue: async (farmId, id, data = {}) => {
    const res = await apiClient.post(`/farms/${farmId}/inventory/issues/${id}/cancel`, data);
    return res.data;
  },

  // 6. Danh Sách Kho Của Trang Trại
  getWarehouses: async (farmId) => {
    const fId = resolveFarmId(farmId);
    if (!fId) return [];
    try {
      const res = await apiClient.get(`/farms/${fId}/warehouses`);
      return res.data;
    } catch {
      return [];
    }
  },

  // 7. Lịch Sử Điều Chuyển Kho (Warehouse Transfers)
  getTransfers: async (params = {}) => {
    const { farmId, ...rest } = params;
    const fId = resolveFarmId(farmId);
    const url = fId ? `/farms/${fId}/inventory/transfers` : '/inventory/transfers';
    const res = await apiClient.get(url, { params: rest });
    return res.data;
  },
  getTransferById: async (farmId, id) => {
    const fId = resolveFarmId(farmId);
    const url = fId ? `/farms/${fId}/inventory/transfers/${id}` : `/inventory/transfers/${id}`;
    const res = await apiClient.get(url);
    return res.data;
  },
  createTransfer: async (farmId, data) => {
    const res = await apiClient.post(`/farms/${farmId}/inventory/transfers`, data);
    return res.data;
  },
  dispatchTransfer: async (farmId, id) => {
    const res = await apiClient.post(`/farms/${farmId}/inventory/transfers/${id}/dispatch`);
    return res.data;
  },
  receiveTransfer: async (farmId, id) => {
    const res = await apiClient.post(`/farms/${farmId}/inventory/transfers/${id}/receive`);
    return res.data;
  },

  // 8. Lịch Sử Kiểm Kê Kho (Stocktakes)
  getStocktakes: async (params = {}) => {
    const { farmId, ...rest } = params;
    const fId = resolveFarmId(farmId);
    const url = fId ? `/farms/${fId}/inventory/stocktakes` : '/inventory/stocktakes';
    const res = await apiClient.get(url, { params: rest });
    return res.data;
  },
  getStocktakeById: async (farmId, id) => {
    const fId = resolveFarmId(farmId);
    const url = fId ? `/farms/${fId}/inventory/stocktakes/${id}` : `/inventory/stocktakes/${id}`;
    const res = await apiClient.get(url);
    return res.data;
  },
  createStocktake: async (farmId, data) => {
    const res = await apiClient.post(`/farms/${farmId}/inventory/stocktakes`, data);
    return res.data;
  },
  recordStocktakeCount: async (farmId, id, data) => {
    const res = await apiClient.post(`/farms/${farmId}/inventory/stocktakes/${id}/count`, data);
    return res.data;
  },
  adjustStocktake: async (farmId, id) => {
    const res = await apiClient.post(`/farms/${farmId}/inventory/stocktakes/${id}/adjust`);
    return res.data;
  },
};
