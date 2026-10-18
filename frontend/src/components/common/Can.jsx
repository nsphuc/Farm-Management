import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * <Can> Permission & Role Authorization Component (File 09 & File 10)
 * Bọc mọi nút bấm nhạy cảm hoặc khối giao diện cần phân quyền.
 *
 * @param {string} permission - Mã quyền đơn lẻ (VD: PERM_FARM_CREATE)
 * @param {string[]} anyPermissions - Danh sách quyền (chỉ cần có 1 trong số đó)
 * @param {string} role - Mã vai trò (VD: ROLE_FARM_OWNER)
 * @param {React.ReactNode} fallback - Giao diện hiển thị khi không có quyền (mặc định null)
 */
export function Can({ permission, anyPermissions = [], role, fallback = null, children }) {
  const { hasPermission, hasAnyPermission, hasRole, isSuperAdmin } = useAuthStore();

  if (isSuperAdmin()) {
    return <>{children}</>;
  }

  if (role && !hasRole(role)) {
    return <>{fallback}</>;
  }

  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  if (anyPermissions.length > 0 && !hasAnyPermission(anyPermissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default Can;
