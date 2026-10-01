import React from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useTenantStore } from '../stores/useTenantStore';
import { Sprout, Users, ShieldCheck, Activity, TrendingUp } from 'lucide-react';

export const DashboardOverviewPage = () => {
  const user = useAuthStore((state) => state.user);
  const currentTenant = useTenantStore((state) => state.currentTenant);

  const stats = [
    {
      title: 'Trang trại trực thuộc',
      value: '04 Trang trại',
      change: '+1 tháng này',
      icon: Sprout,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50',
    },
    {
      title: 'Nhân sự hoạt động',
      value: '28 Nhân viên',
      change: '100% Hoạt động',
      icon: Users,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50',
    },
    {
      title: 'Bảo mật & Tenant',
      value: 'Đã cô lập (Isolated)',
      change: 'Tenant: ' + (currentTenant?.code || 'DEFAULT'),
      icon: ShieldCheck,
      color: 'text-primary-600 bg-primary-50 dark:bg-primary-950/50',
    },
    {
      title: 'Trạng thái Hệ thống',
      value: '99.98% Uptime',
      change: 'WebSocket Trực tuyến',
      icon: Activity,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-700 via-primary-600 to-emerald-600 text-white p-6 sm:p-8 shadow-card">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm mb-3">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Nền tảng Quản trị Nông nghiệp 4.0</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Xin chào, {user?.fullName || 'Quản trị viên'}!
          </h1>
          <p className="mt-2 text-sm sm:text-base text-primary-100 font-light">
            Chào mừng bạn đến với Farm SaaS Platform. Hiện bạn đang quản trị trong phạm vi tổ chức{' '}
            <strong className="font-semibold text-white underline decoration-emerald-400">
              {currentTenant?.name || 'Trang trại Mẫu AgriTech'}
            </strong>.
          </p>
        </div>

        {/* Decorative Watermark */}
        <div className="absolute -right-8 -bottom-8 text-white/10 pointer-events-none">
          <Sprout className="w-64 h-64 stroke-[1]" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft hover:shadow-card transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {stat.title}
                </span>
                <div className={`p-2 rounded-xl ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {stat.value}
                </span>
                <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
                  <span>{stat.change}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Trạng thái Kiến trúc Phase 1: Nền tảng & Tích hợp
          </h2>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            Backend & Frontend Kết nối
          </span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Tầng cốt lõi của hệ thống đã sẵn sàng với kiến trúc Multi-Tenant cách ly dữ liệu,
          bảo mật xác thực JWT qua HttpOnly Cookie, phân quyền RBAC 6 cấp vai trò, thông báo thời
          gian thực qua WebSocket/SSE, và bộ khung xử lý lỗi tập trung.
        </p>
      </div>
    </div>
  );
};
