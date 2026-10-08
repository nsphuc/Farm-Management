import React from 'react';
import { useAuthStore, normalizeRole } from '../../stores/useAuthStore';
import type { UserRole, StandardAction } from '../../types/rbac.types';

export interface PermissionGuardProps {
  /**
   * Danh sách các vai trò được phép truy cập/thực hiện.
   * Nếu không truyền, sẽ tự động suy diễn từ prop `action`.
   */
  allowedRoles?: (UserRole | string)[];

  /**
   * Hành động chuẩn theo ma trận phân quyền
   */
  action?: StandardAction;

  /**
   * Hành vi xử lý khi không có quyền:
   * - 'hide' (mặc định): Trả về null hoặc fallback component, ẩn hoàn toàn khỏi DOM.
   * - 'disable': Vẫn render component con (Button, Input) nhưng đặt trạng thái disabled kèm tooltip giải thích.
   */
  behavior?: 'hide' | 'disable';

  /**
   * Điều kiện bổ sung (nếu có). Ví dụ: Warehouse Staff chỉ in được khi status === 'READY_TO_PRINT'
   */
  condition?: boolean;

  /**
   * Tooltip hoặc thông báo khi bị disable / không có quyền
   */
  tooltip?: string;

  /**
   * Component thay thế hiển thị khi bị ẩn (tuỳ chọn)
   */
  fallback?: React.ReactNode;

  /**
   * Element hoặc nội dung cần bọc phân quyền
   */
  children: React.ReactNode;
}

/**
 * Ma trận mặc định cho các hành động quan trọng nếu caller không truyền allowedRoles
 */
const DEFAULT_ACTION_ROLES: Record<StandardAction, UserRole[]> = {
  VIEW: ['SUPER_ADMIN', 'FARM_OWNER', 'FIELD_STAFF', 'WAREHOUSE_STAFF', 'TECHNICAL_STAFF', 'ACCOUNTANT'],
  CREATE: ['SUPER_ADMIN', 'FARM_OWNER', 'WAREHOUSE_STAFF', 'TECHNICAL_STAFF', 'ACCOUNTANT'],
  UPDATE: ['SUPER_ADMIN', 'FARM_OWNER', 'FIELD_STAFF', 'WAREHOUSE_STAFF', 'TECHNICAL_STAFF', 'ACCOUNTANT'],
  DELETE: ['SUPER_ADMIN', 'FARM_OWNER'],
  APPROVE: ['FARM_OWNER', 'TECHNICAL_STAFF'],
  REJECT: ['FARM_OWNER'],
  EXPORT: ['SUPER_ADMIN', 'FARM_OWNER', 'ACCOUNTANT', 'TECHNICAL_STAFF'],
  IMPORT: ['SUPER_ADMIN', 'FARM_OWNER'],
  GENERATE_QR: ['FARM_OWNER', 'WAREHOUSE_STAFF'],
  PRINT_LABEL: ['FARM_OWNER', 'WAREHOUSE_STAFF'],
};

/**
 * PermissionGuard Component
 * Dùng để bọc các nút bấm, ô nhập liệu, hoặc vùng giao diện để tự động ẩn/vô hiệu hoá
 * theo đúng đặc tả phân quyền 6 Roles.
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  allowedRoles,
  action,
  behavior = 'hide',
  condition = true,
  tooltip,
  fallback = null,
  children,
}) => {
  const currentUserRole = useAuthStore(
    (state) => state.currentUser?.role || state.user?.role
  );
  const normalizedUserRole = normalizeRole(currentUserRole) as UserRole;

  // 1. Xác định danh sách roles được phép
  let effectiveAllowedRoles: string[] = [];

  if (allowedRoles && allowedRoles.length > 0) {
    effectiveAllowedRoles = allowedRoles.map((r) => normalizeRole(r));
  } else if (action && DEFAULT_ACTION_ROLES[action]) {
    effectiveAllowedRoles = DEFAULT_ACTION_ROLES[action];
  } else {
    // Không khai báo giới hạn -> cho phép
    effectiveAllowedRoles = [];
  }

  // 2. Kiểm tra vai trò
  const isRoleAllowed =
    effectiveAllowedRoles.length === 0 ||
    effectiveAllowedRoles.includes(normalizedUserRole);

  // 3. Kết hợp điều kiện nghiệp vụ
  const hasAccess = isRoleAllowed && condition;

  // Nếu đủ quyền và thỏa mãn điều kiện, render trực tiếp children
  if (hasAccess) {
    return <>{children}</>;
  }

  // 4. Xử lý khi KHÔNG đủ quyền:
  // Chế độ 'hide': Ẩn hoàn toàn khỏi DOM (Bảo đảm an toàn tuyệt đối)
  if (behavior === 'hide') {
    return fallback ? <>{fallback}</> : null;
  }

  // Chế độ 'disable': Vô hiệu hoá element (thường dùng cho nút In tem, Duyệt)
  const defaultTooltipText =
    tooltip ||
    (condition === false
      ? 'Chờ duyệt kiểm định'
      : `Chức năng này không khả dụng cho vai trò của bạn`);

  if (React.isValidElement(children)) {
    const childProps = children.props as Record<string, any>;
    const disabledClasses =
      'opacity-50 cursor-not-allowed pointer-events-none select-none filter grayscale-[40%]';

    const clonedElement = React.cloneElement(children, {
      ...childProps,
      disabled: true,
      'aria-disabled': 'true',
      tabIndex: -1,
      className: `${childProps.className || ''} ${disabledClasses}`.trim(),
    });

    return (
      <span
        className="inline-block cursor-not-allowed"
        title={defaultTooltipText}
        data-tooltip={defaultTooltipText}
      >
        {clonedElement}
      </span>
    );
  }

  return (
    <span
      className="inline-block opacity-50 cursor-not-allowed text-xs text-slate-400 italic"
      title={defaultTooltipText}
    >
      {defaultTooltipText}
    </span>
  );
};

/**
 * Custom hook hỗ trợ kiểm tra quyền programmatically trong event handlers hoặc logic UI
 */
export function usePermission() {
  const currentUser = useAuthStore((state) => state.currentUser || state.user);
  const rawRole = currentUser?.role;
  const role = normalizeRole(rawRole) as UserRole;

  const checkRole = (allowedRoles: (UserRole | string)[]): boolean => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    return allowedRoles.map((r) => normalizeRole(r)).includes(role);
  };

  const canPerform = (
    action: StandardAction,
    options?: { allowedRoles?: (UserRole | string)[]; condition?: boolean }
  ): boolean => {
    const allowed = options?.allowedRoles || DEFAULT_ACTION_ROLES[action];
    const roleOk = checkRole(allowed);
    const condOk = options?.condition !== undefined ? options.condition : true;
    return roleOk && condOk;
  };

  return {
    currentUser,
    role,
    checkRole,
    canPerform,
    isSuperAdmin: role === 'SUPER_ADMIN',
    isFarmOwner: role === 'FARM_OWNER',
    isFieldStaff: role === 'FIELD_STAFF',
    isWarehouseStaff: role === 'WAREHOUSE_STAFF',
    isTechnicalStaff: role === 'TECHNICAL_STAFF',
    isAccountant: role === 'ACCOUNTANT',
  };
}
