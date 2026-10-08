import { apiClient } from './apiClient';

export const analyticsService = {
  // Lấy dữ liệu tổng quan điều hành (Executive Summary) cho Dashboard
  getExecutiveSummary: async (farmId) => {
    const response = await apiClient.get(`/farms/${farmId}/analytics/executive-summary`);
    return response.data.data;
  },

  // Báo cáo Sản xuất & Năng suất mùa vụ, FCR chăn nuôi
  getProductionReport: async (farmId, year) => {
    const params = year ? { year } : {};
    const response = await apiClient.get(`/farms/${farmId}/analytics/production`, { params });
    return response.data.data;
  },

  // Báo cáo Tồn kho, Định giá tài sản, Hạn sử dụng
  getInventoryReport: async (farmId) => {
    const response = await apiClient.get(`/farms/${farmId}/analytics/inventory`);
    return response.data.data;
  },

  // Báo cáo Tài chính P&L, Suất sinh lời ROI, Dòng tiền 12 tháng
  getFinancialReport: async (farmId, year) => {
    const params = year ? { year } : {};
    const response = await apiClient.get(`/farms/${farmId}/analytics/financials`, { params });
    return response.data.data;
  },

  // Danh sách Cảnh báo sớm thông minh
  getEarlyAlerts: async (farmId) => {
    const response = await apiClient.get(`/farms/${farmId}/analytics/alerts`);
    return response.data.data;
  },

  // Tải file xuất báo cáo (Excel / CSV UTF-8)
  exportReport: async (farmId, type = 'financials', format = 'csv') => {
    const response = await apiClient.get(`/farms/${farmId}/analytics/export`, {
      params: { type, format },
      responseType: 'blob'
    });
    
    // Tự động trigger tải file trên trình duyệt
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bao_cao_${type}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};
