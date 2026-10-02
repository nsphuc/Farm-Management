import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Sprout,
  Building2,
  Handshake,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';

export const DashboardSidebar = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const hasAnyRole = useAuthStore((state) => state.hasAnyRole);

  const canManageUsers = hasAnyRole(['ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER']);

  const navItems = [
    {
      to: '/dashboard',
      label: 'Bảng điều khiển',
      icon: LayoutDashboard,
      show: true,
    },
    {
      to: '/enterprise',
      label: 'Hồ sơ Doanh nghiệp/HTX',
      icon: Building2,
      show: true,
      badge: 'Core',
    },
    {
      to: '/farms',
      label: 'Quản lý Trang trại',
      icon: Sprout,
      show: true,
    },
    {
      to: '/partners',
      label: 'Đối tác & Chuỗi cung ứng',
      icon: Handshake,
      show: true,
    },
    {
      to: '/users',
      label: 'Người dùng & Quyền (RBAC)',
      icon: Users,
      show: canManageUsers,
      badge: 'RBAC',
    },
    {
      to: '/notifications',
      label: 'Trung tâm Thông báo',
      icon: Bell,
      show: true,
    },
    {
      to: '/settings',
      label: 'Cài đặt hệ thống',
      icon: Settings,
      show: true,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-all duration-300">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-primary-600/20">
            <Sprout className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <span className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
                Farm SaaS
              </span>
              <span className="block text-[10px] text-slate-400 font-medium">AgriTech Platform</span>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={isCollapsed ? 'Mở rộng Sidebar' : 'Thu gọn Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {navItems
          .filter((item) => item.show)
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
                {!isCollapsed && item.badge && (
                  <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800">
        {!isCollapsed ? (
          <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
              <Layers className="w-3.5 h-3.5 text-primary-600" />
              <span>Phase 1: Nền tảng Core</span>
            </div>
            <p className="text-[10px] text-slate-400">Multi-tenant & RBAC Active</p>
          </div>
        ) : (
          <div className="flex justify-center text-slate-400">
            <Shield className="w-4 h-4 text-emerald-600" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block fixed left-0 top-0 bottom-0 z-40 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          onClick={onCloseMobile}
        >
          <div
            className="w-72 h-full max-w-[85vw] bg-white dark:bg-slate-900 shadow-2xl animate-in slide-in-from-left duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
