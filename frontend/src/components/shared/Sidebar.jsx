import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  Boxes,
  BookOpen,
  Wheat,
  ClipboardCheck,
  Settings,
} from 'lucide-react';
import { useUiStore } from '../../store/ui/useUiStore';
import { useAuthStore } from '../../store/auth/useAuthStore';

/**
 * Sidebar Menu Hợp Nhất theo Hiến pháp Master UI Workspace Flows (RULE-UI-001).
 * Tiêu diệt tình trạng Siloed UI: Thay thế toàn bộ menu phân mảnh lắt nhắt thành
 * 6 Không Gian Làm Việc (Workspaces) liền mạch + Tổng quan + Cấu hình hệ thống.
 * Hỗ trợ đường dẫn trực tiếp (sub-links) vào các chức năng con: 3.1 Kho bãi, 3.2 Vật tư, 1.5 Chu kỳ vận hành.
 */
export const Sidebar = () => {
  const { isSidebarOpen } = useUiStore();
  const { hasPermission, hasRole } = useAuthStore();
  const location = useLocation();

  // Danh mục 8 Menu Hợp Nhất theo chuẩn Master UI Workspace Flows
  const menuItems = [
    {
      id: 'dashboard',
      label: '1. Tổng quan (Dashboard)',
      path: '/',
      icon: LayoutDashboard,
      badge: 'Chính',
    },
    {
      id: 'workspace-a',
      label: '2. Không gian Sản xuất',
      sublabel: 'Workspace A: Mặt bằng & Phân công',
      path: '/production',
      icon: Building2,
      permission: ['PERM_FARM_VIEW', 'PERM_ZONE_MANAGE'],
    },
    {
      id: 'workspace-b',
      label: '3. Hồ sơ Nhân sự',
      sublabel: 'Workspace B: Lý lịch & Tài khoản SaaS',
      path: '/personnel',
      icon: Users,
      permission: 'PERM_HR_EMPLOYEE_MANAGE',
    },
    {
      id: 'workspace-c',
      label: '4. Trung tâm Kho bãi',
      sublabel: 'Workspace C: Kho & Vật tư',
      path: '/inventory',
      icon: Boxes,
      permission: ['PERM_INVENTORY_VIEW', 'PERM_INVENTORY_RECEIPT', 'PERM_INVENTORY_ISSUE'],
      children: [
        { id: 'c-warehouses', label: '3.1. Quản lý Kho bãi', path: '/warehouses' },
        { id: 'c-materials', label: '3.2. Danh mục Vật tư', path: '/materials' },
        { id: 'c-receipts', label: '3.3. Nhập kho (warehouse_receipts)', path: '/inventory?tab=receipts' },
        { id: 'c-issues', label: '3.4. Xuất kho (warehouse_issues)', path: '/inventory?tab=issues' },
        { id: 'c-balances', label: '3.7. Sổ thẻ kho (warehouse_inventory)', path: '/inventory?tab=balances' },
      ],
    },
    {
      id: 'workspace-d',
      label: '5. Danh bạ Đối tác',
      sublabel: 'Workspace D: Nhà cung cấp & Khách hàng',
      path: '/partners',
      icon: BookOpen,
      permission: ['PERM_INVENTORY_VIEW', 'PERM_FINANCE_REPORT', 'PERM_FARM_VIEW'],
    },
    {
      id: 'workspace-e',
      label: '6. Canh tác & Hiện trường',
      sublabel: 'Workspace E: Nhật ký & Xuất vật tư',
      path: '/farming',
      icon: Wheat,
      permission: ['PERM_CROP_VIEW', 'PERM_CROP_LOG', 'PERM_LIVESTOCK_VIEW', 'PERM_FARM_VIEW'],
    },
    {
      id: 'workspace-f',
      label: '7. Đường ống QA & Truy xuất',
      sublabel: 'Workspace F: Lô hàng, KCS, In tem',
      path: '/quality',
      icon: ClipboardCheck,
      permission: ['PERM_QC_INSPECT', 'PERM_QC_APPROVE', 'PERM_LABEL_PRINT'],
    },
    {
      id: 'system-settings',
      label: '8. Cấu hình & Hệ thống',
      sublabel: 'Cài đặt chung & Chu kỳ vận hành',
      path: '/settings',
      icon: Settings,
      permission: ['PERM_FARM_UPDATE', 'PERM_FARM_VIEW', 'PERM_FINANCE_REPORT'],
      children: [
        { id: 's-cycles', label: '1.5. Chu kỳ Vận hành', path: '/cycles' },
      ],
    },
  ];

  // Helper kiểm tra quyền của từng menu item
  const checkItemVisibility = (item) => {
    if (!item.role && !item.permission) return true;
    if (item.role) {
      const roles = Array.isArray(item.role) ? item.role : [item.role];
      if (roles.some((r) => hasRole(r))) return true;
    }
    if (item.permission) {
      const permissions = Array.isArray(item.permission) ? item.permission : [item.permission];
      if (permissions.some((p) => hasPermission(p))) return true;
    }
    return false;
  };

  if (!isSidebarOpen) return null;

  const visibleItems = menuItems.filter(checkItemVisibility);

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] flex flex-col shrink-0 border-r border-slate-800">
      {/* Header Sidebar */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
            Không Gian Hợp Nhất
          </p>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800">
            RULE-UI-001
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isExactActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname === item.path;
          const isParentActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path) ||
                (item.children && item.children.some((c) => location.pathname === c.path || location.pathname.startsWith(c.path)));

          return (
            <div key={item.id} className="space-y-1">
              <Link
                to={item.path}
                className={`flex items-start gap-3 p-2.5 rounded-xl text-xs transition-all group ${
                  isExactActive
                    ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                    : isParentActive
                    ? 'bg-slate-800/90 text-white font-medium'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    isExactActive
                      ? 'text-white'
                      : isParentActive
                      ? 'text-emerald-400'
                      : 'text-slate-400 group-hover:text-emerald-400'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {item.sublabel && (
                    <p
                      className={`text-[10px] truncate mt-0.5 ${
                        isExactActive ? 'text-emerald-100 font-normal' : 'text-slate-500'
                      }`}
                    >
                      {item.sublabel}
                    </p>
                  )}
                </div>
              </Link>

              {/* Sub-menu links for Batch 2 modules */}
              {item.children && item.children.length > 0 && (
                <div className="ml-7 pl-3 border-l border-slate-800/80 space-y-1 my-1">
                  {item.children.map((sub) => {
                    const isSubActive =
                      location.pathname === sub.path ||
                      location.pathname.startsWith(sub.path + '/');
                    return (
                      <Link
                        key={sub.id}
                        to={sub.path}
                        className={`block py-1.5 px-2.5 rounded-lg text-[11px] transition-all ${
                          isSubActive
                            ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                      >
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer Sidebar */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400">
        <p className="font-semibold text-slate-300">Farm SaaS Platform</p>
        <p className="mt-0.5 text-slate-500">Master UI Workspaces v2.0</p>
      </div>
    </aside>
  );
};

export default Sidebar;
