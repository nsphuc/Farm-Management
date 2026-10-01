import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';

export const RoleGuard = ({
  allowedRoles,
  allowedPermissions,
  children,
}) => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const hasAnyRole = useAuthStore((state) => state.hasAnyRole);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  let hasAccess = true;

  if (allowedRoles && allowedRoles.length > 0) {
    hasAccess = hasAnyRole(allowedRoles);
  }

  if (hasAccess && allowedPermissions && allowedPermissions.length > 0) {
    hasAccess = allowedPermissions.some((perm) => hasPermission(perm));
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 mb-4 ring-1 ring-amber-200 dark:ring-amber-900">
          <ShieldAlert className="w-12 h-12 stroke-[1.5]" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Truy cập bị từ chối (403)
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md">
          Tài khoản của bạn ({user?.roles?.join(', ') || 'Chưa phân quyền'}) không có quyền truy cập vào chức năng này.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium shadow-sm transition-colors text-sm min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại Bảng điều khiển
        </button>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};
