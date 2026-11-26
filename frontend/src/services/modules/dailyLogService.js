import { apiClient } from '../api/apiClient';
import { API_ENDPOINTS } from '../api/endpoints';

export const dailyLogService = {
  getReminders: async (params = {}) => {
    const res = await apiClient.get(API_ENDPOINTS.DAILY_LOGS.REMINDERS, { params });
    return res.data;
  },

  getDailyLogs: async (params = {}) => {
    const res = await apiClient.get(API_ENDPOINTS.DAILY_LOGS.LIST, { params });
    return res.data;
  },

  createDailyLog: async (data) => {
    const res = await apiClient.post(API_ENDPOINTS.DAILY_LOGS.LIST, data);
    return res.data;
  },

  updateDailyLog: async (id, data) => {
    const res = await apiClient.put(API_ENDPOINTS.DAILY_LOGS.DETAIL(id), data);
    return res.data;
  },

  deleteDailyLog: async (id) => {
    const res = await apiClient.delete(API_ENDPOINTS.DAILY_LOGS.DETAIL(id));
    return res.data;
  },
};

export default dailyLogService;
