import axiosClient from './axiosClient';

/**
 * Service API giao tiếp trực tiếp với Backend Spring Boot cho phân hệ Quản lý Đối tác (Partner).
 * Base URL: /partners (qua /api/v1/partners)
 * Thuộc Nhóm 1 - Quản lý tổ chức & trang trại (1.6 Quản lý đối tác).
 */
export const partnerApi = {
  /**
   * Lấy danh sách đối tác có phân trang (Nhà cung cấp, Khách hàng, Logistics, Đại lý).
   * @param {Object} params { partnerType, status, page, size, sort }
   */
  getPartners: (params = {}) => {
    return axiosClient.get('/partners', { params });
  },

  /**
   * Lấy toàn bộ danh sách đối tác của Tenant (dành cho dropdown/select).
   * @param {string} [partnerType] SUPPLIER, BUYER, LOGISTICS, AGENT
   */
  getAllPartners: (partnerType) => {
    const params = partnerType ? { partnerType } : {};
    return axiosClient.get('/partners/all', { params });
  },

  /**
   * Xem chi tiết thông tin đối tác theo ID.
   * @param {number|string} id Partner ID
   */
  getPartnerById: (id) => {
    return axiosClient.get(`/partners/${id}`);
  },

  /**
   * Tạo mới đối tác (Yêu cầu vai trò Quản lý / Chủ trang trại).
   * @param {Object} data { code, name, partnerType, contactName, phone, email, address, taxCode, notes }
   */
  createPartner: (data) => {
    return axiosClient.post('/partners', data);
  },

  /**
   * Cập nhật thông tin đối tác (Yêu cầu vai trò Quản lý).
   * @param {number|string} id Partner ID
   * @param {Object} data { name, contactName, phone, email, address, taxCode, notes }
   */
  updatePartner: (id, data) => {
    return axiosClient.put(`/partners/${id}`, data);
  },

  /**
   * Vô hiệu hóa đối tác (Soft-delete: status=INACTIVE).
   * @param {number|string} id Partner ID
   */
  deletePartner: (id) => {
    return axiosClient.delete(`/partners/${id}`);
  },

  /**
   * Ngừng hợp tác với đối tác theo chuẩn REST action.
   * @param {number|string} id Partner ID
   */
  deactivatePartner: (id) => {
    return axiosClient.post(`/partners/${id}/deactivate`);
  },
};

export default partnerApi;
