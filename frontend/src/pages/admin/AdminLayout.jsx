import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Layers,
  CreditCard,
  ShieldCheck,
  LogOut,
  Bell,
  Search,
  ExternalLink,
  ChevronRight,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      if (logout) {
        await logout();
      }
    } finally {
      navigate('/login');
    }
  };

  // Hỗ trợ mượt mà cả tiền tố /platform lẫn /admin
  const isPlatformPrefix = location.pathname.startsWith('/platform');

  const navItems = [
    {
      id: 'dashboard',
      path: isPlatformPrefix ? '/platform/dashboard' : '/admin/dashboard',
      matchPrefixes: isPlatformPrefix
        ? ['/platform/dashboard', '/platform']
        : ['/admin/dashboard', '/admin'],
      label: 'Tổng quan nền tảng',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'farms',
      path: isPlatformPrefix ? '/platform/tenants' : '/admin/farms',
      matchPrefixes: isPlatformPrefix
        ? ['/platform/tenants', '/platform/farms']
        : ['/admin/farms', '/admin/tenants'],
      label: 'Danh sách trang trại',
      icon: Building2,
      badge: null,
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    },
    {
      id: 'packages',
      path: isPlatformPrefix ? '/platform/packages' : '/admin/packages',
      matchPrefixes: isPlatformPrefix
        ? ['/platform/packages', '/platform/subscriptions']
        : ['/admin/packages', '/admin/subscriptions'],
      label: 'Gói cước & Add-ons',
      icon: Layers,
      badge: '6 Add-ons',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'transactions',
      path: isPlatformPrefix ? '/platform/transactions' : '/admin/transactions',
      matchPrefixes: isPlatformPrefix
        ? ['/platform/transactions']
        : ['/admin/transactions'],
      label: 'Đối soát VNPAY & Webhook',
      icon: CreditCard,
      badge: null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
  ];

  // Kiểm tra mục đang active
  const isItemActive = (item) => {
    const currentPath = location.pathname;
    if (item.id === 'dashboard') {
      return (
        currentPath === '/platform' ||
        currentPath === '/platform/' ||
        currentPath === '/platform/dashboard' ||
        currentPath === '/admin' ||
        currentPath === '/admin/' ||
        currentPath === '/admin/dashboard'
      );
    }
    return item.matchPrefixes.some((p) => currentPath.startsWith(p));
  };

  const currentNav =
    navItems.find((item) => isItemActive(item)) || navItems[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row antialiased">
      {/* ========================================================
          SIDEBAR DÀNH CHO SUPER ADMIN (SLATE / INDIGO / EMERALD)
         ======================================================== */}
      {/* Mobile / Tablet Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-slate-900 border-r border-slate-800 flex flex-col z-50 transition-transform duration-200 shrink-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">
                  FarmGo
                </span>
                <span className="text-[10px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  SUPER ADMIN
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                SaaS Control Plane
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Đóng menu"
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* System Health Status Badge */}
        <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300 font-medium">Hệ thống Trực tuyến</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-400">
              99.98% Uptime
            </span>
          </div>
        </div>

        {/* 4 Chức năng điều hướng chính */}
        <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Phân khu điều hành SaaS
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item);

            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  active
                    ? 'bg-gradient-to-r from-emerald-500/20 to-indigo-500/10 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      active
                        ? 'text-emerald-400'
                        : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom Profile & Logout Area */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90">
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                SA
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">
                  {userInfo?.fullName || 'Super Administrator'}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {userInfo?.email || 'admin@farmgo.vn'}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Đăng xuất khỏi Admin Portal"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================
          MAIN CONTENT AREA
         ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        {/* Top Header */}
        <header className="h-16 px-4 md:px-6 bg-slate-900/95 border-b border-slate-800/80 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Mở menu quản trị"
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb / Title */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400 font-medium">SaaS Admin</span>
              <ChevronRight className="w-4 h-4 text-slate-600" />
              <span className="text-white font-semibold">
                {currentNav.label}
              </span>
            </div>
          </div>

          {/* Right Header Quick Tools */}
          <div className="flex items-center gap-3">
            {/* VNPAY Status Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-medium">VNPAY Sandbox</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono">
                IPN Active
              </span>
            </div>

            {/* Link to Public Portal */}
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors"
            >
              <span>Xem Cổng Công Khai</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            {/* Notifications */}
            <div className="relative">
              <button
                title="Thông báo hệ thống"
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
