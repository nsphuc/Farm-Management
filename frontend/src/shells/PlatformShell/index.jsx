import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Building,
  CreditCard,
  FileSearch,
  Activity,
  LogOut,
  User,
  Sparkles,
  Users,
  Radio,
  Bell,
} from 'lucide-react';
import { apiClient } from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/services/api/endpoints';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/utils/formatters';
import { renderIcon } from '@/utils/iconHelper';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Button } from '@/components/ui/Button';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { BroadcastNotificationModal } from '@/pages/platform/components/BroadcastNotificationModal';

const PLATFORM_NAV = [
  {
    id: 'tenants',
    label: 'Khách Thuê (Tenants)',
    path: '/platform/tenants',
    icon: Building,
  },
  {
    id: 'subscriptions',
    label: 'Gói Dịch Vụ & Hạn Mức',
    path: '/platform/subscriptions',
    icon: CreditCard,
  },
  {
    id: 'users',
    label: 'Tài Khoản & Chủ Đầu Tư',
    path: '/platform/users',
    icon: Users,
  },
  {
    id: 'audit',
    label: 'Nhật Ký Kiểm Toán Toàn Cầu',
    path: '/platform/audit-logs',
    icon: FileSearch,
  },
  {
    id: 'metrics',
    label: 'Giám Sát Hạ Tầng & Sức Khỏe',
    path: '/platform/health',
    icon: Activity,
  },
];

/**
 * PlatformShell - Layout Dành Riêng Cho Quản Trị Viên Nền Tảng (Mục 1.1.2 File 08)
 * (/platform/*) - Dành riêng ROLE_SUPER_ADMIN, ẩn 100% menu Farm Ops và thanh chuyển trang trại.
 */
export function PlatformShell() {
  const navigate = useNavigate();
  const { userInfo, clearAuth, logout } = useAuthStore();
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);

  const handleLogout = async () => {
    try {
      if (logout) {
        await logout();
      } else {
        await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
        clearAuth();
      }
    } catch {
      // Ignored
    } finally {
      navigate('/login');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-900">
      {/* Platform Sidebar */}
      <aside className="flex w-72 flex-col border-r border-slate-200 bg-slate-900 text-white">
        {/* Header */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-1 ring-white/20">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-white text-base tracking-tight">
              SUPER ADMIN
            </span>
            <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-widest">
              SaaS Control Plane
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-6 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Quản Trị Nền Tảng Khách Thuê
          </div>
          {PLATFORM_NAV.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all',
                  isActive
                    ? 'bg-rose-600 text-white shadow-md font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )
              }
            >
              {renderIcon(item.icon, 'h-4 w-4 shrink-0')}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 p-4 text-xs text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-300 font-bold">
              {userInfo?.fullName?.charAt(0) || <User className="h-4 w-4" />}
            </div>
            <div className="flex flex-col truncate max-w-[140px]">
              <span className="truncate font-bold text-white text-xs">{userInfo?.fullName || 'Super Admin'}</span>
              <span className="text-[10px] text-rose-400">ROLE_SUPER_ADMIN</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-950/50 hover:text-rose-400 transition-colors"
            title="Đăng xuất"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Main Viewport */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-2xs">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
              Chế độ Quản trị Nền tảng (Platform Tenant Isolation)
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-400 hidden sm:inline">
              Trang thái máy chủ: <span className="font-semibold text-emerald-600">Bình thường (72/72 Tables)</span>
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Radio className="h-3.5 w-3.5 text-rose-600 animate-pulse" />}
              onClick={() => setIsBroadcastModalOpen(true)}
              className="border-rose-200 text-rose-700 hover:bg-rose-50 font-bold"
            >
              Phát Thông Báo
            </Button>

            {/* GAP-SYNC-04: Chuông thông báo thời gian thực kết nối NotificationBell */}
            <NotificationBell />
          </div>
        </header>

        {/* Canvas */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>

        {/* Modal Phát Thông Báo Diện Rộng */}
        <BroadcastNotificationModal
          isOpen={isBroadcastModalOpen}
          onClose={() => setIsBroadcastModalOpen(false)}
        />
      </div>
    </div>
  );
}

export default PlatformShell;
