import axiosClient from './axiosClient';

/**
 * Service API giao tiếp với Backend Spring Boot cho phân hệ Phân công Quản lý.
 * Nghiệp vụ: 1.4. Phân công quản lý trong Sơ đồ phân cấp chức năng.
 * Bao gồm:
 * - 1.4.1. Gán quản lý trang trại
 * - 1.4.2. Gán quản lý khu vực
 * - 1.4.3. Thay đổi người phụ trách
 * - 1.4.4. Hủy phân công
 * - 1.4.5. Theo dõi lịch sử phân công
 */
export const assignmentApi = {
  /**
   * 1.4.1. Gán quản lý / phân công nhân sự tại trang trại.
   * @param {number|string} farmId ID trang trại
   * @param {Object} data { userId, employeeId, roleInFarm, assignedFrom, assignedTo }
   */
  assignFarm: (farmId, data) => {
    return axiosClient.post(`/farms/${farmId}/assignments`, data);
  },

  /**
   * 1.4.2. Gán quản lý phân khu sản xuất (Zone Assignment).
   * @param {number|string} farmId ID trang trại
   * @param {number|string} zoneId ID phân khu
   * @param {Object} data { userId, employeeId, assignedFrom, assignedTo }
   */
  assignZone: (farmId, zoneId, data) => {
    return axiosClient.post(`/farms/${farmId}/zones/${zoneId}/assignments`, data);
  },

  /**
   * Lấy danh sách phân công đang có hiệu lực tại một trang trại.
   * @param {number|string} farmId ID trang trại
   */
  getActiveAssignments: (farmId) => {
    return axiosClient.get(`/farms/${farmId}/assignments`);
  },

  /**
   * 1.4.5. Theo dõi lịch sử phân công quản lý trang trại (kể cả đã hết hiệu lực).
   * @param {number|string} farmId ID trang trại
   */
  getAssignmentHistory: (farmId) => {
    return axiosClient.get(`/farms/${farmId}/assignments/history`);
  },

  /**
   * Lấy danh sách toàn bộ phân công của doanh nghiệp (phân trang).
   * @param {Object} params { page, size, sort }
   */
  getAllAssignments: (params = {}) => {
    return axiosClient.get('/farm-assignments', { params });
  },

  /**
   * 1.4.3. Thay đổi người phụ trách / cập nhật vai trò phân công.
   * @param {number|string} id ID phân công
   * @param {Object} data { roleInFarm, assignedFrom, assignedTo, isActive }
   */
  updateAssignment: (id, data) => {
    return axiosClient.put(`/farm-assignments/${id}`, data);
  },

  /**
   * 1.4.4. Hủy phân công quản lý (Soft deactivation: is_active=false, không xóa vật lý).
   * @param {number|string} id ID phân công
   */
  cancelAssignment: (id) => {
    return axiosClient.delete(`/farm-assignments/${id}`);
  },
};

export default assignmentApi;
