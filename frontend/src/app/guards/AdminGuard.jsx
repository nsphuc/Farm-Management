import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * AdminGuard - BẢO VỆ PHÂN KHU QUẢN TRỊ SAAS (/admin/*)
 * Chỉ cho phép người dùng có quyền ROLE_SUPER_ADMIN truy cập.
 * Mọi tài khoản trang trại thông thường (Chủ trại, Trại trưởng, Công nhân...)
 * khi truy cập vào /admin/* sẽ bị đẩy ngược về /app/dashboard.
 */
export function AdminGuard({ children }) {
  const { isAuthenticated, isSuperAdmin, userInfo } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Kiểm tra quyền Super Admin qua helper hoặc trực tiếp trong thông tin user
  const isSuper =
    (typeof isSuperAdmin === 'function' && isSuperAdmin()) ||
    Boolean(
      userInfo?.is_super_admin ||
      userInfo?.role === 'SUPER_ADMIN' ||
      userInfo?.role === 'ROLE_SUPER_ADMIN' ||
      (Array.isArray(userInfo?.roles) &&
        userInfo.roles.some((r) => {
          const code = typeof r === 'string' ? r : r.code;
          return code === 'ROLE_SUPER_ADMIN' || code === 'SUPER_ADMIN';
        }))
    );

  if (!isSuper) {
    // Tài khoản thông thường bị chặn và chuyển hướng về Dashboard trang trại
    return <Navigate to="/app/dashboard" replace />;
  }

  return children;
}

export default AdminGuard;
