import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  MapPin,
  ScanBarcode,
  Users,
  Sprout,
  Warehouse,
  Coins,
  Menu,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/utils/formatters';

/**
 * MobileBottomNav Component
 * Thanh điều hướng đáy màn hình tối ưu cho smartphone & tablet (< 1024px)
 * Giúp cán bộ hiện trường thao tác 1 chạm bằng ngón tay cái thuận tiện.
 */
export function MobileBottomNav({ onOpenMenu, onOpenScanner }) {
  const {
    isOwner,
    isFarmManager,
    isTechnicalLead,
    isWarehouseKeeper,
    isFarmAccountant,
  } = useAuthStore();

  const owner = isOwner();
  const farmManager = isFarmManager();
  const techLead = isTechnicalLead();
  const whKeeper = isWarehouseKeeper();
  const accountant = isFarmAccountant();

  // Xác định màn hình cốt lõi theo từng vai trò
  let coreItem = {
    path: '/app/hr',
    icon: Users,
    label: 'Nhân sự',
  };

  if (techLead) {
    coreItem = {
      path: '/app/farming',
      icon: Sprout,
      label: 'Canh tác',
    };
  } else if (whKeeper) {
    coreItem = {
      path: '/app/inventory',
      icon: Warehouse,
      label: 'Kho bãi',
    };
  } else if (accountant) {
    coreItem = {
      path: '/app/cost-accounting',
      icon: Coins,
      label: 'Chi phí',
    };
  } else if (owner) {
    coreItem = {
      path: '/app/personnel',
      icon: Users,
      label: 'Nhân sự',
    };
  }

  const CoreIcon = coreItem.icon;
  const homePath = owner ? '/app/geography' : '/app/my-dashboard';

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-30 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 flex items-center justify-around shadow-[0_-4px_16px_rgba(0,0,0,0.06)] lg:hidden select-none safe-area-pb"
    >
      {/* 1. Trang Chủ / Dashboard */}
      <NavLink
        to={homePath}
        className={({ isActive }) =>
          cn(
            'flex flex-col items-center justify-center gap-1 w-14 py-1 text-[10px] font-semibold transition-colors',
            isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          )
        }
      >
        {({ isActive }) => (
          <>
            <Home className={cn('h-5 w-5', isActive ? 'text-emerald-700' : 'text-slate-400')} />
            <span className="truncate">{owner ? 'Mặt Bằng' : 'Tác Nghiệp'}</span>
          </>
        )}
      </NavLink>

      {/* 2. Mặt Bằng & Phân Khu (WS-A) */}
      <NavLink
        to="/app/geography"
        className={({ isActive }) =>
          cn(
            'flex flex-col items-center justify-center gap-1 w-14 py-1 text-[10px] font-semibold transition-colors',
            isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          )
        }
      >
        {({ isActive }) => (
          <>
            <MapPin className={cn('h-5 w-5', isActive ? 'text-emerald-700' : 'text-slate-400')} />
            <span className="truncate">Phân Khu</span>
          </>
        )}
      </NavLink>

      {/* 3. Nút Quét Nhanh (QR / Barcode) ở giữa */}
      <div className="flex flex-col items-center justify-center -mt-4">
        <button
          type="button"
          onClick={onOpenScanner}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/25 ring-4 ring-white active:scale-95 transition-transform"
          title="Quét mã vạch / QR hiện trường"
        >
          <ScanBarcode className="h-6 w-6" />
        </button>
        <span className="text-[10px] font-bold text-slate-700 mt-0.5">Quét QR</span>
      </div>

      {/* 4. Nghiệp vụ cốt lõi theo Role */}
      <NavLink
        to={coreItem.path}
        className={({ isActive }) =>
          cn(
            'flex flex-col items-center justify-center gap-1 w-14 py-1 text-[10px] font-semibold transition-colors',
            isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          )
        }
      >
        {({ isActive }) => (
          <>
            <CoreIcon className={cn('h-5 w-5', isActive ? 'text-emerald-700' : 'text-slate-400')} />
            <span className="truncate">{coreItem.label}</span>
          </>
        )}
      </NavLink>

      {/* 5. Mở Menu Tất Cả Workspaces (Drawer) */}
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center gap-1 w-14 py-1 text-[10px] font-semibold text-slate-500 hover:text-slate-800 active:text-emerald-700 transition-colors"
      >
        <Menu className="h-5 w-5 text-slate-400" />
        <span className="truncate">Menu</span>
      </button>
    </nav>
  );
}

export default MobileBottomNav;

