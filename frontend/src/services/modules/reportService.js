import { apiClient } from '../api/apiClient';

/**
 * Report & Analytics API Service
 * Kết nối với ReportController của backend Spring Boot
 */
export const reportService = {
  // 1. Executive Dashboard (Doanh thu, chi phí, lợi nhuận, so sánh trang trại)
  getExecutiveDashboard: async (farmId, fiscalYear) => {
    const url = (farmId && farmId !== 'ALL')
      ? `/farms/${farmId}/reports/executive-dashboard`
      : '/reports/executive-dashboard';
    const params = fiscalYear ? { fiscalYear } : {};
    const res = await apiClient.get(url, { params });
    return res.data;
  },

  // 2. Crop Cost & Profit (Crop P&L từng vụ mùa hoặc theo niên vụ)
  getCropCostProfit: async (farmId, cycleId) => {
    const url = (farmId && farmId !== 'ALL')
      ? `/farms/${farmId}/reports/crop-cost-profit`
      : '/reports/crop-cost-profit';
    const params = cycleId && cycleId !== 'ALL' ? { cycleId } : {};
    const res = await apiClient.get(url, { params });
    return res.data;
  },

  // 2b. Livestock Cost & Profit (Livestock P&L từng lứa vật nuôi hoặc theo niên vụ)
  getLivestockCostProfit: async (farmId, cycleId) => {
    const url = (farmId && farmId !== 'ALL')
      ? `/farms/${farmId}/reports/livestock-cost-profit`
      : '/reports/livestock-cost-profit';
    const params = cycleId && cycleId !== 'ALL' ? { cycleId } : {};
    const res = await apiClient.get(url, { params });
    return res.data;
  },

  // 3. Inventory Aging & FEFO
  getInventoryAging: async (farmId) => {
    const url = (farmId && farmId !== 'ALL')
      ? `/farms/${farmId}/reports/inventory-aging`
      : '/reports/inventory-aging';
    const res = await apiClient.get(url);
    return res.data;
  },

  // 4. Debt Aging (Tuổi nợ)
  getDebtAging: async (farmId) => {
    const url = (farmId && farmId !== 'ALL')
      ? `/farms/${farmId}/reports/debt-aging`
      : '/reports/debt-aging';
    const res = await apiClient.get(url);
    return res.data;
  },

  // 5. Livestock FCR
  getLivestockFcr: async (farmId, groupId) => {
    const url = (farmId && farmId !== 'ALL')
      ? `/farms/${farmId}/reports/livestock-fcr`
      : '/reports/livestock-fcr';
    const params = groupId ? { groupId } : {};
    const res = await apiClient.get(url, { params });
    return res.data;
  },
};

export default reportService;

