import React from 'react';
import { Building, CreditCard, Users, ShieldAlert, Plus, Activity } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * Platform Dashboard Page - Dành riêng ROLE_SUPER_ADMIN (Mục 1.1.2 File 08)
 */
export function PlatformDashboardPage() {
  const metrics = [
    { label: 'Tổng Số Khách Thuê (Tenants)', value: '12 Doanh nghiệp', icon: Building, color: 'text-blue-600 bg-blue-50' },
    { label: 'Gói Dịch Vụ Đang Kích Hoạt', value: '18 Hợp đồng', icon: CreditCard, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Tổng Tài Khoản Đang Hoạt Động', value: '348 Người dùng', icon: Users, color: 'text-purple-600 bg-purple-50' },
    { label: 'Trạng Thái Máy Chủ MySQL 72 Bảng', value: 'Ổn định (Healthy)', icon: Activity, color: 'text-rose-600 bg-rose-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản Trị Nền Tảng SaaS (Platform Control Plane)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Không gian độc quyền của ROLE_SUPER_ADMIN. Cách ly 100% dữ liệu nông nghiệp nội bộ của các Tenant.
          </p>
        </div>

        <Button variant="danger" size="md" icon={Plus}>
          Khởi Tạo Khách Thuê Mới
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => (
          <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl mb-3 ${m.color}`}>
              <m.icon className="h-5 w-5" />
            </div>
            <span className="text-xs text-slate-500 font-medium">{m.label}</span>
            <p className="text-xl font-black text-slate-900 mt-1">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-2">Danh Sách Doanh Nghiệp Thuê Nền Tảng (Tenants)</h2>
        <p className="text-xs text-slate-500">
          Danh mục các khách thuê đang đăng ký sử dụng hệ thống Agri-ERP Đa Trang Trại.
        </p>
      </div>
    </div>
  );
}

export default PlatformDashboardPage;
