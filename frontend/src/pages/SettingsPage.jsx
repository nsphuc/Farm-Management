import React from 'react';
import { Settings, Shield, Lock } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useTenantStore } from '../stores/useTenantStore';

export const SettingsPage = () => {
  const user = useAuthStore((state) => state.user);
  const currentTenant = useTenantStore((state) => state.currentTenant);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary-600" />
          <span>Cài đặt hệ thống & Tài khoản</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Cấu hình thông tin hồ sơ cá nhân và tham số hoạt động của Tenant.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Profile Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-primary-100 dark:bg-primary-950 text-primary-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Thông tin Tài khoản
              </h3>
              <p className="text-xs text-slate-400">Dữ liệu định danh người dùng</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400">Họ và tên:</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                {user?.fullName}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Tên đăng nhập:</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{user?.username}</p>
            </div>
            <div>
              <span className="text-slate-400">Email:</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{user?.email}</p>
            </div>
            <div>
              <span className="text-slate-400">Vai trò RBAC:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {user?.roles?.map((r) => (
                  <span
                    key={r}
                    className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tenant Details Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Ngữ cảnh Tenant Hiện tại
              </h3>
              <p className="text-xs text-slate-400">Thông tin gói thuê bao và cách ly</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400">Tên Doanh nghiệp / Trang trại:</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                {currentTenant?.name || 'Trang trại Mẫu AgriTech'}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Mã Tenant (X-Tenant-ID):</span>
              <p className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {currentTenant?.id || user?.tenantId || '1'} ({currentTenant?.code || 'DEFAULT'})
              </p>
            </div>
            <div>
              <span className="text-slate-400">Gói Dịch vụ:</span>
              <span className="ml-2 inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300 uppercase">
                {currentTenant?.subscriptionPlan || 'ENTERPRISE'}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Trạng thái:</span>
              <span className="ml-2 inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                ACTIVE
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
