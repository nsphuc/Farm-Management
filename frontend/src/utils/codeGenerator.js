import { useActiveFarmStore } from '@/store/useActiveFarmStore';

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
 * Lấy mã định danh tự động tăng dần theo thứ tự: [TIỀN_TỐ]-[XXX] (hoặc [TIỀN_TỐ]-[XXXX] nếu >= 1000)
 * Ví dụ: FRM-001, FRM-002, ZON-001, WHS-001, SKU-001, EMP-001, SSN-001, GRP-001, BAT-001, SO-001, DO-001, EXP-001, PAY-001...
 * @param {string} prefix Tiền tố thực thể (vd: 'FRM', 'EMP', 'SO')
 * @param {Array|number|null} existingListOrCount Danh sách các bản ghi hiện có hoặc số lượng hiện có
 * @returns {string} Mã định danh chuẩn tăng dần
 */
export function getNextSequentialCode(prefix, existingListOrCount = null) {
  if (!prefix) return '';
  const cleanPrefix = prefix.replace(/-+$/, '').toUpperCase();

  // 1. Tự động liên kết danh sách từ store nếu prefix là FRM mà caller không truyền list
  if (existingListOrCount === null || existingListOrCount === undefined) {
    if (cleanPrefix === 'FRM') {
      try {
        const storeFarms = useActiveFarmStore.getState()?.farms;
        if (Array.isArray(storeFarms)) {
          existingListOrCount = storeFarms;
        }
      } catch {
        // ignore
      }
    }
  }

  let maxNum = 0;

  // 2. Quét tìm số thứ tự lớn nhất trong danh sách hiện có (Single Source of Truth)
  if (Array.isArray(existingListOrCount)) {
    existingListOrCount.forEach((item) => {
      const codeStr = (
        typeof item === 'string'
          ? item
          : (item?.code ||
             item?.shiftCode ||
             item?.skuCode ||
             item?.sku ||
             item?.orderCode ||
             item?.deliveryCode ||
             item?.expenseCode ||
             item?.receiptCode ||
             item?.issueCode ||
             item?.paymentCode ||
             item?.groupCode ||
             item?.seasonCode ||
             item?.varietyCode ||
             item?.employeeCode ||
             item?.batchCode ||
             item?.codeNumber || '')
      ) + '';

      if (codeStr.toUpperCase().startsWith(cleanPrefix)) {
        const match = codeStr.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    });

    if (maxNum === 0 && existingListOrCount.length > 0) {
      maxNum = existingListOrCount.length;
    }

    // TUYỆT ĐỐI không ghi đè vào localStorage khi chỉ mới render preview.
    // Nếu danh sách là mảng rỗng (0 items) -> maxNum = 0 -> nextSeq = 1 (FRM-001)
    const nextSeq = maxNum + 1;
    const padDigits = nextSeq >= 1000 ? 4 : 3;
    return `${cleanPrefix}-${String(nextSeq).padStart(padDigits, '0')}`;
  } else if (typeof existingListOrCount === 'number' && existingListOrCount >= 0) {
    maxNum = existingListOrCount;
    const nextSeq = maxNum + 1;
    const padDigits = nextSeq >= 1000 ? 4 : 3;
    return `${cleanPrefix}-${String(nextSeq).padStart(padDigits, '0')}`;
  }

  // 3. Nếu không có danh sách nào được truyền hoặc tìm thấy:
  // Đọc số thứ tự từ localStorage (nếu có), TUYỆT ĐỐI KHÔNG TỰ ĐỘNG TĂNG SỐ VÀ LƯU VÀO LOCALSTORAGE
  const storageKey = `seq_${cleanPrefix}`;
  try {
    const storedSeq = parseInt(localStorage.getItem(storageKey) || '0', 10);
    if (!isNaN(storedSeq) && storedSeq > maxNum) {
      maxNum = storedSeq;
    }
  } catch (e) {
    // ignore
  }

  const nextSeq = maxNum + 1;
  const padDigits = nextSeq >= 1000 ? 4 : 3;
  return `${cleanPrefix}-${String(nextSeq).padStart(padDigits, '0')}`;
}

/**
 * Đặt lại bộ đếm chuỗi mã trong localStorage (dùng khi xóa database hoặc reset)
 */
export function resetSequentialCodes() {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((k) => {
      if (k.startsWith('seq_')) {
        localStorage.removeItem(k);
      }
    });
  } catch (e) {
    // ignore
  }
}

// Tự động dọn dẹp các key seq_ cũ tồn đọng trong localStorage khi nạp module
if (typeof window !== 'undefined') {
  try {
    resetSequentialCodes();
  } catch {
    // ignore
  }
}

/**
 * Cập nhật số thứ tự mã sau khi một bản ghi ĐÃ ĐƯỢC TẠO THÀNH CÔNG trên server
 */
export function commitSequentialCode(prefix, codeOrNum) {
  if (!prefix) return;
  const cleanPrefix = prefix.replace(/-+$/, '').toUpperCase();
  let num = 0;
  if (typeof codeOrNum === 'number') {
    num = codeOrNum;
  } else if (typeof codeOrNum === 'string') {
    const match = codeOrNum.match(/(\d+)$/);
    if (match) num = parseInt(match[1], 10);
  }
  if (num > 0) {
    try {
      localStorage.setItem(`seq_${cleanPrefix}`, String(num));
    } catch {
      // ignore
    }
  }
}

/**
 * Hàm sinh mã tổng quát theo định dạng chuẩn: [TIỀN_TỐ]-[XXX] (Tăng dần theo thứ tự)
 * Hỗ trợ truyền mảng danh sách hiện có ở đối số 2 để tính toán thuần túy (idempotent)
 * @param {string} prefix Tiền tố thực thể (vd: 'FRM', 'EMP', 'RC', hoặc 'FRM-')
 * @param {Array|number|string|null} seqOrList Mảng danh sách hiện có hoặc số thứ tự cụ thể
 * @param {Array|null} existingList Mảng danh sách hiện có (nếu đối số 2 là số)
 * @returns {string} Mã định danh chuẩn tăng dần
 */
export function generateEntityCode(prefix, seqOrList = null, existingList = null) {
  if (!prefix) return '';
  const cleanPrefix = prefix.replace(/-+$/, '').toUpperCase();

  // Nếu đối số 2 là mảng danh sách
  if (Array.isArray(seqOrList)) {
    return getNextSequentialCode(cleanPrefix, seqOrList);
  }

  if (seqOrList !== null && seqOrList !== undefined && !isNaN(Number(seqOrList))) {
    const num = Number(seqOrList);
    const padDigits = num >= 1000 ? 4 : 3;
    return `${cleanPrefix}-${String(num).padStart(padDigits, '0')}`;
  }

  return getNextSequentialCode(cleanPrefix, existingList);
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

/**
 * Lấy chuỗi định dạng YYMMDD từ ngày chỉ định (hoặc hôm nay)
 * Ví dụ: 09/11/2026 -> "261109"
 */
export function getYearMonthDayCode(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return getYearMonthDayCode(new Date());
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

/**
 * Sinh mã số lô (Batch/Lot number) tự động và tuần tự:
 * Định dạng chuẩn: LOT-YYMMDD-01, LOT-YYMMDD-02, LOT-YYMMDD-03...
 * Tự động quét số lớn nhất từ các nguồn:
 * 1. Các lô từ server/DB (existingBatches)
 * 2. Các dòng hiện có trong form hiện tại (currentItems)
 * 3. Bộ nhớ tạm tuần tự localStorage (seq_lot_YYMMDD)
 * 
 * @param {Date|string} date Ngày nhập/tạo lô (mặc định hôm nay)
 * @param {Array} existingBatches Danh sách các lô hiện có từ DB/server
 * @param {Array} currentItems Danh sách các dòng vật tư hiện tại trong form
 * @returns {string} Mã số lô tuần tự tiếp theo (vd: LOT-261109-01)
 */
export function generateLotCode(date = new Date(), existingBatches = [], currentItems = []) {
  const dateStr = getYearMonthDayCode(date);
  const prefix = `LOT-${dateStr}-`;

  let maxSeq = 0;

  // 1. Quét tìm số thứ tự lớn nhất trong danh sách các lô từ server/DB
  if (Array.isArray(existingBatches)) {
    existingBatches.forEach((batch) => {
      const bStr = (
        typeof batch === 'string'
          ? batch
          : (batch?.batchNumber || batch?.code || batch?.batchCode || '')
      ) + '';
      if (bStr.toUpperCase().startsWith(prefix)) {
        const numPart = bStr.substring(prefix.length);
        const match = numPart.match(/^(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        }
      }
    });
  }

  // 2. Quét tìm số thứ tự trong các dòng hiện tại của form
  if (Array.isArray(currentItems)) {
    currentItems.forEach((it) => {
      const bStr = (it?.batchNumber || '') + '';
      if (bStr.toUpperCase().startsWith(prefix)) {
        const numPart = bStr.substring(prefix.length);
        const match = numPart.match(/^(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        }
      }
    });
  }

  // 3. Đọc từ bộ nhớ tạm localStorage (nếu có lưu vết từ các lần tạo trước đó trong ngày)
  const storageKey = `seq_lot_${dateStr}`;
  try {
    const storedSeq = parseInt(localStorage.getItem(storageKey) || '0', 10);
    if (!isNaN(storedSeq) && storedSeq > maxSeq) {
      maxSeq = storedSeq;
    }
  } catch (e) {
    // ignore
  }

  const nextSeq = maxSeq + 1;
  const padDigits = Math.max(2, String(nextSeq).length);
  return `${prefix}${String(nextSeq).padStart(padDigits, '0')}`;
}

/**
 * Cập nhật số thứ tự số lô sau khi lưu thành công phiếu nhập kho
 */
export function commitLotCode(batchNumber) {
  if (!batchNumber || typeof batchNumber !== 'string') return;
  const match = batchNumber.toUpperCase().match(/^LOT-(\d{6})-(\d+)$/);
  if (match) {
    const dateStr = match[1];
    const num = parseInt(match[2], 10);
    if (!isNaN(num) && num > 0) {
      const storageKey = `seq_lot_${dateStr}`;
      try {
        const storedSeq = parseInt(localStorage.getItem(storageKey) || '0', 10);
        if (num > storedSeq) {
          localStorage.setItem(storageKey, String(num));
        }
      } catch (e) {
        // ignore
      }
    }
  }
}

export default {
  CODE_PREFIXES,
  TRANSACTION_PREFIXES,
  MASTER_DATA_PREFIXES,
  getYearMonthCode,
  getYearMonthDayCode,
  getNextSequentialCode,
  resetSequentialCodes,
  generateEntityCode,
  generateLotCode,
  commitLotCode,
  isTransactionPrefix,
  isMasterDataPrefix,
};
