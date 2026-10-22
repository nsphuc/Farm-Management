import React from 'react';
import {
  CheckCircle2,
  PlayCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Clock,
  Truck,
  Printer,
  Sprout,
  AlertOctagon,
  MinusCircle,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/utils/formatters';
import { renderIcon } from '@/utils/iconHelper';

/**
 * Standard Status Configuration mapping SQL Enums to 5 Semantic Color Families
 * Tuân thủ Bảng ánh xạ Mục 1 File 10-ui-ux-design-guidelines.md
 */
const STATUS_REGISTRY = {
  // === 1. SUCCESS (Emerald) ===
  ACTIVE: { label: 'Đang hoạt động', group: 'SUCCESS', icon: CheckCircle2 },
  COMPLETED: { label: 'Hoàn tất', group: 'SUCCESS', icon: CheckCircle2 },
  PASSED: { label: 'Đạt chuẩn KCS', group: 'SUCCESS', icon: CheckCircle2 },
  VALID: { label: 'Hợp lệ', group: 'SUCCESS', icon: CheckCircle2 },
  SETTLED: { label: 'Đã tất toán', group: 'SUCCESS', icon: CheckCircle2 },
  PAID: { label: 'Đã thanh toán', group: 'SUCCESS', icon: CheckCircle2 },
  DONE: { label: 'Đã hoàn thành', group: 'SUCCESS', icon: CheckCircle2 },
  DELIVERED: { label: 'Đã giao hàng', group: 'SUCCESS', icon: CheckCircle2 },

  // === 2. PRIMARY (Blue) ===
  SELLING: { label: 'Đang xuất bán', group: 'PRIMARY', icon: PlayCircle },
  PRINTED: { label: 'Đã in tem QR', group: 'PRIMARY', icon: Printer },
  READY_TO_PRINT: { label: 'Sẵn sàng in tem', group: 'PRIMARY', icon: Printer },
  IN_TRANSIT: { label: 'Đang vận chuyển', group: 'PRIMARY', icon: Truck },
  DISPATCHED: { label: 'Đã xuất kho giao', group: 'PRIMARY', icon: Truck },
  IN_PROGRESS: { label: 'Đang thực hiện', group: 'PRIMARY', icon: PlayCircle },
  GROWING: { label: 'Đang sinh trưởng', group: 'PRIMARY', icon: Sprout },
  SOWING: { label: 'Đang gieo trồng', group: 'PRIMARY', icon: Sprout },
  CONFIRMED: { label: 'Đã xác nhận', group: 'PRIMARY', icon: CheckCircle2 },

  // === 3. WARNING (Amber) ===
  PENDING_APPROVAL: { label: 'Chờ duyệt KCS', group: 'WARNING', icon: Clock },
  QUARANTINED: { label: 'Đang cách ly', group: 'WARNING', icon: AlertTriangle },
  OVERDUE: { label: 'Quá hạn', group: 'WARNING', icon: AlertTriangle },
  OUT_OF_RANGE: { label: 'Ngoài phạm vi GPS', group: 'WARNING', icon: AlertTriangle },
  LATE: { label: 'Đi muộn', group: 'WARNING', icon: Clock },
  EARLY_DEPARTURE: { label: 'Về sớm', group: 'WARNING', icon: Clock },
  FALLOW: { label: 'Đang nghỉ vụ', group: 'WARNING', icon: Clock },
  MAINTENANCE: { label: 'Bảo trì', group: 'WARNING', icon: AlertTriangle },
  CONDITIONAL: { label: 'Đạt có điều kiện', group: 'WARNING', icon: AlertTriangle },
  PARTIALLY_PAID: { label: 'Thanh toán 1 phần', group: 'WARNING', icon: Clock },
  PARTIAL: { label: 'Giao một phần', group: 'WARNING', icon: Truck },
  PENDING_REVIEW: { label: 'Chờ nghiệm thu', group: 'WARNING', icon: Clock },

  // === 4. DANGER (Rose) ===
  RECALLED: { label: 'Thu hồi khẩn cấp', group: 'DANGER', icon: AlertOctagon },
  REJECTED: { label: 'Từ chối / KCS hỏng', group: 'DANGER', icon: XCircle },
  CANCELLED: { label: 'Đã hủy', group: 'DANGER', icon: XCircle },
  BAD_DEBT: { label: 'Nợ xấu khó đòi', group: 'DANGER', icon: AlertOctagon },
  TERMINATED: { label: 'Đã chấm dứt HĐ', group: 'DANGER', icon: XCircle },
  LOCKED: { label: 'Đã khóa', group: 'DANGER', icon: ShieldAlert },
  BLACKLISTED: { label: 'Sổ đen', group: 'DANGER', icon: ShieldAlert },
  ABSENT: { label: 'Vắng mặt', group: 'DANGER', icon: XCircle },
  CULLED: { label: 'Đã loại thải', group: 'DANGER', icon: XCircle },

  // === 5. NEUTRAL (Slate) ===
  DRAFT: { label: 'Bản nháp', group: 'NEUTRAL', icon: FileText },
  PENDING: { label: 'Chờ xử lý', group: 'NEUTRAL', icon: Clock },
  PLANNING: { label: 'Lập kế hoạch', group: 'NEUTRAL', icon: FileText },
  TODO: { label: 'Cần làm', group: 'NEUTRAL', icon: Clock },
  CLOSED: { label: 'Đã đóng vụ', group: 'NEUTRAL', icon: MinusCircle },
  RESIGNED: { label: 'Đã thôi việc', group: 'NEUTRAL', icon: MinusCircle },
  INACTIVE: { label: 'Tạm ngưng', group: 'NEUTRAL', icon: MinusCircle },
  EMPTY: { label: 'Đang trống', group: 'NEUTRAL', icon: MinusCircle },
  OCCUPIED: { label: 'Đang sử dụng', group: 'NEUTRAL', icon: PlayCircle },
  SOIL_PREPARATION: { label: 'Làm đất', group: 'NEUTRAL', icon: FileText },
  UNPAID: { label: 'Chưa thanh toán', group: 'NEUTRAL', icon: Clock },
  ON_LEAVE: { label: 'Đang nghỉ phép', group: 'NEUTRAL', icon: Clock },
};

const COLOR_CLASSES = {
  SUCCESS: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-600/20',
  PRIMARY: 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-600/20',
  WARNING: 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-600/20',
  DANGER: 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-600/20',
  NEUTRAL: 'bg-slate-50 text-slate-700 border-slate-200 ring-1 ring-slate-600/20',
};

/**
 * StatusBadge Component
 * @param {string} status - Giá trị trạng thái SQL (VD: 'COMPLETED', 'ACTIVE', 'RECALLED')
 * @param {string} label - Ghi đè nhãn tiếng Việt (tùy chọn)
 * @param {string} className - Tùy biến class thêm
 * @param {boolean} showIcon - Hiển thị icon (mặc định true)
 * @param {string} size - 'sm' | 'md'
 * @param {any} icon - Icon tuỳ chọn (hỗ trợ JSX element hoặc Component type)
 */
export function StatusBadge({ status, label, className, showIcon = true, size = 'md', icon }) {
  if (!status) return <span className="text-slate-400">—</span>;

  const normalizedKey = String(status).toUpperCase();
  const config = STATUS_REGISTRY[normalizedKey] || {
    label: status,
    group: 'NEUTRAL',
    icon: FileText,
  };

  const targetIcon = icon || config.icon;
  const colorStyle = COLOR_CLASSES[config.group] || COLOR_CLASSES.NEUTRAL;
  const displayLabel = label || config.label;

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs gap-1'
      : 'px-2.5 py-1 text-xs gap-1.5 font-medium';

  const iconSizes = size === 'sm' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border shadow-xs transition-colors',
        sizeClasses,
        colorStyle,
        className
      )}
    >
      {showIcon && renderIcon(targetIcon, iconSizes)}
      <span className="truncate">{displayLabel}</span>
    </span>
  );
}

export default StatusBadge;
