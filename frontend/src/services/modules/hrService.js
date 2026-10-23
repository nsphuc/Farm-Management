import { apiClient } from '../api/apiClient';
import { API_ENDPOINTS } from '../api/endpoints';

/**
 * HR & Employee Daily Operations API Service
 * Khớp 100% hợp đồng backend Spring Boot & bảng MySQL 51, 52, 53, 54, 55, 56, 57, 58
 */
export const hrService = {
  // ==========================================
  // 1. EMPLOYEES (Bảng employees #51)
  // ==========================================
  getEmployees: async (params = {}) => {
    const res = await apiClient.get(API_ENDPOINTS.HR.EMPLOYEES, { params });
    return res.data;
  },

  getEmployeeById: async (id) => {
    const res = await apiClient.get(API_ENDPOINTS.HR.EMPLOYEE_DETAIL(id));
    return res.data;
  },

  createEmployee: async (data) => {
    const res = await apiClient.post(API_ENDPOINTS.HR.EMPLOYEES, data);
    return res.data;
  },

  updateEmployee: async (id, data) => {
    const res = await apiClient.put(API_ENDPOINTS.HR.EMPLOYEE_DETAIL(id), data);
    return res.data;
  },

  provisionAccount: async (id, data) => {
    const res = await apiClient.post(API_ENDPOINTS.HR.PROVISION_ACCOUNT(id), data);
    return res.data;
  },

  updateUserStatus: async (userId, status) => {
    const res = await apiClient.put(API_ENDPOINTS.USERS.STATUS(userId), { status });
    return res.data;
  },

  // ==========================================
  // 2. WORK SHIFTS (Bảng work_shifts #52)
  // ==========================================
  getWorkShifts: async () => {
    const res = await apiClient.get(API_ENDPOINTS.HR.WORK_SHIFTS);
    return res.data;
  },

  createWorkShift: async (data) => {
    const res = await apiClient.post(API_ENDPOINTS.HR.WORK_SHIFTS, data);
    return res.data;
  },

  updateWorkShift: async (id, data) => {
    const res = await apiClient.put(API_ENDPOINTS.HR.WORK_SHIFT_DETAIL(id), data);
    return res.data;
  },

  // ==========================================
  // 3. SHIFT ASSIGNMENTS (Bảng shift_assignments #53)
  // ==========================================
  assignShift: async (data) => {
    const res = await apiClient.post(API_ENDPOINTS.HR.SHIFT_ASSIGN, data);
    return res.data;
  },

  getShiftAssignments: async (params = {}) => {
    const res = await apiClient.get(API_ENDPOINTS.HR.SHIFT_ASSIGNMENTS, { params });
    return res.data;
  },

  cancelShiftAssignment: async (id) => {
    const res = await apiClient.put(API_ENDPOINTS.HR.SHIFT_ASSIGNMENT_CANCEL(id));
    return res.data;
  },

  // ==========================================
  // 4. TIME ATTENDANCES (Bảng time_attendances #54)
  // ==========================================
  checkIn: async (data) => {
    const res = await apiClient.post(API_ENDPOINTS.HR.CHECK_IN, data);
    return res.data;
  },

  checkOut: async (data) => {
    const res = await apiClient.post(API_ENDPOINTS.HR.CHECK_OUT, data);
    return res.data;
  },

  batchRollCall: async (data) => {
    const res = await apiClient.post(API_ENDPOINTS.HR.BATCH_ROLL_CALL, data);
    return res.data;
  },

  adjustAttendance: async (id, data) => {
    const res = await apiClient.put(API_ENDPOINTS.HR.ADJUST_ATTENDANCE(id), data);
    return res.data;
  },

  getAttendances: async (params = {}) => {
    const res = await apiClient.get(API_ENDPOINTS.HR.ATTENDANCE, { params });
    return res.data;
  },

  getAttendanceById: async (id) => {
    const res = await apiClient.get(API_ENDPOINTS.HR.ATTENDANCE_DETAIL(id));
    return res.data;
  },

  // ==========================================
  // 5. LEAVE REQUESTS (Bảng leave_requests #55)
  // ==========================================
  getLeaveRequests: async (params = {}) => {
    const res = await apiClient.get(API_ENDPOINTS.HR.LEAVE_REQUESTS, { params });
    return res.data;
  },

  getLeaveRequestById: async (id) => {
    const res = await apiClient.get(API_ENDPOINTS.HR.LEAVE_DETAIL(id));
    return res.data;
  },

  createLeaveRequest: async (data) => {
    const res = await apiClient.post(API_ENDPOINTS.HR.LEAVE_REQUESTS, data);
    return res.data;
  },

  approveLeaveRequest: async (id, data) => {
    const res = await apiClient.put(API_ENDPOINTS.HR.LEAVE_APPROVE(id), data);
    return res.data;
  },

  // ==========================================
  // 6. OVERTIME REQUESTS (Bảng overtime_requests #56)
  // ==========================================
  getOvertimeRequests: async (params = {}) => {
    const res = await apiClient.get(API_ENDPOINTS.HR.OVERTIME_REQUESTS, { params });
    return res.data;
  },

  getOvertimeRequestById: async (id) => {
    const res = await apiClient.get(API_ENDPOINTS.HR.OVERTIME_DETAIL(id));
    return res.data;
  },

  createOvertimeRequest: async (data) => {
    const res = await apiClient.post(API_ENDPOINTS.HR.OVERTIME_REQUESTS, data);
    return res.data;
  },

  approveOvertimeRequest: async (id, data) => {
    const res = await apiClient.put(API_ENDPOINTS.HR.OVERTIME_APPROVE(id), data);
    return res.data;
  },

  // ==========================================
  // 7. FARM TASKS (Bảng farm_tasks #57 & farm_task_assignees #58)
  // ==========================================
  getTasks: async (farmId, params = {}) => {
    const res = await apiClient.get(API_ENDPOINTS.HR.TASKS(farmId), { params });
    return res.data;
  },

  getTaskById: async (farmId, id) => {
    const res = await apiClient.get(API_ENDPOINTS.HR.TASK_DETAIL(farmId, id));
    return res.data;
  },

  createTask: async (farmId, data) => {
    const res = await apiClient.post(API_ENDPOINTS.HR.TASKS(farmId), data);
    return res.data;
  },

  updateTask: async (farmId, id, data) => {
    const res = await apiClient.put(API_ENDPOINTS.HR.TASK_DETAIL(farmId, id), data);
    return res.data;
  },

  deleteTask: async (farmId, id) => {
    const res = await apiClient.delete(API_ENDPOINTS.HR.TASK_DETAIL(farmId, id));
    return res.data;
  },

  updateTaskStatus: async (id, data) => {
    const res = await apiClient.put(API_ENDPOINTS.HR.TASK_STATUS(id), data);
    return res.data;
  },

  generateDailyRoutines: async (farmId) => {
    const res = await apiClient.post(API_ENDPOINTS.HR.TASK_GENERATE_DAILY_ROUTINES(farmId));
    return res.data;
  },
};

export default hrService;
