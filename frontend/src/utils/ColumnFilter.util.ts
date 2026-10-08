import { useMemo } from 'react';
import { useAuthStore, normalizeRole } from '../stores/useAuthStore';
import type { UserRole } from '../types/rbac.types';

/**
 * Danh sách từ khóa nhận diện các trường / cột tài chính nhạy cảm.
 * Áp dụng triệt để nguyên tắc Data Privacy cho FIELD_STAFF và TECHNICAL_STAFF.
 */
export const FINANCIAL_KEYWORDS = [
  'price',
  'unit_price',
  'unitprice',
  'cost',
  'total_cost',
  'totalcost',
  'amount',
  'total_amount',
  'totalamount',
  'revenue',
  'profit',
  'salary',
  'wage',
  'budget',
  'expense',
  'debt',
  'fee',
  'discount',
  'balance',
  'đơn giá',
  'thành tiền',
  'doanh thu',
  'chi phí',
  'lương',
  'giá thành',
  'ngân sách',
  'công nợ',
  'giá bán',
  'giá nhập',
  'số tiền',
  'tiền',
];

/**
 * Kiểm tra xem một vai trò có bị giới hạn dữ liệu tài chính hay không.
 * Chỉ có FIELD_STAFF và TECHNICAL_STAFF bị cấm truy cập thông tin tiền bạc.
 */
export const isRestrictedFinancialRole = (role?: string | null): boolean => {
  const norm = normalizeRole(role);
  return norm === 'FIELD_STAFF' || norm === 'TECHNICAL_STAFF';
};

/**
 * Kiểm tra một Column Definition (TanStack Table, AntD, hoặc Custom Table)
 * có chứa thông tin tài chính nhạy cảm hay không.
 */
export const isFinancialColumn = (column: any): boolean => {
  if (!column) return false;

  // 1. Kiểm tra explicit flag nếu được lập trình viên chỉ định
  if (
    column.isFinancial === true ||
    column.isSensitive === true ||
    column.category === 'FINANCIAL' ||
    column.category === 'FINANCE'
  ) {
    return true;
  }

  // 2. Thu thập các chuỗi định danh của cột
  const identifiers: string[] = [];

  if (typeof column.id === 'string') identifiers.push(column.id);
  if (typeof column.accessorKey === 'string') identifiers.push(column.accessorKey);
  if (typeof column.key === 'string') identifiers.push(column.key);
  if (typeof column.dataIndex === 'string') identifiers.push(column.dataIndex);

  if (typeof column.header === 'string') identifiers.push(column.header);
  if (typeof column.title === 'string') identifiers.push(column.title);
  if (typeof column.label === 'string') identifiers.push(column.label);

  const combinedStr = identifiers.join(' ').toLowerCase();

  return FINANCIAL_KEYWORDS.some((kw) => {
    // Tìm kiếm chuỗi con hoặc từ nguyên vẹn
    return combinedStr.includes(kw.toLowerCase());
  });
};

/**
 * Hàm lọc mảng cột theo vai trò (Pure Function).
 * Dễ dàng tích hợp vào bất kỳ component Table hoặc unit test nào.
 *
 * @param columns Mảng các cột của bảng
 * @param role Role hiện tại của người dùng
 * @returns Mảng cột đã được làm sạch bảo mật
 */
export function filterColumnsByRole<T extends Record<string, any>>(
  columns: T[],
  role?: string | null
): T[] {
  if (!Array.isArray(columns)) return [];

  // Nếu là vai trò bị hạn chế tài chính, loại bỏ triệt để các cột tài chính
  if (isRestrictedFinancialRole(role)) {
    return columns.filter((col) => !isFinancialColumn(col));
  }

  return columns;
}

/**
 * Custom React Hook tự động lấy currentUser.role từ Zustand store
 * và memoize danh sách cột an toàn cho giao diện bảng.
 *
 * @example
 * const columns = useMemo(() => [...], []);
 * const safeColumns = useFilteredColumns(columns);
 */
export function useFilteredColumns<T extends Record<string, any>>(columns: T[]): T[] {
  const currentUserRole = useAuthStore(
    (state) => state.currentUser?.role || state.user?.role
  );

  return useMemo(() => {
    return filterColumnsByRole(columns, currentUserRole);
  }, [columns, currentUserRole]);
}

/**
 * Tiện ích che giấu giá trị tiền bạc (Data Masking) khi hiển thị trực tiếp trong Card/Text
 * @param value Giá trị tiền cần format
 * @param role Role người dùng (nếu không truyền sẽ dùng role từ Zustand)
 * @param fallback Chuỗi hiển thị thay thế (mặc định '***')
 */
export function maskFinancialValue(
  value: any,
  role?: string | null,
  fallback: string = '***'
): string {
  const effectiveRole =
    role !== undefined
      ? role
      : (useAuthStore.getState().currentUser?.role || useAuthStore.getState().user?.role);

  if (isRestrictedFinancialRole(effectiveRole)) {
    return fallback;
  }

  if (value === null || value === undefined) return '';
  return typeof value === 'number' ? value.toLocaleString('vi-VN') : String(value);
}
