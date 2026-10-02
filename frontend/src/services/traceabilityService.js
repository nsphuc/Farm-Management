import { apiClient } from './apiClient';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export const traceabilityService = {
  // Lấy danh sách lô thành phẩm
  searchBatches: async (farmId, params = {}) => {
    const response = await apiClient.get(`/farms/${farmId}/product-batches`, { params });
    return response.data.data;
  },

  // Lấy chi tiết lô thành phẩm
  getBatchById: async (farmId, batchId) => {
    const response = await apiClient.get(`/farms/${farmId}/product-batches/${batchId}`);
    return response.data.data;
  },

  // Khởi tạo lô thu hoạch mới (PENDING_APPROVAL)
  createHarvestBatch: async (farmId, payload) => {
    const response = await apiClient.post(`/farms/${farmId}/product-batches`, payload);
    return response.data.data;
  },

  // Cổng phê duyệt kiểm định (Approval Gate) -> READY_TO_PRINT + sinh QR Base64 ZXing
  approveBatch: async (farmId, batchId) => {
    const response = await apiClient.put(`/farms/${farmId}/product-batches/${batchId}/approve`);
    return response.data.data;
  },

  // Từ chối kiểm định lô hàng
  rejectBatch: async (farmId, batchId, payload) => {
    const response = await apiClient.put(`/farms/${farmId}/product-batches/${batchId}/reject`, payload);
    return response.data.data;
  },

  // Thu hồi khẩn cấp lô hàng (Emergency Recall)
  recallBatch: async (farmId, batchId, payload) => {
    const response = await apiClient.put(`/farms/${farmId}/product-batches/${batchId}/recall`, payload);
    return response.data.data;
  },

  // Ghi nhận lịch sử in tem nhiệt tại bàn đóng gói
  recordPrintLog: async (farmId, batchId, payload) => {
    const response = await apiClient.post(`/farms/${farmId}/product-batches/${batchId}/print-log`, payload);
    return response.data.data;
  },

  // Lịch sử in tem của lô
  getPrintLogs: async (farmId, batchId, params = {}) => {
    const response = await apiClient.get(`/farms/${farmId}/product-batches/${batchId}/print-logs`, { params });
    return response.data.data;
  },

  // Tra cứu công khai (Không yêu cầu JWT - Zero-Leakage)
  getPublicTraceability: async (traceabilityCode) => {
    // Dùng axios riêng để không gắn Authorization header nếu người dùng là khách vãng lai
    const response = await axios.get(`${BASE_URL}/public/traceability/${traceabilityCode}`);
    return response.data.data;
  }
};

export default traceabilityService;
