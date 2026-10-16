import axiosClient from './axiosClient';

/**
 * Service API giao tiếp trực tiếp với Backend Spring Boot cho phân hệ Quản lý Kho bãi (Warehouse).
 * Base URL: /farms/{farmId}/warehouses (qua /api/v1/farms/{farmId}/warehouses)
 * Tra cứu mở rộng: /warehouses (qua /api/v1/warehouses)
 * Thuộc Nhóm 3 - Quản lý Kho & Vật tư (3.1 Quản lý kho).
 */
export const warehouseApi = {
  // =========================================================================
  // 1. CÁC API THEO NGỮ CẢNH TRANG TRẠI (FARM-SCOPED)
  // =========================================================================

  /**
   * Lấy danh sách kho bãi của trang trại có phân trang.
   * @param {number|string} farmId ID trang trại
   * @param {Object} params { warehouseType, status, page, size, sort }
   */
  getWarehousesByFarm: (farmId, params = {}) => {
    return axiosClient.get(`/farms/${farmId}/warehouses`, { params });
  },

  /**
   * Lấy toàn bộ danh sách kho của trang trại (Dropdown/Select).
   * @param {number|string} farmId ID trang trại
   */
  getAllWarehousesByFarm: (farmId) => {
    return axiosClient.get(`/farms/${farmId}/warehouses/all`);
  },

  /**
   * Xem chi tiết thông tin kho bãi theo ID và FarmId.
   * @param {number|string} farmId ID trang trại
   * @param {number|string} id Warehouse ID
   */
  getWarehouseById: (farmId, id) => {
    return axiosClient.get(`/farms/${farmId}/warehouses/${id}`);
  },

  /**
   * Tạo mới kho bãi trong trang trại (Yêu cầu vai trò Quản lý / Chủ trang trại).
   * @param {number|string} farmId ID trang trại
   * @param {Object} data { code, name, warehouseType, capacityM3, areaM2, standardTemperature, standardHumidity, address }
   */
  createWarehouse: (farmId, data) => {
    return axiosClient.post(`/farms/${farmId}/warehouses`, data);
  },

  /**
   * Cập nhật thông tin kho bãi (Yêu cầu vai trò Quản lý).
   * @param {number|string} farmId ID trang trại
   * @param {number|string} id Warehouse ID
   * @param {Object} data { name, warehouseType, capacityM3, areaM2, standardTemperature, standardHumidity, address }
   */
  updateWarehouse: (farmId, id, data) => {
    return axiosClient.put(`/farms/${farmId}/warehouses/${id}`, data);
  },

  /**
   * Vô hiệu hóa kho bãi (Soft-delete: status=INACTIVE).
   * @param {number|string} farmId ID trang trại
   * @param {number|string} id Warehouse ID
   */
  deleteWarehouse: (farmId, id) => {
    return axiosClient.delete(`/farms/${farmId}/warehouses/${id}`);
  },

  // =========================================================================
  // 2. CÁC API TRA CỨU TRỰC TIẾP TOÀN BỘ TENANT
  // =========================================================================

  /**
   * Lấy danh sách tất cả các kho thuộc toàn bộ Tenant (có phân trang).
   * @param {Object} params { page, size, sort }
   */
  getAllWarehouses: (params = {}) => {
    return axiosClient.get('/warehouses', { params });
  },

  /**
   * Xem chi tiết kho theo ID trực tiếp.
   * @param {number|string} id Warehouse ID
   */
  getWarehouseByIdDirect: (id) => {
    return axiosClient.get(`/warehouses/${id}`);
  },
};

export default warehouseApi;
