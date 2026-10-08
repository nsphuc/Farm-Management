import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuthStore, normalizeRole } from '../stores/useAuthStore';
import { ROLE_LABELS } from '../types/rbac.types';

/**
 * Trả về trang chủ mặc định cho từng vai trò khi bị từ chối truy cập
 */
export const getDefaultHomeForRole = (role) => {
  const norm = normalizeRole(role);
  switch (norm) {
    case 'SUPER_ADMIN':
    case 'FARM_OWNER':
      return '/dashboard';
    case 'FIELD_STAFF':
      return '/tasks';
    case 'WAREHOUSE_STAFF':
      return '/inventory';
    case 'TECHNICAL_STAFF':
      return '/crops';
    case 'ACCOUNTANT':
      return '/finance/unit-cost';
    default:
      return '/dashboard';
  }
};

export const RoleGuard = ({
  allowedRoles,
  children,
}) => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser || state.user);
  const normalizedUserRole = normalizeRole(currentUser?.role);

  const normalizedAllowedRoles = (allowedRoles || []).map((r) => normalizeRole(r));
  const hasAccess =
    normalizedAllowedRoles.length === 0 ||
    normalizedAllowedRoles.includes(normalizedUserRole);

  if (!hasAccess) {
    const defaultHome = getDefaultHomeForRole(normalizedUserRole);
    const roleLabel = ROLE_LABELS[normalizedUserRole] || normalizedUserRole || 'Chưa phân quyền';

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 mb-4 ring-1 ring-amber-200 dark:ring-amber-900">
          <ShieldAlert className="w-12 h-12 stroke-[1.5]" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Truy cập bị từ chối (403 Forbidden)
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md">
          Tài khoản của bạn ({roleLabel}) không có quyền truy cập vào phân hệ này theo chính sách bảo mật hệ thống.
        </p>
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition text-sm min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>
          <button
            onClick={() => navigate(defaultHome)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium shadow-sm transition text-sm min-h-[44px]"
          >
            <Home className="w-4 h-4" />
            Về trang làm việc chính
          </button>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};

export default RoleGuard;
