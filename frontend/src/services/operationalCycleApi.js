import axiosClient from './axiosClient';

/**
 * Service API giao tiếp trực tiếp với Backend Spring Boot cho phân hệ Chu kỳ vận hành & Năm tài chính.
 * Base URL: /farms/{farmId}/cycles (qua /api/v1/farms/{farmId}/cycles)
 * Thuộc Nhóm 1 - Quản lý tổ chức & trang trại (1.5 Cấu hình & Chu kỳ vận hành).
 */
export const operationalCycleApi = {
  // =========================================================================
  // 1. CÁC API THEO NGỮ CẢNH TRANG TRẠI (FARM-SCOPED)
  // =========================================================================

  /**
   * Lấy danh sách chu kỳ vận hành của trang trại có phân trang.
   * @param {number|string} farmId ID trang trại
   * @param {Object} params { status, page, size, sort }
   */
  getCyclesByFarm: (farmId, params = {}) => {
    return axiosClient.get(`/farms/${farmId}/cycles`, { params });
  },

  /**
   * Lấy toàn bộ danh sách chu kỳ của trang trại (Dropdown/Select).
   * @param {number|string} farmId ID trang trại
   */
  getAllCyclesByFarm: (farmId) => {
    return axiosClient.get(`/farms/${farmId}/cycles/all`);
  },

  /**
   * Xem chi tiết thông tin chu kỳ vận hành theo ID và FarmId.
   * @param {number|string} farmId ID trang trại
   * @param {number|string} id Cycle ID
   */
  getCycleById: (farmId, id) => {
    return axiosClient.get(`/farms/${farmId}/cycles/${id}`);
  },

  /**
   * Tạo mới chu kỳ vận hành cho trang trại (Yêu cầu vai trò Quản lý / Chủ trang trại).
   * @param {number|string} farmId ID trang trại
   * @param {Object} data { name, fiscalYear, startDate, endDate }
   */
  createCycle: (farmId, data) => {
    return axiosClient.post(`/farms/${farmId}/cycles`, data);
  },

  /**
   * Cập nhật thông tin chu kỳ vận hành (Không áp dụng cho chu kỳ đã đóng CLOSED).
   * @param {number|string} farmId ID trang trại
   * @param {number|string} id Cycle ID
   * @param {Object} data { name, fiscalYear, startDate, endDate, status }
   */
  updateCycle: (farmId, id, data) => {
    return axiosClient.put(`/farms/${farmId}/cycles/${id}`, data);
  },

  /**
   * Đóng chu kỳ vận hành (Khóa sổ vụ mùa / Chốt số liệu tài chính).
   * @param {number|string} farmId ID trang trại
   * @param {number|string} id Cycle ID
   */
  closeCycle: (farmId, id) => {
    return axiosClient.post(`/farms/${farmId}/cycles/${id}/close`);
  },

  // =========================================================================
  // 2. CÁC API TRA CỨU TRỰC TIẾP THEO TENANT
  // =========================================================================

  /**
   * Lấy danh sách chu kỳ vận hành trực tiếp theo Tenant hoặc lọc theo Farm.
   * @param {Object} params { farmId, status, page, size, sort }
   */
  getCyclesDirect: (params = {}) => {
    return axiosClient.get('/cycles', { params });
  },

  /**
   * Xem chi tiết chu kỳ vận hành theo ID trực tiếp.
   * @param {number|string} id Cycle ID
   */
  getCycleByIdDirect: (id) => {
    return axiosClient.get(`/cycles/${id}`);
  },
};

export default operationalCycleApi;
