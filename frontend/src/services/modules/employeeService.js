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
};
