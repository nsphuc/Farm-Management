/**
 * Bộ Sinh Mã Tự Động Định Danh Nghiệp Vụ Chuẩn Agri-ERP (codeGenerator.js)
 * Tuân thủ 100% Mục 1 File 03-master-validation-constraints.md
 * Định dạng chuẩn: [TIỀN_TỐ]-[YYMM]-[XXXX]
 * 
 * 24 Tiền tố nghiệp vụ:
 * 1. PRT- : Đối tác Nhà cung cấp / Khách hàng (partners #4)
 * 2. FRM- : Trang trại cơ sở thực địa (farms #11)
 * 3. ZON- : Phân khu sản xuất (production_zones #13)
 * 4. LOC- : Vị trí / Luống / Ô chuồng (zone_locations #14)
 * 5. VAR- : Giống cây trồng / vật nuôi (crop_types #18)
 * 6. SSN- : Mùa vụ canh tác (crop_seasons #19)
 * 7. GRP- : Đàn / Lứa nuôi (livestock_groups #22)
 * 8. TAG- : Thẻ tai RFID gia súc (livestock_individuals #23)
 * 9. WHS- : Kho lưu trữ vật tư / nông sản (warehouses #26)
 * 10. MCT- : Nhóm danh mục vật tư (material_categories #27)
 * 11. SKU- : Mã định danh vật tư SKU (materials #28)
 * 12. RC-  : Phiếu nhập kho (warehouse_receipts #32)
 * 13. IS-  : Phiếu xuất kho (warehouse_issues #34)
 * 14. TR-  : Phiếu điều chuyển kho (warehouse_transfers #36)
 * 15. STK- : Biên bản kiểm kê kho (stocktakes #39)
 * 16. HRV- : Biên bản thu hoạch (harvest_records #43)
 * 17. BAT- : Lô thành phẩm đóng gói (product_batches #44)
 * 18. QC-  : Biên bản KCS kiểm định chất lượng (qc_inspections #46)
 * 19. EMP- : Mã hồ sơ nhân sự (employees #51)
 * 20. SHF- : Mã ca làm việc chuẩn (work_shifts #52)
 * 21. SO-  : Đơn đặt hàng bán sỉ (sales_orders #62)
 * 22. DO-  : Đơn giao hàng tách đợt (sales_deliveries)
 * 23. PAY- : Giao dịch thanh toán / VietQR (payment_transactions)
 * 24. EXP- : Khoản mục chi phí thực địa (farm_expenses)
 * 25. CST- : Nhóm chi phí giá thành (cost_categories)
 */

export const CODE_PREFIXES = {
  PARTNER: 'PRT',
  FARM: 'FRM',
  ZONE: 'ZON',
  LOCATION: 'LOC',
  VARIETY: 'VAR',
  CROP_TYPE: 'VAR',
  SEASON: 'SSN',
  LIVESTOCK_GROUP: 'GRP',
  RFID_TAG: 'TAG',
  WAREHOUSE: 'WHS',
  MATERIAL_CATEGORY: 'MCT',
  MATERIAL: 'SKU',
  RECEIPT: 'RC',
  ISSUE: 'IS',
  TRANSFER: 'TR',
  STOCKTAKE: 'STK',
  HARVEST: 'HRV',
  BATCH: 'BAT',
  QC: 'QC',
  EMPLOYEE: 'EMP',
  SHIFT: 'SHF',
  SALES_ORDER: 'SO',
  DELIVERY_ORDER: 'DO',
  PAYMENT: 'PAY',
  EXPENSE: 'EXP',
  COST_CATEGORY: 'CST',
};

// Nhóm 1: Các form Chứng từ & Lô (Transaction / Voucher / Batch) -> Bắt buộc readOnly
export const TRANSACTION_PREFIXES = [
  'RC',
  'IS',
  'TR',
  'STK',
  'HRV',
  'BAT',
  'QC',
  'SO',
  'DO',
  'PAY',
  'EXP',
];

// Nhóm 2: Các form Danh mục / Địa lý / Đối tác / Nhân sự (Master Data) -> Có nút [🔄 Tự sinh]
export const MASTER_DATA_PREFIXES = [
  'PRT',
  'FRM',
  'ZON',
  'LOC',
  'VAR',
  'SSN',
  'GRP',
  'TAG',
  'WHS',
  'MCT',
  'SKU',
  'EMP',
  'SHF',
  'CST',
];

/**
 * Lấy chuỗi YYMM từ ngày hiện tại (hoặc ngày chỉ định)
 * Ví dụ: Tháng 10 năm 2026 -> "2610"
 */
export function getYearMonthCode(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${yy}${mm}`;
}

/**
 * Sinh mã ngẫu nhiên 4 chữ số (1000 -> 9999)
 */
export function generateRandomSeq(digits = 4) {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
}

/**
 * Hàm sinh mã tổng quát theo định dạng chuẩn: [TIỀN_TỐ]-[YYMM]-[XXXX]
 * @param {string} prefix Tiền tố thực thể (vd: 'FRM', 'EMP', 'RC', hoặc 'FRM-')
 * @param {number|string} seq Số thứ tự tùy chọn (nếu không truyền sẽ sinh ngẫu nhiên 4 số)
 * @param {Date} date Ngày áp dụng (mặc định hiện tại)
 * @returns {string} Mã định danh chuẩn SQL
 */
export function generateEntityCode(prefix, seq = null, date = new Date()) {
  if (!prefix) return '';
  const cleanPrefix = prefix.replace(/-+$/, '').toUpperCase();
  const yymm = getYearMonthCode(date);
  const sequenceStr = seq !== null && seq !== undefined
    ? String(seq).padStart(4, '0')
    : generateRandomSeq(4);

  return `${cleanPrefix}-${yymm}-${sequenceStr}`;
}

/**
 * Kiểm tra xem một mã hoặc tiền tố có thuộc loại Chứng từ / Lô giao dịch hay không
 */
export function isTransactionPrefix(prefixOrCode) {
  if (!prefixOrCode) return false;
  const rawPrefix = prefixOrCode.split('-')[0].toUpperCase();
  return TRANSACTION_PREFIXES.includes(rawPrefix);
}

/**
 * Kiểm tra xem một mã hoặc tiền tố có thuộc loại Danh mục Master Data hay không
 */
export function isMasterDataPrefix(prefixOrCode) {
  if (!prefixOrCode) return false;
  const rawPrefix = prefixOrCode.split('-')[0].toUpperCase();
  return MASTER_DATA_PREFIXES.includes(rawPrefix);
}

export default {
  CODE_PREFIXES,
  TRANSACTION_PREFIXES,
  MASTER_DATA_PREFIXES,
  getYearMonthCode,
  generateRandomSeq,
  generateEntityCode,
  isTransactionPrefix,
  isMasterDataPrefix,
};
