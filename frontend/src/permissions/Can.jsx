import React from 'react';
import { useAuthStore } from '../store/auth/useAuthStore';

/**
 * Component hỗ trợ ẩn / hiện UI dựa trên quyền hạn (Permission Code), vai trò hoặc phạm vi Farm.
 * Ví dụ sử dụng:
 * <Can permission="PERM_QC_APPROVE">
 *   <button>Phê duyệt QC</button>
 * </Can>
 */
export const Can = ({ permission, role, farmId, children, fallback = null }) => {
  const { hasPermission, hasRole, canAccessFarm, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return fallback;
  }

  // Nếu yêu cầu role cụ thể
  if (role && !hasRole(role)) {
    return fallback;
  }

  // Nếu yêu cầu permission cụ thể
  if (permission && !hasPermission(permission)) {
    return fallback;
  }

  // Nếu yêu cầu phạm vi farm cụ thể
  if (farmId && !canAccessFarm(farmId)) {
    return fallback;
  }

  return <>{children}</>;
};

export default Can;
