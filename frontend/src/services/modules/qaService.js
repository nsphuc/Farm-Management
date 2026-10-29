import { apiClient } from '../api/apiClient';

export const qaService = {
  /**
   * Lấy danh sách lô thành phẩm (hỗ trợ lọc theo farmId, status, keyword, phân trang)
   */
  getProductBatches: async ({ farmId, status, keyword, page = 0, size = 20 } = {}) => {
    const params = { page, size };
    if (farmId && farmId !== 'ALL') params.farmId = farmId;
    if (status && status !== 'ALL') params.status = status;
    if (keyword) params.keyword = keyword;

    const url = farmId && farmId !== 'ALL'
      ? `/farms/${farmId}/product-batches`
      : '/product-batches';

    const response = await apiClient.get(url, { params });
    return response.data?.data || response.data;
  },

  /**
   * Lấy chi tiết lô thành phẩm
   */
  getProductBatchById: async (farmId, id) => {
    const url = farmId
      ? `/farms/${farmId}/product-batches/${id}`
      : `/product-batches/${id}`;
    const response = await apiClient.get(url);
    return response.data?.data || response.data;
  },

  /**
   * [ĐẶC QUYỀN OWNER / QA LEAD]: Phát lệnh thu hồi khẩn cấp toàn cục
   * POST /farms/{farmId}/product-batches/{id}/recall
   */
  recallBatch: async (farmId, id, recallReason) => {
    const url = farmId
      ? `/farms/${farmId}/product-batches/${id}/recall`
      : `/product-batches/${id}/recall`;
    const response = await apiClient.post(url, { recallReason });
    return response.data?.data || response.data;
  },

  /**
   * Phê duyệt đạt chuẩn KCS
   */
  approveBatch: async (farmId, id, data = {}) => {
    const response = await apiClient.post(`/farms/${farmId}/product-batches/${id}/approve`, data);
    return response.data?.data || response.data;
  },

  /**
   * Từ chối KCS
   */
  rejectBatch: async (farmId, id, data = {}) => {
    const response = await apiClient.post(`/farms/${farmId}/product-batches/${id}/reject`, data);
    return response.data?.data || response.data;
  },

  /**
   * In tem nhãn nhiệt ESC/POS
   */
  printLabel: async (farmId, id, data = {}) => {
    const payload = {
      labelSize: data?.labelSize || '50x50',
      printQuantity: data?.printQuantity ? Number(data.printQuantity) : 10,
      printerModel: data?.printerModel || 'Xprinter XP-365B ESC/POS',
      ...data,
    };
    const response = await apiClient.post(`/farms/${farmId}/product-batches/${id}/print-label`, payload);
    return response.data?.data || response.data;
  },

  /**
   * Tạo lô thành phẩm mới (ROLE_WAREHOUSE_STAFF / ROLE_FARM_MANAGER)
   */
  createProductBatch: async (farmId, data) => {
    const response = await apiClient.post(`/farms/${farmId}/product-batches`, data);
    return response.data?.data || response.data;
  },

  createBatch: async (farmId, data) => {
    const response = await apiClient.post(`/farms/${farmId}/product-batches`, data);
    return response.data?.data || response.data;
  },

  /**
   * Lập biên bản kiểm định KCS (ROLE_TECHNICAL_STAFF)
   * Đảm bảo chuẩn hóa 2 chiều tuyệt đối: criterionName, standardValue, measuredValue, unit, isPassed
   */
  createQcInspection: async (farmId, data) => {
    const payload = {
      productBatchId: Number(data.productBatchId),
      inspectionCode: (data.inspectionCode || `QC-${Date.now().toString().slice(-6)}`).trim(),
      inspectionDate: data.inspectionDate,
      sampleSize: data.sampleSize !== undefined && data.sampleSize !== '' ? Number(data.sampleSize) : 5.0,
      sampleUnit: data.sampleUnit?.trim() || 'KG',
      overallResult: data.overallResult === 'FAILED' || data.overallResult === 'REJECTED' ? 'FAILED' : 'PASSED',
      notes: data.notes?.trim() || '',
      photosJson: data.photosJson || (data.photoUrl ? JSON.stringify([data.photoUrl.trim()]) : null),
      items: (data.items || []).map((it) => {
        const cName = (it.criterionName || it.parameterName || it.name || '').trim();
        const sVal = (it.standardValue || it.standardThreshold || it.standard || '').trim();
        const mVal = (it.measuredValue !== undefined && it.measuredValue !== null ? String(it.measuredValue) : (it.actualValue !== undefined ? String(it.actualValue) : '')).trim();
        const isPass = it.isPassed !== undefined ? Boolean(it.isPassed) : (it.passed !== undefined ? Boolean(it.passed) : true);
        return {
          criterionName: cName,
          parameterName: cName,
          standardValue: sVal,
          standardThreshold: sVal,
          measuredValue: mVal,
          actualValue: mVal,
          unit: it.unit?.trim() || '',
          isPassed: isPass,
          passed: isPass,
          notes: it.notes?.trim() || '',
        };
      }),
    };
    const response = await apiClient.post(`/farms/${farmId}/qc-inspections`, payload);
    return response.data?.data || response.data;
  },

  /**
   * Lập biên bản thu hoạch (ROLE_FIELD_STAFF / ROLE_FARM_MANAGER)
   */
  createHarvestRecord: async (farmId, data) => {
    const targetFarmId = typeof farmId === 'object' && farmId !== null ? farmId.farmId : farmId;
    const response = await apiClient.post(`/farms/${targetFarmId}/harvest-records`, data);
    return response.data?.data || response.data;
  },

  /**
   * Lấy danh sách biên bản thu hoạch
   */
  getHarvestRecords: async (farmId, params = {}) => {
    const targetFarmId = typeof farmId === 'object' && farmId !== null ? farmId.farmId : farmId;
    const response = await apiClient.get(`/farms/${targetFarmId}/harvest-records`, { params });
    return response.data?.data || response.data;
  },
};

export default qaService;

