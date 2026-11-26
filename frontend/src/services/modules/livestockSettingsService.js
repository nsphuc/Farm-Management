import { apiClient } from '../api/apiClient';
import { API_ENDPOINTS } from '../api/endpoints';

export const livestockSettingsService = {
  // Programs (Quy trình nuôi)
  getPrograms: async (farmId) => {
    const res = await apiClient.get(API_ENDPOINTS.LIVESTOCK_SETTINGS.PROGRAMS, {
      params: farmId ? { farmId } : {},
    });
    return res.data;
  },

  getProgramById: async (id) => {
    const res = await apiClient.get(API_ENDPOINTS.LIVESTOCK_SETTINGS.PROGRAM_DETAIL(id));
    return res.data;
  },

  createProgram: async (farmId, data) => {
    const res = await apiClient.post(API_ENDPOINTS.LIVESTOCK_SETTINGS.PROGRAMS, data, {
      params: farmId ? { farmId } : {},
    });
    return res.data;
  },

  updateProgram: async (id, data) => {
    const res = await apiClient.put(API_ENDPOINTS.LIVESTOCK_SETTINGS.PROGRAM_DETAIL(id), data);
    return res.data;
  },

  deleteProgram: async (id) => {
    const res = await apiClient.delete(API_ENDPOINTS.LIVESTOCK_SETTINGS.PROGRAM_DETAIL(id));
    return res.data;
  },

  // Feed Standards (Mốc định mức cám)
  addFeedQuota: async (programId, data) => {
    const res = await apiClient.post(API_ENDPOINTS.LIVESTOCK_SETTINGS.QUOTAS(programId), data);
    return res.data;
  },

  updateFeedQuota: async (programId, quotaId, data) => {
    const res = await apiClient.put(API_ENDPOINTS.LIVESTOCK_SETTINGS.QUOTA_DETAIL(programId, quotaId), data);
    return res.data;
  },

  deleteFeedQuota: async (programId, quotaId) => {
    const res = await apiClient.delete(API_ENDPOINTS.LIVESTOCK_SETTINGS.QUOTA_DETAIL(programId, quotaId));
    return res.data;
  },

  batchRangeFeed: async (programId, data) => {
    const res = await apiClient.post(API_ENDPOINTS.LIVESTOCK_SETTINGS.QUOTA_BATCH_RANGE(programId), data);
    return res.data;
  },

  // Vaccine Timeline (Lịch tiêm phòng)
  addVaccine: async (programId, data) => {
    const res = await apiClient.post(API_ENDPOINTS.LIVESTOCK_SETTINGS.VACCINES(programId), data);
    return res.data;
  },

  updateVaccine: async (programId, quotaId, data) => {
    const res = await apiClient.put(API_ENDPOINTS.LIVESTOCK_SETTINGS.VACCINE_DETAIL(programId, quotaId), data);
    return res.data;
  },

  deleteVaccine: async (programId, quotaId) => {
    const res = await apiClient.delete(API_ENDPOINTS.LIVESTOCK_SETTINGS.VACCINE_DETAIL(programId, quotaId));
    return res.data;
  },

  // Environmental Metrics (Chỉ số môi trường)
  getEnvMetrics: async (farmId) => {
    const res = await apiClient.get(API_ENDPOINTS.LIVESTOCK_SETTINGS.ENV_METRICS, {
      params: farmId ? { farmId } : {},
    });
    return res.data;
  },

  updateEnvMetrics: async (farmId, data) => {
    const res = await apiClient.put(API_ENDPOINTS.LIVESTOCK_SETTINGS.ENV_METRICS, typeof data === 'string' ? data : JSON.stringify(data), {
      params: farmId ? { farmId } : {},
      headers: { 'Content-Type': 'application/json' },
    });
    return res.data;
  },

  // KPIs & Culling Reasons
  getKpis: async (farmId) => {
    const res = await apiClient.get(API_ENDPOINTS.LIVESTOCK_SETTINGS.KPIS, {
      params: farmId ? { farmId } : {},
    });
    return res.data;
  },

  updateKpis: async (farmId, data) => {
    const res = await apiClient.put(API_ENDPOINTS.LIVESTOCK_SETTINGS.KPIS, typeof data === 'string' ? data : JSON.stringify(data), {
      params: farmId ? { farmId } : {},
      headers: { 'Content-Type': 'application/json' },
    });
    return res.data;
  },
};

export default livestockSettingsService;
