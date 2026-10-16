import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Calendar,
  Users,
  Boxes,
  Package,
  Wheat,
  Beef,
  ClipboardCheck,
  CalendarCheck,
  DollarSign,
  BarChart3,
  Settings,
  ShieldCheck,
  Server,
} from 'lucide-react';
import { useUiStore } from '../../store/ui/useUiStore';
import { useAuthStore } from '../../store/auth/useAuthStore';

export const Sidebar = () => {
  const { isSidebarOpen } = useUiStore();
  const { hasPermission, hasRole } = useAuthStore();
  const location = useLocation();

  // Danh mục menu phân cấp theo Sơ đồ phân cấp chức năng (.docx) và ma trận quyền roles-permissions.md
  const menuSections = [
    {
      title: 'Hệ thống',
      items: [
        { label: 'Tổng quan', path: '/', icon: LayoutDashboard },
        { label: 'Trạng thái hệ thống', path: '/system-status', icon: Server },
      ],
    },
    {
      title: '1. Quản lý Tổ chức & Trang trại',
      items: [
        {
          label: '1.2. Trang trại & Phân khu',
          path: '/farms',
          icon: Building2,
          permission: 'PERM_FARM_VIEW',
        },
        {
          label: '1.5. Chu kỳ vận hành',
          path: '/cycles',
          icon: Calendar,
          permission: ['PERM_FARM_VIEW', 'PERM_FINANCE_REPORT'],
        },
        {
          label: '1.6. Quản lý đối tác',
          path: '/partners',
          icon: Users,
          permission: ['PERM_INVENTORY_VIEW', 'PERM_FINANCE_REPORT', 'PERM_FARM_VIEW'],
        },
      ],
    },
    {
      title: '2. Quản lý Sản xuất',
      items: [
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
      ],
    },
    {
      title: '3. Quản lý Kho & Vật tư',
      items: [
        {
          label: '3.1. Quản lý kho bãi',
          path: '/warehouses',
          icon: Boxes,
          permission: 'PERM_INVENTORY_VIEW',
        },
        {
          label: '3.2. Danh mục & Vật tư',
          path: '/materials',
          icon: Package,
          permission: ['PERM_INVENTORY_VIEW', 'PERM_FINANCE_REPORT'],
        },
      ],
    },
    {
      title: 'Vận hành & Nghiệp vụ khác',
      items: [
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
      ],
    },
  ];

  // Helper kiểm tra quyền của từng menu item
  const checkItemVisibility = (item) => {
    // Nếu yêu cầu role cụ thể
    if (item.role) {
      const roles = Array.isArray(item.role) ? item.role : [item.role];
      if (!roles.some((r) => hasRole(r))) return false;
    }
    // Nếu yêu cầu permission cụ thể (hỗ trợ mảng quyền thay thế)
    if (item.permission) {
      const permissions = Array.isArray(item.permission) ? item.permission : [item.permission];
      if (!permissions.some((p) => hasPermission(p))) return false;
    }
    return true;
  };

  if (!isSidebarOpen) return null;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] flex flex-col shrink-0 border-r border-slate-800">
      <div className="p-4 border-b border-slate-800">
        <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
          Sơ đồ chức năng hệ thống
        </p>
      </div>
      <nav className="p-3 space-y-4 flex-1 overflow-y-auto">
        {menuSections.map((section, sIdx) => {
          const visibleItems = section.items.filter(checkItemVisibility);
          if (visibleItems.length === 0) return null;

          return (
            <div key={sIdx} className="space-y-1">
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {section.title}
              </p>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400">
        <p className="font-semibold text-slate-300">Farm SaaS Platform</p>
        <p className="mt-0.5 text-slate-400">Master Data Frontend v1.0</p>
      </div>
    </aside>
  );
};

export default Sidebar;
