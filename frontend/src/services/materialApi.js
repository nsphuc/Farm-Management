import axiosClient from './axiosClient';

/**
 * Service API giao tiếp trực tiếp với Backend Spring Boot cho phân hệ Quản lý Vật tư & Nhóm vật tư.
 * Base URL: /materials và /material-categories
 * Thuộc Nhóm 3 - Quản lý Kho & Vật tư (3.2 Quản lý vật tư).
 */
export const materialApi = {
  // =========================================================================
  // 1. MẶT HÀNG VẬT TƯ NÔNG NGHIỆP (MATERIALS)
  // =========================================================================

  /**
   * Lấy danh sách vật tư có phân trang theo Tenant và nhóm vật tư.
   * @param {Object} params { categoryId, page, size, sort }
   */
  getMaterials: (params = {}) => {
    return axiosClient.get('/materials', { params });
  },

  /**
   * Lấy toàn bộ danh sách vật tư của Tenant (cho Dropdown/Select).
   * @param {number|string} [categoryId] Lọc theo nhóm vật tư nếu có
   */
  getAllMaterials: (categoryId) => {
    const params = categoryId ? { categoryId } : {};
    return axiosClient.get('/materials/all', { params });
  },

  /**
   * Xem chi tiết thông tin vật tư theo ID.
   * @param {number|string} id Material ID
   */
  getMaterialById: (id) => {
    return axiosClient.get(`/materials/${id}`);
  },

  /**
   * Tạo mới mặt hàng vật tư (Hỗ trợ chiến lược xuất kho FIFO / FEFO).
   * @param {Object} data { categoryId, code, name, barcode, unit, outboundStrategy, minStockLevel, maxStockLevel, unitPriceStandard, expireDays, description }
   */
  createMaterial: (data) => {
    return axiosClient.post('/materials', data);
  },

  /**
   * Cập nhật thông tin vật tư.
   * @param {number|string} id Material ID
   * @param {Object} data { categoryId, name, barcode, unit, outboundStrategy, minStockLevel, maxStockLevel, unitPriceStandard, expireDays, description }
   */
  updateMaterial: (id, data) => {
    return axiosClient.put(`/materials/${id}`, data);
  },

  /**
   * Xóa mặt hàng vật tư.
   * @param {number|string} id Material ID
   */
  deleteMaterial: (id) => {
    return axiosClient.delete(`/materials/${id}`);
  },

  // =========================================================================
  // 2. NHÓM VẬT TƯ NÔNG NGHIỆP (MATERIAL CATEGORIES)
  // =========================================================================

  /**
   * Lấy danh sách nhóm vật tư có phân trang.
   * @param {Object} params { page, size, sort }
   */
  getCategories: (params = {}) => {
    return axiosClient.get('/material-categories', { params });
  },

  /**
   * Lấy toàn bộ danh sách nhóm vật tư (Dropdown/Select).
   */
  getAllCategories: () => {
    return axiosClient.get('/material-categories/all');
  },

  /**
   * Xem thông tin chi tiết nhóm vật tư theo ID.
   * @param {number|string} id Category ID
   */
  getCategoryById: (id) => {
    return axiosClient.get(`/material-categories/${id}`);
  },

  /**
   * Tạo mới nhóm vật tư (Ví dụ: Phân bón, Thuốc BVTV, Giống cây, Thức ăn chăn nuôi).
   * @param {Object} data { code, name, description }
   */
  createCategory: (data) => {
    return axiosClient.post('/material-categories', data);
  },

  /**
   * Cập nhật thông tin nhóm vật tư.
   * @param {number|string} id Category ID
   * @param {Object} data { name, description }
   */
  updateCategory: (id, data) => {
    return axiosClient.put(`/material-categories/${id}`, data);
  },

  /**
   * Xóa nhóm vật tư (Chặn xóa nếu còn vật tư trực thuộc).
   * @param {number|string} id Category ID
   */
  deleteCategory: (id) => {
    return axiosClient.delete(`/material-categories/${id}`);
  },
};

export default materialApi;
