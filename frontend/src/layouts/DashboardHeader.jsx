import React, { useState, useRef, useEffect } from 'react';
import { Menu, LogOut, Shield, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { authService } from '../services/authService';
import { TenantSwitcher } from '../components/common/TenantSwitcher';
import { FarmSwitcher } from '../components/common/FarmSwitcher';
import { NotificationPopover } from '../components/common/NotificationPopover';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const DashboardHeader = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    } finally {
      clearAuth();
      toast.success('Đã đăng xuất khỏi hệ thống.');
      navigate('/login', { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left Section: Mobile Menu Button & Tenant Switcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors lg:hidden"
            aria-label="Mở menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <TenantSwitcher />
          <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-800" />
          <FarmSwitcher />
        </div>

        {/* Right Section: Notifications & User Profile */}
        <div className="flex items-center gap-2">
          {/* Notification Popover */}
          <NotificationPopover />

          {/* User Menu Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-600 to-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {user?.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                  {user?.fullName || 'Người dùng'}
                </div>
                <div className="text-[10px] text-slate-400">
                  {user?.roles?.[0]?.replace('ROLE_', '') || 'STAFF'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/80 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {user?.fullName}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                    <Shield className="w-3 h-3" />
                    <span>{user?.roles?.join(', ')}</span>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors min-h-[44px]"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
