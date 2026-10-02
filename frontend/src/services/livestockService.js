import { apiClient } from './apiClient';

export const livestockService = {
  // Giống vật nuôi (Breeds)
  getBreeds: async (species = null) => {
    const params = species ? { species } : {};
    const response = await apiClient.get('/livestock-breeds', { params });
    return response.data.data;
  },

  getBreedById: async (id) => {
    const response = await apiClient.get(`/livestock-breeds/${id}`);
    return response.data.data;
  },

  createBreed: async (payload) => {
    const response = await apiClient.post('/livestock-breeds', payload);
    return response.data.data;
  },

  updateBreed: async (id, payload) => {
    const response = await apiClient.put(`/livestock-breeds/${id}`, payload);
    return response.data.data;
  },

  deleteBreed: async (id) => {
    const response = await apiClient.delete(`/livestock-breeds/${id}`);
    return response.data.data;
  },

  // Đàn / Bầy vật nuôi (Groups)
  getGroups: async (farmId, params = {}) => {
    const response = await apiClient.get(`/farms/${farmId}/livestock/groups`, { params });
    return response.data.data;
  },

  getGroupById: async (farmId, groupId) => {
    const response = await apiClient.get(`/farms/${farmId}/livestock/groups/${groupId}`);
    return response.data.data;
  },

  createGroup: async (farmId, payload) => {
    const response = await apiClient.post(`/farms/${farmId}/livestock/groups`, payload);
    return response.data.data;
  },

  updateGroup: async (farmId, groupId, payload) => {
    const response = await apiClient.put(`/farms/${farmId}/livestock/groups/${groupId}`, payload);
    return response.data.data;
  },

  updateGroupStatus: async (farmId, groupId, status) => {
    const response = await apiClient.patch(`/farms/${farmId}/livestock/groups/${groupId}/status`, null, {
      params: { status },
    });
    return response.data.data;
  },

  adjustGroupQuantity: async (farmId, groupId, quantityChange, reason = '') => {
    const response = await apiClient.patch(
      `/farms/${farmId}/livestock/groups/${groupId}/quantity`,
      null,
      { params: { quantityChange, reason } }
    );
    return response.data.data;
  },

  deleteGroup: async (farmId, groupId) => {
    const response = await apiClient.delete(`/farms/${farmId}/livestock/groups/${groupId}`);
    return response.data.data;
  },

  // Cá thể có mã RFID/Thẻ tai (Individuals)
  getIndividuals: async (farmId, params = {}) => {
    const response = await apiClient.get(`/farms/${farmId}/livestock/individuals`, { params });
    return response.data.data;
  },

  getIndividualById: async (farmId, id) => {
    const response = await apiClient.get(`/farms/${farmId}/livestock/individuals/${id}`);
    return response.data.data;
  },

  getIndividualByRfid: async (farmId, rfidTagCode) => {
    const response = await apiClient.get(`/farms/${farmId}/livestock/individuals/rfid/${rfidTagCode}`);
    return response.data.data;
  },

  createIndividual: async (farmId, payload) => {
    const response = await apiClient.post(`/farms/${farmId}/livestock/individuals`, payload);
    return response.data.data;
  },

  updateIndividual: async (farmId, id, payload) => {
    const response = await apiClient.put(`/farms/${farmId}/livestock/individuals/${id}`, payload);
    return response.data.data;
  },

  updateIndividualHealth: async (farmId, id, healthStatus, notes = '') => {
    const response = await apiClient.patch(
      `/farms/${farmId}/livestock/individuals/${id}/health`,
      null,
      { params: { healthStatus, notes } }
    );
    return response.data.data;
  },

  deleteIndividual: async (farmId, id) => {
    const response = await apiClient.delete(`/farms/${farmId}/livestock/individuals/${id}`);
    return response.data.data;
  },

  // Biến động & Sự kiện chăn nuôi (Events)
  getEvents: async (farmId, params = {}) => {
    const response = await apiClient.get(`/farms/${farmId}/livestock/events`, { params });
    return response.data.data;
  },

  getEventsByTarget: async (farmId, targetType, targetId) => {
    const response = await apiClient.get(
      `/farms/${farmId}/livestock/events/target/${targetType}/${targetId}`
    );
    return response.data.data;
  },

  recordEvent: async (farmId, payload) => {
    const response = await apiClient.post(`/farms/${farmId}/livestock/events`, payload);
    return response.data.data;
  },

  deleteEvent: async (farmId, id) => {
    const response = await apiClient.delete(`/farms/${farmId}/livestock/events/${id}`);
    return response.data.data;
  },
};
