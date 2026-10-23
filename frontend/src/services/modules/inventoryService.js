import { apiClient } from '../api/apiClient';

export const inventoryService = {
  // 1. Tồn Kho Thời Gian Thực
  getInventory: async (params = {}) => {
    const { farmId, ...rest } = params;
    const url = farmId ? `/farms/${farmId}/inventory` : '/inventory';
    const res = await apiClient.get(url, { params: rest });
    return res.data;
  },

  // 2. Thống Kê KPI Kho
  getInventorySummary: async (params = {}) => {
    const { farmId, ...rest } = params;
    const url = farmId ? `/farms/${farmId}/inventory/summary` : '/inventory/summary';
    const res = await apiClient.get(url, { params: rest });
    return res.data;
  },

  // 3. Sổ Thẻ Kho & Lịch Sử Giao Dịch
  getTransactions: async (params = {}) => {
    const { farmId, ...rest } = params;
    const url = farmId ? `/farms/${farmId}/inventory/transactions` : '/inventory/transactions';
    const res = await apiClient.get(url, { params: rest });
    return res.data;
  },

  // 4. Phiếu Nhập Kho (Warehouse Receipts)
  getReceipts: async (params = {}) => {
    const { farmId, ...rest } = params;
    const url = farmId ? `/farms/${farmId}/inventory/receipts` : '/inventory/receipts';
    const res = await apiClient.get(url, { params: rest });
    return res.data;
  },
  getReceiptById: async (farmId, id) => {
    const url = farmId ? `/farms/${farmId}/inventory/receipts/${id}` : `/inventory/receipts/${id}`;
    const res = await apiClient.get(url);
    return res.data;
  },

  // 5. Phiếu Xuất Kho (Warehouse Issues)
  getIssues: async (params = {}) => {
    const { farmId, ...rest } = params;
    const url = farmId ? `/farms/${farmId}/inventory/issues` : '/inventory/issues';
    const res = await apiClient.get(url, { params: rest });
    return res.data;
  },
  getIssueById: async (farmId, id) => {
    const url = farmId ? `/farms/${farmId}/inventory/issues/${id}` : `/inventory/issues/${id}`;
    const res = await apiClient.get(url);
    return res.data;
  },

  // 6. Danh Sách Kho Của Trang Trại
  getWarehouses: async (farmId) => {
    if (!farmId) return [];
    try {
      const res = await apiClient.get(`/farms/${farmId}/warehouses`);
      return res.data;
    } catch {
      return [];
    }
  },

  // 7. Lịch Sử Điều Chuyển Kho (Warehouse Transfers)
  getTransfers: async (params = {}) => {
    const { farmId, ...rest } = params;
    const url = farmId ? `/farms/${farmId}/inventory/transfers` : '/inventory/transfers';
    const res = await apiClient.get(url, { params: rest });
    return res.data;
  },

  // 8. Lịch Sử Kiểm Kê Kho (Stocktakes)
  getStocktakes: async (params = {}) => {
    const { farmId, ...rest } = params;
    const url = farmId ? `/farms/${farmId}/inventory/stocktakes` : '/inventory/stocktakes';
    const res = await apiClient.get(url, { params: rest });
    return res.data;
  },
};
