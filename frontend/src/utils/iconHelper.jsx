import React from 'react';
import { cn } from './formatters';

/**
 * Universal Icon Renderer Helper (Tiêu chuẩn UI/UX Chặng 4.2)
 * Xử lý đa định dạng prop icon trên toàn bộ hệ thống giao diện:
 * 1. Falsy (!iconProp) -> Trả về null.
 * 2. React Element (React.isValidElement): người dùng truyền JSX Element như `<Plus />` hoặc `<RefreshCw className="h-4 w-4" />`.
 *    Giữ nguyên element, hợp nhất className bằng React.cloneElement, TUYỆT ĐỐI không bọc thêm thẻ JSX.
 * 3. Component function / ForwardRef object: các component từ thư viện như `lucide-react` truyền dưới dạng type `icon={Plus}`.
 *    Khởi tạo an toàn: `<IconComponent className={defaultClass} />`.
 * 4. Text/String: text icon / emoji.
 */
export function renderIcon(iconProp, defaultClass = 'w-4 h-4') {
  if (!iconProp) return null;

  // Trường hợp 1: Đã là JSX Element được khởi tạo trước
  if (React.isValidElement(iconProp)) {
    return React.cloneElement(iconProp, {
      className: cn(defaultClass, iconProp.props?.className),
    });
  }

  // Trường hợp 2: Component type (Function, Class, hoặc ForwardRef Object từ Lucide)
  if (
    typeof iconProp === 'function' ||
    (typeof iconProp === 'object' && (iconProp.$$typeof || iconProp.render))
  ) {
    const IconComponent = iconProp;
    return <IconComponent className={defaultClass} />;
  }

  // Trường hợp 3: Chuỗi văn bản / Ký hiệu emoji
  if (typeof iconProp === 'string' || typeof iconProp === 'number') {
    return <span className={cn('inline-flex items-center justify-center shrink-0', defaultClass)}>{iconProp}</span>;
  }

  return null;
}

export default renderIcon;
