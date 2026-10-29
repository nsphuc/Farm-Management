import { apiClient } from '../api/apiClient';
import { API_ENDPOINTS } from '../api/endpoints';

export const platformService = {
  /**
   * 1. Lấy số liệu KPI tổng quan nền tảng & sức khỏe hạ tầng JVM/Database
   */
  getPlatformMetrics: async () => {
    const res = await apiClient.get(API_ENDPOINTS.PLATFORM.METRICS);
    return res.data;
  },

  /**
   * 2. Lấy danh sách khách thuê có phân trang và bộ lọc (keyword, status)
   */
  getTenants: async (params = {}) => {
    const res = await apiClient.get(API_ENDPOINTS.PLATFORM.TENANTS, { params });
    return res.data;
  },

  /**
   * 3. Lấy thông tin chi tiết một khách thuê theo ID
   */
  getTenantById: async (id) => {
    const res = await apiClient.get(API_ENDPOINTS.PLATFORM.TENANT_DETAIL(id));
    return res.data;
  },

  /**
   * 4. Khởi tạo khách thuê mới trọn gói (Tenant + Subscription + Owner)
   */
  createTenant: async (payload) => {
    const res = await apiClient.post(API_ENDPOINTS.PLATFORM.TENANTS, payload);
    return res.data;
  },

  /**
   * 5. Cập nhật trạng thái khách thuê (ACTIVE, SUSPENDED, INACTIVE)
   */
  updateTenantStatus: async (id, payload) => {
    const res = await apiClient.put(API_ENDPOINTS.PLATFORM.TENANT_STATUS(id), payload);
    return res.data;
  },

  /**
   * 6. Nâng cấp hoặc gia hạn gói cước thuê bao cho một Tenant
   */
  addSubscription: async (tenantId, payload) => {
    const res = await apiClient.post(API_ENDPOINTS.PLATFORM.TENANT_SUBSCRIPTIONS(tenantId), payload);
    return res.data;
  },

  /**
   * 7. Truy vấn sổ cái nhật ký kiểm toán bất biến toàn cầu
   */
  getGlobalAuditLogs: async (params = {}) => {
    const res = await apiClient.get(API_ENDPOINTS.PLATFORM.AUDIT_LOGS, { params });
    return res.data;
  },

  getAuditLogs: async (params = {}) => {
    const res = await apiClient.get(API_ENDPOINTS.PLATFORM.AUDIT_LOGS, { params });
    return res.data;
  },

  /**
   * 8. Quản trị Người dùng Toàn Nền tảng (GAP-SA-05)
   */
  getPlatformUsers: async (params = {}) => {
    const res = await apiClient.get(API_ENDPOINTS.USERS.LIST, { params });
    return res.data;
  },

  createPlatformUser: async (payload) => {
    const res = await apiClient.post(API_ENDPOINTS.USERS.LIST, payload);
    return res.data;
  },

  updatePlatformUserStatus: async (userId, payload) => {
    const res = await apiClient.put(API_ENDPOINTS.USERS.STATUS(userId), payload);
    return res.data;
  },

  resetPlatformUserPassword: async (userId, payload = {}) => {
    const res = await apiClient.post(API_ENDPOINTS.USERS.RESET_PASSWORD(userId), payload);
    return res.data;
  },

  /**
   * 9. Phát thông báo hệ thống diện rộng toàn nền tảng (GAP-SA-08)
   */
  broadcastNotification: async (payload) => {
    const res = await apiClient.post(API_ENDPOINTS.PLATFORM.BROADCAST_NOTIFICATION, payload);
    return res.data;
  },
};

export default platformService;

