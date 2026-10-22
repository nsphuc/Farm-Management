import { showToast as defaultShowToast, toast } from '@/store/useToastStore';

/**
 * Chuẩn hóa xử lý lỗi form từ Backend Spring Boot (ApiErrorResponse)
 * Tuân thủ Yêu cầu 2 Chặng Chuẩn hóa (Button & Action Standardization Gate):
 * 1. Khi Backend trả về lỗi HTTP 400 có object fieldErrors, tự động duyệt qua từng key
 *    và gán lỗi inline tương ứng.
 * 2. Hiển thị Toast thông báo lỗi tổng quát `error.response?.data?.message`.
 * 
 * @param {Error|object} error Lỗi nhận được từ try/catch khi gọi axios/apiClient
 * @param {Function} setError Hàm gán lỗi (Hỗ trợ cả React Hook Form `setError(field, { type, message })` lẫn `useState` setter `setErrors`)
 * @param {Function} showToastFn Hàm hiển thị toast tùy chọn (mặc định sử dụng useToastStore)
 * @returns {string} Nội dung lỗi chính
 */
export function applyServerFieldErrors(error, setError, showToastFn = null) {
  const data = error?.response?.data;
  const message =
    data?.message ||
    error?.message ||
    'Dữ liệu nhập không hợp lệ hoặc đã xảy ra lỗi từ hệ thống!';

  // 1. Hiển thị Toast cảnh báo lỗi
  const triggerToast = showToastFn || defaultShowToast;
  if (typeof triggerToast === 'function') {
    triggerToast(message, 'error');
  }

  // 2. Trích xuất object fieldErrors từ Backend
  const fieldErrors = data?.fieldErrors || data?.errors || {};

  if (setError && typeof setError === 'function' && Object.keys(fieldErrors).length > 0) {
    // Trường hợp A: React Hook Form signature có dạng (name, errorObject)
    // Trường hợp B: React useState dispatcher có dạng (updaterFunction | stateObject)
    let isHookForm = false;
    try {
      // Test React Hook Form call style
      const firstKey = Object.keys(fieldErrors)[0];
      const firstMsg =
        typeof fieldErrors[firstKey] === 'string'
          ? fieldErrors[firstKey]
          : fieldErrors[firstKey]?.message || String(fieldErrors[firstKey]);

      setError(firstKey, { type: 'server', message: firstMsg });
      isHookForm = true;
    } catch {
      isHookForm = false;
    }

    if (isHookForm) {
      // Gán toàn bộ các field còn lại theo chuẩn React Hook Form
      Object.entries(fieldErrors).forEach(([field, msg]) => {
        const errMsg = typeof msg === 'string' ? msg : msg?.message || String(msg);
        setError(field, { type: 'server', message: errMsg });
      });
    } else {
      // Fallback: React useState setter -> cập nhật state errors object
      try {
        setError((prev) => {
          if (typeof prev === 'object' && prev !== null) {
            return { ...prev, ...fieldErrors };
          }
          return fieldErrors;
        });
      } catch {
        setError(fieldErrors);
      }
    }
  }

  return message;
}

export default {
  applyServerFieldErrors,
};
