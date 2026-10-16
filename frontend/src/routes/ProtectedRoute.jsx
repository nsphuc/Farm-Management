import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth/useAuthStore';
import { ShieldAlert } from 'lucide-react';

/**
 * Route Guard bảo vệ các trang yêu cầu đăng nhập và phân quyền RBAC.
 * Hỗ trợ kiểm tra quyền hạn (đơn lẻ hoặc danh sách các quyền thay thế), vai trò và phạm vi Farm.
 */
export const ProtectedRoute = ({ children, requiredPermission, requiredRole, requiredFarmId }) => {
  const location = useLocation();
  const { isAuthenticated, hasPermission, hasRole, canAccessFarm } = useAuthStore();

  // 1. Chưa đăng nhập -> Chuyển hướng về trang đăng nhập
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Kiểm tra Role bắt buộc nếu có (hỗ trợ mảng vai trò)
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const matchRole = roles.some((r) => hasRole(r));
    if (!matchRole) {
      return <ForbiddenState message={`Yêu cầu vai trò: ${roles.join(' hoặc ')}`} />;
    }
  }

  // 3. Kiểm tra Permission bắt buộc nếu có (hỗ trợ hasAnyAuthority với mảng quyền)
  if (requiredPermission) {
    const permissions = Array.isArray(requiredPermission)
      ? requiredPermission
      : [requiredPermission];
    const matchPermission = permissions.some((p) => hasPermission(p));
    if (!matchPermission) {
      return <ForbiddenState message={`Yêu cầu quyền hạn: ${permissions.join(' hoặc ')}`} />;
    }
  }

  // 4. Kiểm tra Farm Scope bắt buộc nếu có
  if (requiredFarmId && !canAccessFarm(requiredFarmId)) {
    return <ForbiddenState message={`Bạn không có quyền truy cập trang trại ID: ${requiredFarmId}`} />;
  }

  return children;
};

const ForbiddenState = ({ message }) => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
    <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
      <ShieldAlert className="w-8 h-8" />
    </div>
    <h2 className="text-xl font-bold text-slate-800 mb-1">403 — Truy cập bị từ chối</h2>
    <p className="text-sm text-slate-500 max-w-md mb-6">
      Tài khoản của bạn không có đủ thẩm quyền để truy cập vào phân hệ này.
    </p>
    {message && (
      <div className="text-xs font-mono bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200">
        {message}
      </div>
    )}
  </div>
);

export default ProtectedRoute;
