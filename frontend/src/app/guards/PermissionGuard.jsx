import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * PermissionGuard - Chốt chặn kiểm soát quyền chi tiết cấp Route
 * Kiểm tra mã quyền PERM_* trước khi render trang con.
 */
export function PermissionGuard({ permission, anyPermissions = [], children, fallback = null }) {
  const { hasPermission, hasAnyPermission, isSuperAdmin } = useAuthStore();

  const isSuper = isSuperAdmin();

  let hasAccess = isSuper;
  if (!hasAccess) {
    if (permission) {
      hasAccess = hasPermission(permission);
    } else if (anyPermissions.length > 0) {
      hasAccess = hasAnyPermission(anyPermissions);
    } else {
      hasAccess = true;
    }
  }

  if (!hasAccess) {
    if (fallback) return fallback;

    return (
      <div className="flex h-full min-h-[400px] w-full flex-col items-center justify-center p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-200">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-slate-800">Không có quyền truy cập</h2>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          Tài khoản của bạn không được cấp quyền thực hiện chức năng này ({permission || anyPermissions.join(', ')}). Vui lòng liên hệ Quản trị viên để được phân quyền.
        </p>
        <Link
          to="/app"
          className="mt-6 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
        >
          Quay lại Bàn làm việc
        </Link>
      </div>
    );
  }

  return children;
}

export default PermissionGuard;
