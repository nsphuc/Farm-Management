import { apiClient } from '../api/apiClient';

export const qaService = {
  /**
   * Lấy danh sách lô thành phẩm (hỗ trợ lọc theo farmId, status, keyword, phân trang)
   */
  getProductBatches: async ({ farmId, status, keyword, page = 0, size = 20 } = {}) => {
    const params = { page, size };
    if (farmId && farmId !== 'ALL') params.farmId = farmId;
    if (status && status !== 'ALL') params.status = status;
    if (keyword) params.keyword = keyword;

    const url = farmId && farmId !== 'ALL'
      ? `/farms/${farmId}/product-batches`
      : '/product-batches';

    const response = await apiClient.get(url, { params });
    return response.data?.data || response.data;
  },

  /**
   * Lấy chi tiết lô thành phẩm
   */
  getProductBatchById: async (farmId, id) => {
    const url = farmId
      ? `/farms/${farmId}/product-batches/${id}`
      : `/product-batches/${id}`;
    const response = await apiClient.get(url);
    return response.data?.data || response.data;
  },

  /**
   * [ĐẶC QUYỀN OWNER / QA LEAD]: Phát lệnh thu hồi khẩn cấp toàn cục
   * POST /farms/{farmId}/product-batches/{id}/recall
   */
  recallBatch: async (farmId, id, recallReason) => {
    const url = farmId
      ? `/farms/${farmId}/product-batches/${id}/recall`
      : `/product-batches/${id}/recall`;
    const response = await apiClient.post(url, { recallReason });
    return response.data?.data || response.data;
  },

  /**
   * Phê duyệt đạt chuẩn KCS
   */
  approveBatch: async (farmId, id, data = {}) => {
    const response = await apiClient.post(`/farms/${farmId}/product-batches/${id}/approve`, data);
    return response.data?.data || response.data;
  },

  /**
   * Từ chối KCS
   */
  rejectBatch: async (farmId, id, data = {}) => {
    const response = await apiClient.post(`/farms/${farmId}/product-batches/${id}/reject`, data);
    return response.data?.data || response.data;
  },

  /**
   * In tem nhãn nhiệt ESC/POS
   */
  printLabel: async (farmId, id, data = {}) => {
    const response = await apiClient.post(`/farms/${farmId}/product-batches/${id}/print-label`, data);
    return response.data?.data || response.data;
  },
};

export default qaService;
