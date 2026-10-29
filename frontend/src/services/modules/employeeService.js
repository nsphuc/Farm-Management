import { apiClient } from '../api/apiClient';
import { API_ENDPOINTS } from '../api/endpoints';

export const employeeService = {
  getEmployees: async (params = {}) => {
    const res = await apiClient.get(API_ENDPOINTS.HR.EMPLOYEES, { params });
    return res.data;
  },
  getEmployeeById: async (id) => {
    const res = await apiClient.get(API_ENDPOINTS.HR.EMPLOYEE_DETAIL(id));
    return res.data;
  },
  updateUserStatus: async (userId, status) => {
    const res = await apiClient.put(API_ENDPOINTS.USERS.STATUS(userId), { status });
    return res.data;
  },
  updateUserRoles: async (userId, data) => {
    const res = await apiClient.put(API_ENDPOINTS.USERS.ROLES(userId), data);
    return res.data;
  },
  resetUserPassword: async (userId, newPassword) => {
    const res = await apiClient.post(API_ENDPOINTS.USERS.RESET_PASSWORD(userId), { newPassword });
    return res.data;
  },
};
