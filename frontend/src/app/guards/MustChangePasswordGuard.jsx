import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * MustChangePasswordGuard - First-Login Guard (Điều 1 File 08 & Tiêu chí 6 File 10)
 * Nếu cờ mustChangePassword === true, lập tức cưỡng chế khóa mọi route và đẩy về /force-change-password.
 * Người dùng không thể đóng, bỏ qua, hoặc truy cập bất kỳ trang nào khác trước khi đổi mật khẩu mới.
 */
export function MustChangePasswordGuard({ children }) {
  const location = useLocation();
  const { userInfo, isSuperAdmin } = useAuthStore();

  const mustChange = Boolean(userInfo?.mustChangePassword);
  const isCurrentlyOnChangePasswordPage = location.pathname === '/force-change-password';

  if (mustChange && !isCurrentlyOnChangePasswordPage) {
    return <Navigate to="/force-change-password" replace />;
  }

  if (!mustChange && isCurrentlyOnChangePasswordPage) {
    // Nếu đã đổi xong mật khẩu mà vẫn ở trang /force-change-password, điều hướng về Shell tương ứng
    if (isSuperAdmin()) {
      return <Navigate to="/platform" replace />;
    }
    return <Navigate to="/app" replace />;
  }

  return children;
}

export default MustChangePasswordGuard;
