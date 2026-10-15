import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Wheat,
  Beef,
  Boxes,
  ClipboardCheck,
  Users,
  CalendarCheck,
  DollarSign,
  BarChart3,
  Settings,
  ShieldCheck,
  Server
} from 'lucide-react';
import { useUiStore } from '../../store/ui/useUiStore';
import { useAuthStore } from '../../store/auth/useAuthStore';

export const Sidebar = () => {
  const { isSidebarOpen } = useUiStore();
  const { hasPermission, hasRole, user } = useAuthStore();
  const location = useLocation();

  // Danh mục menu phân cấp theo Sơ đồ phân cấp chức năng và ma trận quyền roles-permissions.md
  const navItems = [
    { label: 'Tổng quan', path: '/', icon: LayoutDashboard },
    { label: 'Trạng thái hệ thống', path: '/system-status', icon: Server },
    {
      label: '1. Tổ chức & Trang trại',
      path: '/farms',
      icon: Building2,
      permission: 'PERM_FARM_VIEW', // Ẩn nếu không có quyền xem trang trại
    },
    {
      label: '2.1. Trồng trọt (Crop)',
      path: '/crop',
      icon: Wheat,
      permission: 'PERM_CROP_VIEW',
    },
    {
      label: '2.2. Chăn nuôi (Livestock)',
      path: '/livestock',
      icon: Beef,
      permission: 'PERM_LIVESTOCK_VIEW',
    },
    {
      label: '3. Kho nông sản & Vật tư',
      path: '/inventory',
      icon: Boxes,
      permission: 'PERM_INVENTORY_VIEW',
    },
    {
      label: '4. QC & Truy xuất nguồn gốc',
      path: '/quality',
      icon: ClipboardCheck,
      permission: 'PERM_QC_INSPECT',
    },
    {
      label: '6. Nhân sự & Chấm công',
      path: '/hr',
      icon: Users,
      permission: 'PERM_HR_EMPLOYEE_MANAGE',
    },
    {
      label: '6.2. Công việc & Giao việc',
      path: '/tasks',
      icon: CalendarCheck,
      permission: 'PERM_TASK_ASSIGN',
    },
    {
      label: '7. Tài chính & Chi phí',
      path: '/finance',
      icon: DollarSign,
      permission: 'PERM_FINANCE_REPORT',
    },
    {
      label: 'Báo cáo & Thống kê',
      path: '/reports',
      icon: BarChart3,
      permission: 'PERM_FINANCE_REPORT',
    },
    {
      label: 'Quản trị nền tảng',
      path: '/platform',
      icon: ShieldCheck,
      permission: 'PERM_TENANT_MANAGE',
      role: 'ROLE_SUPER_ADMIN',
    },
    { label: 'Cài đặt', path: '/settings', icon: Settings },
  ];

  // Lọc menu hiển thị theo quyền và vai trò của người dùng hiện tại
  const visibleNavItems = navItems.filter((item) => {
    // Nếu yêu cầu role cụ thể
    if (item.role && !hasRole(item.role)) {
      return false;
    }
    // Nếu yêu cầu permission cụ thể
    if (item.permission && !hasPermission(item.permission)) {
      return false;
    }
    return true;
  });

  if (!isSidebarOpen) return null;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] flex flex-col shrink-0">
      <div className="p-4 border-b border-slate-800">
        <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">
          Phân hệ quản lý
        </p>
      </div>
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
        <p className="font-semibold text-slate-400">Farm SaaS Platform</p>
        <p className="mt-0.5">Spring Boot 3 + MySQL 8 + React</p>
      </div>
    </aside>
  );
};

export default Sidebar;
