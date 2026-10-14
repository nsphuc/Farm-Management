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

export const Sidebar = () => {
  const { isSidebarOpen } = useUiStore();
  const location = useLocation();

  const navItems = [
    { label: 'Tổng quan', path: '/', icon: LayoutDashboard },
    { label: 'Trạng thái hệ thống', path: '/system-status', icon: Server },
    { label: 'Tổ chức & Trang trại', path: '/organization', icon: Building2 },
    { label: 'Trồng trọt (Crop)', path: '/crop', icon: Wheat },
    { label: 'Chăn nuôi (Livestock)', path: '/livestock', icon: Beef },
    { label: 'Kho nông sản & Vật tư', path: '/inventory', icon: Boxes },
    { label: 'QC & Truy xuất nguồn gốc', path: '/quality', icon: ClipboardCheck },
    { label: 'Nhân sự & Chấm công', path: '/hr', icon: Users },
    { label: 'Công việc & Giao việc', path: '/tasks', icon: CalendarCheck },
    { label: 'Tài chính & Chi phí', path: '/finance', icon: DollarSign },
    { label: 'Báo cáo & Thống kê', path: '/reports', icon: BarChart3 },
    { label: 'Quản trị nền tảng', path: '/platform', icon: ShieldCheck },
    { label: 'Cài đặt', path: '/settings', icon: Settings },
  ];

  if (!isSidebarOpen) return null;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] flex flex-col shrink-0">
      <div className="p-4 border-b border-slate-800">
        <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Phân hệ quản lý</p>
      </div>
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
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
