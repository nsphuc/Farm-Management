import { apiClient } from './apiClient';

export const taskService = {
  getTasks: async (farmId, params = {}) => {
    const response = await apiClient.get(`/farms/${farmId}/tasks`, { params });
    return response.data.data;
  },

  getKanbanBoard: async (farmId) => {
    const response = await apiClient.get(`/farms/${farmId}/tasks/kanban`);
    return response.data.data;
  },

  getTaskById: async (farmId, id) => {
    const response = await apiClient.get(`/farms/${farmId}/tasks/${id}`);
    return response.data.data;
  },

  createTask: async (farmId, payload) => {
    const response = await apiClient.post(`/farms/${farmId}/tasks`, payload);
    return response.data.data;
  },

  updateTask: async (farmId, id, payload) => {
    const response = await apiClient.put(`/farms/${farmId}/tasks/${id}`, payload);
    return response.data.data;
  },

  updateTaskStatus: async (farmId, id, payload) => {
    const response = await apiClient.patch(`/farms/${farmId}/tasks/${id}/status`, payload);
    return response.data.data;
  },

  deleteTask: async (farmId, id) => {
    const response = await apiClient.delete(`/farms/${farmId}/tasks/${id}`);
    return response.data.data;
  }
};
