import axiosClient from './axiosClient';

/**
 * Service API giao tiếp trực tiếp với Backend Spring Boot cho Phân hệ Giao dịch Kho:
 * 1. 3.3. Nhập kho (Inventory Receipts): /api/v1/inventory/receipts
 * 2. 3.4. Xuất kho (Inventory Issues): /api/v1/inventory/issues
 * 3. 3.7. Theo dõi tồn kho hiện tại (Inventory Balance): /api/v1/inventory/balances
 */
export const inventoryTransactionApi = {
  // =========================================================================
  // 1. NGHIỆP VỤ 3.3: NHẬP KHO (INVENTORY RECEIPTS)
  // =========================================================================

  /**
   * Lấy danh sách phiếu nhập kho có phân trang.
   * @param {Object} params { farmId, warehouseId, page, size, sort }
   */
  getReceipts: (params = {}) => {
    return axiosClient.get('/inventory/receipts', { params });
  },

  /**
   * Xem chi tiết một phiếu nhập kho kèm danh sách dòng chi tiết vật tư.
   * @param {number|string} id Receipt ID
   */
  getReceiptById: (id) => {
    return axiosClient.get(`/inventory/receipts/${id}`);
  },

  /**
   * Tạo mới Phiếu Nhập kho và hạch toán tăng thẻ kho (ACID).
   * @param {Object} data { warehouseId, receiptCode, receiptType, partnerId, receiptDate, notes, items: [...] }
   */
  createReceipt: (data) => {
    return axiosClient.post('/inventory/receipts', data);
  },

  /**
   * Hủy Phiếu Nhập kho (Chuyển trạng thái CANCELLED, hoàn trừ tồn kho an toàn).
   * @param {number|string} id Receipt ID
   * @param {string} reason Lý do hủy phiếu
   */
  cancelReceipt: (id, reason) => {
    return axiosClient.post(`/inventory/receipts/${id}/cancel`, { reason });
  },

  // =========================================================================
  // 2. NGHIỆP VỤ 3.4: XUẤT KHO (INVENTORY ISSUES)
  // =========================================================================

  /**
   * Lấy danh sách phiếu xuất kho có phân trang.
   * @param {Object} params { farmId, warehouseId, page, size, sort }
   */
  getIssues: (params = {}) => {
    return axiosClient.get('/inventory/issues', { params });
  },

  /**
   * Xem chi tiết một phiếu xuất kho kèm danh sách dòng chi tiết vật tư.
   * @param {number|string} id Issue ID
   */
  getIssueById: (id) => {
    return axiosClient.get(`/inventory/issues/${id}`);
  },

  /**
   * Tạo mới Phiếu Xuất kho và hạch toán trừ thẻ kho (ACID).
   * @param {Object} data { warehouseId, issueCode, issueType, receiverName, seasonId, farmingLogId, livestockEventId, issueDate, notes, items: [...] }
   */
  createIssue: (data) => {
    return axiosClient.post('/inventory/issues', data);
  },

  /**
   * Hủy Phiếu Xuất kho (Chuyển trạng thái CANCELLED, hoàn cộng lại tồn kho an toàn).
   * @param {number|string} id Issue ID
   * @param {string} reason Lý do hủy phiếu
   */
  cancelIssue: (id, reason) => {
    return axiosClient.post(`/inventory/issues/${id}/cancel`, { reason });
  },

  // =========================================================================
  // 3. NGHIỆP VỤ 3.7: THEO DÕI TỒN KHO HIỆN TẠI (INVENTORY BALANCE)
  // =========================================================================

  /**
   * Lấy danh sách số dư tồn kho theo từng Kho bãi, Vật tư và Số lô.
   * @param {Object} params { farmId, warehouseId, page, size, sort }
   */
  getBalances: (params = {}) => {
    return axiosClient.get('/inventory/balances', { params });
  },

  /**
   * Xem chi tiết số dư tồn kho của một lô vật tư cụ thể.
   * @param {number|string} id Balance ID
   */
  getBalanceById: (id) => {
    return axiosClient.get(`/inventory/balances/${id}`);
  },

  /**
   * Lấy danh sách các lô còn hàng của một vật tư trong kho bãi (hỗ trợ FIFO/FEFO khi xuất kho).
   * @param {number|string} warehouseId ID kho bãi
   * @param {number|string} materialId ID vật tư
   * @param {string} [strategy='FIFO'] Chiến lược gợi ý ('FIFO' hoặc 'FEFO')
   */
  getAvailableBatches: (warehouseId, materialId, strategy = 'FIFO') => {
    return axiosClient.get('/inventory/balances/batches', {
      params: { warehouseId, materialId, strategy },
    });
  },
};

export default inventoryTransactionApi;
