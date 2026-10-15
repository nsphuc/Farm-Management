import axiosClient from './axiosClient';

/**
 * Service API giao tiếp trực tiếp với Backend Spring Boot cho phân hệ Tổ chức & Trang trại.
 * Bao gồm 3 thực thể cốt lõi: Farm (Trang trại), ProductionZone (Phân khu), ZoneLocation (Vị trí canh tác).
 * Lưu ý: Tuyệt đối không gửi `tenantId` hay `status` từ client.
 */
export const farmApi = {
  // =========================================================================
  // 1. QUẢN LÝ TRANG TRẠI (FARMS) - Base: /farms
  // =========================================================================

  /**
   * Lấy danh sách trang trại có phân trang theo Tenant.
   * @param {Object} params { page, size, sort }
   */
  getFarms: (params = {}) => {
    return axiosClient.get('/farms', { params });
  },

  /**
   * Lấy toàn bộ danh sách trang trại của Tenant (cho select box, dropdown).
   */
  getAllFarms: () => {
    return axiosClient.get('/farms/all');
  },

  /**
   * Lấy thông tin chi tiết một trang trại theo ID.
   * @param {number|string} id Farm ID
   */
  getFarmById: (id) => {
    return axiosClient.get(`/farms/${id}`);
  },

  /**
   * Tạo mới trang trại (Yêu cầu PERM_FARM_CREATE).
   * @param {Object} data { code, name, farmType, totalAreaM2, latitude, longitude, address, managerUserId }
   */
  createFarm: (data) => {
    return axiosClient.post('/farms', data);
  },

  /**
   * Cập nhật thông tin trang trại (Yêu cầu PERM_FARM_UPDATE).
   * @param {number|string} id Farm ID
   * @param {Object} data { name, farmType, totalAreaM2, latitude, longitude, address, managerUserId }
   */
  updateFarm: (id, data) => {
    return axiosClient.put(`/farms/${id}`, data);
  },

  /**
   * Vô hiệu hóa trang trại (Soft-delete: status=INACTIVE).
   * @param {number|string} id Farm ID
   */
  deleteFarm: (id) => {
    return axiosClient.delete(`/farms/${id}`);
  },

  // =========================================================================
  // 2. QUẢN LÝ PHÂN KHU SẢN XUẤT (PRODUCTION ZONES) - Base: /farms/{farmId}/zones
  // =========================================================================

  /**
   * Lấy danh sách toàn bộ phân khu thuộc một trang trại.
   * @param {number|string} farmId Farm ID
   */
  getZonesByFarm: (farmId) => {
    return axiosClient.get(`/farms/${farmId}/zones`);
  },

  /**
   * Phân trang danh sách phân khu thuộc một trang trại.
   * @param {number|string} farmId Farm ID
   * @param {Object} params { page, size, sort }
   */
  getZonesPageByFarm: (farmId, params = {}) => {
    return axiosClient.get(`/farms/${farmId}/zones/page`, { params });
  },

  /**
   * Xem chi tiết một phân khu sản xuất.
   * @param {number|string} farmId Farm ID
   * @param {number|string} zoneId Zone ID
   */
  getZoneById: (farmId, zoneId) => {
    return axiosClient.get(`/farms/${farmId}/zones/${zoneId}`);
  },

  /**
   * Tạo mới phân khu sản xuất (Yêu cầu PERM_ZONE_MANAGE).
   * @param {number|string} farmId Farm ID
   * @param {Object} data { code, name, zoneType, areaM2, soilType, waterSource }
   */
  createZone: (farmId, data) => {
    return axiosClient.post(`/farms/${farmId}/zones`, data);
  },

  /**
   * Cập nhật phân khu sản xuất (Yêu cầu PERM_ZONE_MANAGE).
   * @param {number|string} farmId Farm ID
   * @param {number|string} zoneId Zone ID
   * @param {Object} data { name, zoneType, areaM2, soilType, waterSource }
   */
  updateZone: (farmId, zoneId, data) => {
    return axiosClient.put(`/farms/${farmId}/zones/${zoneId}`, data);
  },

  /**
   * Đưa phân khu vào bảo trì (Soft-delete: status=MAINTENANCE).
   * @param {number|string} farmId Farm ID
   * @param {number|string} zoneId Zone ID
   */
  deleteZone: (farmId, zoneId) => {
    return axiosClient.delete(`/farms/${farmId}/zones/${zoneId}`);
  },

  // =========================================================================
  // 3. QUẢN LÝ VỊ TRÍ CHI TIẾT (ZONE LOCATIONS: LUỐNG/Ô ĐẤT/CHUỒNG)
  // Base: /farms/{farmId}/zones/{zoneId}/locations
  // =========================================================================

  /**
   * Lấy toàn bộ vị trí chi tiết thuộc một phân khu.
   * @param {number|string} farmId Farm ID
   * @param {number|string} zoneId Zone ID
   */
  getLocationsByZone: (farmId, zoneId) => {
    return axiosClient.get(`/farms/${farmId}/zones/${zoneId}/locations`);
  },

  /**
   * Phân trang danh sách vị trí chi tiết.
   * @param {number|string} farmId Farm ID
   * @param {number|string} zoneId Zone ID
   * @param {Object} params { page, size, sort }
   */
  getLocationsPageByZone: (farmId, zoneId, params = {}) => {
    return axiosClient.get(`/farms/${farmId}/zones/${zoneId}/locations/page`, { params });
  },

  /**
   * Xem chi tiết vị trí canh tác.
   * @param {number|string} farmId Farm ID
   * @param {number|string} zoneId Zone ID
   * @param {number|string} locationId Location ID
   */
  getLocationById: (farmId, zoneId, locationId) => {
    return axiosClient.get(`/farms/${farmId}/zones/${zoneId}/locations/${locationId}`);
  },

  /**
   * Tạo mới vị trí chi tiết (Yêu cầu PERM_ZONE_MANAGE).
   * @param {number|string} farmId Farm ID
   * @param {number|string} zoneId Zone ID
   * @param {Object} data { code, name, description }
   */
  createLocation: (farmId, zoneId, data) => {
    return axiosClient.post(`/farms/${farmId}/zones/${zoneId}/locations`, data);
  },

  /**
   * Cập nhật vị trí chi tiết (Yêu cầu PERM_ZONE_MANAGE).
   * @param {number|string} farmId Farm ID
   * @param {number|string} zoneId Zone ID
   * @param {number|string} locationId Location ID
   * @param {Object} data { name, description }
   */
  updateLocation: (farmId, zoneId, locationId, data) => {
    return axiosClient.put(`/farms/${farmId}/zones/${zoneId}/locations/${locationId}`, data);
  },

  /**
   * Đưa vị trí vào bảo trì (Soft-delete: status=MAINTENANCE).
   * @param {number|string} farmId Farm ID
   * @param {number|string} zoneId Zone ID
   * @param {number|string} locationId Location ID
   */
  deleteLocation: (farmId, zoneId, locationId) => {
    return axiosClient.delete(`/farms/${farmId}/zones/${zoneId}/locations/${locationId}`);
  },
};

export default farmApi;
