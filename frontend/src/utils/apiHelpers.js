import { applyServerFieldErrors } from './errorHandler';

export { applyServerFieldErrors };

/**
 * API Error parser for Spring Boot ApiErrorResponse
 * Maps fieldErrors to an object { [field]: errorMessage }
 */
export function extractApiErrors(error) {
  if (!error) return { fieldErrors: {}, message: '' };

  const data = error.response?.data;
  const fieldErrors = data?.fieldErrors || {};
  const message = data?.message || error.message || 'Đã có lỗi xảy ra. Vui lòng thử lại!';

  return { fieldErrors, message, raw: data };
}

/**
 * Standard Napas 24/7 bank list in Vietnam
 */
export const VIETNAM_BANKS = [
  { bin: '970422', code: 'MB', name: 'MBBank - Ngân hàng Quân Đội' },
  { bin: '970436', code: 'VCB', name: 'Vietcombank - Ngân hàng Ngoại thương Việt Nam' },
  { bin: '970415', code: 'CTG', name: 'VietinBank - Ngân hàng Công thương Việt Nam' },
  { bin: '970418', code: 'BIDV', name: 'BIDV - Ngân hàng Đầu tư và Phát triển Việt Nam' },
  { bin: '970405', code: 'AGRIBANK', name: 'Agribank - Ngân hàng Nông nghiệp & PTNT' },
  { bin: '970407', code: 'TCB', name: 'Techcombank - Ngân hàng Kỹ thương Việt Nam' },
  { bin: '970423', code: 'TPB', name: 'TPBank - Ngân hàng Tiên Phong' },
  { bin: '970432', code: 'VPB', name: 'VPBank - Ngân hàng Việt Nam Thịnh Vượng' },
  { bin: '970403', code: 'STB', name: 'Sacombank - Ngân hàng Sài Gòn Thương Tín' },
  { bin: '970448', code: 'OCB', name: 'OCB - Ngân hàng Phương Đông' },
  { bin: '970428', code: 'NAB', name: 'NamABank - Ngân hàng Nam Á' },
  { bin: '970416', code: 'ACB', name: 'ACB - Ngân hàng Á Châu' },
  { bin: '970454', code: 'VIB', name: 'VIB - Ngân hàng Quốc tế' },
  { bin: '970437', code: 'HDB', name: 'HDBank - Ngân hàng Phát triển TP.HCM' },
  { bin: '970429', code: 'SCB', name: 'SCB - Ngân hàng Sài Gòn' },
  { bin: '970441', code: 'VAB', name: 'VietABank - Ngân hàng Việt Á' },
  { bin: '970443', code: 'SHB', name: 'SHB - Ngân hàng Sài Gòn - Hà Nội' },
  { bin: '970431', code: 'EIB', name: 'Eximbank - Ngân hàng Xuất Nhập Khẩu' },
  { bin: '970426', code: 'MSB', name: 'MSB - Ngân hàng Hàng Hải' },
  { bin: '970452', code: 'LPB', name: 'LPBank - Ngân hàng Lộc Phát' },
];
