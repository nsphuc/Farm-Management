import React from 'react';
import { useAuthStore } from '../store/auth/useAuthStore';

/**
 * Component hỗ trợ ẩn / hiện UI dựa trên quyền hạn (Permission Code), vai trò hoặc phạm vi Farm.
 * Hỗ trợ cả chuỗi đơn hoặc mảng các quyền / vai trò.
 * Ví dụ sử dụng:
 * <Can permission="PERM_FARM_UPDATE" role={['ROLE_FARM_OWNER', 'ROLE_TENANT_ADMIN']}>
 *   <button>Thêm kho bãi</button>
 * </Can>
 */
export const Can = ({ permission, role, farmId, matchAny = true, children, fallback = null }) => {
  const { hasPermission, hasRole, canAccessFarm, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return fallback;
  }

  // 1. Kiểm tra phạm vi Farm nếu có
  if (farmId && !canAccessFarm(farmId)) {
    return fallback;
  }

  const roleList = role ? (Array.isArray(role) ? role : [role]) : [];
  const permList = permission ? (Array.isArray(permission) ? permission : [permission]) : [];

  // Nếu không chỉ định role và permission nào
  if (roleList.length === 0 && permList.length === 0) {
    return <>{children}</>;
  }

  const hasAnyMatchingRole = roleList.some((r) => hasRole(r));
  const hasAnyMatchingPerm = permList.some((p) => hasPermission(p));

  // Chế độ matchAny (mặc định: có bất kỳ role hoặc bất kỳ permission nào là được)
  if (matchAny) {
    const isAllowed =
      (roleList.length > 0 && hasAnyMatchingRole) ||
      (permList.length > 0 && hasAnyMatchingPerm);

    return isAllowed ? <>{children}</> : fallback;
  }

  // Chế độ nghiêm ngặt: yêu cầu thỏa mãn cả role và permission nếu cả 2 được khai báo
  if (roleList.length > 0 && !hasAnyMatchingRole) {
    return fallback;
  }
  if (permList.length > 0 && !hasAnyMatchingPerm) {
    return fallback;
  }

  return <>{children}</>;
};

export default Can;
