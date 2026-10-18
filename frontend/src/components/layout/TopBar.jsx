import React, { useState } from 'react';
import {
  ScanBarcode,
  LogOut,
  User,
  Menu,
  Shield,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FarmContextSwitcher } from './FarmContextSwitcher';
import { NotificationBell } from './NotificationBell';
import { Modal } from '@/components/ui/Modal';
import { BarcodeScannerInput } from '@/components/common/BarcodeScannerInput';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';

/**
 * Global TopBar for TenantAppShell (Mục 1.1.3 File 08)
 * - FarmContextSwitcher: Dropdown chọn trang trại
 * - QuickScannerButton: Nút biểu tượng quét mã vạch/QR nổi bật
 * - NotificationBell: Chuông thông báo đếm số chưa đọc
 * - User Profile & Đăng xuất
 */
export function TopBar({ onMobileMenuToggle }) {
  const navigate = useNavigate();
  const { userInfo, clearAuth } = useAuthStore();
  const { clearActiveContext } = useActiveFarmStore();
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await axios.post('/api/v1/auth/logout', {}, { withCredentials: true });
    } catch {
      // Ignored
    } finally {
      clearAuth();
      clearActiveContext();
      navigate('/login');
    }
  };

  const primaryRole =
    userInfo?.roles?.[0]?.name ||
    (typeof userInfo?.roles?.[0] === 'string' ? userInfo?.roles?.[0] : null) ||
    'Nhân viên';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 shadow-2xs">
      {/* Left: Mobile Menu Toggle & Farm Context Switcher */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <FarmContextSwitcher />
      </div>

      {/* Right: QuickScannerButton + NotificationBell + User Profile */}
      <div className="flex items-center gap-3">
        {/* QuickScannerButton */}
        <button
          type="button"
          onClick={() => setIsScannerModalOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-2xs hover:bg-emerald-100 hover:border-emerald-300 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          title="Quét mã vạch / QR nhanh toàn cục"
        >
          <ScanBarcode className="h-4 w-4 text-emerald-600" />
          <span className="hidden sm:inline">Quét nhanh</span>
        </button>

        {/* NotificationBell */}
        <NotificationBell />

        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

        {/* User Profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2.5 rounded-xl p-1.5 text-left text-xs hover:bg-slate-50 transition-all focus:outline-none"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs shadow-xs">
              {userInfo?.fullName ? userInfo.fullName.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
            </div>

            <div className="hidden flex-col text-left md:flex">
              <span className="font-bold text-slate-900 leading-tight">
                {userInfo?.fullName || userInfo?.username || 'Người dùng'}
              </span>
              <span className="text-[10px] text-emerald-700 font-medium">
                {primaryRole}
              </span>
            </div>
          </button>

          {/* User Dropdown */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="font-bold text-slate-900 text-xs truncate">{userInfo?.fullName}</p>
                <p className="text-[11px] text-slate-500 truncate">{userInfo?.email || userInfo?.username}</p>
                <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md w-fit">
                  <Shield className="h-3 w-3" />
                  <span>{primaryRole}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Scanner Modal */}
      <Modal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        title="Quét Mã Tra Cứu Toàn Cục"
        subtitle="Quét mã vạch vật tư, mã QR truy xuất hoặc lô thành phẩm trong trang trại"
        size="md"
      >
        <div className="py-2">
          <BarcodeScannerInput
            autoFocus
            onScanSuccess={(result) => {
              // Could navigate to specific material or batch detail
            }}
          />
        </div>
      </Modal>
    </header>
  );
}

export default TopBar;
