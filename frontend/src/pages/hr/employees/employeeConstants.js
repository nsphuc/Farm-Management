/**
 * Constants & Mapping cho Module Quản lý Nhân sự (Nghiệp vụ 4.1).
 * Tuân thủ nghiêm ngặt ma trận ràng buộc giữa Phòng ban và Vị trí công tác.
 */

export const DEPARTMENT_LABELS = {
  AGRICULTURE: 'Phòng Kỹ thuật & Canh tác',
  HARVESTING: 'Tổ Thu hoạch',
  INVENTORY: 'Bộ phận Kho & Vật tư',
  HR_ADMIN: 'Phòng Hành chính - Nhân sự',
  ACCOUNTING: 'Phòng Kế toán - Tài chính',
};

export const POSITION_LABELS = {
  TECHNICAL_STAFF: 'Kỹ sư / Kỹ thuật viên',
  WORKER: 'Công nhân nông vụ',
  WAREHOUSE_KEEPER: 'Thủ kho',
  HR: 'Chuyên viên Nhân sự',
  ACCOUNTANT: 'Kế toán viên',
};

export const DEPARTMENT_POSITIONS = {
  AGRICULTURE: ['TECHNICAL_STAFF', 'WORKER'],
  HARVESTING: ['WORKER'],
  INVENTORY: ['WAREHOUSE_KEEPER', 'WORKER'],
  HR_ADMIN: ['HR'],
  ACCOUNTING: ['ACCOUNTANT'],
};
