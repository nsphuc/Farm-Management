import axiosClient from './axiosClient';

/**
 * Service API giao tiếp với Backend Spring Boot cho phân hệ Quản lý Nhân sự (Employees).
 * Base URL: /employees (qua /api/v1/employees)
 * Nghiệp vụ: 4.1. Quản lý nhân viên trong Sơ đồ phân cấp chức năng.
 */
export const employeeApi = {
  /**
   * Lấy danh sách nhân viên có phân trang.
   * @param {Object} params { farmId, status, page, size, sort }
   */
  getEmployees: (params = {}) => {
    return axiosClient.get('/employees', { params });
  },

  /**
   * Lấy chi tiết thông tin hồ sơ nhân viên theo ID.
   * @param {number|string} id Employee ID
   */
  getEmployeeById: (id) => {
    return axiosClient.get(`/employees/${id}`);
  },

  /**
   * Thêm mới hồ sơ nhân viên (Yêu cầu PERM_HR_EMPLOYEE_MANAGE / ROLE_FARM_OWNER).
   * @param {Object} data { employeeCode, fullName, email, phone, idCardNumber, position, department, joinedDate, baseSalary, hourlyRate, contractType, status, farmId, userId }
   */
  createEmployee: (data) => {
    return axiosClient.post('/employees', data);
  },

  /**
   * Cập nhật thông tin nhân viên (Yêu cầu PERM_HR_EMPLOYEE_MANAGE / ROLE_FARM_OWNER).
   * @param {number|string} id Employee ID
   * @param {Object} data
   */
  updateEmployee: (id, data) => {
    return axiosClient.put(`/employees/${id}`, data);
  },

  /**
   * Thôi việc / Ngừng hoạt động nhân viên (Soft-delete: status=RESIGNED).
   * @param {number|string} id Employee ID
   */
  deleteEmployee: (id) => {
    return axiosClient.delete(`/employees/${id}`);
  },
};

export default employeeApi;
