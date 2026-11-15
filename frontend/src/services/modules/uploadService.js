import { apiClient } from '../api/apiClient';
import { API_ENDPOINTS } from '../api/endpoints';

export const uploadService = {
  /**
   * Tải ảnh lên máy chủ (hoặc Cloudinary)
   * @param {File} file - File ảnh từ máy tính
   * @returns {Promise<{ url: string }>}
   */
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    // Lưu ý: Không cấu hình thủ công 'Content-Type': 'multipart/form-data'
    // để Axios / trình duyệt tự động sinh kèm boundary hợp lệ:
    const res = await apiClient.post(API_ENDPOINTS.UPLOADS.IMAGE, formData);
    return res.data;
  },
};

export default uploadService;

