import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { ShieldAlert, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * PermissionGuard - Chốt chặn kiểm soát quyền chi tiết & gói Add-on cấp Route
 * Kiểm tra mã quyền (RBAC) và trạng thái kích hoạt gói Add-on (Feature Gating) trước khi render.
 */
export function PermissionGuard({ permission, anyPermissions = [], addonCode = null, children, fallback = null }) {
  const { userInfo, hasPermission, hasAnyPermission, isSuperAdmin, isOwner } = useAuthStore();

  // 1. Kiểm tra gói dịch vụ mở rộng (Add-on Feature Gating — SAAS-03)
  if (addonCode && !isSuperAdmin()) {
    const subs = userInfo?.farmAddOnSubscriptions || [];
    const isAddonActive = subs.some(
      (s) => s.addonCode === addonCode && (s.isEnabled || s.status === 'ACTIVE')
    );
    if (!isAddonActive) {
      return (
        <div className="flex h-full min-h-[400px] w-full flex-col items-center justify-center p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-800">Gói dịch vụ mở rộng chưa kích hoạt</h2>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            Trang trại hiện tại chưa đăng ký hoặc chưa bật phân hệ mở rộng <strong>{addonCode}</strong>. Vui lòng nâng cấp gói tại mục Thiết lập chung để sử dụng.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Link
              to="/app/general-settings?tab=service-info"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
            >
              Nâng cấp gói ngay
            </Link>
            <Link
              to="/app/dashboard"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Về Tổng quan
            </Link>
          </div>
        </div>
      );
    }
  }

  const isSuper = isSuperAdmin() || (typeof isOwner === 'function' && isOwner());

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
