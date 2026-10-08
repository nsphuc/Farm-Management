import { apiClient } from './apiClient';

export const hrService = {
  // --- Quản lý Nhân viên (Employees) ---
  getEmployees: async (farmId, params = {}) => {
    const response = await apiClient.get(`/farms/${farmId}/employees`, { params });
    return response.data.data;
  },

  getEmployeeById: async (farmId, id) => {
    const response = await apiClient.get(`/farms/${farmId}/employees/${id}`);
    return response.data.data;
  },

  createEmployee: async (farmId, payload) => {
    const response = await apiClient.post(`/farms/${farmId}/employees`, payload);
    return response.data.data;
  },

  updateEmployee: async (farmId, id, payload) => {
    const response = await apiClient.put(`/farms/${farmId}/employees/${id}`, payload);
    return response.data.data;
  },

  deleteEmployee: async (farmId, id) => {
    const response = await apiClient.delete(`/farms/${farmId}/employees/${id}`);
    return response.data.data;
  },

  // --- Ca làm việc (Work Shifts) ---
  getWorkShifts: async (farmId) => {
    const response = await apiClient.get(`/farms/${farmId}/work-shifts`);
    return response.data.data;
  },

  getWorkShiftById: async (farmId, id) => {
    const response = await apiClient.get(`/farms/${farmId}/work-shifts/${id}`);
    return response.data.data;
  },

  createWorkShift: async (farmId, payload) => {
    const response = await apiClient.post(`/farms/${farmId}/work-shifts`, payload);
    return response.data.data;
  },

  updateWorkShift: async (farmId, id, payload) => {
    const response = await apiClient.put(`/farms/${farmId}/work-shifts/${id}`, payload);
    return response.data.data;
  },

  deleteWorkShift: async (farmId, id) => {
    const response = await apiClient.delete(`/farms/${farmId}/work-shifts/${id}`);
    return response.data.data;
  },

  // --- Phân ca (Shift Assignments) ---
  getShiftAssignments: async (farmId, params = {}) => {
    const response = await apiClient.get(`/farms/${farmId}/shift-assignments`, { params });
    return response.data.data;
  },

  createShiftAssignment: async (farmId, payload) => {
    const response = await apiClient.post(`/farms/${farmId}/shift-assignments`, payload);
    return response.data.data;
  },

  bulkAssignShifts: async (farmId, payload) => {
    const response = await apiClient.post(`/farms/${farmId}/shift-assignments/bulk`, payload);
    return response.data.data;
  },

  deleteShiftAssignment: async (farmId, id) => {
    const response = await apiClient.delete(`/farms/${farmId}/shift-assignments/${id}`);
    return response.data.data;
  },

  // --- Chấm công GPS (Attendance) ---
  getAttendances: async (farmId, params = {}) => {
    const response = await apiClient.get(`/farms/${farmId}/attendances`, { params });
    return response.data.data;
  },

  checkIn: async (farmId, payload) => {
    const response = await apiClient.post(`/farms/${farmId}/attendances/check-in`, payload);
    return response.data.data;
  },

  checkOut: async (farmId, payload) => {
    const response = await apiClient.post(`/farms/${farmId}/attendances/check-out`, payload);
    return response.data.data;
  },

  // --- Nghỉ phép & Tăng ca (Leave & Overtime) ---
  getLeaveRequests: async (farmId, params = {}) => {
    const response = await apiClient.get(`/farms/${farmId}/leave-requests`, { params });
    return response.data.data;
  },

  createLeaveRequest: async (farmId, payload) => {
    const response = await apiClient.post(`/farms/${farmId}/leave-requests`, payload);
    return response.data.data;
  },

  reviewLeaveRequest: async (farmId, id, payload) => {
    const response = await apiClient.put(`/farms/${farmId}/leave-requests/${id}/review`, payload);
    return response.data.data;
  },

  getOvertimeRequests: async (farmId, params = {}) => {
    const response = await apiClient.get(`/farms/${farmId}/overtime-requests`, { params });
    return response.data.data;
  },

  createOvertimeRequest: async (farmId, payload) => {
    const response = await apiClient.post(`/farms/${farmId}/overtime-requests`, payload);
    return response.data.data;
  },

  reviewOvertimeRequest: async (farmId, id, payload) => {
    const response = await apiClient.put(`/farms/${farmId}/overtime-requests/${id}/review`, payload);
    return response.data.data;
  }
};
