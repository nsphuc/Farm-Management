import { apiClient } from '../api/apiClient';

export const purchaseInvoiceService = {
  /**
   * Lấy danh sách hóa đơn nhập hàng (có phân trang & bộ lọc)
   */
  getInvoices: async (params = {}) => {
    const res = await apiClient.get('/api/v1/purchase-invoices', { params });
    return res.data;
  },

  /**
   * Xem chi tiết hóa đơn theo ID
   */
  getInvoiceById: async (id) => {
    const res = await apiClient.get(`/api/v1/purchase-invoices/${id}`);
    return res.data;
  },

  /**
   * Tạo hóa đơn nhập hàng mới (cộng kho/tăng đàn + sinh phiếu chi + nợ NCC)
   */
  createInvoice: async (data, farmId) => {
    const params = farmId ? { queryFarmId: farmId } : {};
    const res = await apiClient.post('/api/v1/purchase-invoices', data, { params });
    return res.data;
  },

  /**
   * Thanh toán công nợ cho hóa đơn nhập hàng
   */
  payDebt: async (id, data) => {
    const res = await apiClient.post(`/api/v1/purchase-invoices/${id}/pay-debt`, data);
    return res.data;
  },
};
