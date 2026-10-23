import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';

/**
 * <Can> Permission & Role Authorization Component (File 09 & File 10 & ADR-4-Tier-RBAC)
 * Bọc mọi nút bấm nhạy cảm hoặc khối giao diện cần phân quyền và kiểm soát chéo Maker - Checker.
 *
 * @param {string | string[]} permission - Mã quyền đơn lẻ hoặc danh sách quyền
 * @param {string[]} anyPermissions - Danh sách quyền (chỉ cần có 1 trong số đó) - Giữ tương thích ngược
 * @param {string | string[]} role - Mã vai trò yêu cầu (VD: 'ROLE_FARM_OWNER' hoặc ['ROLE_FARM_MANAGER', 'ROLE_FARM_OWNER'])
 * @param {string | string[]} notRole - Mã vai trò bị cấm (VD: ['ROLE_FARM_OWNER'])
 * @param {string | string[]} farmRole - Chức danh hiện trường trong farm_assignments (VD: 'ZONE_MANAGER')
 * @param {React.ReactNode} fallback - Giao diện hiển thị khi không đủ điều kiện (mặc định null)
 */
export function Can({
  permission,
  anyPermissions = [],
  role,
  notRole,
  farmRole,
  fallback = null,
  children,
}) {
  const {
    hasPermission,
    hasAnyPermission,
    hasRole,
    hasAnyRole,
    isSuperAdmin,
    isFarmOwner,
    isFarmManager,
    hasFarmAssignmentRole,
  } = useAuthStore();

  // 1. Kiểm tra notRole (Phủ định vai trò - Cấm Maker hoặc cấm Owner/Checker):
  // Nếu người dùng có bất kỳ vai trò nào trong danh sách notRole -> chặn ngay
  if (notRole) {
    const excludedRoles = Array.isArray(notRole) ? notRole : [notRole];
    const isExcluded = excludedRoles.some((r) => {
      if (r === 'ROLE_SUPER_ADMIN') return isSuperAdmin();
      if (r === 'ROLE_FARM_OWNER') return isFarmOwner ? isFarmOwner() : hasRole('ROLE_FARM_OWNER');
      if (r === 'ROLE_FARM_MANAGER') return isFarmManager ? isFarmManager() : hasRole('ROLE_FARM_MANAGER');
      return hasRole(r);
    });
    if (isExcluded) {
      return <>{fallback}</>;
    }
  }

  // 2. Nếu là Super Admin (và không bị chặn bởi notRole ở trên), cho phép toàn quyền
  if (isSuperAdmin()) {
    return <>{children}</>;
  }

  // 3. Kiểm tra permission (Đơn lẻ hoặc mảng):
  // Người dùng phải có ít nhất 1 permission hợp lệ
  const permissionsToCheck = [];
  if (permission) {
    if (Array.isArray(permission)) {
      permissionsToCheck.push(...permission);
    } else {
      permissionsToCheck.push(permission);
    }
  }
  if (Array.isArray(anyPermissions) && anyPermissions.length > 0) {
    permissionsToCheck.push(...anyPermissions);
  }

  if (permissionsToCheck.length > 0) {
    const hasPerm = permissionsToCheck.some((p) => hasPermission(p));
    if (!hasPerm) {
      return <>{fallback}</>;
    }
  }

  // 4. Kiểm tra role (Khẳng định vai trò hệ thống):
  let roleMatched = false;
  if (role) {
    const requiredRoles = Array.isArray(role) ? role : [role];
    roleMatched = requiredRoles.some((r) => {
      if (r === 'ROLE_SUPER_ADMIN') return isSuperAdmin();
      if (r === 'ROLE_FARM_OWNER') return isFarmOwner ? isFarmOwner() : hasRole('ROLE_FARM_OWNER');
      if (r === 'ROLE_FARM_MANAGER') return isFarmManager ? isFarmManager() : hasRole('ROLE_FARM_MANAGER');
      return hasRole(r);
    });
  }

  // 5. Kiểm tra farmRole (vai trò hiện trường role_in_farm trong bảng farm_assignments):
  let farmRoleMatched = false;
  if (farmRole) {
    const activeFarmId = useActiveFarmStore.getState().getSelectedFarmId?.();
    farmRoleMatched = hasFarmAssignmentRole
      ? hasFarmAssignmentRole(farmRole, activeFarmId) || hasFarmAssignmentRole(farmRole, null)
      : false;
  }

  // Đánh giá điều kiện kết hợp:
  // - Nếu cả role VÀ farmRole đều được truyền vào: Cho phép nếu thỏa mãn ít nhất 1 trong 2 (HOẶC: roleMatched || farmRoleMatched)
  // - Nếu chỉ truyền role: Bắt buộc roleMatched
  // - Nếu chỉ truyền farmRole: Bắt buộc farmRoleMatched
  if (role && farmRole) {
    if (!roleMatched && !farmRoleMatched) {
      return <>{fallback}</>;
    }
  } else if (role) {
    if (!roleMatched) {
      return <>{fallback}</>;
    }
  } else if (farmRole) {
    if (!farmRoleMatched) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

export default Can;
